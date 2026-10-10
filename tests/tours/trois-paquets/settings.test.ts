// Les réglages relus sur l'appareil : chaque champ invalide reprend sa valeur par défaut.
import { DEFAULTS, sanitizeSettings } from '../../../src/tours/trois-paquets/logic/settings.ts';

test('réglages absents ou abîmés : les valeurs par défaut', () => {
	for (const brut of [null, undefined, 42, 'bleu', [], {}]) expect(sanitizeSettings(brut), String(brut)).toStrictEqual(DEFAULTS);
	expect(sanitizeSettings({ couleur: 'vert', disparition: 'non', showHoldRing: 'oui' })).toStrictEqual(DEFAULTS);
});

test('réglages valides : gardés tels quels, champs inconnus oubliés', () => {
	expect(sanitizeSettings({ couleur: 'rouge', disparition: false, showHoldRing: false, duree: 3 })).toStrictEqual({ couleur: 'rouge', photos: 'identiques', disparition: false, showHoldRing: false });
});

test('par défaut, la carte face en bas de la fin disparaît', () => {
	expect(DEFAULTS.disparition).toBe(true);
});

test('les photos des paquets : identiques par défaut, liées au choix', () => {
	expect(DEFAULTS.photos).toBe('identiques');
	expect(sanitizeSettings({ photos: 'liees' }).photos).toBe('liees');
	expect(sanitizeSettings({ photos: 'toutes' }).photos).toBe('identiques');
});
