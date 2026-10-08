/*
 * Les trois paquets : huit cartes à forcer, trois paquets de sept, et la carte pensée qui disparaît.
 * Sept panneaux, de l'un à l'autre en balayant : deux mélanges, la salade (1), les paquets trois fois
 * (2, 2, 2), la fin (3). Le tour se joue téléphone tenu en largeur (appareil/Orientation.tsx) ; ses
 * réglages, ouverts depuis le menu, restent en portrait.
 *   deux mélanges              des cartes du jeu en tas, faces en l'air ou en bas, tirées au sort
 *   balayer vers la gauche     le mélange suivant, puis :
 *   panneau 1, la salade       un tas de cartes aux dos Bicycle ; les huit cartes à forcer sont
 *                              faces en l'air (content/cartes.ts), certaines en partie sous d'autres
 *                              cartes ; d'autres faces en l'air sont cachées, on n'en voit qu'un
 *                              bord ; sous elles, plus au fond, le double de chacune, loin d'elle :
 *                              le spectateur pense à l'une des huit
 *   balayer vers la gauche     panneau 2 : trois paquets de sept cartes. Le spectateur dit dans
 *                              lesquels il voit sa carte : paquet 1 → 1, paquet 2 → 2, paquet 3 → 4 ;
 *                              la somme est le code de sa carte (0 le 2♣, 1 le 4♣ … 7 la dame de ♠).
 *                              Chaque carte à forcer y est elle-même ou un sosie (même valeur, autre
 *                              enseigne)
 *   toucher un paquet          le note, sans que rien ne se voie (toucher encore : il ne l'est plus)
 *   balayer vers la gauche     le panneau 2 encore, deux fois : les mêmes paquets, à l'identique ; la
 *                              dernière copie où des paquets sont notés donne le code
 *   balayer vers la gauche     panneau 3 : trois colonnes de sept, les cartes restantes, aucune à
 *                              forcer (ni aucune de la valeur pensée ; rien de noté : pas de 2), et au
 *                              milieu une carte face en bas
 *   toucher                    la carte face en bas disparaît ; le tour est alors figé : plus aucun
 *                              balayage (seulement R, au clavier, ou le retour au menu)
 *   balayer vers la gauche     avant le toucher, sur la fin : une nouvelle routine, le premier mélange
 *   balayer vers la droite     le panneau d'avant (sauf une fois la carte disparue)
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène, l'état de la routine, le tirage en cours
 *   components/  Panneaux (les sept panneaux : les mélanges, la salade, les colonnes), Carte (une carte, aux
 *                faces Bicycle), Reglages
 *   content/     LES CARTES À FORCER : cartes.ts, et interface.ts (les textes)
 *   hooks/       useGestesBalayage : les gestes de la scène
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/trois-paquets/)
 *     tirage.ts      les cartes des trois panneaux : paquets, sosies, remplissage, fin
 *     disposition.ts la salade : les cartes en grille lâche, et en tas
 *     routine.ts     le panneau montré, les paquets notés, la carte disparue
 *     dame.ts        le tracé de la dame
 *     gestes.ts      balayage, tap et appui long
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 * Les faces et le dos sont ceux de la Princesse (src/tours/princesse/). Les styles sont dans
 * src/styles/tours/trois-paquets/.
 */

import { useMemo, useRef, useState } from 'preact/hooks';
import { useVerrouPaysage } from '../../appareil/Orientation.tsx';
import { JaugeAppui } from '../../components/JaugeAppui.tsx';
import { useClavier } from '../../hooks/useClavier.ts';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { useSansAnimation } from '../../hooks/useSansAnimation.ts';
import type { Lang } from '../../logic/i18n.ts';
import { nouveauSemis } from '../princesse/logic/melange.ts';
import { usePont } from '../pont.tsx';
import { Panneaux, type CarteEnSalade } from './components/Panneaux.tsx';
import { Reglages } from './components/Reglages.tsx';
import { ui } from './content/interface.ts';
import { useGestesBalayage } from './hooks/useGestesBalayage.ts';
import { DEBORD_DES_MELANGES, desordreDesColonnes, doublon, faceCachee, grille, nappe, recouvrements, tas, type Position } from './logic/disposition.ts';
import { keyAction, paquetDeLaTouche } from './logic/keys.ts';
import { apresBalayage, apresToucher, codeNote, copieDuPanneau, depart, estPaquets, paquetDuPoint, SALADE, type Etat } from './logic/routine.ts';
import { sanitizeSettings } from './logic/settings.ts';
import { CARTES_PAR_PAQUET, DOS_PAR_DESSUS, finale, PAQUETS, tirer } from './logic/tirage.ts';
import type { Carte as CarteAJouer } from '../princesse/logic/cartes.ts';

