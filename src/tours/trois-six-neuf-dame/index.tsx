/*
 * Trois, six, neuf, Dame : cinq cartes face cachée, en ligne, téléphone tenu en largeur — un As, un
 * 3, un 6, un 9 et une Dame, depuis le bord réglé (gauche par défaut). La reprise des cinq cartes :
 * leur table, leurs dos, leurs faces.
 *   le choix        toucher la carte de la valeur du spectateur, dans le coin de sa famille (haut
 *                   gauche pique, haut droite cœur, bas gauche trèfle, bas droite carreau : la
 *                   colonne de la carte coupée en quatre jusqu'aux bords de l'écran) ; elle se
 *                   retourne aussitôt sur la carte du spectateur
 *   la révélation   chaque toucher retourne la carte touchée : les autres sont blanches ; si la
 *                   carte choisie n'est pas l'As et que l'As est retourné ensuite, toutes les
 *                   cartes sauf la carte choisie, l'As compris, portent « À 1 carte près »
 *   la fin          les cinq cartes retournées, on ne peut plus que les retourner, dans un sens
 *                   ou dans l'autre ; aucun geste ne relance la routine (au clavier : R ou Début)
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal, d'où le tour rouvre neuf
 *
 * Depuis les réglages (écrou ⚙), deux aides à la répétition : le mode entraînement (une carte à
 * trouver, tirée au hasard) et le test des zones (les vingt coins dessinés sur la scène).
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène et l'état de la routine (gestes et clavier : src/hooks/)
 *   components/  Rangee (les cinq cartes, le retournement), Reglages (le panneau de l'écrou ⚙),
 *                Entrainement et TestDesZones (les aides à la répétition)
 *   content/     LE TEXTE : interface.ts (les réglages, le nom des cartes)
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/trois-six-neuf-dame/)
 *     routine.ts     le choix, la révélation, et ce que chaque toucher en fait
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 * La table (carte et coin touchés), la rangée un peu de travers, le dos « Arcade » et la face des
 * cartes viennent des cinq cartes (src/tours/cinq-cartes/), comme leurs styles
 * (src/styles/tours/trois-six-neuf-dame/).
 */

import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useVerrouPaysage } from '../../appareil/Orientation.tsx';
import { JaugeAppui } from '../../components/JaugeAppui.tsx';
import { useClavier } from '../../hooks/useClavier.ts';
import { useGestesDoubleToucher } from '../../hooks/useGestesDoubleToucher.ts';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { useSansAnimation } from '../../hooks/useSansAnimation.ts';
import { nouveauSemis, rangee, type Position } from '../cinq-cartes/logic/disposition.ts';
import { boitesDeLaRangee, carteDuPoint, couleurDuPoint, type Boite } from '../cinq-cartes/logic/table.ts';
import { usePont } from '../pont.tsx';
import { Entrainement } from './components/Entrainement.tsx';
import { annonce, Rangee } from './components/Rangee.tsx';
import { Reglages } from './components/Reglages.tsx';
import { TestDesZones, type Eclair } from './components/TestDesZones.tsx';
import { keyAction, rangDeLaTouche } from './logic/keys.ts';
import { carteAuHasard, DEPART, NOMBRE, toucher, type CarteJouee, type Couleur, type Etat } from './logic/routine.ts';
import { rangDeLaPlace, sanitizeSettings } from './logic/settings.ts';

/**
 * Les réglages, gardés sur l'appareil. La routine, elle, n'est enregistrée nulle part : chaque
 * ouverture repart de cinq dos.
 */
const CLE_REGLAGES = 'trois-six-neuf-dame:settings:v1';
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

/** L'aide à la répétition ouverte depuis les réglages, s'il y en a une. */
type Aide = 'entrainement' | 'zones' | null;

