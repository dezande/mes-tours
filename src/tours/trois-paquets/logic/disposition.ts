/*
 * Où sont posées les cartes en salade (panneaux 1 et 3) : un tas, chaque carte de travers, comme
 * jetées sur le tapis. Fonctions pures, sans DOM : testées sous Node
 * (tests/tours/trois-paquets/disposition.test.ts). Le même semis donne toujours la même salade.
 *
 * Une position est donnée dans la place libre du panneau (styles/tours/trois-paquets/_panneaux.scss) :
 *   x, y  de 0 à 1 : 0 met la carte contre le bord gauche (ou haut), 1 contre le bord droit (ou bas) ;
 *   rot   en degrés ;
 *   z     le rang d'empilement : plus grand, la carte est dessus.
 *
 * Les cartes faces en l'air sont posées sur une grille lâche, une carte par case, un peu décalées et
 * penchées : elles se chevauchent sans jamais cacher le coin en haut à gauche de leur voisine (la
 * rangée du dessous passe devant, mais plus bas). Les cartes faces en bas s'entassent dessous,
 * n'importe où — et quelques-unes PAR-DESSUS (recouvrements) : elles couvrent le bas d'une carte
 * de la grille, jamais son index ni celui d'une autre. Les cartes faces en l'air ne sont pas toutes
 * sur le dessus du tas, mais leur valeur se lit toujours. À la place de certains recouvrements,
 * une autre carte face en l'air sous deux dos (faceCachee) : on n'en voit qu'une bande du bord,
 * toute blanche.
 */

import { alea } from '../../princesse/logic/melange.ts';

/** Le débord des mélanges (nappe) : ils dépassent la place libre d'un cinquième de chaque côté, l'écran les coupe. */
export const DEBORD_DES_MELANGES = .2;

export interface Position {
	x: number;
	y: number;
	rot: number;
	z: number;
	/** Un décalage le long de la carte elle-même (penchée comme elle), en largeurs de carte… */
	dx?: number;
	/** … et en hauteurs de carte (négatif : vers son haut). */
	dy?: number;
}

/** Les bornes du désordre sur la grille : en fraction d'une case, et en degrés. */
export const DESORDRE = { case: .22, rot: 16 } as const;

/** Un tirage entre -1 et 1. */
const centre = (semis: number, rang: number): number => alea(semis, rang) * 2 - 1;

const borne = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * `nombre` cartes sur une grille lâche de `colonnes` colonnes, rangée par rangée de haut en bas ; la
 * dernière rangée, incomplète, est centrée. Les rangées du bas passent devant (z à partir de
 * `zDepart`, de quatre en quatre : un recouvrement, jusqu'à trois cartes, se glisse juste au-dessus
 * de sa carte).
 */
export function grille(nombre: number, colonnes: number, semis: number, zDepart = 100): Position[] {
	if (nombre <= 0 || colonnes <= 0) return [];
	const rangees = Math.ceil(nombre / colonnes);
	return Array.from({ length: nombre }, (_, i) => {
		const rangee = Math.floor(i / colonnes);
		const dansLaRangee = rangee === rangees - 1 ? nombre - rangee * colonnes : colonnes;
		const colonne = i % colonnes + (colonnes - dansLaRangee) / 2;
		const pasX = colonnes > 1 ? 1 / (colonnes - 1) : 0;
		const pasY = rangees > 1 ? 1 / (rangees - 1) : 0;
		return {
			x: borne((colonnes > 1 ? colonne * pasX : .5) + centre(semis, 3 * i) * DESORDRE.case * (pasX || .5)),
			y: borne((rangees > 1 ? rangee * pasY : .5) + centre(semis, 3 * i + 1) * DESORDRE.case * (pasY || .5)),
			rot: centre(semis, 3 * i + 2) * DESORDRE.rot,
			z: zDepart + 4 * i,
		};
	});
}

/**
 * `nombre` cartes en tas, n'importe où, penchées en tous sens, sous la grille (z de `zDepart` à
 * `zDepart + nombre - 1`). `rang` sépare deux tas tirés du même semis.
 */
