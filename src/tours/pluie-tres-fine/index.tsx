/*
 * Pluie très fine : une seule carte, face cachée, au dos d'un jeu des années 1950. C'est une Dame,
 * et sa famille n'est choisie qu'au moment où elle se retourne — le trucage de la carte de la
 * couleur des cinq cartes :
 *   toucher l'écran     la carte se retourne aussitôt sur la Dame de la famille du coin touché :
 *                       l'écran est coupé en quatre par le milieu de la carte, jusqu'à ses bords
 *                       (haut gauche pique, haut droite cœur, bas gauche trèfle, bas droite carreau)
 *   la carte retournée  un toucher ne la change plus ; un double toucher (au clavier : R) la remet
 *                       face cachée, prête pour une nouvelle routine : on reste dans le tour
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal
 *
 * Depuis les réglages (écrou ⚙) : la couleur du dos, et le test des zones (les quatre coins
 * dessinés sur la scène, comme pour les cinq cartes).
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène et l'état de la carte (gestes et clavier : src/hooks/)
 *   components/  Carte (le dos, la Dame, le retournement), DosAncien et FaceDeDame (leurs dessins
 *                en SVG), Reglages (le panneau de l'écrou ⚙), TestDesZones (l'aide à la répétition)
 *   content/     LE TEXTE : interface.ts (les réglages, le nom de la carte)
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/pluie-tres-fine/)
 *     routine.ts     l'état de la carte, et la famille du coin touché
 *     dos.ts         le dessin du dos : la pluie de hachures, le médaillon
 *     dame.ts        le dessin de la Dame, à l'ancienne
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 * Les styles sont dans src/styles/tours/pluie-tres-fine/.
 */

import { useCallback, useRef, useState } from 'preact/hooks';
import { JaugeAppui } from '../../components/JaugeAppui.tsx';
import { useClavier } from '../../hooks/useClavier.ts';
import { useGestesDoubleToucher } from '../../hooks/useGestesDoubleToucher.ts';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { useSansAnimation } from '../../hooks/useSansAnimation.ts';
import { usePont } from '../pont.tsx';
import { annonce, Carte } from './components/Carte.tsx';
import { Reglages } from './components/Reglages.tsx';
import { TestDesZones, type Eclair } from './components/TestDesZones.tsx';
import { keyAction } from './logic/keys.ts';
import { apresGeste, CACHEE, couleurDuPoint, type Boite, type Couleur, type Etat } from './logic/routine.ts';
import { sanitizeSettings } from './logic/settings.ts';

/**
 * Les réglages, gardés sur l'appareil. La carte, elle, n'est enregistrée nulle part : chaque
 * ouverture repart d'une carte face cachée.
 */
const CLE_REGLAGES = 'pluie-tres-fine:settings:v1';
const valider = (brut: unknown) => sanitizeSettings(brut);

/**
 * La boîte d'un élément dans le repère de #app : ses décalages (offsetLeft…), que les rotations
 * de #app ne changent pas, additionnés jusqu'à #app (position: fixed, styles/_app.scss).
 */
function boiteDansLApp(el: HTMLElement): Boite {
	let [x, y] = [0, 0];
	for (let e: HTMLElement | null = el; e && e.id !== 'app'; e = e.offsetParent as HTMLElement | null) {
		x += e.offsetLeft;
		y += e.offsetTop;
	}
	return { x, y, largeur: el.offsetWidth, hauteur: el.offsetHeight };
}

