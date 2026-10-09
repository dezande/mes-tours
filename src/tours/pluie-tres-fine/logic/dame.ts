/*
 * La Dame d'un jeu des années 1950 et 1960, dessinée en SVG (components/FaceDeDame.tsx) : le
 * portrait français, la reine en buste, coupée à la taille et reprise tête-bêche, son nom dans le
 * cadre comme sur les jeux de l'époque. Fonctions pures et données, sans DOM : testées sous Node
 * (tests/tours/pluie-tres-fine/dame.test.ts).
 *
 * Le repère est celui des dos : 100 de large pour 140 de haut. La demi-figure va du haut du cadre
 * à son milieu (y = 70) ; le composant la reprend tournée d'un demi-tour pour le bas.
 *
 * Chaque élément est imprimé comme sur une carte ancienne : son aplat de couleur, posé un peu de
 * travers sur le trait noir (le repérage approximatif des presses de l'époque), puis le trait.
 * Les couleurs sont nommées ici et peintes par styles/tours/pluie-tres-fine/_dame.scss ; chaque
 * Dame a les siennes (robe, manches, voile), comme dans un vrai jeu :
 *   robe, manches, voile   les trois couleurs propres à chaque Dame
 *   or                     le jaune des couronnes, des cheveux et des galons
 *   rouge                  les joyaux, la rose et la bouche
 *   vert                   les feuilles de la rose
 *   papier                 ce qui est réservé en blanc : le visage, les mains, la fraise
 *   noir                   les yeux, les perles du collier
 */

import type { Couleur } from './routine.ts';

/** Le nom de chaque Dame sur les jeux français : Pallas, Judith, Argine et Rachel. */
export const NOMS: Readonly<Record<Couleur, string>> = {
	pique: 'PALLAS',
	coeur: 'JUDITH',
	trefle: 'ARGINE',
	carreau: 'RACHEL',
};

export const TEINTES_DAME = ['robe', 'manches', 'voile', 'or', 'rouge', 'vert', 'papier', 'noir'] as const;
export type TeinteDame = (typeof TEINTES_DAME)[number];

/**
 * Un élément de la demi-figure : son chemin, son aplat (ou aucun), l'épaisseur de son trait (0 :
 * aucun), et l'encre de ce trait quand elle n'est pas le noir (les galons d'or).
 */
export interface Element {
	d: string;
	aplat: TeinteDame | null;
	trait: number;
	encre?: TeinteDame;
}

/** La demi-figure se termine au milieu de la carte. */
export const TAILLE = 70;

/** Un élément, puis le même renvoyé de l'autre côté de l'axe de la carte (x = 50). */
function enMiroir(element: Element): Element[] {
	const d = element.d.replace(/([MLQCHA])([^MLQCHAZ]*)/g, (_, commande: string, nombres: string) => {
		const v = nombres.trim().split(/[\s,]+/).filter(Boolean).map(Number);
		if (commande === 'H') return `H${100 - v[0]!}`;
		if (commande === 'A') return `A${v[0]} ${v[1]} ${v[2]} ${v[3]} ${1 - v[4]!} ${100 - v[5]!} ${v[6]}`;
		const points = [];
		for (let i = 0; i < v.length; i += 2) points.push(`${Math.round((100 - v[i]!) * 100) / 100} ${v[i + 1]}`);
		return `${commande}${points.join(' ')}`;
	});
	return [element, { ...element, d }];
}

/** Un cercle de rayon `r` centré en (x, y), en chemin. */
export const rond = (x: number, y: number, r: number): string => `M${x - r} ${y}A${r} ${r} 0 1 0 ${x + r} ${y}A${r} ${r} 0 1 0 ${x - r} ${y}Z`;

