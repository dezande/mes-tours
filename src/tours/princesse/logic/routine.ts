/*
 * L'état de la routine, et ce que chaque geste en fait. Fonctions pures, sans DOM :
 * testées sous Node (tests/tours/princesse/routine.test.ts).
 *
 * La version de « The Princess Card Trick » : cinq cartes faces en bas, côte à côte, montrées cinq
 * secondes dans un ordre tiré au sort, mélangées ; l'artiste en fait disparaître une, et la carte
 * pensée par le spectateur n'est plus parmi les quatre autres.
 *
 *   faces en bas                ──toucher──▶  faces en l'air (la durée réglée, 5 s par défaut)
 *   faces en l'air              ──durée───▶  faces en bas, puis mélangées
 *   mélangées                   ──toucher une carte──▶  elle disparaît (n'importe laquelle)
 *   une carte disparue          ──toucher une autre carte──▶  elle se retourne, faces en l'air
 *   une carte retournée         ──toucher──▶  elle se remet face en bas, et ainsi de suite
 *
 * Une fois la carte disparue, rien ne remet le tour à zéro sous les yeux du public : ni le double
 * toucher, ni aucun autre geste sur la scène. Seuls le retour au menu (appui de 3 s) et, au
 * clavier, la touche R remettent les cinq cartes faces en bas.
 *
 * La carte qui ne sera JAMAIS montrée (la carte pensée) est dite par la PREMIÈRE CARTE RETOURNÉE,
 * une fois la carte disparue : par sa place parmi les quatre restantes, comptées de gauche à droite,
 * ou de droite à gauche selon les réglages (la place vide ne compte pas). La première cache la
 * première carte de content/cartes.ts (4♣), la deuxième la deuxième (8♥), la troisième le 5♦, la
 * quatrième le 10♦. Un DOUBLE TOUCHER sur n'importe quelle carte restante, à n'importe quel moment
 * après la disparition, cache la dernière (valet de ♦) à la place.
 *
 * Pour que le double toucher reste possible le plus longtemps, le valet n'est montré que s'il ne reste
 * plus que lui à montrer : les cartes retournées montrent d'abord les autres. Chaque carte garde la
 * face qu'elle a montrée la première fois (attribuees), même remise face en bas puis retournée. Tant
 * que le valet n'a été montré nulle part, passer au valet ne change rien de visible : seules les
 * cartes encore jamais retournées en dépendent.
 *
 * Une fois la carte disparue, rien ne remet le tour à zéro sous les yeux du public : ni le double
 * toucher, ni aucun autre geste sur la scène. Seuls le retour au menu (appui de 3 s) et, au
 * clavier, la touche R remettent les cinq cartes faces en bas.
 *
 * La carte qui ne sera JAMAIS montrée (la carte pensée) est dite par la PREMIÈRE CARTE RETOURNÉE,
 * une fois la carte disparue : par sa place parmi les quatre restantes, comptées de gauche à droite,
 * ou de droite à gauche selon les réglages (la place vide ne compte pas). La première cache la première carte de content/cartes.ts (4♣), la
 * deuxième la deuxième (8♥), la troisième le 5♦, la quatrième le 10♦ ; un DOUBLE toucher sur
 * cette première carte, quelle qu'elle soit, cache la dernière (valet de ♦).
 *
 * Le premier toucher du double retourne déjà la carte : elle montre donc une face qui n'est ni la
 * carte cachée par sa place, ni le valet. Le second toucher peut alors changer la carte cachée sans
 * que rien de visible ne change : les trois autres cartes sont encore faces en bas.
 *
 * Un toucher pendant que les cartes sont montrées ou se retournent ne fait rien : un doigt posé par
 * mégarde n'abrège pas les cinq secondes. Pendant le mélange, il fait déjà disparaître la carte :
 * le mélange s'achève aussitôt, sans perdre le geste de l'artiste.
 *
 * Rien de tout cela n'est enregistré : chaque ouverture du tour repart des cinq cartes faces en bas.
 */

import type { Sens } from './settings.ts';

/** Le nombre de cartes de la routine. */
export const NOMBRE = 5;

