// Les réglages : la durée bornée et arrondie à la seconde, tout champ abîmé remis à sa valeur par défaut.
import { COULEURS, DEFAULTS, DUREE_MAX, DUREE_MIN, MOTIFS, sanitizeSettings } from '../../../src/tours/princesse/logic/settings.ts';

test('par défaut : le dos bleu façon Bicycle, les cartes montrées 5 s, la jauge visible', () => {
	expect(sanitizeSettings(undefined)).toStrictEqual({ motif: 'bicycle', couleur: 'bleu', sens: 'gauche', duree: 5, showHoldRing: true });
	expect(sanitizeSettings('abîmé')).toStrictEqual(DEFAULTS);
});

test('la durée est bornée et arrondie à la seconde', () => {
	expect(sanitizeSettings({ duree: 7.4 }).duree).toBe(7);
	expect(sanitizeSettings({ duree: 0 }).duree).toBe(DUREE_MIN);
	expect(sanitizeSettings({ duree: 99 }).duree).toBe(DUREE_MAX);
	expect(sanitizeSettings({ duree: '8' }).duree).toBe(5);
	expect(sanitizeSettings({ duree: Number.NaN }).duree).toBe(5);
});

test('la jauge se garde, et seulement un booléen', () => {
	expect(sanitizeSettings({ showHoldRing: false }).showHoldRing).toBe(false);
	expect(sanitizeSettings({ showHoldRing: 'non' }).showHoldRing).toBe(true);
});

test('le dos : façon Bicycle ou l’un des six des autres tours, en bleu, rouge, noir ou blanc', () => {
	expect(MOTIFS).toStrictEqual(['bicycle', 'deco', 'nouveau', 'pixel', 'minimal', 'pop', 'futuriste']);
	expect(COULEURS).toStrictEqual(['bleu', 'rouge', 'noir', 'blanc']);
	expect(sanitizeSettings({ motif: 'pop', couleur: 'rouge' })).toMatchObject({ motif: 'pop', couleur: 'rouge' });
	// Une valeur inconnue (ou le « mix » des six prédictions) revient au dos par défaut.
	expect(sanitizeSettings({ motif: 'mix', couleur: 'vert' })).toMatchObject({ motif: 'bicycle', couleur: 'bleu' });
});

test('le sens de comptage : de gauche à droite par défaut, ou de droite à gauche', () => {
	expect(sanitizeSettings({ sens: 'droite' }).sens).toBe('droite');
	expect(sanitizeSettings({ sens: 'haut' }).sens).toBe('gauche');
});
