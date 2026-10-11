// Touches du clavier et des télécommandes de présentation.
import { keyAction, rangDeLaTouche } from '../../../src/tours/trois-six-neuf-dame/logic/keys.ts';

test('1 à 5 touchent la carte de ce rang', () => {
	for (const key of ['1', '2', '3', '4', '5']) {
		const action = keyAction(key);
		expect(action, key).toBe(key);
		expect(rangDeLaTouche(action as '1')).toBe(Number(key) - 1);
	}
});

test('P, C, T, D choisissent le coin du prochain toucher', () => {
	for (const [key, couleur] of [['p', 'pique'], ['C', 'coeur'], ['t', 'trefle'], ['D', 'carreau']] as const) {
		expect(keyAction(key), key).toBe(couleur);
		expect(rangDeLaTouche(couleur)).toBeNull();
	}
});

test('remettre les cartes face cachée, et le menu', () => {
	for (const key of ['Home', 'r', 'R']) expect(keyAction(key), key).toBe('remettre');
	for (const key of ['Escape', 'm', 'M']) expect(keyAction(key), key).toBe('menu');
});

test('les autres touches ne font rien, même celles héritées de tout objet', () => {
	for (const key of ['0', '6', 'a', 'Enter', ' ', 'constructor', 'toString']) expect(keyAction(key), key).toBeNull();
});
