/*
 * Les cinq cartes : cinq cartes face cachée, en ligne, téléphone tenu en largeur. À la révélation,
 * elles sont toutes blanches, sauf une : la carte du spectateur.
 *   le codage       toucher les cartes 1, 2, 3, 4 (depuis le bord réglé, gauche par défaut) les
 *                   retourne, blanches, et ajoute 1, 2, 4, 8 à la valeur ; toucher la cinquième, à
 *                   l'autre bord, la retourne et termine le codage, et son coin donne la couleur
 *                   (haut gauche pique, haut droite cœur, bas gauche trèfle, bas droite carreau).
 *   la révélation   chaque toucher retourne la carte touchée : blanche, sauf la dernière retournée
 *   la fin          les cinq cartes retournées, on ne peut plus que les retourner, dans un sens ou
 *                   dans l'autre ; aucun geste ne relance la routine (au clavier : R ou Début)
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal, d'où le tour rouvre neuf
 *
 * Les cartes sont posées comme dans Princesse : côte à côte, un peu de travers, sans se toucher.
 *
 * Depuis les réglages (écrou ⚙), deux aides à la répétition : le mode entraînement (la routine,
 * une carte à coder tirée au hasard, « Recommencer » et « Retour aux réglages ») et le test des zones (les zones de touchers
 * dessinées sur la scène, comme pour la boule de cristal).
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène et l'état de la routine (gestes et clavier : src/hooks/)
 *   components/  Rangee (les cinq cartes, le retournement), FaceDeCarte (la carte du spectateur,
 *                dessinée en SVG), Reglages (le panneau de l'écrou ⚙), Entrainement et
 *                TestDesZones (les aides à la répétition)
 *   content/     LE TEXTE : interface.ts (les réglages, le nom des cartes)
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/cinq-cartes/)
 *     routine.ts     le codage, la révélation, et ce que chaque toucher en fait
 *     table.ts       la carte touchée, et le coin de la cinquième
 *     disposition.ts la rangée, chaque carte un peu de travers
 *     faces.ts       le dessin des faces : symboles, places, index
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 * Les dos de cartes sont partagés avec les autres tours de cartes (src/components/cartes/), les
 * styles sont dans src/styles/tours/cinq-cartes/.
 */

import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useVerrouPaysage } from '../../appareil/Orientation.tsx';
import { JaugeAppui } from '../../components/JaugeAppui.tsx';
import { useClavier } from '../../hooks/useClavier.ts';
import { useGestesDoubleToucher } from '../../hooks/useGestesDoubleToucher.ts';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { useSansAnimation } from '../../hooks/useSansAnimation.ts';
import { usePont } from '../pont.tsx';
import { Entrainement } from './components/Entrainement.tsx';
import { annonce, Rangee } from './components/Rangee.tsx';
import { Reglages } from './components/Reglages.tsx';
import { TestDesZones, type Eclair } from './components/TestDesZones.tsx';
import { keyAction, toucheDeCarte } from './logic/keys.ts';
import { nouveauSemis, rangee, type Position } from './logic/disposition.ts';
import { carteAuHasard, DEPART, DERNIERE, NOMBRE, toucher, type CarteJouee, type Couleur, type Etat } from './logic/routine.ts';
import { rangDeLaPlace, sanitizeSettings } from './logic/settings.ts';
import { boitesDeLaRangee, carteDuPoint, couleurDuPoint, type Boite } from './logic/table.ts';

/**
 * Les réglages, gardés sur l'appareil. La routine, elle, n'est enregistrée nulle part : chaque
 * ouverture repart de cinq dos, sans rien de codé.
 */
const CLE_REGLAGES = 'cinq-cartes:settings:v1';
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

