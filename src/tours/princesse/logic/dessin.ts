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
 * La ligne qui partage le valet en deux moitiés, en biais comme sur les cartes classiques : elle
 * passe par le centre de la carte (50, 70) et descend vers la gauche. La moitié haute est au-dessus,
 * la moitié basse en est la même, tête-bêche autour du centre.
 */
export const PENTE = .45;
/** La hauteur de la ligne de partage à l'abscisse `x`. */
export const partage = (x: number): number => 70 - PENTE * (x - 50);

/** Un point à `ecart` au-dessus de la ligne de partage, à l'abscisse `x`. */
const auDessus = (x: number, ecart: number): string => `${x} ${(partage(x) - ecart).toFixed(2)}`;

const [GAUCHE, DROITE] = [17, 83];

/** Les rayures bleues du plastron, verticales, du col jusqu'à la bande dorée. */
function rayures(): string {
	let d = '';
	for (let x = 42; x <= 59; x += 1.8) d += `M${x.toFixed(1)} 52.6L${auDessus(Number(x.toFixed(1)), 8.6)}`;
	return d;
}

/** Les épis de la bande dorée : des chevrons le long du partage. */
function epis(): string {
	let d = '';
	for (let x = GAUCHE + 2.5; x <= DROITE - 2; x += 3.4) {
		const y = partage(x) - 5.5;
		d += `M${(x + 1.2).toFixed(2)} ${(y - 1.6).toFixed(2)}L${x.toFixed(2)} ${(y + .3).toFixed(2)}L${(x + 1.2).toFixed(2)} ${(y + 1.9).toFixed(2)}`;
	}
	return d;
}

/**
 * La moitié haute du valet de carreau, dans la composition traditionnelle des cartes classiques
 * (le portrait anglais des jeux américains) : de face, la toque rouge à panneaux blancs, les cheveux
 * dorés qui s'enroulent sous les oreilles, les yeux bleus, le col doré et son médaillon, la manche
 * rouge à rayure bleue, le plastron rayé, la bande dorée à épis et la bande noire le long du partage
 * en biais, et, à droite, la main qui tient la hallebarde au fer en croissant. Le visage reste blanc,
 * comme le papier. Tout reste au-dessus de la ligne de partage (`partage`).
 */
