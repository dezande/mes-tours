// L'écran toujours allumé (src/appareil/EcranAllume.tsx) : la vidéo muette, et le verrou redemandé
// à chaque geste n'importe où dans l'app, puis rendu quand le composant disparaît.
import { act, fireEvent, render } from '@testing-library/preact';
import { jest } from '@jest/globals';
import { EcranAllume } from '../../src/appareil/EcranAllume.tsx';

/** Un faux verrou : `relache()` imite le système qui le reprend (app en arrière-plan). */
function fauxVerrou() {
	const ecouteurs: (() => void)[] = [];
	const verrou = {
		released: false,
		addEventListener: (_type: string, ecouteur: () => void) => ecouteurs.push(ecouteur),
		release: jest.fn(async () => {
			verrou.released = true;
		}),
		relache: () => {
			verrou.released = true;
			for (const ecouteur of ecouteurs) ecouteur();
		},
	};
	return verrou;
}

/** Un geste du doigt : jsdom n'a pas de PointerEvent, fireEvent.pointerDown n'enverrait rien. */
const doigt = (type: 'pointerdown' | 'pointerup', cible: Element = document.body): void => {
	cible.dispatchEvent(new Event(type, { bubbles: true }));
};

/** Laisse les promesses en cours se résoudre (demande du verrou). */
const attendre = () => act(() => new Promise<void>((fin) => setTimeout(fin, 0)));

let verrous: ReturnType<typeof fauxVerrou>[];
const request = jest.fn(async () => {
	const verrou = fauxVerrou();
	verrous.push(verrou);
	return verrou;
});

beforeEach(() => {
	verrous = [];
	request.mockClear();
	Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
});

afterEach(() => {
	delete (navigator as { wakeLock?: unknown }).wakeLock;
});

test('une vidéo muette, en boucle, invisible pour les lecteurs d’écran', () => {
	render(<EcranAllume />);
	const video = document.querySelector<HTMLVideoElement>('video#keep-awake');
	expect(video).not.toBe(null);
	expect(video!.muted, 'muette').toBe(true);
	expect(video!.loop, 'en boucle').toBe(true);
	expect(video!.getAttribute('aria-hidden')).toBe('true');
	expect([...video!.querySelectorAll('source')].map((source) => source.type)).toStrictEqual(['video/webm', 'video/mp4']);
});

test('le verrou est demandé au démarrage, une seule fois tant qu’il tient', async () => {
	render(<EcranAllume />);
	await attendre();
	expect(request).toHaveBeenCalledTimes(1);
	doigt('pointerdown');
	await attendre();
	expect(request, 'verrou encore actif : pas de nouvelle demande').toHaveBeenCalledTimes(1);
});

test('verrou relâché par le système : le geste suivant, n’importe où, le redemande', async () => {
	render(<div><button type="button">ailleurs</button><EcranAllume /></div>);
	await attendre();
	verrous[0]!.relache();
	doigt('pointerup', document.querySelector('button')!);
	await attendre();
	expect(request).toHaveBeenCalledTimes(2);
	verrous[1]!.relache();
	fireEvent.keyDown(document.body, { key: 'r' });
	await attendre();
	expect(request, 'une touche aussi').toHaveBeenCalledTimes(3);
});

test('le composant retiré : le verrou est rendu, les gestes ne le redemandent plus', async () => {
	const { unmount } = render(<EcranAllume />);
	await attendre();
	act(() => {
		unmount();
	});
	expect(verrous[0]!.release).toHaveBeenCalled();
	verrous[0]!.relache();
	doigt('pointerdown');
	await attendre();
	expect(request).toHaveBeenCalledTimes(1);
});
