// Les cinq cartes de la routine (content/cartes.ts), et ce qu'on sait d'une carte : nom, index, enseignes.
import { CARTES } from '../../../src/tours/princesse/content/cartes.ts';
import { checkCartes, estFigure, estRouge, indexDeCarte, nomDeCarte, placesDesEnseignes, VALEURS } from '../../../src/tours/princesse/logic/cartes.ts';

test('les cinq cartes, dans l’ordre de départ : 4♣, 8♥, 5♦, 10♦, valet de ♦', () => {
	expect(checkCartes(CARTES)).toStrictEqual([]);
	expect(CARTES.map((carte) => nomDeCarte(carte, 'fr'))).toStrictEqual(['4 de trèfle', '8 de cœur', '5 de carreau', '10 de carreau', 'Valet de carreau']);
	expect(CARTES.map((carte) => nomDeCarte(carte, 'en'))).toStrictEqual(['4 of clubs', '8 of hearts', '5 of diamonds', '10 of diamonds', 'Jack of diamonds']);
});

test('une faute dans les cartes est signalée', () => {
	expect(checkCartes([{ valeur: '11', enseigne: 'coeur' }])).toStrictEqual(['carte 1 : valeur inconnue « 11 »']);
	expect(checkCartes([{ valeur: '4', enseigne: 'trèfle' }])).toStrictEqual(['carte 1 : enseigne inconnue « trèfle »']);
	expect(checkCartes([{ valeur: '4', enseigne: 'trefle', couleur: 'bleu' }])).toStrictEqual(['carte 1 : champ inconnu « couleur »']);
	expect(checkCartes([{ valeur: '4', enseigne: 'trefle' }, { valeur: '4', enseigne: 'trefle' }])).toStrictEqual(['carte 2 : déjà dans le jeu']);
	expect(checkCartes([null])).toStrictEqual(['carte 1 : ce n\'est pas une carte']);
});

test('l’index des coins est celui d’un jeu Bicycle : J, Q, K', () => {
	expect(['V', 'D', 'R', '10', 'A'].map((v) => indexDeCarte(v as never))).toStrictEqual(['J', 'Q', 'K', '10', 'A']);
	expect(estFigure('V')).toBe(true);
	expect(estFigure('10')).toBe(false);
	expect(estRouge('coeur') && estRouge('carreau')).toBe(true);
	expect(estRouge('trefle') || estRouge('pique')).toBe(false);
});

test('chaque carte de 1 à 10 porte autant d’enseignes que sa valeur, symétriques (sauf le 7, comme sur un vrai jeu), celles du bas tête-bêche', () => {
	for (const valeur of VALEURS) {
		const places = placesDesEnseignes(valeur);
		if (estFigure(valeur)) {
			expect(places, valeur).toStrictEqual([]);
			continue;
		}
		expect(places, valeur).toHaveLength(valeur === 'A' ? 1 : Number(valeur));
		// Retournée tête-bêche, la carte montre les mêmes enseignes aux mêmes places ; le 7 a une
		// enseigne de plus en haut, comme sur un vrai jeu.
		const cles = (liste: { x: number; y: number }[]): string => liste.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).sort().join(' ');
		if (valeur !== '7') expect(cles(places.map(({ x, y }) => ({ x: 100 - x, y: 140 - y }))), valeur).toBe(cles(places));
		for (const { x, y, retourne } of places) {
			expect(retourne, `${valeur} en ${x}, ${y}`).toBe(y > 70);
			// Loin des index des coins, et dans la carte.
			expect(x >= 25 && x <= 75 && y >= 25 && y <= 115, `${valeur} en ${x}, ${y}`).toBe(true);
		}
	}
});
