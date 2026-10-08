/*
 * Princesse : la version de « The Princess Card Trick ». Sur le tapis, cinq cartes côte à côte,
 * faces en bas. Le tour se joue téléphone tenu en largeur (appareil/Orientation.tsx) ; ses réglages,
 * ouverts depuis le menu, restent en portrait.
 *   toucher n'importe où       : les cinq cartes se retournent, faces en l'air, dans un ordre tiré
 *                                au sort, le temps réglé (5 s par défaut) : 4♣, 8♥, 5♦, 10♦, valet
 *                                de ♦ ; le spectateur en pense une
 *   (le temps écoulé)          : elles se remettent faces en bas, et se mélangent
 *   toucher une carte          : elle disparaît (l'artiste la « sort du téléphone »), n'importe laquelle
 *   toucher une autre carte    : elle se retourne. La PREMIÈRE retournée dit la carte pensée, qui ne
 *                                sera pas montrée, par sa place parmi les quatre restantes, comptées
 *                                depuis la gauche (ou la droite, réglage « sens ») : 1re → 4♣,
 *                                2e → 8♥, 3e → 5♦, 4e → 10♦ ; un double toucher sur n'importe quelle
 *                                carte, à n'importe quel moment → valet de ♦
 *   toucher les autres cartes  : chacune se retourne ; la carte pensée n'y est pas
 *   toucher une carte retournée : elle se remet face en bas (et ainsi de suite)
 *   après la disparition, aucun geste ne remet le tour à zéro : seulement R ou Début, au clavier
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène, l'état de la routine et ses minuteries (gestes et clavier : src/hooks/)
 *   components/  Jeu (les cinq cartes côte à côte), DessinsDeCarte (les dos, les faces, le valet),
 *                Reglages (l'écrou ⚙ : dos et couleur des cartes, durée)
 *   content/     LES CARTES : cartes.ts (les cinq, dans leur ordre de départ) et interface.ts (les textes)
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/princesse/)
 *     routine.ts     l'état de la routine, la carte touchée, la carte cachée et les faces montrées
 *     melange.ts     l'ordre des faces et les ordres successifs du mélange, tirés au sort
 *     cartes.ts      forme, nom et index d'une carte, place des enseignes
 *     dessin.ts      les tracés : enseignes, dos, valet
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 * Les styles sont dans src/styles/tours/princesse/.
 */

import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useVerrouPaysage } from '../../appareil/Orientation.tsx';
import { JaugeAppui } from '../../components/JaugeAppui.tsx';
import { useClavier } from '../../hooks/useClavier.ts';
import { useGestesDoubleToucher } from '../../hooks/useGestesDoubleToucher.ts';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { useSansAnimation } from '../../hooks/useSansAnimation.ts';
import type { Lang } from '../../logic/i18n.ts';
import { usePont } from '../pont.tsx';
import { Jeu } from './components/Jeu.tsx';
import { Reglages } from './components/Reglages.tsx';
import { CARTES } from './content/cartes.ts';
import { ui } from './content/interface.ts';
import { nomDeCarte } from './logic/cartes.ts';
import { colonneDeLaTouche, keyAction } from './logic/keys.ts';
import { eparpillements, rangee, type Position } from './logic/disposition.ts';
import { ETAPES, melange, nouveauSemis, ordreAuHasard, ordreDeDepart } from './logic/melange.ts';
import { apresDoubleToucher, apresMinuterie, apresToucher, colonneDuPoint, DEPART, facesAffichees, NOMBRE, type Etat } from './logic/routine.ts';
import { sanitizeSettings } from './logic/settings.ts';

/**
 * Les réglages, gardés sur l'appareil. La routine, elle, n'est enregistrée nulle part : chaque
 * ouverture repart des cinq cartes faces en bas, dans l'ordre.
 */
const CLE_REGLAGES = 'princesse:settings:v1';

/** Le temps de remettre les cartes faces en bas, avant le mélange (le retournement dure 0,62 s). */
const RETOURNEMENT_MS = 750;
/** Le temps de chaque étape du mélange : les cartes glissent à leur nouvelle place. */
const PAS_DU_MELANGE_MS = 480;

/**
 * Où est la rangée de cartes, dans le repère de l'app : #jeu a exactement la largeur des cinq places
 * (styles/tours/princesse/_cartes.scss), une colonne par carte.
 * Les mesures de mise en page (offsetLeft, offsetWidth) ignorent les transformations : elles restent
 * justes quand l'app est pivotée en paysage (appareil/Orientation.tsx). Sans mesure, c'est toute la largeur de l'app.
 */
