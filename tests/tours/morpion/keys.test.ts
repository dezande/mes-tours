// Touches du clavier et des télécommandes de présentation.
import { keyAction } from '../../../src/tours/morpion/logic/keys.ts';

test('le haut donne la grille du haut', () => {
	for (const key of ['ArrowUp', 'PageUp']) expect(keyAction(key), key).toBe('haut');
});

test('le bas donne la grille du bas', () => {
	for (const key of ['ArrowDown', 'PageDown']) expect(keyAction(key), key).toBe('bas');
});

test('remettre le papier sur « Prédiction »', () => {
	for (const key of ['Home', 'r', 'R']) expect(keyAction(key), key).toBe('cacher');
});

test('menu', () => {
	for (const key of ['Escape', 'm', 'M']) expect(keyAction(key), key).toBe('menu');
});

test('les autres touches ne font rien, même celles héritées de tout objet', () => {
	for (const key of ['a', 'Enter', ' ', 'constructor', 'toString']) expect(keyAction(key), key).toBeNull();
});
