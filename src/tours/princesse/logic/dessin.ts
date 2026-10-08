/*
 * Les tracés des faces : les enseignes et le valet (le dos, lui, est une photo :
 * components/DessinsDeCarte.tsx). Fonctions pures, sans DOM : testées sous Node
 * (tests/tours/princesse/dessin.test.ts). Les composants (components/) en font des SVG.
 *
 * Tout est dessiné dans le repère de la carte, 100 de large pour 140 de haut (2,5 × 3,5 pouces),
 * sauf les enseignes, dessinées dans une case de 100 × 100 et posées à leur taille.
 */

import type { Enseigne } from './cartes.ts';

/** Un cercle, en chemin. */
const cercle = (cx: number, cy: number, r: number): string =>
	`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

/** Les enseignes, dans une case de 100 × 100, la pointe ou la tige en bas. */
export const ENSEIGNE: Readonly<Record<Enseigne, string>> = {
	coeur: 'M50 94C34 76 4 58 4 32C4 16 15 6 29 6C39 6 46 12 50 21C54 12 61 6 71 6C85 6 96 16 96 32C96 58 66 76 50 94Z',
	// Les côtés un peu creusés, comme sur un vrai jeu.
	carreau: 'M50 2Q63 34 88 50Q63 66 50 98Q37 66 12 50Q37 34 50 2Z',
	trefle: `${cercle(50, 27, 20)}${cercle(27, 58, 20)}${cercle(73, 58, 20)}${cercle(50, 50, 12)}M47 52C47 74 41 88 31 96H69C59 88 53 74 53 52Z`,
	pique: 'M50 4C40 24 6 40 6 62C6 76 17 84 29 84C38 84 44 79 47 73C46 84 41 91 31 96H69C59 91 54 84 53 73C56 79 62 84 71 84C83 84 94 76 94 62C94 40 60 24 50 4Z',
};

/* ---------- Le valet ---------- */

/** Une pièce du valet : son tracé et sa teinte (classe CSS : .rouge, .bleu, .jaune, .peau, .noir, .blanc). */
export interface Piece {
	d: string;
	teinte: 'rouge' | 'bleu' | 'jaune' | 'peau' | 'noir' | 'blanc';
	/** Un trait, sans remplissage. */
	trait?: true;
}

/** Le cadre du personnage, dans le repère de la carte. */
export const CADRE_FIGURE = { x: 17, y: 19, l: 66, h: 102 } as const;

/**
 * La moitié haute du valet, en buste, de la tête aux épaules ; la moitié basse est la même,
 * tête-bêche autour du centre de la carte, comme sur un vrai jeu. Tout reste au-dessus de la ligne
 * du milieu (y = 70).
 */
export const DEMI_VALET: readonly Piece[] = [
	// Les épaules : le pourpoint, mi-bleu mi-rouge, et ses galons jaunes.
	{ d: 'M18 70V66C26 61 36 59 45 61L50 62V70Z', teinte: 'bleu' },
	{ d: 'M82 70V66C74 61 64 59 55 61L50 62V70Z', teinte: 'rouge' },
	{ d: 'M24 70L27 63.4L30 63L27.4 70ZM35 70L36.6 61.6L39.6 61.4L38.4 70Z', teinte: 'jaune' },
	{ d: 'M76 70L73 63.4L70 63L72.6 70ZM65 70L63.4 61.6L60.4 61.4L61.6 70Z', teinte: 'jaune' },
	// Le col en éventail.
	{ d: 'M37 59.5C44 64.5 56 64.5 63 59.5L64.5 63.5C56 69 44 69 35.5 63.5Z', teinte: 'blanc' },
	{ d: 'M40 62.5L41.6 66M45 64L45.8 67.6M50 64.6V68.2M55 64L54.2 67.6M60 62.5L58.4 66', teinte: 'noir', trait: true },
	// Les cheveux, bouclés, de part et d'autre du visage.
	{ d: 'M37.5 41C32 45 31 51 33 57C34.5 55 36 55.6 37.5 57.5C37 52 38 47 40.5 43Z', teinte: 'jaune' },
	{ d: 'M62.5 41C68 45 69 51 67 57C65.5 55 64 55.6 62.5 57.5C63 52 62 47 59.5 43Z', teinte: 'jaune' },
	// Le visage.
	{ d: 'M39 47C39 40 44 37 50 37C56 37 61 40 61 47C61 55 56 60.5 50 60.5C44 60.5 39 55 39 47Z', teinte: 'peau' },
	{ d: 'M43.4 46.2Q45.8 44.8 48.2 46.2M51.8 46.2Q54.2 44.8 56.6 46.2', teinte: 'noir', trait: true },
	{ d: `${cercle(45.8, 48.4, .9)}${cercle(54.2, 48.4, .9)}`, teinte: 'noir' },
	{ d: 'M50 48.6L48.4 53.6L50.8 54', teinte: 'noir', trait: true },
	{ d: 'M46.6 56.4Q50 58.2 53.4 56.4', teinte: 'rouge', trait: true },
	// Le chapeau, rouge à bord jaune, et sa plume.
	{ d: 'M33 43C34 33 42 27.5 50 27.5C58 27.5 66 33 67 43C61 39.6 56 38.6 50 38.6C44 38.6 39 39.6 33 43Z', teinte: 'rouge' },
	{ d: 'M33 43C39 39.6 44 38.6 50 38.6C56 38.6 61 39.6 67 43L67.6 45.6C61 42.2 56 41.4 50 41.4C44 41.4 39 42.2 32.4 45.6Z', teinte: 'jaune' },
	{ d: 'M60.5 32C63 27.4 67.5 24.2 73.5 23.4C70.6 25.6 67.8 28.6 64.2 33.6Z', teinte: 'blanc' },
	{ d: 'M61.8 32.6C64.8 28.6 68.6 25.6 73 23.8M64.6 29.6L64.2 27.4M66.8 27.6L66.8 25.6M69.2 25.8L69.6 24.2', teinte: 'noir', trait: true },
];
