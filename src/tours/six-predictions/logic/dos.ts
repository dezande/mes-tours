/*
 * Les dos des six cartes : leur dessin et leur couleur. Fonctions pures, sans DOM : testées sous
 * Node (tests/tours/six-predictions/dos.test.ts).
 *
 * Rien ne se règle ici. Chaque carte a son dessin (src/components/cartes/dos.ts), toujours le même
 * à la même place du paquet : le paquet de six montre les six dessins, dans l'ordre. Les couleurs,
 * elles, sont tirées au sort à chaque nouveau paquet, deux voisines n'ayant jamais la même.
 */

import { DESSINS_DE_DOS } from '../../../components/cartes/dos.ts';

/** Les dessins de dos, un par carte, dans l'ordre du paquet. */
export const DESSINS = DESSINS_DE_DOS;
export type Dessin = (typeof DESSINS)[number];

/** Les couleurs de dos, telles qu'elles sont peintes (styles/components/_cartes.scss). */
export const TEINTES = ['noir', 'rouge', 'bleu', 'blanc'] as const;
export type Teinte = (typeof TEINTES)[number];

/** Le dessin du dos de la carte `index` : les dessins se suivent d'une carte à l'autre. */
export const dessinDeCarte = (index: number): Dessin =>
	DESSINS[((index % DESSINS.length) + DESSINS.length) % DESSINS.length]!;

/**
 * Une couleur au hasard pour chacune des `nombre` cartes, différente de celle de la carte
 * précédente : dans l'étalement, chaque carte se détache de sa voisine. `hasard` rend un nombre
 * entre 0 (compris) et 1 (exclu), comme Math.random.
 */
export function teintesAuHasard(nombre: number, hasard: () => number = Math.random): Teinte[] {
	const teintes: Teinte[] = [];
	for (let i = 0; i < nombre; i++) {
		const possibles = TEINTES.filter((teinte) => teinte !== teintes[i - 1]);
		teintes.push(possibles[Math.min(possibles.length - 1, Math.floor(hasard() * possibles.length))]!);
	}
	return teintes;
}
