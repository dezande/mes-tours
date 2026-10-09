// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { DEFAULTS, sanitizeSettings, TEINTES } from '../../../src/tours/pluie-tres-fine/logic/settings.ts';

test('quatre encres de dos, rouge par défaut', () => {
	expect(TEINTES).toStrictEqual(['rouge', 'bleu', 'vert', 'brun']);
	expect(DEFAULTS).toStrictEqual({ couleur: 'rouge', showHoldRing: true });
});

test('des réglages valides sont gardés tels quels', () => {
	const valides = { couleur: 'vert', showHoldRing: false };
	expect(sanitizeSettings(valides)).toStrictEqual(valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	expect(sanitizeSettings({ couleur: 'violet', showHoldRing: false })).toStrictEqual({ couleur: DEFAULTS.couleur, showHoldRing: false });
	expect(sanitizeSettings({ couleur: 'brun', showHoldRing: 'oui' })).toStrictEqual({ couleur: 'brun', showHoldRing: DEFAULTS.showHoldRing });
});

test('n’importe quelle donnée abîmée donne les réglages par défaut', () => {
	for (const brut of [null, undefined, 42, 'x', []]) expect(sanitizeSettings(brut)).toStrictEqual({ ...DEFAULTS });
});
