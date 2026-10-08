// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { DEFAULTS, rangDeLaPlace, sanitizeSettings } from '../../../src/tours/cinq-cartes/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { sens: 'droite', motif: 'pixel', couleur: 'bleu', showHoldRing: false };
	expect(sanitizeSettings(valides)).toStrictEqual(valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	expect(sanitizeSettings({ sens: 'haut', motif: 'mix', couleur: 'bleu', showHoldRing: false })).toStrictEqual({ sens: DEFAULTS.sens, motif: DEFAULTS.motif, couleur: 'bleu', showHoldRing: false });
	expect(sanitizeSettings({ sens: 'droite', motif: 'pop', couleur: 'vert', showHoldRing: 'oui' })).toStrictEqual({ sens: 'droite', motif: 'pop', couleur: DEFAULTS.couleur, showHoldRing: DEFAULTS.showHoldRing });
});

test('n’importe quelle donnée abîmée donne les réglages par défaut', () => {
	for (const brut of [null, undefined, 42, 'x', []]) expect(sanitizeSettings(brut)).toStrictEqual({ ...DEFAULTS });
});

test('par défaut, le « 1 » part de la gauche', () => {
	expect(DEFAULTS.sens).toBe('gauche');
});

test('le « 1 » à gauche, les places sont les rangs ; à droite, tout est en miroir', () => {
	expect([0, 1, 2, 3, 4].map((p) => rangDeLaPlace(p, 'gauche'))).toStrictEqual([0, 1, 2, 3, 4]);
	// À droite : la carte qui vaut 1 au bord droit, la carte de la couleur au bord gauche.
	expect([0, 1, 2, 3, 4].map((p) => rangDeLaPlace(p, 'droite'))).toStrictEqual([4, 3, 2, 1, 0]);
});

test('par défaut, le dos « Arcade », rouge : l’allure de Balatro', () => {
	expect([DEFAULTS.motif, DEFAULTS.couleur]).toStrictEqual(['arcade', 'rouge']);
	expect(sanitizeSettings({ motif: 'arcade' }).motif).toBe('arcade');
});