export type Etat =
	/** Les cinq cartes faces en bas, dans l'ordre de départ : prêt à jouer. */
	| { readonly phase: 'depart' }
	/** Les cinq cartes faces en l'air, le temps que le spectateur en pense une. */
	| { readonly phase: 'montre' }
	/** Les cinq cartes se retournent faces en bas, avant le mélange. */
	| { readonly phase: 'retourne' }
	/** Les cartes se mélangent, faces en bas. */
	| { readonly phase: 'melange' }
	/** Mélangées, faces en bas : on attend le toucher de l'artiste. */
	| { readonly phase: 'pret' }
	/**
	 * La carte de la place `place` a disparu ; `sens`, d'où se comptent les quatre restantes (réglage
	 * lu au moment de la disparition) ; `naturelles`, la face tirée au sort de chaque place ;
	 * `retournees`, les places des cartes faces en l'air ; `attribuees`, la face que chaque place a
	 * montrée la première fois qu'elle a été retournée (null : jamais retournée) ; `premiere`, la place
	 * de la première carte retournée ; `cachee`, la carte qui ne sera pas montrée (son rang dans
	 * content/cartes.ts), null tant que rien ne l'a décidée.
	 */
	| {
		readonly phase: 'revele';
		readonly place: number;
		readonly sens: Sens;
		readonly naturelles: readonly number[];
		readonly retournees: readonly number[];
		readonly attribuees: readonly (number | null)[];
		readonly premiere: number | null;
		readonly cachee: number | null;
	};

export type Phase = Etat['phase'];

/** Le départ : l'état à l'ouverture du tour (et après la touche R, au clavier). */
export const DEPART: Etat = Object.freeze({ phase: 'depart' });

/**
 * La place touchée, de 0 (à gauche) à `nombre - 1` (à droite), à l'abscisse `x`, dans la rangée de
 * cartes qui commence à `gauche` et large de `largeur`, coupée en `nombre` colonnes égales, une par
 * carte. Un point hors de la rangée est ramené à la carte la plus proche ; une largeur invalide donne null.
 */
export function colonneDuPoint(x: number, gauche: number, largeur: number, nombre = NOMBRE): number | null {
	if (![x, gauche, largeur].every(Number.isFinite) || largeur <= 0 || nombre < 1) return null;
	return Math.min(nombre - 1, Math.max(0, Math.floor(((x - gauche) / largeur) * nombre)));
}

/** La carte cachée par un double toucher : la dernière (le valet de ♦). */
export const CACHEE_PAR_LE_DOUBLE = NOMBRE - 1;

/**
 * Le rang d'une place parmi les quatre cartes restantes, compté depuis la gauche (ou la droite, avec
 * `sens` à « droite ») : la place vide ne compte pas.
 */
export function rangParmiLesRestantes(place: number, placeVide: number, sens: Sens = 'gauche'): number {
	const depuisLaGauche = place > placeVide ? place - 1 : place;
	return sens === 'droite' ? NOMBRE - 2 - depuisLaGauche : depuisLaGauche;
}

/** Les faces tirées au sort de chaque place, au moment où une carte disparaît ; par défaut, dans l'ordre. */
const DANS_L_ORDRE: readonly number[] = Array.from({ length: NOMBRE }, (_, i) => i);

/**
 * La face que montre la place `place`, retournée pour la première fois : jamais la carte cachée, ni
 * une face déjà montrée ailleurs ; jamais le valet non plus tant qu'il reste une autre carte à montrer
 * et que le double toucher peut encore le cacher. Sa face tirée au sort si elle convient, sinon la
 * première qui convient, dans l'ordre tiré au sort.
 */
function faceAAttribuer(etat: Extract<Etat, { phase: 'revele' }>, place: number, cachee: number): number {
	const dejaMontrees = etat.attribuees.filter((face): face is number => face !== null);
	const possibles = etat.naturelles.filter((carte) => carte !== cachee && !dejaMontrees.includes(carte));
	const sansValet = cachee === CACHEE_PAR_LE_DOUBLE ? possibles : possibles.filter((carte) => carte !== CACHEE_PAR_LE_DOUBLE);
	const choix = sansValet.length > 0 ? sansValet : possibles;
	const naturelle = etat.naturelles[place]!;
	return choix.includes(naturelle) ? naturelle : choix[0]!;
}