/**
 * Les réglages, gardés sur l'appareil. La routine, elle, n'est enregistrée nulle part : chaque
 * ouverture repart d'un nouveau tirage, panneau 1.
 */
const CLE_REGLAGES = 'trois-paquets:settings:v1';

/** Les colonnes de la grille lâche des mélanges : huit, sur cinq rangées, en paysage. */
const COLONNES_DES_MELANGES = 8;

/** Les colonnes de la grille des huit cartes à forcer de la salade : deux rangées de quatre, en paysage. */
const COLONNES_SALADE = 4;

/** La place de la carte face en bas, dans les 21 du panneau 3 : la quatrième de la colonne du milieu. */
const MILIEU = CARTES_PAR_PAQUET + Math.floor(CARTES_PAR_PAQUET / 2);

/**
 * Où est la rangée des trois paquets de la copie `copie` (1 à 3), dans le repère de l'app : ses
 * .colonnes, un tiers de leur largeur par paquet (les colonnes y sont réparties, chacune dans son tiers). Sans mesure, c'est toute la
 * largeur de l'app. Les mesures de mise en page ignorent les transformations : elles restent justes
 * quand l'app est pivotée en paysage.
 */
function placeDesPaquets(copie: number): { gauche: number; largeur: number } {
	const paquets = document.querySelector<HTMLElement>(`.panneau.paquets[data-copie="${copie}"] .colonnes`);
	if (paquets && paquets.offsetWidth > 0) {
		// Jusqu'au panneau seulement : la bande glisse (transform) pour le poser contre le bord de l'app.
		let gauche = 0;
		for (let e: HTMLElement | null = paquets; e && !e.classList.contains('panneau'); e = e.offsetParent as HTMLElement | null) gauche += e.offsetLeft;
		return { gauche, largeur: paquets.offsetWidth };
	}
	return { gauche: 0, largeur: document.getElementById('app')?.clientWidth ?? window.innerWidth };
}

/** Ce qui est à l'écran, pour les lecteurs d'écran seulement. */
function annonce(etat: Etat, langue: Lang): string {
	if (etat.panneau < SALADE) return ui('panneau.melange', langue);
	if (etat.panneau === SALADE) return ui('panneau.salade', langue);
	if (estPaquets(etat.panneau)) return ui('panneau.paquets', langue);
	return etat.disparue ? ui('annonce.disparue', langue) : ui('panneau.fin', langue);
}

