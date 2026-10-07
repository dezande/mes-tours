// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { DEFAULTS, DELAI_MAX, sanitizeSettings } from '../../../src/tours/morpion/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { delai: 3.5, showHoldRing: false };
	expect(sanitizeSettings(valides)).toStrictEqual(valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	expect(sanitizeSettings({ delai: '3', showHoldRing: false })).toStrictEqual({ delai: DEFAULTS.delai, showHoldRing: false });
	expect(sanitizeSettings({ delai: 2, showHoldRing: 'oui' })).toStrictEqual({ delai: 2, showHoldRing: DEFAULTS.showHoldRing });
});

test('n’importe quelle donnée abîmée donne les réglages par défaut', () => {
	for (const brut of [null, undefined, 42, 'x', []]) expect(sanitizeSettings(brut)).toStrictEqual({ ...DEFAULTS });
});

test('le délai est borné et arrondi à la demi-seconde', () => {
	expect(sanitizeSettings({ delai: -3 }).delai).toBe(0);
	expect(sanitizeSettings({ delai: 99 }).delai).toBe(DELAI_MAX);
	expect(sanitizeSettings({ delai: 1.3 }).delai).toBe(1.5);
	expect(sanitizeSettings({ delai: Number.NaN }).delai).toBe(DEFAULTS.delai);
});
