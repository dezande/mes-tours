// Les personnages des figures : une demi-figure par figure, symétrique, dans les couleurs prévues.
import { grilleDeFigure, grilleDeJoker, HAUTEUR_FIGURE, LARGEUR_FIGURE, NOMBRE_DE_JOKERS, TEINTES_FIGURE } from '../../../src/tours/cinq-cartes/logic/figures.ts';

/** Les personnages : les trois figures, puis les cinq Jokers. */
const PERSONNAGES = [
	...[11, 12, 13].map((valeur) => [`figure ${valeur}`, grilleDeFigure(valeur)] as const),
	...Array.from({ length: NOMBRE_DE_JOKERS }, (_, v) => [`Joker ${v}`, grilleDeJoker(v)] as const),
];

test('le Valet, la Dame, le Roi et les cinq Jokers ont chacun leur personnage, de 16 × 18 pixels', () => {
	expect(NOMBRE_DE_JOKERS).toBe(5);
	for (const [valeur, grille] of PERSONNAGES) {
		expect(grille, valeur).toHaveLength(HAUTEUR_FIGURE);
		for (const ligne of grille) expect(ligne).toHaveLength(LARGEUR_FIGURE);
	}
	// Huit personnages différents.
	expect(new Set(PERSONNAGES.map(([, grille]) => grille.join())).size).toBe(8);
});

test('chaque personnage est symétrique, et n’emploie que les couleurs des figures', () => {
	const couleurs = new Set(['.', ...TEINTES_FIGURE]);
	for (const [valeur, grille] of PERSONNAGES) {
		for (const ligne of grille) {
			expect(ligne, valeur).toBe([...ligne].reverse().join(''));
			for (const c of ligne) expect(couleurs.has(c), `${valeur} : « ${c} »`).toBe(true);
		}
	}
});

test('les cartes numérotées n’ont pas de personnage', () => {
	for (const valeur of [1, 7, 10]) expect(grilleDeFigure(valeur)).toStrictEqual([]);
});

test('au-delà du cinquième Joker, on reprend au premier', () => {
	expect(grilleDeJoker(NOMBRE_DE_JOKERS)).toStrictEqual(grilleDeJoker(0));
	expect(grilleDeJoker(-1)).toStrictEqual(grilleDeJoker(NOMBRE_DE_JOKERS - 1));
});
