// Le dessin des faces : un symbole par point de la carte, à sa place, et les index des coins.
import { estFigure, estRouge, index, placesDesSymboles, SYMBOLES } from '../../../src/tours/cinq-cartes/logic/faces.ts';

test('de l’As au 10, autant de symboles que la valeur ; une figure n’en a pas', () => {
	for (let valeur = 1; valeur <= 10; valeur++) expect(placesDesSymboles(valeur), `valeur ${valeur}`).toHaveLength(valeur);
	for (const valeur of [11, 12, 13]) expect(placesDesSymboles(valeur)).toStrictEqual([]);
});

test('les symboles tiennent dans la carte, sans se superposer, et la moitié du bas est tête-bêche', () => {
	for (let valeur = 1; valeur <= 10; valeur++) {
		const places = placesDesSymboles(valeur);
		const cles = new Set(places.map((p) => `${p.x},${p.y}`));
		expect(cles.size, `valeur ${valeur} : deux symboles au même endroit`).toBe(places.length);
		for (const p of places) {
			expect(p.x > 20 && p.x < 80 && p.y > 15 && p.y < 125, `valeur ${valeur} : (${p.x}, ${p.y}) hors de la carte`).toBe(true);
			expect(p.retourne).toBe(p.y > 70);
		}
	}
});

test('chaque carte est symétrique, comme une vraie carte à jouer (sauf le 7, et son symbole du milieu)', () => {
	for (const valeur of [1, 2, 3, 4, 5, 6, 8, 9, 10]) {
		const cles = new Set(placesDesSymboles(valeur).map((p) => `${p.x},${p.y}`));
		for (const p of placesDesSymboles(valeur)) expect(cles.has(`${100 - p.x},${140 - p.y}`), `valeur ${valeur} : (${p.x}, ${p.y}) sans son vis-à-vis`).toBe(true);
	}
});

test('les index : A, 2 à 10, puis V D R en français et J Q K en anglais', () => {
	expect([1, 2, 10, 11, 12, 13].map((v) => index(v, 'fr'))).toStrictEqual(['A', '2', '10', 'V', 'D', 'R']);
	expect([1, 11, 12, 13].map((v) => index(v, 'en'))).toStrictEqual(['A', 'J', 'Q', 'K']);
	expect([10, 11, 13].map(estFigure)).toStrictEqual([false, true, true]);
});

test('cœur et carreau sont rouges, pique et trèfle noirs ; chaque couleur a son symbole', () => {
	expect((['pique', 'coeur', 'trefle', 'carreau'] as const).map(estRouge)).toStrictEqual([false, true, false, true]);
	for (const d of Object.values(SYMBOLES)) expect(d).toMatch(/^M[-\d. CHQZMa]+Z$/);
});