export default function TroisPaquets() {
	const { langue, enReglages } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, sanitizeSettings);

	/* ---------- L'état de la routine, et le tirage ---------- */

	const [etat, setEtat] = useState<Etat>(() => depart(nouveauSemis()));
	// Lu par les gestes, qui doivent toujours voir la dernière valeur.
	const etatRef = useRef(etat);
	const changer = (suivant: Etat): void => {
		etatRef.current = suivant;
		setEtat(suivant);
	};

	const tirage = useMemo(() => tirer(etat.semis), [etat.semis]);

	/**
	 * Les mélanges : leurs cartes faces en l'air ou en bas, dans l'ordre du tirage, sur toute la table
	 * et au-delà, bien réparties (peu de tapis visible) : le tas déborde de l'écran.
	 */
	const melanges = useMemo<CarteEnSalade[][]>(() => tirage.melanges.map((cartes, m) =>
		nappe(cartes.length, COLONNES_DES_MELANGES, etat.semis ^ (0x3e1a + m), DEBORD_DES_MELANGES).map((position, i) => ({ carte: cartes[i]!, position }))), [tirage, etat.semis]);

	/** Le désordre des colonnes : le même pour les trois copies des paquets, un autre pour la fin. */
	const desordre = useMemo(() => ({
		paquets: desordreDesColonnes(PAQUETS, CARTES_PAR_PAQUET, etat.semis, 0),
		fin: desordreDesColonnes(PAQUETS, CARTES_PAR_PAQUET, etat.semis, 1),
	}), [etat.semis]);

	/**
	 * Panneau 1 : les cartes à forcer en grille lâche, sur un tas de dos et leurs doubles, plus au
	 * fond, chacun loin de sa carte ; quelques dos par-dessus,
	 * qui en couvrent une partie (jamais l'index) ; à la place de certains, une carte face en l'air
	 * dont on ne voit qu'un bord blanc, sous deux dos.
	 */
	const salade = useMemo<CarteEnSalade[]>(() => {
		const faces = grille(tirage.salade.faces.length, COLONNES_SALADE, etat.semis ^ 0x5a1ade);
		const dessus = recouvrements(faces, COLONNES_SALADE, DOS_PAR_DESSUS, etat.semis);
		// Les premiers recouvrements cachent une face en l'air sous deux dos ; les autres sont un dos.
		const caches = tirage.salade.cachees.slice(0, dessus.length);
		const nombreAuTas = tirage.salade.dos - (dessus.length - caches.length) - 2 * caches.length - tirage.salade.faces.length;
		const posees: Position[] = [];
		const doubles = tirage.salade.faces.flatMap((carte, i) => {
			const [double, dos] = doublon(faces[i]!, posees, etat.semis, i, nombreAuTas + 2 * i);
			posees.push(double);
			return [{ carte, position: double }, { carte: null, position: dos }];
		});
		return [
			// Le tas de dos ; dessus, sous la grille, le double de chaque carte à forcer, loin d'elle,
			// la moitié du bas sous un dos.
			...tas(nombreAuTas, etat.semis).map((position) => ({ carte: null, position })),
			...doubles,
			...faces.map((position, i) => ({ carte: tirage.salade.faces[i]!, position })),
			...dessus.flatMap((place, i) => {
				if (i >= caches.length) return [{ carte: null, position: place }];
				const [face, droite, haut] = faceCachee(place);
				return [{ carte: caches[i]!, position: face }, { carte: null, position: droite }, { carte: null, position: haut }];
			}),
		];
	}, [tirage, etat.semis]);

	/**
	 * Panneau 3 : trois colonnes de sept, comme les paquets ; la carte face en bas au milieu de la
	 * colonne du milieu. Les cartes dépendent des paquets notés, mais ne changent jamais sous les yeux
	 * du public : seulement quand on arrive sur le panneau.
	 */
	const code = codeNote(etat);
	const fin = useMemo(() => {
		const cartes: (CarteAJouer | null)[] = finale(tirage, code);
		cartes.splice(MILIEU, 0, null);
		return Array.from({ length: PAQUETS }, (_, p) => cartes.slice(p * CARTES_PAR_PAQUET, (p + 1) * CARTES_PAR_PAQUET));
	}, [tirage, code]);

	// Sans transition à l'ouverture comme à chaque nouvelle routine : le panneau 1 est là d'un coup.
	const sansAnimation = useSansAnimation(etat.semis);

	/* ---------- Gestes sur la scène, clavier ---------- */

	// En paysage : la scène ; les réglages, ouverts depuis le menu, en portrait.
	useVerrouPaysage(!enReglages);

	const { scene, jauge } = useGestesBalayage(reglages.showHoldRing, (geste, { x }) => {
		const avant = etatRef.current;
		if (geste === 'tap') {
			const { gauche, largeur } = placeDesPaquets(copieDuPanneau(avant.panneau) ?? 0);
			changer(apresToucher(avant, paquetDuPoint(x, gauche, largeur)));
		} else changer(apresBalayage(avant, geste, nouveauSemis()));
	});

	// → et ← : panneau suivant, précédent ; 1 à 3 : toucher ce paquet ; Espace : toucher la scène ;
	// R : une nouvelle routine, même une fois la carte disparue ; Échap ou M : retour au menu.
	useClavier(keyAction, (action) => {
		const avant = etatRef.current;
		if (action === 'remettre') changer(depart(nouveauSemis()));
		else if (action === 'suivant' || action === 'precedent') changer(apresBalayage(avant, action, nouveauSemis()));
		else if (action === 'toucher') changer(apresToucher(avant, null));
		else changer(apresToucher(avant, paquetDeLaTouche(action)));
	});

	/* ---------- Affichage ---------- */

	return (
		<>
			{/* La scène reçoit tous les touchers. */}
			<main id="stage" {...scene}>
				<Panneaux etat={etat} melanges={melanges} salade={salade} desordre={desordre} paquets={tirage.paquets} fin={fin} sansAnimation={sansAnimation} couleur={reglages.couleur} langue={langue} />
			</main>

			{/* Ce qui est à l'écran, pour les lecteurs d'écran seulement. */}
			<p id="annonce" className="sr-only" aria-live="polite">{annonce(etat, langue)}</p>
			<JaugeAppui jauge={jauge} />

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{enReglages && <Reglages reglages={reglages} langue={langue} enregistrer={enregistrer} />}
		</>
	);
}
