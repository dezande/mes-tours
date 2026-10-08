/*
 * Où les cartes sont posées sur le tapis : la rangée de Princesse, côte à côte, chaque carte un
 * peu de travers comme posée à la main, sans jamais toucher sa voisine. Fonctions pures, sans
 * DOM : testées sous Node (tests/tours/cinq-cartes/disposition.test.ts).
 *
 * Une position est donnée dans le repère de la rangée (styles/tours/cinq-cartes/_cartes.scss) :
 *   x    en places, depuis le milieu de la rangée (-2 pour la première, 2 pour la dernière) ;
 *   y    en hauteurs de carte, depuis la ligne de la rangée (négatif : vers le haut) ;
 *   rot  en degrés.
 */

export interface Position {
	x: number;
	y: number;
	rot: number;
}

/**
 * Les bornes du désordre de la rangée. L'écart entre deux cartes (--ecart, _cartes.scss) vaut 22 %
 * de leur largeur ; chaque carte peut en prendre au plus 7,5 % de chaque côté (décalage, plus le
 * débord de son inclinaison : la moitié de sa hauteur fois le sinus de l'angle), deux voisines
 * 15 % : elles ne se touchent jamais.
 */
export const DESORDRE = { x: .03, y: .07, rot: 3.5 } as const;

/** Tirage déterministe entre 0 et 1, à partir d'un semis et d'un rang (mulberry32). */
export function alea(semis: number, rang: number): number {
	let x = (semis + rang * 0x9e3779b9) >>> 0;
	x = (x + 0x6d2b79f5) >>> 0;
	let t = Math.imul(x ^ (x >>> 15), 1 | x);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Un semis au hasard, pour une nouvelle rangée. */
export const nouveauSemis = (): number => Math.floor(Math.random() * 0x100000000);

/** Un tirage entre -1 et 1. */
const centre = (semis: number, rang: number): number => alea(semis, rang) * 2 - 1;

/** La rangée de `nombre` cartes, chaque place un peu de travers. Le même semis donne la même rangée. */
export function rangee(nombre: number, semis: number): Position[] {
	return Array.from({ length: Math.max(0, nombre) }, (_, place) => ({
		x: place - (nombre - 1) / 2 + centre(semis, 10 + place) * DESORDRE.x,
		y: centre(semis, 20 + place) * DESORDRE.y,
		rot: centre(semis, 30 + place) * DESORDRE.rot,
	}));
}
