// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { DEFAULTS, rangDeLaPlace, sanitizeSettings } from '../../../src/tours/trois-six-neuf-dame/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { sens: 'droite', couleur: 'bleu', showHoldRing: false };
	expect(sanitizeSettings(valides)).toStrictEqual(valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	expect(sanitizeSettings({ sens: 'haut', couleur: 'bleu', showHoldRing: false })).toStrictEqual({ sens: DEFAULTS.sens, couleur: 'bleu', showHoldRing: false });
	expect(sanitizeSettings({ sens: 'droite', couleur: 'vert', showHoldRing: 'oui' })).toStrictEqual({ sens: 'droite', couleur: DEFAULTS.couleur, showHoldRing: DEFAULTS.showHoldRing });
});

test('n’importe quelle donnée abîmée donne les réglages par défaut', () => {
	for (const brut of [null, undefined, 42, 'x', []]) expect(sanitizeSettings(brut)).toStrictEqual({ ...DEFAULTS });
});

test('l’As à gauche par défaut ; à droite, tout est en miroir', () => {
	expect(DEFAULTS.sens).toBe('gauche');
	expect([0, 1, 2, 3, 4].map((p) => rangDeLaPlace(p, 'gauche'))).toStrictEqual([0, 1, 2, 3, 4]);
	expect([0, 1, 2, 3, 4].map((p) => rangDeLaPlace(p, 'droite'))).toStrictEqual([4, 3, 2, 1, 0]);
});
