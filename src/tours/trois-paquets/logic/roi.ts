/*
 * Le tracé du roi (dans les mélanges et le remplissage), dans la composition des cartes classiques
 * des jeux américains. Fonctions pures, sans DOM : testées sous Node
 * (tests/tours/trois-paquets/figures.test.ts). components/Carte.tsx en fait un SVG, dans le cadre des
 * figures de la Princesse (princesse/logic/dessin.ts : CADRE_FIGURE), avec ses couleurs.
 *
 * Tout est dessiné dans le repère de la carte, 100 de large pour 140 de haut. La moitié basse est la
 * même que la haute, tête-bêche autour du centre de la carte : tout reste au-dessus de y = 70.
 */

import type { Piece } from '../../princesse/logic/dessin.ts';

/** Un cercle, en chemin. */
const cercle = (cx: number, cy: number, r: number): string =>
	`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

/** Les boucles de la barbe : des arcs, rangée après rangée. */
function boucles(): string {
	let d = '';
	for (const [y, debut, fin] of [[44.6, 43.4, 56.6], [47.4, 44.6, 55.4]] as const) {
		for (let x = debut; x < fin; x += 2.6) d += `M${x.toFixed(1)} ${y}Q${(x + 1.3).toFixed(1)} ${y + 1.6} ${(x + 2.6).toFixed(1)} ${y}`;
	}
	return d;
}

/**
 * La moitié haute du roi : la grande couronne dorée et ses pierres, les cheveux et la barbe dorés,
 * la moustache, le visage de face, le col d'hermine blanc moucheté de noir, le manteau rouge bordé
 * d'or sur la tunique bleue, et l'épée levée derrière la tête, à droite, la main sur la garde. Le
 * visage reste blanc, comme le papier.
 */
export const DEMI_ROI: readonly Piece[] = [
	// Le manteau rouge, des épaules jusqu'au milieu, et la tunique bleue au milieu.
	{ d: 'M18 70V57C25 52.5 33 50.6 40 50.4H60C67 50.6 75 52.5 82 57V70Z', teinte: 'rouge' },
	{ d: 'M41 56H59L61 70H39Z', teinte: 'bleu' },
	{ d: 'M41 56H59L59.3 58H40.7Z', teinte: 'jaune' },
	{ d: 'M50 58V70M45 58L44 70M55 58L56 70', teinte: 'noir', trait: true },
	// Les bords dorés du manteau, et leurs motifs.
	{ d: 'M37.4 70L39.4 51H41.8L39.8 70ZM62.6 70L60.6 51H58.2L60.2 70Z', teinte: 'jaune' },
	{ d: 'M21 62C26 59.6 31 58.8 36.4 58.6V60.4C31 60.6 26 61.4 21 63.8ZM79 62C74 59.6 69 58.8 63.6 58.6V60.4C69 60.6 74 61.4 79 63.8Z', teinte: 'jaune' },
	{ d: `${cercle(26, 66, 1.2)}${cercle(32, 65, 1.2)}${cercle(68, 65, 1.2)}${cercle(74, 66, 1.2)}`, teinte: 'jaune' },
	// Le col d'hermine, blanc moucheté de noir.
	{ d: 'M35 50C41 54.6 59 54.6 65 50L66 54.4C59 59 41 59 34 54.4Z', teinte: 'blanc' },
	{ d: 'M39.4 53.4L40 55.4M44.4 55L45 57M50 55.6V57.6M55.6 55L55 57M60.6 53.4L60 55.4', teinte: 'noir', trait: true },
	// Les cheveux dorés, sur les côtés.
	{ d: 'M41 31C37.6 33 36.6 38 37 43C37.4 46.6 39 48.6 41.6 49.4C41 45 41.4 39 42.6 33Z', teinte: 'jaune' },
	{ d: 'M59 31C62.4 33 63.4 38 63 43C62.6 46.6 61 48.6 58.4 49.4C59 45 58.6 39 57.4 33Z', teinte: 'jaune' },
	// Le visage, de face.
	{ d: 'M42 31H58V39C58 44 54.5 47.4 50 47.4C45.5 47.4 42 44 42 39Z', teinte: 'blanc' },
	{ d: 'M43.6 34.6Q46 33.4 48.2 34.4M51.8 34.4Q54 33.4 56.4 34.6', teinte: 'noir', trait: true },
	{ d: 'M44.2 36.8Q46.2 35.6 48 36.8Q46.2 37.8 44.2 36.8ZM52 36.8Q53.8 35.6 55.8 36.8Q53.8 37.8 52 36.8Z', teinte: 'blanc' },
	{ d: `${cercle(46.1, 36.8, .85)}${cercle(53.9, 36.8, .85)}`, teinte: 'bleu' },
	{ d: `${cercle(46.1, 36.8, .35)}${cercle(53.9, 36.8, .35)}`, teinte: 'noir' },
	{ d: 'M50 37.2V40.6Q49 41.6 48 41', teinte: 'noir', trait: true },
	// La barbe dorée, bouclée, et la moustache.
	{ d: 'M42.4 41.4C43 47.6 46 51.6 50 52C54 51.6 57 47.6 57.6 41.4C55.4 43.4 53 44 50 44C47 44 44.6 43.4 42.4 41.4Z', teinte: 'jaune' },
	{ d: boucles(), teinte: 'noir', trait: true },
	{ d: 'M45 42.4C46.6 41.2 48.6 41.4 50 42.4C51.4 41.4 53.4 41.2 55 42.4C53.4 43.6 51.4 43.6 50 42.8C48.6 43.6 46.6 43.6 45 42.4Z', teinte: 'jaune' },
	{ d: 'M47.8 44.6Q50 45.6 52.2 44.6', teinte: 'rouge', trait: true },
	// La grande couronne dorée, ses pierres rouges et bleues, posée sur le haut du cadre.
	{ d: 'M38.6 31.6L37 20.4L42.4 25.4L46 19.6L50 24.2L54 19.6L57.6 25.4L63 20.4L61.4 31.6Z', teinte: 'jaune' },
	{ d: 'M39 28.4H61', teinte: 'noir', trait: true },
	{ d: `${cercle(44, 30, 1)}${cercle(56, 30, 1)}`, teinte: 'rouge' },
	{ d: cercle(50, 30, 1.2), teinte: 'bleu' },
	{ d: `${cercle(46, 20.6, .6)}${cercle(54, 20.6, .6)}`, teinte: 'blanc' },
	// L'épée, levée derrière la tête, à droite : la lame, la garde, la main.
	{ d: 'M73 20H75V44H73Z', teinte: 'blanc' },
	{ d: 'M74 20V44', teinte: 'noir', trait: true },
	{ d: 'M68.6 44H79.4V46.2H68.6Z', teinte: 'jaune' },
	{ d: 'M73 46.2H75V50H73Z', teinte: 'jaune' },
	{ d: 'M70.4 49C70.4 47.6 71.8 46.8 73.8 47L78.2 47.6V54.4L73.8 55C71.8 55.2 70.4 54.2 70.4 52.8Z', teinte: 'blanc' },
	{ d: 'M71.2 49.2H74.2M71 51H74.4M71.2 52.8H74.2', teinte: 'noir', trait: true },
];