export default function TroisSixNeufDame() {
	const { langue, enReglages, quitter } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, valider);
	const [aide, setAide] = useState<Aide>(null);
	/** Le panneau de réglages est à l'écran (ouvert par l'écrou ⚙, aucune aide en cours). */
	const panneau = enReglages && aide === null;
	// Cinq cartes en ligne : le tour, et ses aides, se jouent en largeur. Ses réglages restent en portrait.
	useVerrouPaysage(!panneau);

	// La police pixel des index, chargée dès l'ouverture : la carte du spectateur se retourne avec son index.
	useEffect(() => {
		void document.fonts?.load('700 21px "Pixelify Sans"').catch(() => undefined);
	}, []);

	/* ---------- L'état de la routine ---------- */

	const [etat, setEtat] = useState<Etat>(DEPART);
	// Lu par les gestes et le clavier, qui doivent toujours voir la dernière valeur.
	const etatRef = useRef(etat);
	const rangeeRef = useRef<HTMLDivElement>(null);
	/** La rangée, un peu de travers : neuve à chaque ouverture et à chaque remise en place. */
	const [places, setPlaces] = useState<readonly Position[]>(() => rangee(NOMBRE, nouveauSemis()));
	/** Le coin choisi au clavier (P, C, T, D) pour le prochain toucher d'une carte (1 à 5). */
	const coinClavier = useRef<Couleur>('pique');

	// Sans transition à l'ouverture comme à chaque remise en place (R) : les cartes se retrouvent face cachée d'un coup.
	const [remises, setRemises] = useState(0);
	const sansAnimation = useSansAnimation(remises);

	const changer = useCallback((suivant: Etat): void => {
		if (suivant === etatRef.current) return;
		etatRef.current = suivant;
		setEtat(suivant);
	}, []);

	/** Les cinq cartes reviennent face cachée (au clavier seulement) : on reste dans le tour. */
	const remettre = useCallback((): void => {
		coinClavier.current = 'pique';
		if (etatRef.current === DEPART) return;
		setRemises((n) => n + 1);
		setPlaces(rangee(NOMBRE, nouveauSemis()));
		changer(DEPART);
	}, [changer]);

	/** Les colonnes et les cartes de la table, dans le repère de #app, le rang de chaque place, et la hauteur de #app. */
	const mesurer = useCallback(() => {
		const el = rangeeRef.current;
		const carte = el?.querySelector<HTMLElement>('.carte');
		if (!el || !carte) return null;
		const boites = boitesDeLaRangee(boiteDansLApp(el), places, carte.offsetWidth, carte.offsetHeight);
		const hauteur = el.closest<HTMLElement>('#app')?.offsetHeight ?? window.innerHeight;
		return { ...boites, rangs: places.map((_, place) => rangDeLaPlace(place, reglages.sens)), hauteur };
	}, [places, reglages.sens]);

	/* ---------- Les aides à la répétition ---------- */

	/** La dernière zone touchée, pendant le test des zones. */
	const [eclair, setEclair] = useState<Eclair | null>(null);

	/** La carte que le mode entraînement demande de trouver : nouvelle à chaque ouverture et à chaque « Recommencer ». */
	const [demandee, setDemandee] = useState<CarteJouee>(() => carteAuHasard());

	/** Ouvre une aide (ou revient au panneau, null) : chacune commence sur cinq dos. */
	const ouvrirAide = (suivante: Aide): void => {
		remettre();
		setEclair(null);
		if (suivante === 'entrainement') setDemandee(carteAuHasard());
		setAide(suivante);
	};

	/** « Recommencer », ou R, dans le mode entraînement : cinq dos, et une nouvelle carte à trouver. */
	const recommencer = (): void => {
		remettre();
		setDemandee(carteAuHasard());
	};

	/* ---------- Gestes sur la scène, clavier ---------- */

	/**
	 * Un geste de la scène, au point (x, y) du repère de l'app, touche la carte sous le doigt, dans
	 * le coin touché. Le double toucher n'a rien de particulier : c'est un toucher de plus.
	 */
	const { scene, jauge } = useGestesDoubleToucher(reglages.showHoldRing, (_geste, { x, y }) => {
		// Le panneau de réglages par-dessus : la scène cachée ne reçoit rien.
		if (panneau) return;
		const boites = mesurer();
		if (!boites) return;
		const place = carteDuPoint(x, boites.colonnes);
		if (place === null) return;
		const rang = boites.rangs[place]!;
		const coin = couleurDuPoint(x, y, boites.cartes[place]!);
		if (!coin) return;
		// Le test des zones allume la zone touchée, sans retourner de carte.
		if (aide === 'zones') setEclair((avant) => ({ zone: { rang, couleur: coin }, n: (avant?.n ?? 0) + 1 }));
		else changer(toucher(etatRef.current, rang, coin));
	});

	// P, C, T, D : le coin du prochain toucher ; 1 à 5 : toucher la carte de ce rang (1 : l'As) ; R : remettre ; Échap ou M : menu.
	// Le panneau de réglages ouvert, seules Échap et M comptent ; le test des zones ne retourne rien.
	useClavier(keyAction, (action) => {
		if (action === 'remettre') {
			if (aide === 'entrainement') recommencer();
			else remettre();
			return;
		}
		if (aide === 'zones') return;
		const rang = rangDeLaTouche(action);
		if (rang === null) {
			coinClavier.current = action as Couleur;
			return;
		}
		changer(toucher(etatRef.current, rang, coinClavier.current));
		coinClavier.current = 'pique';
	}, panneau);

	/* ---------- Affichage ---------- */

	return (
		<>
			{/* La scène reçoit tous les touchers. */}
			<main id="stage" {...scene}>
				<Rangee etat={etat} places={places} sens={reglages.sens} sansAnimation={sansAnimation} langue={langue} couleur={reglages.couleur} rangeeRef={rangeeRef} />
			</main>

			{/* Ce qui est à l'écran, pour les lecteurs d'écran seulement. */}
			<p id="annonce" className="sr-only" aria-live="polite">{annonce(etat, langue)}</p>
			<JaugeAppui jauge={jauge} />

			{/* Les aides à la répétition, ouvertes depuis les réglages. */}
			{enReglages && aide === 'entrainement' && <Entrainement langue={langue} demandee={demandee} etat={etat} surRecommencer={recommencer} surRetour={() => ouvrirAide(null)} />}
			{enReglages && aide === 'zones' && <TestDesZones langue={langue} mesurer={mesurer} eclair={eclair} surReglages={() => ouvrirAide(null)} surQuitter={quitter} />}

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{panneau && <Reglages reglages={reglages} langue={langue} enregistrer={enregistrer} surEntrainement={() => ouvrirAide('entrainement')} surTestDesZones={() => ouvrirAide('zones')} />}
		</>
	);
}
