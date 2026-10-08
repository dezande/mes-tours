// Les personnages des figures : une demi-figure par figure, symétrique, dans les couleurs prévues.
import { grilleDeFigure, HAUTEUR_FIGURE, LARGEUR_FIGURE, TEINTES_FIGURE } from '../../../src/tours/cinq-cartes/logic/figures.ts';

test('le Valet, la Dame et le Roi ont chacun leur personnage, de 16 × 18 pixels', () => {
	for (const valeur of [11, 12, 13]) {
		const grille = grilleDeFigure(valeur);
		expect(grille, `figure ${valeur}`).toHaveLength(HAUTEUR_FIGURE);
		for (const ligne of grille) expect(ligne).toHaveLength(LARGEUR_FIGURE);
	}
	// Trois personnages différents.
	expect(new Set([11, 12, 13].map((v) => grilleDeFigure(v).join())).size).toBe(3);
});

test('chaque personnage est symétrique, et n’emploie que les couleurs des figures', () => {
	const couleurs = new Set(['.', ...TEINTES_FIGURE]);
	for (const valeur of [11, 12, 13]) {
		for (const ligne of grilleDeFigure(valeur)) {
			expect(ligne, `figure ${valeur}`).toBe([...ligne].reverse().join(''));
			for (const c of ligne) expect(couleurs.has(c), `figure ${valeur} : « ${c} »`).toBe(true);
		}
	}
});

test('les cartes numérotées n’ont pas de personnage', () => {
	for (const valeur of [1, 7, 10]) expect(grilleDeFigure(valeur)).toStrictEqual([]);
});
