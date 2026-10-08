// Gestes : balayages, taps et appui long, avec des rythmes de vrai doigt.
import { GESTURE, GestureTracker, type Geste } from '../../../src/tours/trois-paquets/logic/gestes.ts';

const P = { x: 200, y: 400 };

/** Doigt posé en `from` à t=0, déplacé par étapes, levé en `to` au bout de `ms`. */
function geste(from: { x: number; y: number }, to: { x: number; y: number }, ms: number, tracker = new GestureTracker()): Geste {
	tracker.press(1, from.x, from.y, 0);
	for (let step = 1; step <= 4; step++) tracker.move(1, from.x + ((to.x - from.x) * step) / 4, from.y + ((to.y - from.y) * step) / 4);
	return tracker.release(1, to.x, to.y, ms);
}

test('balayer vers la gauche : suivant ; vers la droite : précédent, même lentement', () => {
	expect(geste(P, { x: P.x - 120, y: P.y + 20 }, 250)).toBe('suivant');
	expect(geste(P, { x: P.x + 120, y: P.y - 20 }, 1500)).toBe('precedent');
	expect(geste(P, { x: P.x - GESTURE.swipeMinPx, y: P.y }, 200)).toBe('suivant');
});

test('un glissement vertical n’est ni un balayage ni un tap', () => {
	expect(geste(P, { x: P.x + 60, y: P.y + 150 }, 300)).toBe('none');
});

test('tap : bref, ou lent et qui tremble un peu', () => {
	expect(geste(P, P, 80)).toBe('tap');
	expect(geste(P, { x: P.x + 25, y: P.y - 20 }, 650)).toBe('tap');
	expect(geste(P, P, GESTURE.tapMaxMs + 1)).toBe('none');
});

test('appui long : le menu, et le doigt levé ensuite ne fait rien', () => {
	const tracker = new GestureTracker();
	tracker.press(1, P.x, P.y, 0);
	expect(tracker.holdCompleted(1)).toBe(true);
	expect(tracker.release(1, P.x, P.y, GESTURE.holdMs + 10)).toBe('none');
});

test('un second doigt annule le geste ; un contact interrompu ne fait rien', () => {
	const tracker = new GestureTracker();
	tracker.press(1, P.x, P.y, 0);
	expect(tracker.press(2, 10, 10, 10)).toBe(false);
	expect(tracker.release(1, P.x - 200, P.y, 100)).toBe('none');
	tracker.press(3, P.x, P.y, 0);
	tracker.cancel(3);
	expect(tracker.release(3, P.x, P.y, 50)).toBe('none');
});