/** Les éléments de la demi-figure, du fond vers le dessus. */
export const DEMI_FIGURE: readonly Element[] = [
	// Le voile, qui tombe de la couronne sur les épaules.
	...enMiroir({ d: 'M42 21Q34 24 33 34Q32 44 26 53L36 50Q40 41 42.5 31Z', aplat: 'voile', trait: .55 }),
	// Les épaules et les manches.
	{ d: 'M25 70L26.5 57Q27.5 49.5 34 47.5L44 44.5L56 44.5L66 47.5Q72.5 49.5 73.5 57L75 70Z', aplat: 'manches', trait: .6 },
	// Les galons des manches, et leurs hachures d'ombre.
	...enMiroir({ d: 'M27 55.5Q31 52 37 52', aplat: null, trait: 1.5, encre: 'or' }),
	...enMiroir({ d: 'M26.2 64L28.6 60.6M26.4 67.4L30 62.4M27.6 69.6L31.6 64M30.4 70L33 66.4', aplat: null, trait: .32 }),
	// Le corsage, bordé d'or, et ses losanges.
	{ d: 'M41.5 45.5L58.5 45.5L62 70L38 70Z', aplat: 'robe', trait: .6 },
	...enMiroir({ d: 'M41.5 45.5L38 70', aplat: null, trait: 1.3, encre: 'or' }),
	{ d: 'M50 51.5L51.8 54L50 56.5L48.2 54ZM50 58L51.8 60.5L50 63L48.2 60.5ZM50 64.5L51.8 67L50 69.5L48.2 67Z', aplat: 'or', trait: .4 },
	// Le cou.
	{ d: 'M46.6 36.5L53.4 36.5L54 45L46 45Z', aplat: 'papier', trait: .5 },
	// La fraise, au ras du cou, et le collier de perles avec sa goutte.
	{ d: 'M39 45Q41 41.5 43 44Q45 41 47 43.5Q50 40.5 53 43.5Q55 41 57 44Q59 41.5 61 45Q56 48.8 50 48.8Q44 48.8 39 45Z', aplat: 'papier', trait: .5 },
	{ d: rond(44.5, 49.3, .65) + rond(47.2, 50.1, .65) + rond(50, 50.4, .65) + rond(52.8, 50.1, .65) + rond(55.5, 49.3, .65), aplat: 'noir', trait: 0 },
	{ d: 'M50 51.2Q51.4 53 50 54.2Q48.6 53 50 51.2Z', aplat: 'rouge', trait: .35 },
	// Le visage.
	{ d: 'M50 24.5C53.4 24.5 55.6 27.6 55.6 31.5C55.6 35.6 53.2 38.6 50 38.6C46.8 38.6 44.4 35.6 44.4 31.5C44.4 27.6 46.6 24.5 50 24.5Z', aplat: 'papier', trait: .55 },
	// Les joues, la bouche.
	{ d: rond(46.9, 34, 1.1) + rond(53.1, 34, 1.1), aplat: 'rouge', trait: 0 },
	{ d: 'M48.5 36.2Q50 35.5 51.5 36.2Q50 37.3 48.5 36.2Z', aplat: 'rouge', trait: .3 },
	// Les sourcils, les yeux, le nez.
	...enMiroir({ d: 'M45.9 28.7Q47.3 27.8 48.7 28.5', aplat: null, trait: .4 }),
	...enMiroir({ d: 'M46.1 30.6Q47.4 29.7 48.7 30.6Q47.4 31.2 46.1 30.6Z', aplat: 'noir', trait: .25 }),
	{ d: 'M50.1 30.6L49.3 34.1Q50 34.7 50.9 34.2', aplat: null, trait: .35 },
	// Les cheveux, d'or, qui encadrent le visage et tombent sur la fraise.
	{ d: 'M42.6 33Q41 22 50 21Q59 22 57.4 33Q58 38.5 56 42L55.3 33Q55.3 26 50 25.6Q44.7 26 44.7 33L44 42Q42 38.5 42.6 33Z', aplat: 'or', trait: .5 },
	...enMiroir({ d: 'M43.6 28Q43 33 44.2 37.5M42.8 32Q42.6 36 43.6 39.5', aplat: null, trait: .3 }),
	// La couronne : son bandeau, ses fleurons et leurs perles, ses joyaux.
	{ d: 'M42 20.5L41 14.5L44.5 18L46.5 12.5L50 17L53.5 12.5L55.5 18L59 14.5L58 20.5Z', aplat: 'or', trait: .5 },
	{ d: 'M42 20.5L58 20.5L57.4 24L42.6 24Z', aplat: 'or', trait: .5 },
	{ d: rond(41, 14.2, .9) + rond(46.5, 12.2, .9) + rond(53.5, 12.2, .9) + rond(59, 14.2, .9), aplat: 'papier', trait: .35 },
	{ d: rond(50, 22.2, 1.1), aplat: 'rouge', trait: .3 },
	{ d: rond(45.8, 22.2, .8) + rond(54.2, 22.2, .8), aplat: 'voile', trait: .3 },
	// La main droite, qui tient la rose ; la tige, les feuilles, la fleur.
	{ d: 'M34.4 57.5Q33.2 50 31 44.5', aplat: null, trait: .7 },
	{ d: 'M33 51Q28.6 50 27.6 46.6Q31.4 47.2 33 51ZM33.6 54Q37.6 52.4 38.2 49Q34.6 50.4 33.6 54Z', aplat: 'vert', trait: .4 },
	{ d: rond(31, 41.8, 3.4), aplat: 'rouge', trait: .5 },
	{ d: 'M29.4 41.8A1.6 1.6 0 1 1 32.6 41.8M28.6 40.2Q31 38.6 33.4 40.2M29.2 43.9Q31 45 32.8 43.9', aplat: null, trait: .35 },
	{ d: 'M32.2 58Q33.4 55.8 35.8 56.4Q37.6 57.2 37.2 59.4Q35.4 60.8 33 60.2Z', aplat: 'papier', trait: .5 },
	{ d: 'M34.2 57.4Q35.6 57.6 36.4 58.4M33.6 58.6Q35 58.8 35.8 59.6', aplat: null, trait: .25 },
	// La main gauche, posée sur le corsage.
	{ d: 'M58.2 61Q60.4 59.4 63 60.6Q64 62.2 62 63.4Q59.6 63.6 58.2 61Z', aplat: 'papier', trait: .5 },
	{ d: 'M59.8 61.8Q61.2 61.4 62.4 61.8M59.4 62.6Q60.8 62.4 61.8 62.8', aplat: null, trait: .25 },
];

/** Le cadre de la figure, et la ligne qui la coupe à la taille. */
export const CADRE = { x: 16, y: 9, largeur: 68, hauteur: 122 } as const;
