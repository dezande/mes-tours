// Les tracés : le papier froissé reste dans sa feuille, ses deux faces se correspondent, l'écriture suit la grille.
import { aretes, COLS, contour, facettes, RANGS, sommets, traces, tremble } from '../../../src/tours/morpion/logic/dessin.ts';
import { lire } from '../../../src/tours/morpion/logic/grilles.ts';

test('les tirages sont déterministes, entre -1 et 1', () => {
	for (let g = 0; g < 200; g++) {
		expect(tremble(g)).toBe(tremble(g));
		expect(Math.abs(tremble(g))).toBeLessThanOrEqual(1);
	}
});

test('les sommets des plis restent dans la feuille, ceux du bord tout près du bord', () => {
	const s = sommets();
	expect(s).toHaveLength(RANGS + 1);
	for (const rang of s) {
		expect(rang).toHaveLength(COLS + 1);
		for (const { x, y } of rang) {
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThanOrEqual(100);
			expect(y).toBeGreaterThanOrEqual(0);
			expect(y).toBeLessThanOrEqual(100);
		}
	}
	for (const rang of s) {
		expect(rang[0]!.x).toBeLessThan(1);
		expect(rang[COLS]!.x).toBeGreaterThan(99);
	}
});

test('le bord du papier est un polygone, et le verso est le recto retourné', () => {
	const recto = contour(false);
	const verso = contour(true);
	expect(recto).toMatch(/^polygon\(/);
	const points = (c: string) => c.slice(8, -1).split(', ').map((p) => p.split(' ').map(parseFloat));
	expect(points(recto)).toHaveLength(2 * (COLS + RANGS));
	points(recto).forEach(([x, y], i) => {
		expect(points(verso)[i]![0]).toBeCloseTo(100 - x!, 1);
		expect(points(verso)[i]![1]).toBeCloseTo(y!, 5);
	});
});

test('deux facettes par case ; au verso, chaque pli éclairé passe dans l’ombre', () => {
	const recto = facettes(false);
	const verso = facettes(true);
	expect(recto).toHaveLength(2 * COLS * RANGS);
	recto.forEach((f, i) => {
		expect(f.force).toBeGreaterThanOrEqual(0);
		expect(f.force).toBeLessThanOrEqual(1);
		if (f.force > 0) expect(verso[i]!.claire).toBe(!f.claire);
	});
	// Un pli en creux au recto est en relief au verso.
	expect(aretes(false).creux).toHaveLength(RANGS - 1);
	expect(aretes(true).reliefs).toHaveLength(RANGS - 1);
	expect(aretes(false).reliefs).toHaveLength(COLS - 1);
	expect(aretes(true).creux).toHaveLength(COLS - 1);
});

test('l’écriture : une marque par case remplie, la ligne gagnante barrée seulement si elle existe', () => {
	const gagne = traces(lire(['XO.', '.XO', '..X']));
	expect(gagne.marques.map((m) => [m.case, m.signe])).toStrictEqual([[0, 'X'], [1, 'O'], [4, 'X'], [5, 'O'], [8, 'X']]);
	expect(gagne.gagnante).toMatch(/^M/);
	expect(traces(lire(['XOX', 'XOO', 'OXX'])).gagnante).toBeNull();
	expect(traces(lire(['...', '...', '...'])).marques).toStrictEqual([]);
	// Une case superposée : le rond, puis la croix par-dessus.
	expect(traces(lire(['*..', '...', '...'])).marques.map((m) => [m.case, m.signe])).toStrictEqual([[0, 'O'], [0, 'X']]);
});
