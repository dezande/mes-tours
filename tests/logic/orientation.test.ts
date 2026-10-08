// Les verrous portrait (toute l'app) et paysage (la carte de visite) : src/logic/orientation.ts.
// Lancer : npm test
import { appSize, landscapeRotation, portraitRotation, toAppPoint, type Viewport } from '../../src/logic/orientation.ts';

const PORTRAIT: Viewport = { width: 390, height: 844, angle: 0, touch: true };
const LEFT: Viewport = { width: 844, height: 390, angle: 90, touch: true };
const RIGHT: Viewport = { width: 844, height: 390, angle: 270, touch: true };

test('portraitRotation : pivote seulement un écran tactile en paysage', () => {
	expect(portraitRotation(PORTRAIT)).toBe(0);
	expect(portraitRotation(LEFT)).toBe(-90);
	expect(portraitRotation(RIGHT)).toBe(90);
	expect(portraitRotation({ ...RIGHT, angle: -90 })).toBe(90);
	expect(portraitRotation({ ...LEFT, angle: 0 }), 'angle inconnu : sens par défaut').toBe(-90);
	expect(portraitRotation({ ...LEFT, touch: false }), 'ordinateur : jamais').toBe(0);
	expect(portraitRotation({ ...PORTRAIT, angle: 180 })).toBe(0);
});

test('appSize : dimensions portrait une fois pivotée', () => {
	expect(appSize(LEFT, -90)).toStrictEqual({ width: 390, height: 844 });
	expect(appSize(PORTRAIT, 0)).toStrictEqual({ width: 390, height: 844 });
});

test('toAppPoint : les coins de l’écran tombent sur les bons coins de l’app', () => {
	expect(toAppPoint(10, 20, PORTRAIT, 0)).toStrictEqual({ x: 10, y: 20 });
	// -90° : haut de l'app à gauche de l'écran, gauche de l'app en bas.
	expect(toAppPoint(0, 390, LEFT, -90), 'bas gauche écran = haut gauche app').toStrictEqual({ x: 0, y: 0 });
	expect(toAppPoint(0, 0, LEFT, -90), 'haut gauche écran = haut droite app').toStrictEqual({ x: 390, y: 0 });
	expect(toAppPoint(844, 390, LEFT, -90), 'bas droite écran = bas gauche app').toStrictEqual({ x: 0, y: 844 });
	// +90° : haut de l'app à droite de l'écran, gauche de l'app en haut.
	expect(toAppPoint(844, 0, RIGHT, 90), 'haut droite écran = haut gauche app').toStrictEqual({ x: 0, y: 0 });
	expect(toAppPoint(844, 390, RIGHT, 90), 'bas droite écran = haut droite app').toStrictEqual({ x: 390, y: 0 });
	expect(toAppPoint(0, 0, RIGHT, 90), 'haut gauche écran = bas gauche app').toStrictEqual({ x: 0, y: 844 });
});

test('paysage : écran en portrait (app verrouillée, téléphone tenu en largeur) : la scène pivote d’un quart de tour', () => {
	expect(landscapeRotation(390, 844)).toBe(90);
});

test('paysage : écran déjà en paysage, ou carré : rien ne pivote', () => {
	expect(landscapeRotation(844, 390)).toBe(0);
	expect(landscapeRotation(500, 500)).toBe(0);
});

test('paysage : pivotée, le haut de la scène est à droite de l’écran : le coin haut droite de l’écran est le coin haut gauche de la scène', () => {
	const ecran = { width: 390, height: 844, angle: 0, touch: true };
	const p = toAppPoint(380, 10, ecran, landscapeRotation(ecran.width, ecran.height));
	expect(p).toStrictEqual({ x: 10, y: 10 });
});
