// La carte de visite dans l'app (src/tours/carte-de-visite/) : un tour à zones en 4 coins, joué
// téléphone tenu en largeur (le paysage, appareil/Orientation.tsx), la carte retournée au numéro du coin touché.
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';
import { DEFAULTS, NUMEROS } from '../../src/tours/carte-de-visite/logic/settings.ts';

/** La fenêtre de jsdom (1024 × 768), remise après chaque test. */
const FENETRE = { largeur: window.innerWidth, hauteur: window.innerHeight };

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

afterEach(() => {
	jest.useRealTimers();
	window.innerWidth = FENETRE.largeur;
	window.innerHeight = FENETRE.hauteur;
});

/** La scène, en largeur : jsdom ne mesure rien, et les zones ont besoin d'une taille. */
const SCENE = { largeur: 800, hauteur: 400 };
/** Un point dans chaque coin, dans l'ordre des zones : haut gauche, haut droite, bas gauche, bas droite. */
const COINS = [[100, 100], [700, 100], [100, 300], [700, 300]] as const;

/** Ouvre le tour à son adresse, attend qu'il soit chargé, puis passe aux minuteries simulées. */
async function ouvrir(adresse: string): Promise<HTMLElement> {
	window.location.hash = adresse;
	render(<App />);
	await waitFor(() => expect(document.querySelector('#carte')).not.toBeNull());
	const stage = document.querySelector<HTMLElement>('#stage')!;
	Object.defineProperties(stage, { clientWidth: { value: SCENE.largeur }, clientHeight: { value: SCENE.hauteur } });
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
	jest.useFakeTimers();
	return stage;
}

const carte = (): HTMLElement => document.querySelector<HTMLElement>('#carte')!;
const numero = (): string => document.querySelector('#number-text')!.textContent ?? '';
const rotation = (): string => document.querySelector<HTMLElement>('#app')!.dataset.rotation ?? '';

/** Un événement du doigt : jsdom n'a pas de PointerEvent, il est fait d'un MouseEvent. */
function doigt(type: 'pointerdown' | 'pointerup', x: number, y: number): void {
	const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
	Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'touch' } });
	act(() => {
		document.querySelector('#stage')!.dispatchEvent(event);
	});
}

function toucher(x: number, y: number): void {
	doigt('pointerdown', x, y);
	doigt('pointerup', x, y);
}

const attendre = (ms: number): void => {
	act(() => {
		jest.advanceTimersByTime(ms);
	});
};

test('le recto imprimé au repos ; un coin touché retourne la carte sur son numéro, après le délai', async () => {
	await ouvrir('#/tours/carte-de-visite');
	expect(carte()).not.toHaveClass('retournee');
	expect(document.querySelector('.face.recto .nom-grand')).toHaveTextContent('Robert-Houdin');
	expect(numero()).toBe('');
	toucher(...COINS[3]);
	// Armé : rien ne bouge encore, mais le numéro est déjà écrit au verso.
	expect(carte()).not.toHaveClass('retournee');
	expect(numero()).toBe('23');
	attendre(DEFAULTS.delay * 1000);
	expect(carte()).toHaveClass('retournee');
	expect(numero()).toBe('23');
});

test('les 4 coins, dans le sens de lecture : 17, 19, 21, 23', async () => {
	localStorage.setItem('carte-de-visite:settings:v1', JSON.stringify({ delay: 0 }));
	for (const [coin, [x, y]] of COINS.entries()) {
		await ouvrir('#/tours/carte-de-visite');
		toucher(x, y);
		expect(numero(), `coin ${coin}`).toBe(NUMEROS[coin]);
		attendre(0);
		expect(carte()).toHaveClass('retournee');
		jest.useRealTimers();
		cleanup();
	}
});

test('un double tap remet la carte sur son recto, le temps du retournement, puis la carte est réarmée', async () => {
	await ouvrir('#/tours/carte-de-visite');
	toucher(...COINS[0]);
	attendre(DEFAULTS.delay * 1000);
	expect(carte()).toHaveClass('retournee');
	toucher(400, 200);
	attendre(100);
	toucher(400, 200);
	expect(carte()).not.toHaveClass('retournee');
	// Le numéro reste écrit au verso le temps du retournement, puis une nouvelle routine.
	expect(numero()).toBe('17');
	attendre(DEFAULTS.fade * 1000 + 150);
	toucher(...COINS[1]);
	expect(numero()).toBe('19');
	expect(window.location.hash).toBe('#/tours/carte-de-visite');
});

test('la scène se joue en paysage : sur un écran en portrait, l’app pivote d’un quart de tour', async () => {
	window.innerWidth = 400;
	window.innerHeight = 800;
	await ouvrir('#/tours/carte-de-visite');
	expect(rotation()).toBe('90');
	const app = document.querySelector<HTMLElement>('#app')!;
	expect(app.style.getPropertyValue('--app-w')).toBe('800px');
	expect(app.style.getPropertyValue('--app-h')).toBe('400px');
	// Pivotée, le coin haut gauche de la scène est en haut à droite de l'écran : (x, y) → (y, largeur − x).
	toucher(350, 50);
	expect(numero()).toBe('17');
	jest.useRealTimers();
	act(() => {
		fireEvent.keyDown(document, { key: 'Escape' });
	});
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
	// Le menu, lui, suit l'écran.
	expect(rotation()).toBe('0');
});

test('sur un écran déjà en paysage (navigateur), rien ne pivote', async () => {
	await ouvrir('#/tours/carte-de-visite');
	expect(rotation()).toBe('0');
});

test('les réglages, ouverts téléphone tenu droit, restent en portrait ; le test des zones pivote', async () => {
	window.innerWidth = 400;
	window.innerHeight = 800;
	await ouvrir('#/tours/carte-de-visite?reglages');
	expect(rotation()).toBe('0');
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Carte de visite');
	expect(document.querySelector('.row-label')).toHaveTextContent('Arcane Système 4 coins de l\'écran');
	expect([...document.querySelectorAll('#routine-values .value-row')].map((ligne) => ligne.textContent)).toStrictEqual(['Haut gauche17', 'Haut droite19', 'Bas gauche21', 'Bas droite23']);
	expect(document.querySelector('#fade-out')).toHaveTextContent('1,2 s');

	fireEvent.click(document.querySelector('#test-btn')!);
	expect(rotation()).toBe('90');
	const zones = [...document.querySelectorAll<HTMLElement>('#zones .zone')];
	expect(zones.map((zone) => zone.textContent)).toStrictEqual(['Haut gauche →17', 'Haut droite →19', 'Bas gauche →21', 'Bas droite →23']);
	// Deux colonnes : la colonne de droite est marquée, son étiquette à droite.
	expect(zones.map((zone) => zone.classList.contains('right'))).toStrictEqual([false, true, false, true]);
	expect(zones.map((zone) => `${zone.style.left} ${zone.style.top}`)).toStrictEqual(['0px 0px', '400px 0px', '0px 200px', '400px 200px']);
	expect(zones.every((zone) => zone.style.width === '400px' && zone.style.height === '200px')).toBe(true);

	fireEvent.click(document.querySelector('#test-back')!);
	expect(rotation()).toBe('0');
	expect(document.querySelector('#settings')).not.toBeNull();
});
