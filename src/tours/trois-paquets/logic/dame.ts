/*
 * Le tracé de la dame (la dame de ♠ à forcer, et ses sosies), dans la composition des cartes
 * classiques des jeux américains. Fonctions pures, sans DOM : testées sous Node
 * (tests/tours/trois-paquets/dame.test.ts). components/Carte.tsx en fait un SVG, dans le cadre des
 * figures de la Princesse (princesse/logic/dessin.ts : CADRE_FIGURE), avec ses couleurs.
 *
 * Tout est dessiné dans le repère de la carte, 100 de large pour 140 de haut. La moitié basse est la
 * même que la haute, tête-bêche autour du centre de la carte : tout reste au-dessus de y = 70.
 */

import type { Piece } from '../../princesse/logic/dessin.ts';

/** Un cercle, en chemin. */
const cercle = (cx: number, cy: number, r: number): string =>
	`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

/** Les plis de la robe : des traits qui descendent du corsage jusqu'au milieu. */
function plis(): string {
	let d = '';
	for (let x = 44; x <= 56; x += 3) d += `M${x} 58L${x + (x - 50) * .25} 70`;
	return d;
}

/**
 * La moitié haute de la dame : la couronne dorée et ses pierres rouges, les cheveux dorés tombant sur
 * les épaules, le visage de face, la fraise blanche au cou, la robe bleue au corsage rouge bordé d'or,
 * et, à gauche, la main qui tient le sceptre fleurdelisé. Le visage reste blanc, comme le papier.
 */
export const DEMI_DAME: readonly Piece[] = [
	// La robe, bleue, des épaules jusqu'au milieu.
	{ d: 'M18 70V58C25 53.5 33 51.5 40 51H60C67 51.5 75 53.5 82 58V70Z', teinte: 'bleu' },
	// Les manches rouges, galonnées d'or.
	{ d: 'M18 58C25 53.5 33 51.5 39 51.2L37 70H18Z', teinte: 'rouge' },
	{ d: 'M82 58C75 53.5 67 51.5 61 51.2L63 70H82Z', teinte: 'rouge' },
	{ d: 'M37 70L39 51.2H41.4L39.6 70ZM63 70L61 51.2H58.6L60.4 70Z', teinte: 'jaune' },
	{ d: 'M20 63.5C25 61 30 60 35.6 59.6V61.4C30 61.8 25 62.8 20 65.3ZM80 63.5C75 61 70 60 64.4 59.6V61.4C70 61.8 75 62.8 80 65.3Z', teinte: 'jaune' },
	// Le corsage rouge, sa bordure dorée et ses plis.
	{ d: 'M43 56H57L59 70H41Z', teinte: 'rouge' },
	{ d: 'M43 56H57L57.3 58H42.7Z', teinte: 'jaune' },
	{ d: plis(), teinte: 'noir', trait: true },
	// La fraise blanche, plissée, autour du cou.
	{ d: 'M37 49.5C42 53.5 58 53.5 63 49.5L64.5 53C58 58.5 42 58.5 35.5 53Z', teinte: 'blanc' },
	{ d: 'M39.5 52L39 55M43 53.6L42.8 57M46.5 54.4V57.8M50 54.6V58M53.5 54.4V57.8M57 53.6L57.2 57M60.5 52L61 55', teinte: 'noir', trait: true },
	// Les cheveux dorés, qui tombent sur les épaules.
	{ d: 'M40 30C36 33 35 40 35.5 46C36 49.5 38 51 41 51C40 46 40.6 40 42.4 33Z', teinte: 'jaune' },
	{ d: 'M60 30C64 33 65 40 64.5 46C64 49.5 62 51 59 51C60 46 59.4 40 57.6 33Z', teinte: 'jaune' },
	{ d: 'M38.4 36Q37.4 42 38.6 48M61.6 36Q62.6 42 61.4 48', teinte: 'noir', trait: true },
	// Le visage, de face.
	{ d: 'M42 31H58V40C58 45.5 54.5 49.5 50 49.5C45.5 49.5 42 45.5 42 40Z', teinte: 'blanc' },
	{ d: 'M43.6 35.4Q46 34.4 48.2 35.2M51.8 35.2Q54 34.4 56.4 35.4', teinte: 'noir', trait: true },
	{ d: 'M44.2 37.6Q46.2 36.4 48 37.6Q46.2 38.6 44.2 37.6ZM52 37.6Q53.8 36.4 55.8 37.6Q53.8 38.6 52 37.6Z', teinte: 'blanc' },
	{ d: `${cercle(46.1, 37.6, .85)}${cercle(53.9, 37.6, .85)}`, teinte: 'bleu' },
	{ d: `${cercle(46.1, 37.6, .35)}${cercle(53.9, 37.6, .35)}`, teinte: 'noir' },
	{ d: 'M50 38V42Q49 43 48 42.4', teinte: 'noir', trait: true },
	{ d: 'M47.6 45Q50 46.4 52.4 45Q50 47.2 47.6 45Z', teinte: 'rouge' },
	// La couronne dorée à cinq pointes, ses pierres rouges, posée sur le haut du cadre.
	{ d: 'M39 31.6L37.6 21L42 25L45 19.6L48 24.4L50 19.2L52 24.4L55 19.6L58 25L62.4 21L61 31.6Z', teinte: 'jaune' },
	{ d: 'M39.4 28.6H60.6', teinte: 'noir', trait: true },
	{ d: `${cercle(44, 30.2, .9)}${cercle(50, 30.2, 1.1)}${cercle(56, 30.2, .9)}`, teinte: 'rouge' },
	{ d: `${cercle(45, 20.6, .6)}${cercle(50, 20.2, .6)}${cercle(55, 20.6, .6)}`, teinte: 'blanc' },
	// Le sceptre, à gauche : la hampe dorée, la fleur de lys au sommet, et la main qui le tient.
	{ d: 'M24.6 29H26.6V70H24.6Z', teinte: 'jaune' },
	{ d: 'M25.6 20C24 22.6 24 25.4 25.6 28C27.2 25.4 27.2 22.6 25.6 20ZM25 27C22.4 27.4 20.8 25.6 21 23.4C22.6 24.4 23.8 25.6 25 27ZM26.2 27C28.8 27.4 30.4 25.6 30.2 23.4C28.6 24.4 27.4 25.6 26.2 27ZM22.6 28.4H28.6V30H22.6Z', teinte: 'jaune' },
	{ d: 'M21.6 47C21.6 45.4 23 44.6 25 44.8L29.6 45.4V52.6L25 53C23 53.2 21.6 52.2 21.6 50.6Z', teinte: 'blanc' },
	{ d: 'M22.4 47H25.4M22.2 48.8H25.6M22.4 50.6H25.4', teinte: 'noir', trait: true },
];
