// Touches du clavier.
import { colonneDeLaTouche, keyAction } from '../../../src/tours/trois-questions/logic/keys.ts';

test('flèches, chiffres, Espace, R, Échap', () => {
	expect(keyAction('ArrowRight')).toBe('suivant');
	expect(keyAction('ArrowLeft')).toBe('precedent');
	expect(keyAction('0')).toBe('aucune');
	expect(['1', '2', '3'].map(keyAction)).toStrictEqual(['1', '2', '3']);
	expect(keyAction(' ')).toBe('centre');
	expect(keyAction('r')).toBe('remettre');
	expect(keyAction('Escape')).toBe('menu');
	expect(keyAction('x')).toBeNull();
	expect(keyAction('constructor')).toBeNull();
});

test('la colonne d’une touche de chiffre', () => {
	expect(colonneDeLaTouche('2')).toBe(2);
	expect(colonneDeLaTouche('aucune')).toBeNull();
	expect(colonneDeLaTouche('suivant')).toBeNull();
});
