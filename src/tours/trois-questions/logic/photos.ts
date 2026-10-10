/*
 * Ce que montre chaque photo de colonnes : les cartes de chaque colonne, dans un ordre tiré au sort
 * (rien ne trahit l'ordre du paquet), et un peu de désordre, comme posées à la main. Fonctions pures,
 * sans DOM : testées sous Node (tests/tours/trois-questions/photos.test.ts). Le même semis donne
 * toujours les mêmes photos : la rafale montre exactement les mêmes colonnes que la première prise.
 */

import { alea } from '../../princesse/logic/melange.ts';
import type { Position } from '../../trois-paquets/logic/disposition.ts';
import { COLONNES, groupes } from './codes.ts';

/** Le plus grand nombre de cartes d'une colonne (14) : la hauteur des colonnes, sur toutes les photos. */
export const CARTES_PAR_COLONNE = 14;

/** Les trois colonnes de la question `question` (0 à 2), sans le groupe de côté, chacune mélangée. */
export function colonnes<T>(cartes: readonly T[], question: number, semis: number): T[][] {
	const [, ...montrees] = groupes(cartes, question);
	return montrees.map((colonne, c) => {
		const melangee = [...colonne];
		for (let i = melangee.length - 1; i > 0; i--) {
			const j = Math.floor(alea(semis, 7000 + (question * COLONNES + c) * 64 + i) * (i + 1));
			[melangee[i], melangee[j]] = [melangee[j]!, melangee[i]!];
		}
		return melangee;
	});
}

/**
 * Les bornes du désordre : en largeurs et hauteurs de carte, en degrés. Juste assez pour que les cartes
 * semblent posées à la main, jamais assez pour cacher l'index d'une carte sous la suivante : celle-ci
 * descend de plus d'un quart de carte (styles/tours/trois-questions/_galerie.scss : --pas-colonne),
 * l'index en occupe moins (22 %), et le désordre ne la remonte que de 1 % ni ne la penche de plus de 1,5°.
 */
export const DESORDRE = { x: .03, y: .01, rot: 1.5 } as const;

/** Le désordre des cartes des colonnes de la question `question` (0 à 2, ou 3 pour la révélation) : un autre à chaque photo. */
export function desordre(question: number, semis: number): Position[][] {
	const centre = (rang: number): number => alea(semis, rang) * 2 - 1;
	return Array.from({ length: COLONNES }, (_, c) => Array.from({ length: CARTES_PAR_COLONNE }, (_, i) => {
		const r = 9000 + ((question * COLONNES + c) * CARTES_PAR_COLONNE + i) * 3;
		return { x: 0, y: 0, dx: centre(r) * DESORDRE.x, dy: centre(r + 1) * DESORDRE.y, rot: centre(r + 2) * DESORDRE.rot, z: i };
	}));
}
