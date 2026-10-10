/*
 * Trois questions : un paquet de 52 cartes, sans Joker, trois questions, et la carte du
 * spectateur retrouvée par ses trois réponses (logic/codes.ts). Au public, l'écran est une galerie de
 * photos qu'on fait défiler au doigt, d'une main, téléphone tenu droit :
 *   photo 1, 2, 3                  les cartes en trois colonnes (les autres sont de côté, jamais
 *                                  montrées) : le spectateur dit dans quelle colonne est sa carte
 *   toucher une colonne            la note, et passe à la photo suivante (un instant après : le
 *                                  temps de voir qu'aucun second toucher ne suit)
 *   double toucher, n'importe où   note « aucune » (sa carte est de côté), et passe à la photo suivante
 *   défiler vers la gauche         une autre photo des mêmes colonnes, prise en rafale : rien n'est noté
 *   défiler vers la droite         la photo d'avant : la réponse de cette question est oubliée
 *   la révélation                  trois colonnes de cartes, celle du spectateur face en bas au milieu
 *                                  de la colonne du milieu : la 1re carte en haut à gauche a sa valeur,
 *                                  la dernière en bas à droite sa famille — logic/revelation.ts ; cette
 *                                  dernière photo est bloquée : plus aucun défilement
 *   toucher la carte face en bas   elle se retourne, grandit et passe au premier plan (si le réglage le
 *                                  permet ; sinon, elle reste face en bas)
 *   double toucher, la carte retournée (ou qui ne se retourne pas) : une nouvelle routine, la première photo
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal
 * Trois réponses qui ne sont celles d'aucune carte (un code écarté) : rien ne bouge, le téléphone
 * vibre pour l'artiste seul (réglage), qui revient en arrière en défilant vers la droite.
 *
 * Le paquet est mélangé à chaque nouvelle routine. Depuis les réglages (écrou ⚙) : un ordre fixe (un
 * chapelet mémorisé), la couleur du dos, la
 * vibration, la jauge.
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène, l'état de la routine, la galerie qui suit le doigt
 *   components/  Galerie (les photos : colonnes, révélation), Carte (faces Bicycle, dos),
 *                Reglages (le panneau de l'écrou ⚙, l'ordre du paquet)
 *   content/     LE TEXTE : interface.ts (les réglages, les noms des cartes)
 *   hooks/       useGestesGalerie : les gestes de la scène
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/trois-questions/)
 *     codes.ts       les codes des 52 cartes, les codes écartés, la carte des trois réponses
 *     paquet.ts      les 52 cartes, l'ordre du paquet et son écriture abrégée
 *     photos.ts      les colonnes de chaque photo, mélangées
 *     revelation.ts  les colonnes de la révélation et leurs deux coins
 *     routine.ts     la photo montrée, les réponses notées, ce que fait chaque geste
 *     gestes.ts      défilement, tap, double toucher et appui long
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 * Les faces et le dos sont ceux des trois paquets et de la Princesse. Les styles sont dans
 * src/styles/tours/trois-questions/.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { JaugeAppui } from '../../components/JaugeAppui.tsx';
import { useClavier } from '../../hooks/useClavier.ts';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import type { Lang } from '../../logic/i18n.ts';
import { nomDeCarte, type Carte } from '../princesse/logic/cartes.ts';
import { nouveauSemis } from '../princesse/logic/melange.ts';
import { usePont } from '../pont.tsx';
import { ENTRE, Galerie, PhotoDesColonnes } from './components/Galerie.tsx';
import { Reglages } from './components/Reglages.tsx';
import { ui } from './content/interface.ts';
import { useGestesGalerie } from './hooks/useGestesGalerie.ts';
import { placeDesReponses, QUESTIONS, type Reponse } from './logic/codes.ts';
import { GESTURE, type Geste } from './logic/gestes.ts';
import { colonneDeLaTouche, keyAction } from './logic/keys.ts';
import { cartesDeLOrdre, ordreMelange } from './logic/paquet.ts';
import { colonnes, desordre } from './logic/photos.ts';
import { revelation as colonnesDeLaRevelation } from './logic/revelation.ts';
import { apresAucune, apresCentre, apresColonne, apresDefilement, apresDouble, colonneDuPoint, depart, enRevelation, photo, voisines, type Etat, type Photo, type Suite } from './logic/routine.ts';
import { sanitizeSettings } from './logic/settings.ts';

/**
 * Les réglages, gardés sur l'appareil. La routine, elle, n'est enregistrée nulle part : chaque
 * ouverture repart de la première photo.
 */
const CLE_REGLAGES = 'trois-questions:settings:v1';

/** Le signal discret d'un code écarté : deux brèves vibrations. */
const VIBRATION = [40, 90, 40];

/** Sans voisine de ce côté, la photo suit le doigt trois fois moins : la galerie est au bout. */
const RESISTANCE = 1 / 3;

