/*
 * Le mélange des cartes : les ordres successifs par lesquels passent les cartes, faces en bas.
 * Fonctions pures, sans DOM : testées sous Node (tests/tours/princesse/melange.test.ts).
 *
 * Un ordre dit quelle carte est à chaque place : `ordre[place]` est le rang de départ de la carte
 * posée là. Le départ est [0, 1, 2, 3, 4].
 *
 * Le mélange se voit : les cartes changent de place plusieurs fois, en glissant les unes devant les
 * autres. Il est tiré au sort à partir d'un semis, et ne finit jamais dans l'ordre de départ — ni
 * avec une carte à sa place de départ : au public, toutes ont bougé.
 */

/** Le nombre d'étapes du mélange visible : autant de fois où les cartes changent de place. */
export const ETAPES = 4;

/** L'ordre de départ de `nombre` cartes : chacune à sa place. */
export const ordreDeDepart = (nombre: number): number[] => Array.from({ length: Math.max(0, nombre) }, (_, i) => i);

/** Tirage déterministe entre 0 et 1, à partir d'un semis et d'un rang (mulberry32). */
export function alea(semis: number, rang: number): number {
	let x = (semis + rang * 0x9e3779b9) >>> 0;
	x = (x + 0x6d2b79f5) >>> 0;
	let t = Math.imul(x ^ (x >>> 15), 1 | x);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Un semis au hasard, pour un nouveau mélange. */
export const nouveauSemis = (): number => Math.floor(Math.random() * 0x100000000);

/** Un ordre tiré au sort (Fisher-Yates), à partir du semis et d'un rang de tirage. */
function permutation(nombre: number, semis: number, rang: number): number[] {
	const ordre = ordreDeDepart(nombre);
	for (let i = nombre - 1; i > 0; i--) {
		const j = Math.floor(alea(semis, rang * 64 + i) * (i + 1));
		[ordre[i], ordre[j]] = [ordre[j]!, ordre[i]!];
	}
	return ordre;
}

/** Un ordre tiré au sort, quelconque : celui dans lequel les faces sont montrées. */
export const ordreAuHasard = (nombre: number, semis: number): number[] => permutation(nombre, semis, 0x7fff);

/** Aucune carte n'est à sa place de départ. */
export const toutesDeplacees = (ordre: readonly number[]): boolean => ordre.every((carte, place) => carte !== place);

/**
 * Les ordres successifs du mélange de `nombre` cartes, le dernier étant l'ordre final : `etapes`
 * ordres, chacun différent du précédent, le dernier sans aucune carte à sa place de départ (avec au
 * moins deux cartes ; à deux cartes, le dernier peut répéter le précédent). Le même semis donne
 * toujours le même mélange.
 */
export function melange(nombre: number, semis: number, etapes = ETAPES): number[][] {
	if (nombre <= 0 || etapes <= 0) return [];
	if (nombre === 1) return Array.from({ length: etapes }, () => [0]);
	const suite: number[][] = [];
	let precedent = ordreDeDepart(nombre);
	let rang = 0;
	while (suite.length < etapes) {
		const ordre = permutation(nombre, semis, rang++);
		const memeQuAvant = ordre.every((carte, place) => carte === precedent[place]);
		const dernier = suite.length === etapes - 1;
		// À deux cartes, il n'y a qu'un ordre sans carte à sa place : la dernière étape peut alors
		// répéter la précédente. Dès trois cartes, il y en a toujours un autre.
		if (dernier ? !toutesDeplacees(ordre) || (memeQuAvant && nombre > 2) : memeQuAvant) continue;
		suite.push(ordre);
		precedent = ordre;
	}
	return suite;
}
