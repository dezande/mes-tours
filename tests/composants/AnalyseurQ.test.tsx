// L'Analyseur Q dans l'app (src/tours/analyseur-q/) : le diaporama au clavier et au doigt, le bouton
// d'une slide et son délai, le faux chargement, l'écran noir, les notes, l'appui de 3 s et les réglages.
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';
import { SLIDES } from '../../src/tours/analyseur-q/content/slides.ts';
import { LOADING } from '../../src/tours/analyseur-q/logic/loading.ts';
import { t } from '../../src/logic/i18n.ts';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

afterEach(() => {
	jest.useRealTimers();
});

/** La largeur donnée à la scène (jsdom ne mesure rien) : un tap à droite ou à gauche en dépend. */
const LARGEUR = 390;
/** Délai avant qu'un bouton devienne actif, en arrivant sur sa slide (hooks/useDiaporama.ts). */
const DELAI_BOUTON_MS = 700;
const DERNIERE = SLIDES.length - 1;

/** Ouvre le tour à son adresse, attend qu'il soit chargé, puis passe aux minuteries simulées. */
async function ouvrir(adresse: string): Promise<HTMLElement> {
	window.location.hash = adresse;
	render(<App />);
	await waitFor(() => expect(document.querySelector('#deck .slide.current')).not.toBeNull());
	const stage = document.querySelector<HTMLElement>('#stage')!;
	Object.defineProperty(stage, 'clientWidth', { value: LARGEUR, configurable: true });
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
	jest.useFakeTimers();
	return stage;
}

const courante = (): number => Number(document.querySelector<HTMLElement>('#deck .slide.current')!.dataset.index);
const bouton = (): HTMLButtonElement | null => document.querySelector<HTMLButtonElement>('#deck .slide.current .bouton');
const pourcent = (): string => document.querySelector('#deck .slide.current .chargement-pourcent')?.textContent ?? '';
const noir = (): boolean => !document.querySelector('#black')!.hasAttribute('hidden');

const touche = (key: string): void => {
	act(() => {
		fireEvent.keyDown(document, { key });
	});
};

const attendre = (ms: number): void => {
	act(() => {
		jest.advanceTimersByTime(ms);
	});
};

/** Un événement du doigt : jsdom n'a pas de PointerEvent, il est fait d'un MouseEvent. */
function doigt(type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number): void {
	const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
	Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'touch' } });
	act(() => {
		document.querySelector('#stage')!.dispatchEvent(event);
	});
}

function toucher(x: number, y = 400): void {
	doigt('pointerdown', x, y);
	doigt('pointerup', x, y);
}

/** Passe la slide au bouton (1) : le diaporama est sur la slide du chargement (2). */
function jusquAuChargement(): void {
	touche('ArrowRight');
	attendre(DELAI_BOUTON_MS);
	touche('ArrowRight');
	expect(courante()).toBe(2);
}

test('à l’ouverture, la première slide, ses voisines rendues, les autres non ; sa note en bas', async () => {
	await ouvrir('#/tours/analyseur-q');
	expect(courante()).toBe(0);
	expect(document.querySelector('#deck')).toHaveAttribute('data-transition', 'fondu');
	const slides = [...document.querySelectorAll<HTMLElement>('#deck .slide')];
	expect(slides).toHaveLength(SLIDES.length);
	expect(slides.map((slide) => slide.classList.contains('far'))).toStrictEqual(slides.map((_, i) => i > 1));
	expect(slides[0]).toHaveAttribute('aria-hidden', 'false');
	expect(slides[1]).toHaveAttribute('aria-hidden', 'true');
	expect(slides[0]!.querySelector('.titre')).toHaveTextContent('Analyseur Q');
	expect(document.querySelector('#note')).not.toHaveAttribute('hidden');
	expect(document.querySelector('#note')).toHaveTextContent(t(SLIDES[0]!.note, 'fr')!);
	expect(noir()).toBe(false);
});

