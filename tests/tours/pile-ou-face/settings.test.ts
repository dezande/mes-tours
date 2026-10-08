// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { DEFAULTS, DELAI_MAX, sanitizeSettings, TEINTES } from '../../../src/tours/pile-ou-face/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { langue: 'en', couleur: 'rouge', delai: 3.5, showHoldRing: false } as const;
	expect(sanitizeSettings(valides)).toStrictEqual(valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	expect(sanitizeSettings({ langue: 'de', couleur: 'rouge', delai: 2, showHoldRing: false })).toStrictEqual({ langue: DEFAULTS.langue, couleur: 'rouge', delai: 2, showHoldRing: false });
	expect(sanitizeSettings({ langue: 'fr', couleur: 'vert', delai: '3', showHoldRing: 'oui' })).toStrictEqual({ langue: 'fr', couleur: DEFAULTS.couleur, delai: DEFAULTS.delai, showHoldRing: DEFAULTS.showHoldRing });
});

test('des données absentes ou abîmées donnent les réglages par défaut', () => {
	for (const raw of [null, undefined, 'x', 42, []]) expect(sanitizeSettings(raw)).toStrictEqual(DEFAULTS);
});

test('par défaut, la carte se retourne au toucher', () => {
	expect(DEFAULTS.delai).toBe(0);
});

test('le délai est borné et arrondi à la demi-seconde du curseur', () => {
	expect(sanitizeSettings({ delai: -2 }).delai).toBe(0);
	expect(sanitizeSettings({ delai: 99 }).delai).toBe(DELAI_MAX);
	expect(sanitizeSettings({ delai: 2.3 }).delai).toBe(2.5);
	expect(sanitizeSettings({ delai: Number.NaN }).delai).toBe(DEFAULTS.delai);
});

test('la langue du téléphone sert de défaut tant qu’aucune n’est enregistrée', () => {
	expect(sanitizeSettings(null, 'en').langue).toBe('en');
	expect(sanitizeSettings({ langue: 'fr' }, 'en').langue).toBe('fr');
});

test('seule l’encre se règle : noir, bleu ou rouge, sans « mélange » ni blanc', () => {
	expect(TEINTES).toStrictEqual(['noir', 'bleu', 'rouge']);
	for (const couleur of TEINTES) expect(sanitizeSettings({ couleur }).couleur).toBe(couleur);
	expect(sanitizeSettings({ couleur: 'mix' }).couleur).toBe(DEFAULTS.couleur);
	// Le dos blanc d'une version précédente : une encre blanche sur papier ne se lirait pas.
	expect(sanitizeSettings({ couleur: 'blanc' }).couleur).toBe(DEFAULTS.couleur);
});

test('le dessin de dos d’une version précédente est oublié, la couleur gardée', () => {
	expect(sanitizeSettings({ motif: 'pop', couleur: 'bleu' })).toStrictEqual({ ...DEFAULTS, couleur: 'bleu' });
});
