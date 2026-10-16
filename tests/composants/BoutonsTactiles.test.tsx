// Les boutons qui agissent au lever du doigt, appui bref ou long (src/hooks/useSurToucher.ts pour
// ceux du menu, src/hooks/useBoutonsTactiles.ts pour ceux d'un panneau de réglages) : sur Android, un
// doigt qui reste posé devient un « appui long » et le clic n'arrive jamais.
import { jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/preact';
import { BoutonTactile } from '../../src/components/BoutonTactile.tsx';
import { boutonsTactiles } from '../../src/hooks/useBoutonsTactiles.ts';
import { surToucher } from '../../src/hooks/useSurToucher.ts';

/** Le doigt posé en (x, y) sur `element`. */
const doigt = (element: Element, x: number, y: number) => ({ clientX: x, clientY: y, identifier: 1, target: element });

/** Le doigt se pose, glisse (`etapes`), puis se lève. */
function toucher(element: Element, depart: [number, number], ...etapes: [number, number][]): void {
	let d = doigt(element, ...depart);
	fireEvent.touchStart(element, { touches: [d], changedTouches: [d] });
	for (const etape of etapes) {
		d = doigt(element, ...etape);
		fireEvent.touchMove(element, { touches: [d], changedTouches: [d] });
	}
	fireEvent.touchEnd(element, { touches: [], changedTouches: [d] });
}

/** La souris : un bouton pressé puis relâché en (x, y), le clic natif derrière. */
function souris(element: Element, x: number, y: number, { clic = true } = {}): void {
	for (const type of ['pointerdown', 'pointerup']) {
		const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
		Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'mouse' } });
		element.dispatchEvent(event);
	}
	if (clic) fireEvent.click(element, { detail: 1, clientX: x, clientY: y });
}

/* ---------- Le panneau de réglages ---------- */

describe('boutonsTactiles : un panneau de réglages', () => {
	let panneau: HTMLDivElement;
	let bouton: HTMLButtonElement;
	let clics: number;
	let debrancher: () => void;

	beforeEach(() => {
		clics = 0;
		panneau = document.createElement('div');
		panneau.innerHTML = `
			<button type="button" id="b">Bouton</button>
			<label id="l"><span>Jauge</span> <input id="c" type="checkbox"></label>
			<input id="r" type="range">
			<p id="p">Un texte</p>
		`;
		document.body.append(panneau);
		bouton = panneau.querySelector('#b')!;
		bouton.addEventListener('click', () => {
			clics += 1;
		});
		debrancher = boutonsTactiles(panneau);
	});

	afterEach(() => {
		debrancher();
		panneau.remove();
	});

	test('un doigt posé puis levé sur un bouton : un clic, et un seul, le clic natif annulé', () => {
		toucher(bouton, [0, 0]);
		expect(clics).toBe(1);
		// Le clic natif qui suivrait est annulé : touchend est « non passif » et empêché.
		const d = doigt(bouton, 0, 0);
		fireEvent.touchStart(bouton, { touches: [d], changedTouches: [d] });
		expect(fireEvent.touchEnd(bouton, { touches: [], changedTouches: [d] }), 'touchend empêché').toBe(false);
		expect(clics).toBe(2);
	});

	test('un appui long compte autant qu’un appui bref : rien ne dépend de la durée', () => {
		jest.useFakeTimers();
		const d = doigt(bouton, 0, 0);
		fireEvent.touchStart(bouton, { touches: [d], changedTouches: [d] });
		jest.advanceTimersByTime(2000);
		fireEvent.touchEnd(bouton, { touches: [], changedTouches: [d] });
		jest.useRealTimers();
		expect(clics).toBe(1);
	});

	test('une case à cocher dans son libellé : le libellé reçoit le clic, la case change', () => {
		const label = panneau.querySelector<HTMLLabelElement>('#l')!;
		const span = label.querySelector('span')!;
		const checkbox = panneau.querySelector<HTMLInputElement>('#c')!;
		toucher(span, [0, 0]);
		expect(checkbox.checked).toBe(true);
		toucher(checkbox, [0, 0]);
		expect(checkbox.checked).toBe(false);
	});

	test('un doigt qui glisse (défilement des réglages) n’appuie sur rien', () => {
		toucher(bouton, [0, 0], [10, 30]);
		expect(clics).toBe(0);
		// Un petit tremblement reste un appui.
		toucher(bouton, [0, 0], [5, 5], [0, 0]);
		expect(clics).toBe(1);
	});

	test('un doigt levé à côté du bouton, deux doigts, ou un contact interrompu : pas de clic', () => {
		// Levé hors du bouton (jsdom le mesure à 0 × 0 en (0, 0)).
		toucher(bouton, [0, 0], [0, 0]);
		expect(clics).toBe(1);
		const d = doigt(bouton, 0, 0);
		fireEvent.touchStart(bouton, { touches: [d], changedTouches: [d] });
		fireEvent.touchEnd(bouton, { touches: [], changedTouches: [doigt(bouton, 100, 100)] });
		expect(clics).toBe(1);
		// Deux doigts.
		const autre = { clientX: 50, clientY: 50, identifier: 2, target: bouton };
		fireEvent.touchStart(bouton, { touches: [d, autre], changedTouches: [d] });
		fireEvent.touchEnd(bouton, { touches: [], changedTouches: [d] });
		expect(clics).toBe(1);
		// Interrompu par le système.
		fireEvent.touchStart(bouton, { touches: [d], changedTouches: [d] });
		fireEvent.touchCancel(bouton, { touches: [], changedTouches: [d] });
		fireEvent.touchEnd(bouton, { touches: [], changedTouches: [d] });
		expect(clics).toBe(1);
	});

	test('un curseur se fait glisser, un texte ne se touche pas : le navigateur garde la main', () => {
		const curseur = panneau.querySelector<HTMLInputElement>('#r')!;
		const clicsCurseur = jest.fn();
		curseur.addEventListener('click', clicsCurseur);
		toucher(curseur, [0, 0]);
		expect(clicsCurseur).not.toHaveBeenCalled();
		const texte = panneau.querySelector('#p')!;
		const d = doigt(texte, 0, 0);
		fireEvent.touchStart(texte, { touches: [d], changedTouches: [d] });
		expect(fireEvent.touchEnd(texte, { touches: [], changedTouches: [d] }), 'touchend laissé au navigateur').toBe(true);
		expect(clics).toBe(0);
	});

	test('pas de menu contextuel sur un appui long ; débranché, le panneau n’écoute plus', () => {
		expect(fireEvent.contextMenu(bouton)).toBe(false);
		debrancher();
		toucher(bouton, [0, 0]);
		expect(clics).toBe(0);
		expect(fireEvent.contextMenu(bouton)).toBe(true);
		// Débrancher deux fois ne gêne pas (afterEach).
	});
});