test('→ et ← changent de slide ; on s’arrête aux extrémités ; Début et Fin', async () => {
	await ouvrir('#/tours/analyseur-q');
	touche('ArrowLeft');
	expect(courante()).toBe(0);
	touche('ArrowRight');
	expect(courante()).toBe(1);
	expect(document.querySelector<HTMLElement>('#deck .slide[data-index="0"]')).toHaveClass('before');
	expect(document.querySelector<HTMLElement>('#deck .slide[data-index="2"]')).toHaveClass('after');
	touche('ArrowLeft');
	expect(courante()).toBe(0);
	touche('End');
	expect(courante()).toBe(DERNIERE);
	touche('ArrowRight');
	expect(courante()).toBe(DERNIERE);
	touche('Home');
	expect(courante()).toBe(0);
});

test('une slide à bouton : « suivante » appuie dessus, mais seulement passé le délai d’activation', async () => {
	await ouvrir('#/tours/analyseur-q');
	touche('ArrowRight');
	expect(courante()).toBe(1);
	expect(bouton()).not.toBeNull();
	expect(bouton()).not.toHaveAttribute('hidden');
	// Trop tôt : on ne traverse pas la slide sans la voir.
	touche('ArrowRight');
	attendre(DELAI_BOUTON_MS - 50);
	touche(' ');
	expect(courante()).toBe(1);
	attendre(50);
	touche('ArrowRight');
	expect(courante()).toBe(2);
	// ← revient en arrière librement.
	touche('ArrowLeft');
	expect(courante()).toBe(1);
	expect(bouton()).not.toHaveAttribute('hidden');
	// Un vrai appui sur le bouton, lui aussi après le délai.
	fireEvent.click(bouton()!);
	expect(courante()).toBe(1);
	attendre(DELAI_BOUTON_MS);
	fireEvent.click(bouton()!);
	expect(courante()).toBe(2);
});

test('le faux chargement : le cadran se remplit, les étapes défilent, puis la slide suivante toute seule', async () => {
	await ouvrir('#/tours/analyseur-q');
	jusquAuChargement();
	const slide = SLIDES[2]!;
	const dureeMs = slide.chargement! * 1000;
	const etapes = slide.etapes!.map((etape) => t(etape, 'fr'));
	expect(document.querySelector('#deck .slide.current .chargement')).not.toHaveAttribute('hidden');
	expect(pourcent()).toBe('0 %');
	attendre(dureeMs / 2);
	const miParcours = parseInt(pourcent(), 10);
	expect(miParcours).toBeGreaterThan(20);
	expect(miParcours).toBeLessThan(100);
	expect(etapes).toContain(document.querySelector('#deck .slide.current .chargement-etape')!.textContent);
	expect(courante()).toBe(2);
	attendre(dureeMs / 2 + 100);
	expect(pourcent()).toBe('100 %');
	expect(document.querySelector('#deck .slide.current .chargement-etape')).toHaveTextContent(etapes[etapes.length - 1]!);
	// Le cadran plein reste un instant, puis la suite.
	expect(courante()).toBe(2);
	attendre(LOADING.holdFullMs + 50);
	expect(courante()).toBe(3);
});

test('le chargement s’arrête quand on quitte la slide, et repart de zéro quand on y revient', async () => {
	await ouvrir('#/tours/analyseur-q');
	jusquAuChargement();
	attendre(4000);
	expect(parseInt(pourcent(), 10)).toBeGreaterThan(0);
	touche('ArrowLeft');
	expect(courante()).toBe(1);
	attendre(20000);
	expect(courante()).toBe(1);
	attendre(DELAI_BOUTON_MS);
	touche('ArrowRight');
	expect(courante()).toBe(2);
	expect(pourcent()).toBe('0 %');
});

test('réglages ouverts ou écran noir, le temps du chargement est suspendu', async () => {
	await ouvrir('#/tours/analyseur-q');
	jusquAuChargement();
	touche('b');
	expect(noir()).toBe(true);
	attendre(30000);
	expect(courante()).toBe(2);
	expect(pourcent()).toBe('0 %');
	touche('b');
	expect(noir()).toBe(false);
	attendre(2000);
	expect(parseInt(pourcent(), 10)).toBeGreaterThan(0);
});

