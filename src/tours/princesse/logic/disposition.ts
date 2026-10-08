/*
 * Où les cartes sont posées sur le tapis : la rangée, un peu de travers comme posée à la main, et
 * les positions éparpillées du mélange. Fonctions pures, sans DOM : testées sous Node
 * (tests/tours/princesse/disposition.test.ts).
 *
 * Une position est donnée dans le repère de la rangée (styles/tours/princesse/_cartes.scss) :
 *   x    en places, depuis le milieu de la rangée (-2 pour la première, 2 pour la dernière) ;
 *   y    en hauteurs de carte, depuis la ligne de la rangée (négatif : vers le haut) ;
 *   rot  en degrés.
 *
 * Le désordre de la rangée reste assez petit pour que deux cartes voisines ne se touchent jamais,
 * même penchées : il est tiré au sort par place, et la carte qui vient s'y poser le prend.
 */

import { alea } from './melange.ts';

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

/** Les bornes du mélange : toute la largeur de la rangée, et de la hauteur de part et d'autre. */
export const ETENDUE_DU_MELANGE = { x: 2.1, y: .3, rot: 28 } as const;

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

/**
 * Les positions éparpillées de chaque étape du mélange : `etapes` listes d'une position par carte
 * de l'écran, partout sur la largeur de la rangée et de part et d'autre de sa ligne, penchées en
 * tous sens. Les cartes s'y croisent en largeur comme en hauteur.
 */
export function eparpillements(nombre: number, semis: number, etapes: number): Position[][] {
	return Array.from({ length: Math.max(0, etapes) }, (_, etape) =>
		Array.from({ length: Math.max(0, nombre) }, (_, carte) => {
			const rang = 1000 + etape * 64 + carte * 4;
			return {
				x: centre(semis, rang) * ETENDUE_DU_MELANGE.x,
				y: centre(semis, rang + 1) * ETENDUE_DU_MELANGE.y,
				rot: centre(semis, rang + 2) * ETENDUE_DU_MELANGE.rot,
			};
		}));
}