function placeDeLEventail(): { gauche: number; largeur: number } {
	const jeu = document.getElementById('jeu');
	if (jeu && jeu.offsetWidth > 0) {
		let gauche = 0;
		for (let e: HTMLElement | null = jeu; e && e.id !== 'app'; e = e.offsetParent as HTMLElement | null) gauche += e.offsetLeft;
		return { gauche, largeur: jeu.offsetWidth };
	}
	return { gauche: 0, largeur: document.getElementById('app')?.clientWidth ?? window.innerWidth };
}

/** Ce qui est à l'écran, pour les lecteurs d'écran seulement : les faces visibles, de gauche à droite. */
function annonce(etat: Etat, ordre: readonly number[], faces: readonly number[], langue: Lang): string {
	const noms = (places: readonly number[]): string => places.map((place) => nomDeCarte(CARTES[faces[ordre[place]!]!]!, langue)).join(', ');
	switch (etat.phase) {
		case 'montre': return noms(ordreDeDepart(NOMBRE));
		case 'melange': return ui('annonce.melange', langue);
		case 'pret': return ui('annonce.pret', langue);
		case 'revele': return etat.retournees.length > 0 ? noms([...etat.retournees].sort((a, b) => a - b)) : ui('annonce.disparue', langue);
		default: return ui('annonce.dos', langue);
	}
}