export default function CinqCartes() {
	const { langue, enReglages, quitter } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, valider);
	const [aide, setAide] = useState<Aide>(null);
	/** Le panneau de réglages est à l'écran (ouvert par l'écrou ⚙, aucune aide en cours). */
	const panneau = enReglages && aide === null;
	// Cinq cartes en ligne : le tour, et ses aides, se jouent en largeur. Ses réglages restent en portrait.
	useVerrouPaysage(!panneau);

	/*
	 * La police pixel des index n'est demandée qu'à la première face écrite : sans précaution, la
	 * carte du spectateur se retournerait sans index le temps qu'elle arrive. Elle est donc chargée
	 * dès l'ouverture du tour.
	 */
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

	/*
	 * Sans transition à l'ouverture comme à chaque remise en place (R) : les cartes se retrouvent
	 * face cachée d'un coup, au lieu de se retourner une à une sous les yeux du public.
	 */
	const [remises, setRemises] = useState(0);
	const sansAnimation = useSansAnimation(remises);

	const changer = useCallback((suivant: Etat): void => {
		if (suivant === etatRef.current) return;
		etatRef.current = suivant;
		setEtat(suivant);
	}, []);

	/** Les cinq cartes reviennent face cachée, rien de codé (au clavier seulement) : on reste dans le tour. */
	const remettre = useCallback((): void => {
		if (etatRef.current === DEPART) return;
		setRemises((n) => n + 1);
		setPlaces(rangee(NOMBRE, nouveauSemis()));
		changer(DEPART);
	}, [changer]);

	const toucherCarte = useCallback((index: number, couleur?: Couleur | null): void => {
		changer(toucher(etatRef.current, index, couleur));
	}, [changer]);

	/** Les colonnes et les cartes de la table, dans le repère de #app, et le rang du codage de chaque place. */
	const mesurer = useCallback(() => {
		const el = rangeeRef.current;
		const carte = el?.querySelector<HTMLElement>('.carte');
		if (!el || !carte) return null;
		const boites = boitesDeLaRangee(boiteDansLApp(el), places, carte.offsetWidth, carte.offsetHeight);
		return { ...boites, rangs: places.map((_, place) => rangDeLaPlace(place, reglages.sens)) };
	}, [places, reglages.sens]);

	/* ---------- Les aides à la répétition ---------- */

	/** La dernière zone touchée, pendant le test des zones. */
	const [eclair, setEclair] = useState<Eclair | null>(null);

	/** La carte que le mode entraînement demande de coder : nouvelle à chaque ouverture et à chaque « Recommencer ». */
	const [demandee, setDemandee] = useState<CarteJouee>(() => carteAuHasard());

	/** Ouvre une aide (ou revient au panneau, null) : chacune commence sur cinq dos. */
	const ouvrirAide = (suivante: Aide): void => {
		remettre();
		setEclair(null);
		if (suivante === 'entrainement') setDemandee(carteAuHasard());
		setAide(suivante);
	};

	/** « Recommencer », ou R, dans le mode entraînement : cinq dos, et une nouvelle carte à coder. */
	const recommencer = (): void => {
		remettre();
		setDemandee(carteAuHasard());
	};

	/* ---------- Gestes sur la scène, clavier ---------- */

	/**
	 * Un geste de la scène, au point (x, y) du repère de l'app, touche la carte sous le doigt (le
	 * coin compte pour la cinquième). Le double toucher n'a rien de particulier : c'est un toucher
	 * de plus — deux cartes voisines touchées vite pendant le codage, ou une carte retournée puis
	 * remise, ne doivent rien avoir d'exceptionnel.
	 */
	const { scene, jauge } = useGestesDoubleToucher(reglages.showHoldRing, (_geste, { x, y }) => {
		// Le panneau de réglages par-dessus : la scène cachée ne reçoit rien.
		if (panneau) return;
		const boites = mesurer();
		if (!boites) return;
		const place = carteDuPoint(x, boites.colonnes);
		if (place === null) return;
		const rang = boites.rangs[place]!;
		const couleur = rang === DERNIERE ? couleurDuPoint(x, y, boites.cartes[place]!) : null;
		// Le test des zones allume la zone touchée, sans retourner de carte.
		if (aide === 'zones') setEclair((avant) => ({ zone: couleur ? { rang, couleur } : { rang }, n: (avant?.n ?? 0) + 1 }));
		else toucherCarte(rang, couleur);
	});

	// 1 à 5 : toucher la carte de ce rang du codage (1 : celle qui vaut 1, 5 : celle de la couleur) ; P, C, T, D : la cinquième dans un coin ; R : remettre ; Échap ou M : menu.
	// Le panneau de réglages ouvert, seules Échap et M comptent ; le test des zones ne retourne rien.
	useClavier(keyAction, (action) => {
		if (action === 'remettre') {
			if (aide === 'entrainement') recommencer();
			else remettre();
			return;
		}
		if (aide === 'zones') return;
		const { index, couleur } = toucheDeCarte(action);
		toucherCarte(index, couleur);
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
