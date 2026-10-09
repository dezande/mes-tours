// Touches du clavier et des télécommandes de présentation.
import { keyAction } from '../../../src/tours/pluie-tres-fine/logic/keys.ts';

test('P, C, T, D retournent la carte sur la Dame de cette famille', () => {
	for (const [key, couleur] of [['p', 'pique'], ['C', 'coeur'], ['t', 'trefle'], ['D', 'carreau']] as const) expect(keyAction(key), key).toBe(couleur);
});

test('remettre la carte face cachée, et le menu', () => {
	for (const key of ['Home', 'r', 'R']) expect(keyAction(key), key).toBe('remettre');
	for (const key of ['Escape', 'm', 'M']) expect(keyAction(key), key).toBe('menu');
});

test('les autres touches ne font rien, même celles héritées de tout objet', () => {
	for (const key of ['1', 'a', 'Enter', ' ', 'constructor', 'toString']) expect(keyAction(key), key).toBeNull();
});
