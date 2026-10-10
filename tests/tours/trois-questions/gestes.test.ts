// Les gestes de la galerie : défilement, tap, double toucher, appui long.
import { GESTURE, GestureTracker } from '../../../src/tours/trois-questions/logic/gestes.ts';

/** Un doigt posé en (x, y) à t, glissé jusqu'à (x2, y2), levé à t2. */
function geste(g: GestureTracker, [x, y]: [number, number], [x2, y2]: [number, number], t = 0, t2 = t + 400, id = 1) {
	g.press(id, x, y, t);
	g.move(id, (x + x2) / 2, (y + y2) / 2);
	g.move(id, x2, y2);
	return g.release(id, x2, y2, t2);
}

test('défiler vers la gauche : suivant ; vers la droite : précédent', () => {
	const g = new GestureTracker();
	expect(geste(g, [300, 400], [100, 410])).toBe('suivant');
	expect(geste(g, [100, 400], [300, 390])).toBe('precedent');
});

test('un défilement vif peut être court ; lent, il doit aller assez loin', () => {
	const g = new GestureTracker();
	expect(geste(g, [200, 400], [170, 400], 0, 120)).toBe('suivant');
	expect(geste(g, [200, 400], [170, 400], 0, 600)).toBe('none');
});

test('glisser vers le haut ou le bas ne fait pas défiler, et la photo ne suit pas', () => {
	const g = new GestureTracker();
	g.press(1, 200, 400, 0);
	g.move(1, 210, 300);
	expect(g.glissement(1, 210)).toBe(0);
	expect(g.release(1, 210, 200, 400)).toBe('none');
});

test('la photo suit le doigt qui glisse de côté', () => {
	const g = new GestureTracker();
	g.press(1, 200, 400, 0);
	expect(g.glissement(1, 195)).toBe(0);
	g.move(1, 150, 405);
	expect(g.glissement(1, 150)).toBe(-50);
	expect(g.glissement(2, 150), 'un autre doigt').toBe(0);
});

test('tap, puis double toucher rapproché ; un troisième repart d’un tap', () => {
	const g = new GestureTracker();
	expect(geste(g, [100, 100], [102, 101], 0, 80)).toBe('tap');
	expect(geste(g, [104, 100], [104, 100], 200, 280)).toBe('double');
	expect(geste(g, [104, 100], [104, 100], 400, 480)).toBe('tap');
	// Trop tard : deux taps.
	expect(geste(g, [104, 100], [104, 100], 400 + GESTURE.doubleMaxMs + 200, 400 + GESTURE.doubleMaxMs + 280)).toBe('tap');
});

test('un défilement entre deux taps empêche le double toucher', () => {
	const g = new GestureTracker();
	expect(geste(g, [100, 100], [100, 100], 0, 50)).toBe('tap');
	expect(geste(g, [300, 100], [100, 100], 60, 160)).toBe('suivant');
	expect(geste(g, [100, 100], [100, 100], 170, 220)).toBe('tap');
});

test('l’appui de 3 s ouvre le menu, et ne fait rien d’autre ; un appui trop long n’est pas un tap', () => {
	const g = new GestureTracker();
	expect(g.press(1, 100, 100, 0)).toBe(true);
	expect(g.holdCompleted(1)).toBe(true);
	expect(g.release(1, 100, 100, 3100)).toBe('none');
	g.press(1, 100, 100, 0);
	expect(g.release(1, 100, 100, GESTURE.tapMaxMs + 1)).toBe('none');
});

test('un second doigt annule le geste ; un contact interrompu ne déclenche rien', () => {
	const g = new GestureTracker();
	g.press(1, 300, 100, 0);
	expect(g.press(2, 100, 100, 10)).toBe(false);
	expect(g.release(1, 100, 100, 100)).toBe('none');
	g.press(3, 300, 100, 0);
	g.cancel(3);
	expect(g.release(3, 100, 100, 100)).toBe('none');
});