/* ---------- Un bouton du menu ---------- */

describe('surToucher : un bouton du menu principal', () => {
	let bouton: HTMLButtonElement;
	let action: ReturnType<typeof jest.fn>;
	let debrancher: () => void;

	beforeEach(() => {
		bouton = document.createElement('button');
		bouton.type = 'button';
		document.body.append(bouton);
		action = jest.fn();
		debrancher = surToucher(bouton, action);
	});

	afterEach(() => {
		debrancher();
		bouton.remove();
	});

	test('le doigt : l’action au lever, une seule fois même si un clic suit', () => {
		toucher(bouton, [0, 0]);
		expect(action).toHaveBeenCalledTimes(1);
		// Un navigateur qui enverrait quand même le clic : pas une deuxième fois.
		fireEvent.click(bouton, { detail: 1 });
		expect(action).toHaveBeenCalledTimes(1);
		// Et le clic d'après, hors de tout appui, ne fait rien non plus.
		fireEvent.click(bouton, { detail: 1 });
		expect(action).toHaveBeenCalledTimes(1);
	});

	test('le doigt qui glisse ou se lève à côté : rien, même avec un clic derrière', () => {
		toucher(bouton, [0, 0], [40, 0]);
		fireEvent.click(bouton, { detail: 1 });
		expect(action).not.toHaveBeenCalled();
		const d = doigt(bouton, 0, 0);
		fireEvent.touchStart(bouton, { touches: [d], changedTouches: [d] });
		fireEvent.touchEnd(bouton, { touches: [], changedTouches: [doigt(bouton, 100, 100)] });
		fireEvent.click(bouton, { detail: 1 });
		expect(action).not.toHaveBeenCalled();
	});

	test('la souris : l’action au relâchement, une seule fois avec le clic natif', () => {
		souris(bouton, 0, 0);
		expect(action).toHaveBeenCalledTimes(1);
		// Le bouton droit ne fait rien.
		const droit = new MouseEvent('pointerdown', { bubbles: true, button: 2 });
		Object.defineProperties(droit, { pointerId: { value: 1 }, pointerType: { value: 'mouse' } });
		bouton.dispatchEvent(droit);
		fireEvent.click(bouton, { detail: 1 });
		expect(action).toHaveBeenCalledTimes(1);
	});

	test('le clavier et la télécommande : le clic sans position agit toujours', () => {
		fireEvent.click(bouton, { detail: 0 });
		expect(action).toHaveBeenCalledTimes(1);
	});

	test('un clic sans appui commencé ici (le doigt de l’appui de 3 s, levé sur le menu) ne fait rien', () => {
		fireEvent.click(bouton, { detail: 1 });
		expect(action).not.toHaveBeenCalled();
	});

	test('le clic de secours : un appui commencé ici, sans lever reconnu, agit par le clic', () => {
		const d = doigt(bouton, 0, 0);
		fireEvent.touchStart(bouton, { touches: [d], changedTouches: [d] });
		fireEvent.touchCancel(bouton, { touches: [], changedTouches: [d] });
		fireEvent.click(bouton, { detail: 1 });
		expect(action).toHaveBeenCalledTimes(1);
	});

	test('pas de menu contextuel ; débranché, le bouton n’écoute plus', () => {
		expect(fireEvent.contextMenu(bouton)).toBe(false);
		debrancher();
		toucher(bouton, [0, 0]);
		fireEvent.click(bouton, { detail: 0 });
		expect(action).not.toHaveBeenCalled();
	});
});

test('<BoutonTactile onAction> : un bouton du menu qui agit au lever du doigt, avec la dernière action', () => {
	const action = jest.fn();
	const { rerender } = render(<BoutonTactile onAction={action} className="tuile">Tour</BoutonTactile>);
	const bouton = document.querySelector<HTMLButtonElement>('button.tuile')!;
	expect(bouton.type).toBe('button');
	expect(bouton).toHaveTextContent('Tour');
	toucher(bouton, [0, 0]);
	expect(action).toHaveBeenCalledTimes(1);
	// L'action changée au rendu suivant est celle qui agit, sans rebrancher le bouton.
	const autre = jest.fn();
	rerender(<BoutonTactile onAction={autre} className="tuile">Tour</BoutonTactile>);
	toucher(bouton, [0, 0]);
	expect(action).toHaveBeenCalledTimes(1);
	expect(autre).toHaveBeenCalledTimes(1);
});
