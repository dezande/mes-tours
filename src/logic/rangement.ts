/*
 * LE RANGEMENT DES TUILES DU MENU : les favoris d'abord, puis les autres tours, les uns comme les
 * autres dans l'ordre choisi dans les réglages généraux (src/pages/ReglagesGeneraux.tsx) :
 *
 *   publication   de la première version à la dernière (Tour.publie, content/tours.ts) ; les tours
 *                 d'une même version dans l'ordre de la liste ;
 *   alphabetique  par nom, dans la langue du menu, sans tenir compte des accents ni des majuscules.
 *
 * Fonctions pures, testées sous Node (tests/logic/rangement.test.ts).
 */

import type { Tour } from '../content/tours.ts';
import type { Lang } from './i18n.ts';

/** L'ordre des tours du menu. */
export type Tri = 'publication' | 'alphabetique';

export const TRIS: readonly Tri[] = ['publication', 'alphabetique'];

/** Compare deux versions « 1.10.0 » nombre à nombre (« 1.10.0 » vient après « 1.9.0 »). */
export function comparerVersions(a: string, b: string): number {
	const [x, y] = [a.split('.').map(Number), b.split('.').map(Number)];
	for (let i = 0; i < Math.max(x.length, y.length); i++) {
		const ecart = (x[i] ?? 0) - (y[i] ?? 0);
		if (ecart !== 0) return ecart;
	}
	return 0;
}

/** Les tours dans l'ordre `tri` (un tri stable : à égalité, l'ordre de la liste). */
export function trier(tours: readonly Tour[], tri: Tri, langue: Lang): Tour[] {
	const comparer = tri === 'publication'
		? (a: Tour, b: Tour) => comparerVersions(a.publie, b.publie)
		: (a: Tour, b: Tour) => a.nom[langue].localeCompare(b.nom[langue], langue, { sensitivity: 'base' });
	return [...tours].sort(comparer);
}

/** Les favoris, puis les autres tours, chacun dans l'ordre `tri`. */
export function ranger(tours: readonly Tour[], favoris: readonly string[], tri: Tri, langue: Lang): { favoris: Tour[]; autres: Tour[] } {
	const tries = trier(tours, tri, langue);
	return {
		favoris: tries.filter((tour) => favoris.includes(tour.dossier)),
		autres: tries.filter((tour) => !favoris.includes(tour.dossier)),
	};
}
