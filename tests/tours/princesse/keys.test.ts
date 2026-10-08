// Les touches : 1 à 5 pour les places, V pour le double toucher (valet), Espace ou → pour montrer, R pour remettre, Échap ou M pour le menu.
import { colonneDeLaTouche, keyAction } from '../../../src/tours/princesse/logic/keys.ts';

test('1 à 5 : les cinq colonnes, de gauche à droite', () => {
	expect(['1', '2', '3', '4', '5'].map((key) => colonneDeLaTouche(keyAction(key)!))).toStrictEqual([0, 1, 2, 3, 4]);
});

test('les touches de la routine', () => {
	for (const key of [' ', 'ArrowRight', 'ArrowDown', 'PageDown', 'Enter']) expect(keyAction(key), key).toBe('montrer');
	for (const key of ['r', 'R', 'Home']) expect(keyAction(key), key).toBe('remettre');
	for (const key of ['v', 'V']) expect(keyAction(key), key).toBe('valet');
	for (const key of ['Escape', 'm', 'M']) expect(keyAction(key), key).toBe('menu');
	expect(colonneDeLaTouche('montrer')).toBeNull();
});

test('les autres touches ne font rien, ni les noms hérités de tout objet', () => {
	for (const key of ['6', '0', 'a', 'constructor', '__proto__', 'toString']) expect(keyAction(key), key).toBeNull();
});
