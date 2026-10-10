// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { ORDRE_RANGE } from '../../../src/tours/trois-questions/logic/paquet.ts';
import { COULEURS, DEFAULTS, sanitizeSettings } from '../../../src/tours/trois-questions/logic/settings.ts';

test('sans ordre réglé (mélangé à chaque routine), le dos rouge, la carte qui se retourne, la vibration et la jauge', () => {
	expect(COULEURS).toStrictEqual(['rouge', 'bleu', 'noir']);
	expect(DEFAULTS).toStrictEqual({ ordre: null, couleur: 'rouge', retournable: true, vibration: true, showHoldRing: true });
});

test('des réglages valides sont gardés tels quels, l’ordre compris', () => {
	const valides = { ordre: [...ORDRE_RANGE].reverse(), couleur: 'noir', retournable: false, vibration: false, showHoldRing: false };
	expect(sanitizeSettings(valides)).toStrictEqual(valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	const sansUneCarte = ORDRE_RANGE.slice(1);
	expect(sanitizeSettings({ ordre: sansUneCarte, couleur: 'bleu', vibration: false })).toStrictEqual({ ...DEFAULTS, couleur: 'bleu', vibration: false });
	expect(sanitizeSettings({ couleur: 'vert', vibration: 'oui' })).toStrictEqual({ ...DEFAULTS });
});

test('n’importe quelle donnée abîmée donne les réglages par défaut', () => {
	for (const brut of [null, undefined, 42, 'x', []]) expect(sanitizeSettings(brut)).toStrictEqual({ ...DEFAULTS });
});