export function tas(nombre: number, semis: number, zDepart = 0, rang = 0): Position[] {
	return Array.from({ length: Math.max(0, nombre) }, (_, i) => ({
		x: alea(semis, 500 + 3 * i + 200 * rang),
		y: alea(semis, 501 + 3 * i + 200 * rang),
		rot: centre(semis, 502 + 3 * i + 200 * rang) * 60,
		z: zDepart + i,
	}));
}

/**
 * `nombre` cartes posées PAR-DESSUS des cartes de la grille (`places`, `colonnes` colonnes), chacune
 * sur une case différente tirée au sort, hors de la dernière rangée : décalée vers le bas d'une
 * demi-case (et vers la droite d'un peu moins, sauf contre le bord droit), à peine penchée, elle
 * couvre le bas de sa carte sans jamais cacher l'index en haut à gauche. Elle se glisse juste
 * au-dessus de sa carte (son z plus un) et sous toutes les cartes suivantes de la grille : les
 * cartes de la rangée d'en dessous, dont elle atteindrait l'index, passent devant elle.
 */
export function recouvrements(places: readonly Position[], colonnes: number, nombre: number, semis: number): Position[] {
	const rangees = Math.ceil(places.length / Math.max(1, colonnes));
	if (rangees < 2) return [];
	const pasX = colonnes > 1 ? 1 / (colonnes - 1) : 1;
	const pasY = 1 / (rangees - 1);
	const possibles = places.slice(0, (rangees - 1) * colonnes).map((place) => ({
		x: place.x + pasX * .35 <= 1 ? place.x + pasX * .35 : place.x,
		y: place.y + pasY * .5,
		z: place.z + 1,
	}));
	// Les cases tirées au sort (Fisher-Yates), autant que demandé.
	for (let i = possibles.length - 1; i > 0; i--) {
		const j = Math.floor(alea(semis, 900 + i) * (i + 1));
		[possibles[i], possibles[j]] = [possibles[j]!, possibles[i]!];
	}
	return possibles.slice(0, Math.max(0, nombre)).map(({ x, y, z }, i) => ({
		x: borne(x),
		y: borne(y),
		rot: centre(semis, 950 + i) * DESORDRE.rot,
		z,
	}));
}

/**
 * Ce qu'on voit d'une carte face en l'air cachée dans le tas : une bande de son bord gauche, de
 * BORD_VISIBLE de sa largeur, sous son quart du haut (HAUT_CACHE de sa hauteur). Sur toutes les
 * faces, cette bande est blanche : les enseignes commencent à 20 % de la largeur, le cadre des
 * figures à 17 % ; l'index du coin (jusqu'à 22 % de la hauteur) est sous le dos du haut, celui du
 * coin opposé à droite. Ni la valeur ni l'enseigne ne se voient, ni ne se devinent.
 */
export const BORD_VISIBLE = .15;
export const HAUT_CACHE = .28;

/**
 * Une carte face en l'air cachée, posée à la place d'un recouvrement (`place`), et ses deux dos :
 * au même endroit, tête-bêche (la bande blanche dépasse alors du côté droit, et le dos du haut
 * descend, sous les rangées suivantes de la grille), l'un décalé le long de la carte (il laisse voir
 * la bande du bord), l'autre vers son haut (il en couvre l'index). Leurs rangs d'empilement : celui
 * du recouvrement, puis les deux suivants — toujours sous la carte suivante de la grille.
 */
export function faceCachee(place: Position): [Position, Position, Position] {
	const face = { ...place, rot: place.rot + 180 };
	return [face, { ...face, z: place.z + 1, dx: BORD_VISIBLE }, { ...face, z: place.z + 2, dy: HAUT_CACHE - 1 }];
}

/** L'écart minimal entre une carte à forcer et son double, dans la place libre (voir distance). */
export const ECART_DU_DOUBLE = .55;

/**
 * La distance de deux positions, dans la place libre ; la largeur compte double : le tour se joue en
 * paysage, la place est deux fois plus large que haute.
 */
export const distance = (a: Position, b: Position): number => Math.hypot(2 * (a.x - b.x), a.y - b.y);