export default function PluieTresFine() {
	const { langue, enReglages, quitter } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, valider);
	/** Le test des zones, ouvert depuis les réglages. */
	const [testDesZones, setTestDesZones] = useState(false);
	/** Le panneau de réglages est à l'écran (ouvert par l'écrou ⚙, le test des zones fermé). */
	const panneau = enReglages && !testDesZones;

	/* ---------- L'état de la carte ---------- */

	const [etat, setEtat] = useState<Etat>(CACHEE);
	/** La famille de la Dame écrite à l'avant : gardée quand la carte revient face cachée. */
	const [ecrite, setEcrite] = useState<Couleur | null>(null);
	// Lu par les gestes et le clavier, qui doivent toujours voir la dernière valeur.
	const etatRef = useRef(etat);
	const carteRef = useRef<HTMLElement>(null);

	// Sans transition à l'ouverture comme à chaque remise en place au clavier.
	const [remises, setRemises] = useState(0);
	const sansAnimation = useSansAnimation(remises);

	const changer = useCallback((suivant: Etat): void => {
		if (suivant === etatRef.current) return;
		if (suivant.phase === 'retournee') setEcrite(suivant.couleur);
		etatRef.current = suivant;
		setEtat(suivant);
	}, []);

	/** La carte revient face cachée d'un coup (au clavier, R) : on reste dans le tour. */
	const remettre = useCallback((): void => {
		if (etatRef.current === CACHEE) return;
		setRemises((n) => n + 1);
		changer(CACHEE);
	}, [changer]);

	/** La carte et l'écran, dans le repère de #app : le milieu de la carte coupe l'écran en quatre. */
	const mesurer = useCallback(() => {
		const carte = carteRef.current;
		const app = carte?.closest<HTMLElement>('#app');
		if (!carte) return null;
		return { carte: boiteDansLApp(carte), largeur: app?.offsetWidth ?? window.innerWidth, hauteur: app?.offsetHeight ?? window.innerHeight };
	}, []);

	/* ---------- Le test des zones ---------- */

	/** Le dernier coin touché, pendant le test des zones. */
	const [eclair, setEclair] = useState<Eclair | null>(null);

	/** Ouvre le test des zones (ou revient au panneau) : il commence sur la carte face cachée. */
	const ouvrirTest = (ouvert: boolean): void => {
		remettre();
		setEclair(null);
		setTestDesZones(ouvert);
	};

	/* ---------- Gestes sur la scène, clavier ---------- */

	/** État de la carte avant le dernier tap : un double toucher ne compte que sur une carte déjà retournée. */
	const avantDernierTap = useRef<Etat>(CACHEE);

	/**
	 * Ce qu'un geste de la scène déclenche, au point (x, y) du repère de l'app :
	 *   un tap        retourne la carte face cachée sur la Dame de la famille du coin touché ;
	 *   un double     remet la carte face cachée, si elle était déjà retournée au premier toucher.
	 */
	const { scene, jauge } = useGestesDoubleToucher(reglages.showHoldRing, (geste, { x, y }) => {
		// Le panneau de réglages par-dessus : la scène cachée ne reçoit rien.
		if (panneau) return;
		const mesure = mesurer();
		const couleur = mesure ? couleurDuPoint(x, y, mesure.carte) : null;
		// Le test des zones allume le coin touché, sans retourner la carte.
		if (testDesZones) {
			if (couleur && geste === 'tap') setEclair((avant) => ({ couleur, n: (avant?.n ?? 0) + 1 }));
			return;
		}
		const avant = etatRef.current;
		changer(apresGeste(avant, geste, couleur, geste === 'double' ? avantDernierTap.current : avant));
		if (geste === 'tap') avantDernierTap.current = avant;
	});

	// P, C, T, D : la Dame de cette famille ; R : la carte face cachée ; Échap ou M : menu.
	// Le panneau de réglages ouvert, seules Échap et M comptent ; le test des zones ne retourne rien.
	useClavier(keyAction, (action) => {
		if (action === 'remettre') remettre();
		else if (!testDesZones) changer(apresGeste(etatRef.current, 'tap', action, etatRef.current));
	}, panneau);

	/* ---------- Affichage ---------- */

	return (
		<>
			{/* La scène reçoit tous les touchers. */}
			<main id="stage" {...scene}>
				<Carte etat={etat} ecrite={ecrite} langue={langue} couleur={reglages.couleur} sansAnimation={sansAnimation} carteRef={carteRef} />
			</main>

			{/* Ce qui est à l'écran, pour les lecteurs d'écran seulement. */}
			<p id="annonce" className="sr-only" aria-live="polite">{annonce(etat, langue)}</p>
			<JaugeAppui jauge={jauge} />

			{/* Le test des zones, ouvert depuis les réglages. */}
			{enReglages && testDesZones && <TestDesZones langue={langue} mesurer={mesurer} eclair={eclair} surReglages={() => ouvrirTest(false)} surQuitter={quitter} />}

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{panneau && <Reglages reglages={reglages} langue={langue} enregistrer={enregistrer} surTestDesZones={() => ouvrirTest(true)} />}
		</>
	);
}
