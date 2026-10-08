// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { DEFAULTS, sanitizeSettings } from '../../../src/tours/six-predictions/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { langue: 'en', showHoldRing: false } as const;
	expect(sanitizeSettings(valides)).toStrictEqual(valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	expect(sanitizeSettings({ langue: 'de', showHoldRing: false })).toStrictEqual({ langue: DEFAULTS.langue, showHoldRing: false });
	expect(sanitizeSettings({ langue: 'fr', showHoldRing: 'oui' })).toStrictEqual({ langue: 'fr', showHoldRing: DEFAULTS.showHoldRing });
});

test('des données absentes ou abîmées donnent les réglages par défaut', () => {
	for (const raw of [null, undefined, 'x', 42, []]) expect(sanitizeSettings(raw)).toStrictEqual(DEFAULTS);
});

test('les dos et couleurs d’une version précédente sont oubliés, les autres choix gardés', () => {
	// Le dos et sa couleur ne se règlent plus (logic/dos.ts) ; la version 0.1.0 avait même un réglage
	// « dos » à elle. La langue et la jauge, elles, doivent survivre à la mise à jour.
	expect(sanitizeSettings({ langue: 'en', motif: 'pop', couleur: 'mix', showHoldRing: false })).toStrictEqual({ langue: 'en', showHoldRing: false });
	expect(sanitizeSettings({ langue: 'en', dos: 'encre', showHoldRing: false })).toStrictEqual({ langue: 'en', showHoldRing: false });
});

test('la langue du téléphone sert de défaut tant qu’aucune n’est enregistrée', () => {
	expect(sanitizeSettings(null, 'en').langue).toBe('en');
	expect(sanitizeSettings({ langue: 'fr' }, 'en').langue).toBe('fr');
});
