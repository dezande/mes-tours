/*
 * La face d'une carte à jouer, dessinée en SVG (components/FaceDeCarte.tsx) : les symboles des
 * quatre couleurs, la place des symboles de l'As au 10, et les index des coins. Fonctions pures,
 * sans DOM : testées sous Node (tests/tours/cinq-cartes/faces.test.ts).
 *
 * Le repère est celui des dos (src/components/cartes/dos.ts) : 100 de large pour 140 de haut,
 * le rapport d'une carte à jouer. Les symboles de la moitié du bas sont tête-bêche, comme sur une
 * vraie carte.
 */

import type { Lang } from '../../../logic/i18n.ts';
import type { Couleur } from './routine.ts';

/** Un nombre arrondi au millième : un chemin sans « 0.44999999999999996 ». */
const n = (v: number): number => Math.round(v * 1000) / 1000;

/** Un cercle de rayon `r` centré en (x, y), en chemin. */
const rond = (x: number, y: number, r: number): string => `M${n(x - r)} ${n(y)}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(-2 * r)} 0Z`;

/**
 * Le symbole de chaque couleur, centré sur (0, 0), d'une hauteur de 1 (de -0,5 à 0,5) : le
 * composant le place et l'agrandit.
 */
export const SYMBOLES: Readonly<Record<Couleur, string>> = {
	coeur: 'M0 .45C-.16 .3-.5 .08-.5-.17C-.5-.36-.36-.47-.22-.47C-.1-.47-.03-.4 0-.3C.03-.4 .1-.47 .22-.47C.36-.47 .5-.36 .5-.17C.5 .08 .16 .3 0 .45Z',
	carreau: 'M0-.5Q.17-.24 .38 0Q.17 .24 0 .5Q-.17 .24-.38 0Q-.17-.24 0-.5Z',
	pique: 'M0-.5C.16-.31 .5-.12 .5 .1C.5 .28 .36 .38 .23 .38C.13 .38 .06 .33 .03 .27C.05 .38 .1 .45 .18 .5H-.18C-.1 .45-.05 .38-.03 .27C-.06 .33-.13 .38-.23 .38C-.36 .38-.5 .28-.5 .1C-.5-.12-.16-.31 0-.5Z',
	trefle: `${rond(0, -.25, .21)}${rond(-.24, .09, .21)}${rond(.24, .09, .21)}${rond(0, .03, .12)}M-.04 .1C-.04 .3-.1 .42-.18 .5H.18C.1 .42 .04 .3 .04 .1Z`,
};

/** Les couleurs rouges ; les autres sont noires. */
export const estRouge = (couleur: Couleur): boolean => couleur === 'coeur' || couleur === 'carreau';

/** Un symbole posé sur la carte : son centre, et s'il est tête-bêche (moitié du bas). */
export interface Place {
	x: number;
	y: number;
	retourne: boolean;
}

// Trois colonnes, assez loin des bords pour laisser la place aux grands index des coins, et les
// rangées des cartes à jouer, du haut (25) au bas (115) de la carte.
const G = 33;
const M = 50;
const D = 67;
const [H, H2, H3, MI, B3, B2, B] = [25, 40, 47.5, 70, 92.5, 100, 115];

/** Les symboles de chaque carte numérotée, de l'As au 10, aux places de toutes les cartes à jouer. */
const DISPOSITIONS: Readonly<Record<number, readonly (readonly [number, number])[]>> = {
	1: [[M, MI]],
	2: [[M, H], [M, B]],
	3: [[M, H], [M, MI], [M, B]],
	4: [[G, H], [D, H], [G, B], [D, B]],
	5: [[G, H], [D, H], [M, MI], [G, B], [D, B]],
	6: [[G, H], [D, H], [G, MI], [D, MI], [G, B], [D, B]],
	7: [[G, H], [D, H], [M, H3], [G, MI], [D, MI], [G, B], [D, B]],
	8: [[G, H], [D, H], [M, H3], [G, MI], [D, MI], [M, B3], [G, B], [D, B]],
	9: [[G, H], [D, H], [G, 55], [D, 55], [M, MI], [G, 85], [D, 85], [G, B], [D, B]],
	10: [[G, H], [D, H], [M, H2], [G, 55], [D, 55], [G, 85], [D, 85], [M, B2], [G, B], [D, B]],
};

/** Les places des symboles d'une carte numérotée (As à 10) ; une figure (11 à 13) n'en a pas. */
export function placesDesSymboles(valeur: number): Place[] {
	return (DISPOSITIONS[valeur] ?? []).map(([x, y]) => ({ x, y, retourne: y > MI }));
}

/** La carte est-elle une figure (Valet, Dame, Roi) ? */
export const estFigure = (valeur: number): boolean => valeur >= 11 && valeur <= 13;

/** L'index des coins : A, 2 à 10, puis V D R en français, J Q K en anglais. */
export function index(valeur: number, langue: Lang): string {
	if (valeur === 1) return 'A';
	if (estFigure(valeur)) return (langue === 'fr' ? ['V', 'D', 'R'] : ['J', 'Q', 'K'])[valeur - 11]!;
	return String(valeur);
}
