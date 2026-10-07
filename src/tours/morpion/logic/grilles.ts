/*
 * Les grilles de morpion : lecture, vérification et ligne gagnante. Fonctions pures, sans DOM :
 * testées sous Node (tests/tours/morpion/grilles.test.ts).
 *
 * Une grille s'écrit en trois lignes de trois cases (content/grilles.ts) :
 *   X  une croix      O  un rond      *  une croix et un rond superposés      .  une case vide
 *
 * Une case superposée vaut pour les deux joueurs : elle complète une ligne de croix comme une
 * ligne de ronds.
 */

/** Ce qu'une case peut contenir : `XO`, la croix et le rond superposés. */
export type Case = 'X' | 'O' | 'XO' | null;

/** Une grille telle qu'elle s'écrit : trois lignes de trois caractères. */
export type GrilleEcrite = readonly [string, string, string];

/** Les neuf cases, de gauche à droite et de haut en bas. */
export type Grille = readonly Case[];

/** Les huit lignes qui gagnent : trois rangées, trois colonnes, deux diagonales. */
export const LIGNES: readonly (readonly [number, number, number])[] = [
	[0, 1, 2], [3, 4, 5], [6, 7, 8],
	[0, 3, 6], [1, 4, 7], [2, 5, 8],
	[0, 4, 8], [2, 4, 6],
];

const CASES: Readonly<Record<string, Case>> = { 'X': 'X', 'O': 'O', '*': 'XO' };

/** Les neuf cases d'une grille écrite (une grille mal écrite lève une erreur : voir verifier). */
export function lire(ecrite: GrilleEcrite): Grille {
	return [...ecrite.join('')].map((c) => (Object.hasOwn(CASES, c) ? CASES[c]! : null));
}

/** La case porte-t-elle le signe `signe` (seul, ou superposé à l'autre) ? */
export const porte = (c: Case, signe: 'X' | 'O'): boolean => c !== null && c.includes(signe);

/** Les joueurs qui gagnent sur la ligne `[a, b, c]` : aucun, l'un, ou les deux (cases superposées). */
const gagnantsDe = (grille: Grille, ligne: readonly number[]): ('X' | 'O')[] =>
	(['X', 'O'] as const).filter((signe) => ligne.every((i) => porte(grille[i]!, signe)));

/** La ligne gagnante de la grille, ou null s'il n'y en a pas (match nul ou partie en cours). */
export function ligneGagnante(grille: Grille): readonly [number, number, number] | null {
	return LIGNES.find((ligne) => gagnantsDe(grille, ligne).length > 0) ?? null;
}

/**
 * Les erreurs d'une grille écrite, en clair ; une liste vide si elle est bien écrite. Sans case
 * superposée, la grille doit être une vraie partie : jamais plus d'un coup d'écart entre les croix
 * et les ronds, et pas deux gagnants à la fois. Avec des cases superposées, ce n'est plus une
 * partie ordinaire : seule l'écriture est vérifiée.
 */
export function verifier(ecrite: unknown): string[] {
	if (!Array.isArray(ecrite) || ecrite.length !== 3) return ['trois lignes attendues'];
	const erreurs: string[] = [];
	ecrite.forEach((ligne: unknown, n) => {
		if (typeof ligne !== 'string' || !/^[XO*.]{3}$/.test(ligne)) erreurs.push(`ligne ${n + 1} : trois cases X, O, * ou . attendues`);
	});
	if (erreurs.length > 0) return erreurs;
	const grille = lire(ecrite as unknown as GrilleEcrite);
	if (grille.includes('XO')) return [];
	const x = grille.filter((c) => c === 'X').length;
	const o = grille.filter((c) => c === 'O').length;
	if (Math.abs(x - o) > 1) erreurs.push(`${x} croix pour ${o} ronds : les coups alternent`);
	const gagnants = new Set(LIGNES.flatMap((ligne) => gagnantsDe(grille, ligne)));
	if (gagnants.size > 1) erreurs.push('les deux joueurs gagnent à la fois');
	return erreurs;
}