test('B, ou le « . » des télécommandes, éteint l’écran ; n’importe quel déplacement le rallume sans bouger', async () => {
	await ouvrir('#/tours/analyseur-q');
	touche('ArrowRight');
	touche('.');
	expect(noir()).toBe(true);
	touche('ArrowRight');
	expect(noir()).toBe(false);
	expect(courante()).toBe(1);
	touche('B');
	expect(noir()).toBe(true);
	toucher(300);
	expect(noir()).toBe(false);
	expect(courante()).toBe(1);
});

test('le bouton « Recommencer » de la dernière slide ramène à la calibration ; « suivante » ne l’actionne pas', async () => {
	await ouvrir('#/tours/analyseur-q');
	touche('End');
	expect(courante()).toBe(DERNIERE);
	expect(SLIDES[DERNIERE]!.boutonVers).toBe(1);
	attendre(DELAI_BOUTON_MS);
	touche('ArrowRight');
	expect(courante()).toBe(DERNIERE);
	fireEvent.click(bouton()!);
	expect(courante()).toBe(0);
});

test('au doigt : tap à droite, slide suivante ; tap sur le tiers gauche, précédente ; glisser aussi', async () => {
	await ouvrir('#/tours/analyseur-q');
	toucher(300);
	expect(courante()).toBe(1);
	toucher(50);
	expect(courante()).toBe(0);
	// Glisser vers la gauche : suivante ; vers la droite : précédente.
	doigt('pointerdown', 300, 400);
	doigt('pointermove', 200, 405);
	doigt('pointerup', 150, 405);
	expect(courante()).toBe(1);
	doigt('pointerdown', 100, 400);
	doigt('pointermove', 200, 400);
	doigt('pointerup', 260, 400);
	expect(courante()).toBe(0);
	// Un tap trop long ne fait rien.
	doigt('pointerdown', 300, 400);
	attendre(1000);
	doigt('pointerup', 300, 400);
	expect(courante()).toBe(0);
});

test('le doigt encore posé après le tap qui amène sur la slide à bouton : le bouton attend qu’il se lève', async () => {
	await ouvrir('#/tours/analyseur-q');
	toucher(300);
	expect(courante()).toBe(1);
	doigt('pointerdown', 300, 400);
	attendre(DELAI_BOUTON_MS);
	fireEvent.click(bouton()!);
	expect(courante()).toBe(1);
	attendre(2000);
	doigt('pointerup', 300, 400);
	fireEvent.click(bouton()!);
	expect(courante()).toBe(2);
});

test('l’appui de 3 s n’importe où ramène au menu, et Échap aussi', async () => {
	await ouvrir('#/tours/analyseur-q');
	doigt('pointerdown', 200, 400);
	attendre(3000);
	jest.useRealTimers();
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : la transition, les notes et la jauge, gardées ; les anciens réglages (rain-man) relus', async () => {
	localStorage.setItem('rain-man:settings:v1', JSON.stringify({ transition: 'aucune', showNotes: false }));
	await ouvrir('#/tours/analyseur-q?reglages');
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Analyseur Q');
	expect(document.querySelector('#deck')).toHaveAttribute('data-transition', 'aucune');
	expect(document.querySelector('#note')).toHaveAttribute('hidden');
	const radios = [...document.querySelectorAll<HTMLButtonElement>('#transition-seg [role="radio"]')];
	expect(radios.map((r) => r.dataset.transition)).toStrictEqual(['fondu', 'glisse', 'aucune']);
	expect(radios.map((r) => r.getAttribute('aria-checked'))).toStrictEqual(['false', 'false', 'true']);
	fireEvent.click(radios[1]!);
	expect(document.querySelector('#deck')).toHaveAttribute('data-transition', 'glisse');
	fireEvent.click(document.querySelector('#show-notes')!);
	expect(document.querySelector('#note')).not.toHaveAttribute('hidden');
	expect(JSON.parse(localStorage.getItem('analyseur-q:settings:v1')!)).toStrictEqual({ langue: 'fr', transition: 'glisse', showNotes: true, showHoldRing: true });
	// Les touches du diaporama ne traversent pas les réglages.
	touche('ArrowRight');
	expect(courante()).toBe(0);
	fireEvent.click(screen.getByText('Rétablir les réglages par défaut'));
	expect(document.querySelector('#deck')).toHaveAttribute('data-transition', 'fondu');
	jest.useRealTimers();
	fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});