export default function Princesse() {
	const { langue, enReglages } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, sanitizeSettings);

	/* ---------- L'état de la routine ---------- */

	const [etat, setEtat] = useState<Etat>(DEPART);
	/** `ordre[place]` : la carte de l'écran posée à chaque place (elles glissent pendant le mélange). */
	const [ordre, setOrdre] = useState<readonly number[]>(() => ordreDeDepart(NOMBRE));
	/** `faces[carte]` : la face (rang dans content/cartes.ts) de chaque carte de l'écran, tirée au sort. */
	const [faces, setFaces] = useState<readonly number[]>(() => ordreDeDepart(NOMBRE));
	/** Les places de la rangée, un peu de travers, tirées au sort à chaque ouverture et chaque remise. */
	const [places, setPlaces] = useState<readonly Position[]>(() => rangee(NOMBRE, nouveauSemis()));
	/** Pendant le mélange : la position éparpillée de chaque carte de l'écran ; sinon, null (la rangée). */
	const [eparpillees, setEparpillees] = useState<readonly Position[] | null>(null);
	// Lus par les gestes : la face tirée au sort de chaque place, au moment où une carte disparaît.
	const ordreRef = useRef(ordre);
	ordreRef.current = ordre;
	const facesRef = useRef(faces);
	facesRef.current = faces;
	const facesDesPlaces = (): number[] => ordreRef.current.map((element) => facesRef.current[element]!);
	/** Les étapes éparpillées du mélange en cours. */
	const nuages = useRef<Position[][]>([]);
	// Lus par les gestes et les minuteries, qui doivent toujours voir la dernière valeur.
	const etatRef = useRef(etat);
	const reglagesRef = useRef(reglages);
	reglagesRef.current = reglages;
	/** Les ordres du mélange en cours, tirés au sort quand les cartes sont montrées. */
	const suite = useRef<number[][]>([]);

	/*
	 * Sans transition à l'ouverture comme à chaque retour au départ : les cartes se retrouvent
	 * directement à leur place, faces en bas. `remises` relance cette attente.
	 */
	const [remises, setRemises] = useState(0);
	const sansAnimation = useSansAnimation(remises);

	const changer = useCallback((suivant: Etat): void => {
		const avant = etatRef.current;
		if (suivant === avant) return;
		if (suivant.phase === 'montre') {
			// Les faces dans un ordre tiré au sort ; les cartes, elles, ne bougent pas avant le mélange.
			setFaces(ordreAuHasard(NOMBRE, nouveauSemis()));
			suite.current = melange(NOMBRE, nouveauSemis());
			nuages.current = eparpillements(NOMBRE, nouveauSemis(), ETAPES);
		}
		// Hors du mélange, les cartes sont dans la rangée.
		if (suivant.phase !== 'melange') setEparpillees(null);
		// Le mélange interrompu par le toucher de l'artiste s'achève aussitôt, sur son ordre final.
		if (suivant.phase === 'revele' && avant.phase !== 'revele') setOrdre(suite.current.at(-1) ?? ordreDeDepart(NOMBRE));
		if (suivant.phase === 'depart') {
			setOrdre(ordreDeDepart(NOMBRE));
			setPlaces(rangee(NOMBRE, nouveauSemis()));
			setRemises((n) => n + 1);
		}
		etatRef.current = suivant;
		setEtat(suivant);
	}, []);

	/* ---------- Les minuteries : faces en l'air, retournement, mélange ---------- */

	useEffect(() => {
		const minuteries: number[] = [];
		const ensuite = (ms: number): void => {
			minuteries.push(window.setTimeout(() => changer(apresMinuterie(etatRef.current)), ms));
		};
		if (etat.phase === 'montre') ensuite(reglagesRef.current.duree * 1000);
		if (etat.phase === 'retourne') ensuite(RETOURNEMENT_MS);
		if (etat.phase === 'melange') {
			// Les cartes s'éparpillent sur le tapis, en largeur comme en hauteur, d'une étape à l'autre ;
			// leur ordre final est déjà décidé : à la fin, chacune glisse à sa nouvelle place de la rangée.
			setOrdre(suite.current.at(-1) ?? ordreDeDepart(NOMBRE));
			nuages.current.forEach((nuage, k) => {
				minuteries.push(window.setTimeout(() => setEparpillees(nuage), k * PAS_DU_MELANGE_MS));
			});
			ensuite(ETAPES * PAS_DU_MELANGE_MS);
		}
		return () => minuteries.forEach((minuterie) => clearTimeout(minuterie));
	}, [etat, changer]);

	/* ---------- Gestes sur la scène, clavier ---------- */

	// En paysage : la scène ; les réglages, ouverts depuis le menu, en portrait.
	useVerrouPaysage(!enReglages);

	/** État avant le dernier tap : un double toucher ne cache le valet qu'une fois une carte disparue. */
	const avantDernierTap = useRef<Etat>(DEPART);

	/**
	 * Ce qu'un geste de la scène déclenche, à l'abscisse `x` (repère de l'app, qui peut être pivotée) :
	 *   un tap        montre les cartes au départ ; une fois mélangées, fait disparaître la carte
	 *                 touchée ; ensuite, retourne la carte touchée ;
	 *   un double     sur n'importe quelle carte, une fois une carte disparue : cache le valet.
	 */
	const { scene, jauge } = useGestesDoubleToucher(reglages.showHoldRing, (geste, { x }) => {
		const { gauche, largeur } = placeDeLEventail();
		const colonne = colonneDuPoint(x, gauche, largeur);
		const avant = etatRef.current;
		const { sens } = reglagesRef.current;
		const naturelles = facesDesPlaces();
		changer(geste === 'double' ? apresDoubleToucher(avant, colonne, avantDernierTap.current, sens, naturelles) : apresToucher(avant, colonne, sens, naturelles));
		if (geste === 'tap') avantDernierTap.current = avant;
	});

	// Espace ou → : montrer ; 1 à 5 : toucher la carte de cette place ; V : double toucher sur la première
	// carte face en bas ; R : retour au départ ; Échap ou M : retour au menu.
	useClavier(keyAction, (action) => {
		if (action === 'remettre') changer(DEPART);
		else if (action === 'valet') {
			// Le double toucher sur la première carte encore face en bas, à gauche.
			const avant = etatRef.current;
			if (avant.phase !== 'revele') return;
			const place = [0, 1, 2, 3, 4].find((p) => p !== avant.place && !avant.retournees.includes(p));
			if (place === undefined) return;
			changer(apresDoubleToucher(apresToucher(avant, place), place, avant));
		} else if (action === 'montrer') changer(etatRef.current.phase === 'depart' ? apresToucher(etatRef.current, null) : etatRef.current);
		else changer(apresToucher(etatRef.current, colonneDeLaTouche(action), reglagesRef.current.sens, facesDesPlaces()));
	});

	/* ---------- Affichage ---------- */

	return (
		<>
			{/* La scène reçoit tous les touchers. */}
			<main id="stage" {...scene}>
				<Jeu etat={etat} ordre={ordre} places={places} eparpillees={eparpillees} faces={facesAffichees(faces, ordre, etat)} sansAnimation={sansAnimation} langue={langue} motif={reglages.motif} couleur={reglages.couleur} />
			</main>

			{/* Ce qui est à l'écran, pour les lecteurs d'écran seulement. */}
			<p id="annonce" className="sr-only" aria-live="polite">{annonce(etat, ordre, facesAffichees(faces, ordre, etat), langue)}</p>
			<JaugeAppui jauge={jauge} />

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{enReglages && <Reglages reglages={reglages} langue={langue} enregistrer={enregistrer} />}
		</>
	);
}