/**
 * Le DOUBLE d'une carte à forcer (posée en `original`), plus au fond, et le dos qui en couvre la
 * moitié du bas : loin de sa carte (au moins ECART_DU_DOUBLE ; sinon, la plus éloignée de vingt places
 * tirées au sort), et loin des doubles déjà posés (`autres`) autant que possible. Son index du haut
 * reste visible, sauf si une carte de la grille passe dessus. Rangs d'empilement : `z`, `z + 1`.
 */
export function doublon(original: Position, autres: readonly Position[], semis: number, rang: number, z: number): [Position, Position] {
	const places = Array.from({ length: 20 }, (_, essai) => {
		const r = 1200 + rang * 80 + essai * 3;
		return { x: alea(semis, r), y: alea(semis, r + 1), rot: centre(semis, r + 2) * 40, z };
	});
	// La plus éloignée des autres doubles parmi celles qui sont assez loin de sa carte ; à défaut, la
	// plus éloignée de sa carte.
	const loin = places.filter((place) => distance(place, original) >= ECART_DU_DOUBLE);
	const proche = (place: Position): number => Math.min(Infinity, ...autres.map((autre) => distance(place, autre)));
	const choix = loin.length > 0
		? loin.reduce((a, b) => (proche(b) > proche(a) ? b : a))
		: places.reduce((a, b) => (distance(b, original) > distance(a, original) ? b : a));
	return [choix, { ...choix, z: z + 1, dy: .5 }];
}

/**
 * Les cartes d'un mélange, sur toute la table et au-delà : une grille lâche de `colonnes` colonnes qui
 * dépasse la place libre de `debord` de chaque côté, chaque carte décalée jusqu'à une demi-case et
 * penchée en tous sens. Bien réparties, elles couvrent le tapis sans grand trou ; leurs rangs
 * d'empilement sont tirés au sort (0 à `nombre` - 1).
 */
export function nappe(nombre: number, colonnes: number, semis: number, debord: number): Position[] {
	if (nombre <= 0 || colonnes <= 0) return [];
	const rangees = Math.ceil(nombre / colonnes);
	const etendue = 1 + 2 * debord;
	const rangs = Array.from({ length: nombre }, (_, i) => i);
	for (let i = nombre - 1; i > 0; i--) {
		const j = Math.floor(alea(semis, 3000 + i) * (i + 1));
		[rangs[i], rangs[j]] = [rangs[j]!, rangs[i]!];
	}
	return Array.from({ length: nombre }, (_, i) => ({
		x: -debord + ((i % colonnes) + .5 + centre(semis, 3100 + 3 * i) * .5) / colonnes * etendue,
		y: -debord + (Math.floor(i / colonnes) + .5 + centre(semis, 3101 + 3 * i) * .5) / rangees * etendue,
		rot: centre(semis, 3102 + 3 * i) * 60,
		z: rangs[i]!,
	}));
}

/** Les bornes du désordre des colonnes, comme la rangée de la Princesse : en largeurs et hauteurs de carte, en degrés. */
export const DESORDRE_DES_COLONNES = { x: .05, y: .02, rot: 3.5 } as const;

/**
 * Le désordre des cartes des colonnes (les paquets, la fin) : chaque carte un peu décalée et penchée,
 * comme posée à la main. `colonnes` colonnes de `parColonne` cartes ; le même semis donne le même
 * désordre (les trois copies des paquets restent identiques).
 */
export function desordreDesColonnes(colonnes: number, parColonne: number, semis: number, rang = 0): Position[][] {
	return Array.from({ length: Math.max(0, colonnes) }, (_, c) => Array.from({ length: Math.max(0, parColonne) }, (_, i) => {
		const r = 4000 + rang * 500 + (c * parColonne + i) * 3;
		return {
			x: 0,
			y: 0,
			dx: centre(semis, r) * DESORDRE_DES_COLONNES.x,
			dy: centre(semis, r + 1) * DESORDRE_DES_COLONNES.y,
			rot: centre(semis, r + 2) * DESORDRE_DES_COLONNES.rot,
			z: i,
		};
	}));
}
