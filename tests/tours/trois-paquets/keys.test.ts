// Les touches : → et ← pour les panneaux, 1 à 3 pour les paquets, Espace pour toucher, R pour remettre, Échap ou M pour le menu.
import { keyAction, paquetDeLaTouche } from '../../../src/tours/trois-paquets/logic/keys.ts';

test('1 à 3 : les trois paquets, de gauche à droite', () => {
	expect(['1', '2', '3'].map((key) => paquetDeLaTouche(keyAction(key)!))).toStrictEqual([0, 1, 2]);
});

test('les touches de la routine', () => {
	for (const key of ['ArrowRight', 'PageDown']) expect(keyAction(key), key).toBe('suivant');
	for (const key of ['ArrowLeft', 'PageUp']) expect(keyAction(key), key).toBe('precedent');
	for (const key of [' ', 'Enter']) expect(keyAction(key), key).toBe('toucher');
	for (const key of ['r', 'R', 'Home']) expect(keyAction(key), key).toBe('remettre');
	for (const key of ['Escape', 'm', 'M']) expect(keyAction(key), key).toBe('menu');
	expect(paquetDeLaTouche('suivant')).toBeNull();
});

test('les autres touches ne font rien, ni les noms hérités de tout objet', () => {
	for (const key of ['4', '0', 'a', 'constructor', '__proto__', 'toString']) expect(keyAction(key), key).toBeNull();
});
