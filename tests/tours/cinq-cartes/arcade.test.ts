// Le dos « Arcade » : une grille de pixels, symétrique comme tous les dos.
import { cheminDesPixels, grilleDuDos, HAUTEUR, LARGEUR } from '../../../src/tours/cinq-cartes/logic/arcade.ts';

test('une grille de 20 × 28 pixels, en trois couleurs', () => {
	const grille = grilleDuDos();
	expect(grille).toHaveLength(HAUTEUR);
	for (const ligne of grille) expect(ligne).toMatch(new RegExp(`^[.cs]{${LARGEUR}}$`));
});

test('le dos est le même tête-bêche : symétrique de gauche à droite et de haut en bas', () => {
	const grille = grilleDuDos();
	expect(grille.every((ligne) => ligne === [...ligne].reverse().join('')), 'pas symétrique de gauche à droite').toBe(true);
	expect([...grille].reverse(), 'pas symétrique de haut en bas').toStrictEqual(grille);
});

test('un cadre clair tout autour, et un losange au centre', () => {
	const grille = grilleDuDos();
	expect(grille[1]!.slice(1, -1)).toBe('c'.repeat(LARGEUR - 2));
	expect(grille[HAUTEUR / 2]![LARGEUR / 2]).toBe('s');
});

test('un carré par pixel, dans un seul chemin', () => {
	expect(cheminDesPixels(['.c', 'c.'], 'c')).toBe('M1 0h1v1h-1zM0 1h1v1h-1z');
	expect(cheminDesPixels(['..'], 'c')).toBe('');
});