/** Une boîte dans le repère de #app : ses décalages (offsetLeft…), que les transformations ne changent pas. */
function boiteDansLApp(el: HTMLElement): { x: number; y: number; largeur: number; hauteur: number } {
	let [x, y] = [0, 0];
	for (let e: HTMLElement | null = el; e && e.id !== 'app'; e = e.offsetParent as HTMLElement | null) {
		x += e.offsetLeft;
		y += e.offsetTop;
	}
	return { x, y, largeur: el.offsetWidth, hauteur: el.offsetHeight };
}

/** Un élément de la photo montrée. */
const dansLaPhoto = (selecteur: string): HTMLElement | null => document.querySelector<HTMLElement>(`#galerie .diapo[data-place="0"] ${selecteur}`);

/** La largeur d'une photo, d'où arrive la suivante. */
const largeurDeLaGalerie = (): number => document.getElementById('galerie')?.offsetWidth || window.innerWidth;

/** Ce qui est à l'écran, pour les lecteurs d'écran seulement : une photo, ou la carte retournée. */
function annonce(etat: Etat, carte: Carte | null, langue: Lang): string {
	return enRevelation(etat) && etat.retournee && carte ? nomDeCarte(carte, langue) : ui('annonce.photo', langue);
}

export default function TroisQuestions() {
	const { langue, enReglages } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, sanitizeSettings);

	/* ---------- L'état de la routine ---------- */

	const [etat, setEtat] = useState<Etat>(() => depart(nouveauSemis()));
	// Lu par les gestes et le clavier, qui doivent toujours voir la dernière valeur.
	const etatRef = useRef(etat);
	const changer = useCallback((suivant: Etat): void => {
		etatRef.current = suivant;
		setEtat(suivant);
	}, []);

	/** Les 52 cartes, dans l'ordre du paquet réglé ; sans ordre réglé, un autre mélange à chaque routine. */
	const cartes = useMemo(() => cartesDeLOrdre(reglages.ordre ?? ordreMelange(etat.semis)), [reglages.ordre, etat.semis]);

	/** Les trois photos de colonnes de la routine : les mêmes pour la première prise et la rafale. */
	const questions = useMemo(() => Array.from({ length: QUESTIONS }, (_, q) => ({ colonnes: colonnes(cartes, q, etat.semis), desordre: desordre(q, etat.semis) })), [cartes, etat.semis]);

	/** La carte des trois réponses, et les colonnes de la révélation ; null pour un code écarté. */
	const revelation = useCallback((reponses: readonly Reponse[]) => {
		const place = placeDesReponses(reponses);
		return place === null ? null : { carte: cartes[place]!, colonnes: colonnesDeLaRevelation(cartes[place]!, etat.semis), desordre: desordre(QUESTIONS, etat.semis) };
	}, [cartes, etat.semis]);

	/* ---------- La galerie qui suit le doigt ---------- */

	const [decalage, setDecalage] = useState(0);
	const [anime, setAnime] = useState(false);
	const image = useRef(0);
	useEffect(() => () => cancelAnimationFrame(image.current), []);

	/** La photo revient à sa place, en glissant. */
	const reposer = useCallback((): void => {
		cancelAnimationFrame(image.current);
		setAnime(true);
		setDecalage(0);
	}, []);

	/**
	 * La nouvelle photo arrive en glissant depuis `ecart` pixels (là où elle était, à côté de l'ancienne,
	 * quand le doigt s'est levé) : posée là d'un coup, puis, deux images plus tard, glissée à sa place.
	 */
	const glisserDepuis = useCallback((ecart: number): void => {
		cancelAnimationFrame(image.current);
		setAnime(false);
		setDecalage(ecart);
		image.current = requestAnimationFrame(() => {
			image.current = requestAnimationFrame(() => reposer());
		});
	}, [reposer]);

	/** Le signal discret d'un code écarté, pour l'artiste seul. */
	const signaler = useCallback((): void => {
		if (reglages.vibration) navigator.vibrate?.(VIBRATION);
	}, [reglages.vibration]);

	/**
	 * Applique ce qu'un geste a fait (`suite`). La nouvelle photo arrive du côté de `sens`, depuis le
	 * dernier déplacement du doigt (`dx`) ; rien de changé, la photo revient à sa place.
	 */
	const appliquer = useCallback((suite: Suite, sens: 'suivant' | 'precedent', dx = 0): void => {
		if (suite.exclu) signaler();
		if (suite.etat === etatRef.current) {
			reposer();
			return;
		}
		const avant = photo(etatRef.current);
		changer(suite.etat);
		// La carte qui se retourne : la photo reste où elle est.
		if (avant.type === 'revelation' && photo(suite.etat).type === 'revelation') return reposer();
		glisserDepuis((sens === 'suivant' ? 1 : -1) * (largeurDeLaGalerie() + ENTRE) + dx);
	}, [changer, glisserDepuis, reposer, signaler]);

	/* ---------- Gestes sur la scène, clavier ---------- */

	/** État avant le dernier tap : un double toucher ne relance la routine que sur une carte déjà retournée. */
	const avantDernierTap = useRef<Etat>(etat);

	/**
	 * Le toucher d'une colonne attend un instant, le temps de voir si un second toucher en fait un
	 * double toucher (« aucune ») : la colonne n'est notée que s'il ne vient pas.
	 */
	const enAttente = useRef(0);
	useEffect(() => () => clearTimeout(enAttente.current), []);
	const appliquerRef = useRef(appliquer);
	appliquerRef.current = appliquer;

	/** La carte du spectateur est-elle sous le point (x, y) ? Sa boîte, élargie d'un quart de chaque côté. */
	const surLaCarte = (x: number, y: number): boolean => {
		const carte = dansLaPhoto('#spectateur');
		if (!carte) return false;
		const b = boiteDansLApp(carte);
		const [mx, my] = [b.largeur / 4, b.hauteur / 4];
		return x >= b.x - mx && x <= b.x + b.largeur + mx && y >= b.y - my && y <= b.y + b.hauteur + my;
	};

	const voisinesRef = useRef(voisines(etat));
	voisinesRef.current = voisines(etat);

	const { scene, jauge } = useGestesGalerie(
		reglages.showHoldRing,
		(dx) => {
			if (enReglages) return;
			// Au bout de la galerie, la photo résiste.
			const { precedente, suivante } = voisinesRef.current;
			const libre = dx < 0 ? suivante : precedente;
			cancelAnimationFrame(image.current);
			setAnime(false);
			setDecalage(libre ? dx : dx * RESISTANCE);
		},
		(geste: Geste, { x, y }, dx) => {
			if (enReglages) return;
			const avant = etatRef.current;
			const libre = dx < 0 ? voisinesRef.current.suivante : voisinesRef.current.precedente;
			const suivi = libre ? dx : dx * RESISTANCE;
			if (geste === 'suivant' || geste === 'precedent') return appliquer(apresDefilement(avant, geste), geste, suivi);
			if (geste === 'none') return reposer();
			if (enRevelation(avant)) {
				if (geste === 'double') {
					const relance = apresDouble(avant, avantDernierTap.current, nouveauSemis(), reglages.retournable);
					if (relance !== avant) appliquer({ etat: relance, exclu: false }, 'suivant');
				} else if (reglages.retournable && surLaCarte(x, y)) changer(apresCentre(avant));
			} else if (geste === 'double') {
				// Le premier toucher attendait : il n'était que la moitié du double toucher.
				clearTimeout(enAttente.current);
				appliquer(apresAucune(avant), 'suivant');
			} else if (geste === 'tap') {
				const cliche = dansLaPhoto('.cliche');
				const boite = cliche ? boiteDansLApp(cliche) : null;
				const colonne = boite ? colonneDuPoint(x, boite.x, boite.largeur) : null;
				clearTimeout(enAttente.current);
				if (colonne !== null) {
					enAttente.current = window.setTimeout(() => appliquerRef.current(apresColonne(etatRef.current, colonne), 'suivant'), GESTURE.doubleMaxMs);
				}
			}
			if (geste === 'tap') avantDernierTap.current = avant;
		},
	);

	// → et ← : défiler ; 0 : « aucune » ; 1 à 3 : toucher cette colonne ; Espace : la carte du spectateur ;
	// R : une nouvelle routine ; Échap ou M : retour au menu.
	useClavier(keyAction, (action) => {
		const avant = etatRef.current;
		if (action === 'remettre') {
			clearTimeout(enAttente.current);
			cancelAnimationFrame(image.current);
			setAnime(false);
			setDecalage(0);
			changer(depart(nouveauSemis()));
		} else if (action === 'suivant' || action === 'precedent') appliquer(apresDefilement(avant, action), action);
		else if (action === 'aucune') appliquer(apresAucune(avant), 'suivant');
		else if (action === 'centre') {
			if (reglages.retournable) changer(apresCentre(avant));
		}
		else {
			const colonne = colonneDeLaTouche(action);
			if (colonne !== null) appliquer(apresColonne(avant, colonne), 'suivant');
		}
	});

	/* ---------- Affichage ---------- */

	const { precedente, suivante } = voisines(etat);
	const montree = revelation(etat.reponses);

	const rendu = (photoMontree: Photo) => {
		if (photoMontree.type === 'colonnes') {
			const q = questions[photoMontree.question]!;
			return <PhotoDesColonnes colonnes={q.colonnes} desordre={q.desordre} rafale={photoMontree.rafale} langue={langue} />;
		}
		const r = revelation(photoMontree.reponses);
		return r && <PhotoDesColonnes colonnes={r.colonnes} desordre={r.desordre} langue={langue} spectateur={{ couleur: reglages.couleur, retournee: photoMontree.retournee }} />;
	};

	return (
		<>
			{/* La scène reçoit tous les touchers. */}
			<main id="stage" {...scene}>
				<Galerie precedente={precedente} courante={photo(etat)} suivante={suivante} decalage={decalage} anime={anime} rendu={rendu} />
			</main>

			{/* Ce qui est à l'écran, pour les lecteurs d'écran seulement. */}
			<p id="annonce" className="sr-only" aria-live="polite">{annonce(etat, montree?.carte ?? null, langue)}</p>
			<JaugeAppui jauge={jauge} />

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{enReglages && <Reglages reglages={reglages} langue={langue} enregistrer={enregistrer} />}
		</>
	);
}