export const DEMI_VALET: readonly Piece[] = [
	// Le vêtement, bleu, des épaules jusqu'au partage.
	{ d: `M${GAUCHE} 54C25 51 33 50.4 38 50.6H62C70 50.4 77 50.8 ${DROITE} 51.6L${auDessus(DROITE, 0)}L${auDessus(GAUCHE, 0)}Z`, teinte: 'bleu' },
	// La manche rouge, à gauche, et sa rayure bleue.
	{ d: `M${GAUCHE} 54C22 52 30 51 37 51L${auDessus(37, 8)}L${auDessus(GAUCHE, 8)}Z`, teinte: 'rouge' },
	{ d: 'M19 60C24 57.6 30 56.8 35 57V59.6C30 59.4 24 60.2 19 62.6Z', teinte: 'bleu' },
	{ d: 'M19 66C24 63.6 30 62.8 35 63V64.4C30 64.2 24 65 19 67.4Z', teinte: 'blanc' },
	// Le galon blanc à zigzag, entre la manche et le plastron.
	{ d: `M37 51H40.4L${auDessus(40.4, 8)}L${auDessus(37, 8)}Z`, teinte: 'blanc' },
	{ d: 'M37.6 53L39.8 55L37.6 57L39.8 59L37.6 61L39.8 63L37.6 65', teinte: 'bleu', trait: true },
	// L'épaule droite, rouge.
	{ d: `M60 51.2C66 50.4 72 50.4 79 50.8L${auDessus(79, 8)}L${auDessus(60, 8)}Z`, teinte: 'rouge' },
	// Le plastron blanc, rayé de bleu.
	{ d: `M40.4 52.4H60L${auDessus(60, 8)}L${auDessus(40.4, 8)}Z`, teinte: 'blanc' },
	{ d: rayures(), teinte: 'bleu', trait: true },
	// La bande dorée à épis, puis la bande noire, le long du partage.
	{ d: `M${auDessus(GAUCHE, 8)}L${auDessus(DROITE, 8)}L${auDessus(DROITE, 3)}L${auDessus(GAUCHE, 3)}Z`, teinte: 'jaune' },
	{ d: epis(), teinte: 'noir', trait: true },
	{ d: `M${auDessus(GAUCHE, 3)}L${auDessus(DROITE, 3)}L${auDessus(DROITE, 0)}L${auDessus(GAUCHE, 0)}Z`, teinte: 'noir' },
	// Le col doré, et le médaillon qui y pend.
	{ d: 'M38 47C42 50.5 58 50.5 62 47L63 50C58 54 42 54 37 50Z', teinte: 'jaune' },
	{ d: 'M40 49.6C44 52 56 52 60 49.6', teinte: 'noir', trait: true },
	{ d: `M48.4 52.6L50 54.2L51.6 52.6Z${cercle(50, 57, 2.8)}`, teinte: 'jaune' },
	{ d: cercle(50, 57, 1.2), teinte: 'rouge' },
	// Les cheveux dorés, en mèches, qui s'enroulent vers l'extérieur sous les oreilles.
	{ d: 'M41 29C38 31 37 36 37.5 41C36 42 35 44 36 46C37.5 47.5 40.4 46.5 40 44.5C39 44 39.5 42.5 41.4 43Z', teinte: 'jaune' },
	{ d: 'M59 29C62 31 63 36 62.5 41C64 42 65 44 64 46C62.5 47.5 59.6 46.5 60 44.5C61 44 60.5 42.5 58.6 43Z', teinte: 'jaune' },
	{ d: 'M39.6 31.6V41.4M38.6 34V42.4M60.4 31.6V41.4M61.4 34V42.4M37.4 44.2Q38.4 45.4 39.2 44.6M62.6 44.2Q61.6 45.4 60.8 44.6', teinte: 'noir', trait: true },
	// Le visage, de face.
	{ d: 'M41 29H59V38C59 44 55 47.5 50 47.5C45 47.5 41 44 41 38Z', teinte: 'blanc' },
	{ d: 'M43 32.4Q45.5 31.4 48 32.2M52 32.2Q54.5 31.4 57 32.4', teinte: 'noir', trait: true },
	{ d: 'M43.4 34.6Q45.6 33.2 47.8 34.6Q45.6 35.8 43.4 34.6ZM52.2 34.6Q54.4 33.2 56.6 34.6Q54.4 35.8 52.2 34.6Z', teinte: 'blanc' },
	{ d: `${cercle(45.6, 34.6, .95)}${cercle(54.4, 34.6, .95)}`, teinte: 'bleu' },
	{ d: `${cercle(45.6, 34.6, .4)}${cercle(54.4, 34.6, .4)}`, teinte: 'noir' },
	{ d: 'M50 35V39.6Q49 40.8 47.8 40.2M50 39.6Q51 40.8 52.2 40.2', teinte: 'noir', trait: true },
	{ d: 'M47.4 43Q50 44.2 52.6 43', teinte: 'rouge', trait: true },
	{ d: 'M48.8 45.2Q50 45.8 51.2 45.2', teinte: 'noir', trait: true },
	// La toque, rouge à panneaux blancs, posée sur le haut du cadre.
	{ d: 'M36 19H64L61 29.4H39Z', teinte: 'rouge' },
	{ d: 'M39.4 21H45L44.2 27.4H40.8ZM47.4 21H52.6V27.4H47.4ZM55 21H60.6L59.2 27.4H55.8Z', teinte: 'blanc' },
	// La hallebarde, le long du bord droit : la hampe, le fer en croissant semé de points, la main.
	{ d: `M79.4 19.4H81.4L${auDessus(81.4, 3)}L${auDessus(79.4, 3)}Z`, teinte: 'jaune' },
	{ d: 'M79.4 22C73 22.5 69.5 26 69 30.5C69.5 35 73 38 79.4 38.5C75.5 36 74 33 74 30.5C74 27.5 75.5 24.5 79.4 22Z', teinte: 'jaune' },
	{ d: `${cercle(71.6, 30.5, .7)}${cercle(73.4, 26, .6)}${cercle(73.4, 35, .6)}`, teinte: 'noir' },
	{ d: 'M75.6 41C75.6 39.6 77 39 79 39.2L82.6 39.6V47L79 47.4C77 47.6 75.6 46.6 75.6 45.2Z', teinte: 'blanc' },
	{ d: 'M76.4 41.4H79.4M76.2 43.2H79.6M76.4 45H79.4', teinte: 'noir', trait: true },
];