/**
 * État après un toucher sur la carte de la place `colonne` (null : à côté, rien ne se passe).
 * `sens` et `naturelles` : d'où se compteront les quatre restantes, et la face tirée au sort de
 * chaque place, si ce toucher fait disparaître une carte.
 */
export function apresToucher(etat: Etat, colonne: number | null, sens: Sens = 'gauche', naturelles: readonly number[] = DANS_L_ORDRE): Etat {
	if (etat.phase === 'depart') return { phase: 'montre' };
	if (colonne === null) return etat;
	if (etat.phase === 'pret' || etat.phase === 'melange') {
		return {
			phase: 'revele', place: colonne, sens, naturelles: [...naturelles], retournees: [],
			attribuees: naturelles.map(() => null), premiere: null, cachee: null,
		};
	}
	if (etat.phase !== 'revele' || colonne === etat.place) return etat;
	// Une carte retournée se remet face en bas ; elle garde sa face pour la fois suivante.
	if (etat.retournees.includes(colonne)) return { ...etat, retournees: etat.retournees.filter((place) => place !== colonne) };
	// La première carte retournée dit la carte cachée, par sa place parmi les restantes (sauf si un
	// double toucher l'a déjà décidée : le valet).
	const premiere = etat.premiere ?? colonne;
	const cachee = etat.cachee ?? rangParmiLesRestantes(colonne, etat.place, etat.sens);
	const attribuees = [...etat.attribuees];
	attribuees[colonne] ??= faceAAttribuer(etat, colonne, cachee);
	return { ...etat, retournees: [...etat.retournees, colonne], attribuees, premiere, cachee };
}

/** Le valet peut-il encore être caché ? Oui tant qu'aucune carte ne l'a montré. */
export const valetEncoreCachable = (etat: Etat): boolean =>
	etat.phase === 'revele' && !etat.attribuees.includes(CACHEE_PAR_LE_DOUBLE);

/**
 * État après un double toucher : `avantPremierTap` est l'état avant le premier toucher de la paire.
 * Une fois une carte disparue, un double toucher sur n'importe quelle carte restante cache le valet ;
 * le premier toucher a déjà retourné (ou remis) la carte, le second n'y touche plus. Si le valet a
 * déjà été montré, ou ailleurs que sur une carte, le second toucher compte comme un toucher simple.
 * Jamais un double toucher ne remet le tour à zéro.
 */
export function apresDoubleToucher(etat: Etat, colonne: number | null, avantPremierTap: Etat, sens: Sens = 'gauche', naturelles: readonly number[] = DANS_L_ORDRE): Etat {
	if (avantPremierTap.phase === 'revele' && etat.phase === 'revele' && colonne !== null && colonne !== etat.place && valetEncoreCachable(etat)) {
		return { ...etat, cachee: CACHEE_PAR_LE_DOUBLE };
	}
	return apresToucher(etat, colonne, sens, naturelles);
}

/**
 * Quelle carte montre chaque carte de l'écran (`faces[element]`, son rang dans content/cartes.ts),
 * `ordre[place]` étant la carte de l'écran posée à chaque place : la face déjà montrée par sa place,
 * ou sinon sa face tirée au sort (elle est alors face en bas, rien ne se voit).
 */
export function facesAffichees(faces: readonly number[], ordre: readonly number[], etat: Etat): number[] {
	if (etat.phase !== 'revele') return [...faces];
	return faces.map((face, element) => etat.attribuees[ordre.indexOf(element)] ?? face);
}

/** L'étape suivante de la routine, quand sa minuterie arrive à terme. */
export function apresMinuterie(etat: Etat): Etat {
	switch (etat.phase) {
		case 'montre': return { phase: 'retourne' };
		case 'retourne': return { phase: 'melange' };
		case 'melange': return { phase: 'pret' };
		default: return etat;
	}
}

/** La carte de la place `place` montre-t-elle sa face ? */
export const faceEnLAir = (etat: Etat, place: number): boolean =>
	etat.phase === 'montre' || (etat.phase === 'revele' && etat.retournees.includes(place));
