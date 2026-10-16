// Les six prédictions dans l'app (src/tours/six-predictions/) : la routine au clavier et au doigt
// (src/hooks/useGestesDoubleToucher.ts), le double toucher sur la table vide, l'appui de 3 s, et les réglages.
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';
import { t } from '../../src/logic/i18n.ts';
import { CARTES } from '../../src/tours/six-predictions/content/cartes.ts';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

afterEach(() => {
	jest.useRealTimers();
});

/** Délai pendant lequel un nouveau toucher est ignoré, le temps de l'animation (index.tsx). */
const GARDE_MS = 260;

/** Ouvre le tour à son adresse, attend qu'il soit chargé, puis passe aux minuteries simulées. */
async function ouvrir(adresse: string): Promise<HTMLElement> {
	window.location.hash = adresse;
	render(<App />);
	// Le tour est chargé à sa première ouverture (src/tours/registre.ts).
	await waitFor(() => expect(document.querySelectorAll('#paquet .carte')).toHaveLength(CARTES.length));
	// Preact branche les écouteurs (clavier…) après l'affichage : on laisse passer un instant.
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
	jest.useFakeTimers();
	return document.querySelector<HTMLElement>('#paquet')!;
}

const carte = (index: number): HTMLElement => document.querySelector<HTMLElement>(`#paquet .carte[data-index="${index}"]`)!;
const annonce = (): string => document.querySelector('#annonce')!.textContent ?? '';

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

function toucher(x = 200, y = 400): void {
	doigt('pointerdown', x, y);
	doigt('pointerup', x, y);
}

/** Fait sortir toutes les cartes : la table est vide. */
function vider(): void {
	for (let i = 0; i < 2 * CARTES.length; i++) {
		touche('ArrowRight');
		attendre(GARDE_MS + 40);
	}
}

test('à l’ouverture : six cartes faces en bas, la première sur le dessus, chacune à sa place dans l’étalement', async () => {
	const paquet = await ouvrir('#/tours/six-predictions');
	expect(paquet).not.toHaveClass('vide');
	expect(carte(0)).toHaveClass('dessus');
	expect(carte(0)).not.toHaveClass('retournee');
	for (let i = 1; i < CARTES.length; i++) expect(carte(i), `carte ${i}`).toHaveClass('dessous');
	expect(document.querySelectorAll('#paquet .carte.retournee')).toHaveLength(0);
	// Rien à lire pour les lecteurs d'écran, sauf l'annonce.
	expect(document.querySelectorAll('#paquet .carte[aria-hidden="false"]')).toHaveLength(0);
	expect(annonce()).toBe('Carte face cachée 1 / 6');
	// Chaque carte a son décalage et son dessin de dos.
	for (let i = 0; i < CARTES.length; i++) {
		expect(carte(i).style.getPropertyValue('--rang')).toBe(String(i));
		expect(carte(i).style.getPropertyValue('--dy')).not.toBe('');
		expect(carte(i).dataset.couleur).not.toBe('');
		expect(carte(i).querySelector('.carte-face.dos svg')).not.toBeNull();
	}
});

test('→ retourne la carte du dessus et montre sa prédiction, puis la fait sortir : la suivante est dessous', async () => {
	await ouvrir('#/tours/six-predictions');
	touche('ArrowRight');
	expect(carte(0)).toHaveClass('retournee');
	expect(carte(0)).toHaveClass('dessus');
	expect(carte(0)).toHaveAttribute('aria-hidden', 'false');
	expect(carte(0).querySelector('.prediction')).toHaveTextContent(t(CARTES[0]!.texte, 'fr')!);
	expect(annonce()).toBe(t(CARTES[0]!.texte, 'fr')!);
	// Un second toucher trop vif est ignoré, le temps que la carte finisse de se retourner.
	touche('ArrowRight');
	expect(carte(0)).toHaveClass('dessus');
	attendre(GARDE_MS + 40);
	touche(' ');
	expect(carte(0)).toHaveClass('sortie');
	// Sortie, elle garde sa face visible.
	expect(carte(0)).toHaveClass('retournee');
	expect(carte(0)).toHaveAttribute('aria-hidden', 'true');
	expect(carte(1)).toHaveClass('dessus');
	expect(carte(1)).not.toHaveClass('retournee');
	expect(annonce()).toBe('Carte face cachée 2 / 6');
});

test('les six cartes sorties, l’écran reste vide : un toucher seul ne fait rien, R remet le paquet', async () => {
	const paquet = await ouvrir('#/tours/six-predictions');
	vider();
	expect(paquet).toHaveClass('vide');
	expect(document.querySelectorAll('#paquet .carte.sortie')).toHaveLength(CARTES.length);
	expect(annonce()).toBe('Le paquet est vide');
	touche('ArrowRight');
	attendre(GARDE_MS + 40);
	toucher();
	attendre(1000);
	expect(paquet).toHaveClass('vide');
	touche('r');
	expect(paquet).not.toHaveClass('vide');
	expect(carte(0)).toHaveClass('dessus');
	expect(carte(0)).not.toHaveClass('retournee');
	expect(document.querySelectorAll('#paquet .carte.sortie')).toHaveLength(0);
	expect(annonce()).toBe('Carte face cachée 1 / 6');
	// On reste dans le tour, prêt pour une nouvelle routine.
	expect(window.location.hash).toBe('#/tours/six-predictions');
});

test('au doigt : un tap touche la carte ; deux taps rapprochés en pleine routine comptent chacun', async () => {
	await ouvrir('#/tours/six-predictions');
	toucher();
	expect(carte(0)).toHaveClass('retournee');
	attendre(300);
	toucher();
	expect(carte(0)).toHaveClass('sortie');
	expect(carte(1)).toHaveClass('dessus');
});

test('au doigt : deux taps rapprochés sur la table vide remettent le paquet', async () => {
	const paquet = await ouvrir('#/tours/six-predictions');
	vider();
	expect(paquet).toHaveClass('vide');
	toucher(100, 300);
	attendre(150);
	toucher(120, 320);
	expect(paquet).not.toHaveClass('vide');
	expect(carte(0)).toHaveClass('dessus');
});

test('un tap trop long, ou un doigt qui glisse, ne touche pas la carte', async () => {
	await ouvrir('#/tours/six-predictions');
	doigt('pointerdown', 200, 400);
	attendre(1000);
	doigt('pointerup', 200, 400);
	expect(carte(0)).not.toHaveClass('retournee');
	doigt('pointerdown', 200, 400);
	doigt('pointermove', 300, 400);
	doigt('pointerup', 300, 400);
	expect(carte(0)).not.toHaveClass('retournee');
});

test('l’appui de 3 s n’importe où ramène au menu ; relâché avant, il ne fait rien', async () => {
	await ouvrir('#/tours/six-predictions');
	doigt('pointerdown', 200, 400);
	expect(document.querySelector('#hold-ring')).toHaveClass('run');
	attendre(2000);
	doigt('pointerup', 200, 400);
	expect(document.querySelector('#hold-ring')).toHaveAttribute('hidden');
	attendre(2000);
	expect(document.querySelector('#paquet')).not.toBeNull();
	doigt('pointerdown', 200, 400);
	attendre(3000);
	jest.useRealTimers();
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('Échap ramène au menu principal', async () => {
	await ouvrir('#/tours/six-predictions');
	jest.useRealTimers();
	touche('Escape');
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('en anglais, les prédictions et l’annonce suivent la langue du menu', async () => {
	localStorage.setItem('mes-tours:langue', '"en"');
	await ouvrir('#/tours/six-predictions');
	expect(annonce()).toBe('Face-down card 1 / 6');
	touche('ArrowRight');
	expect(annonce()).toBe(t(CARTES[0]!.texte, 'en')!);
	expect(carte(0).querySelector('.prediction')).toHaveTextContent(t(CARTES[0]!.texte, 'en')!);
});

test('écrou ⚙ : seules les aides à la répétition, la jauge gardée, la croix ramène au menu', async () => {
	await ouvrir('#/tours/six-predictions?reglages');
	expect(document.querySelector('.titre-reglages')).toHaveTextContent('Réglages');
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Les six prédictions');
	// Les dos ne se règlent pas : aucun réglage propre au tour, seulement les aides.
	expect(document.querySelectorAll('#menu .card')).toHaveLength(1);
	expect(document.querySelector('#show-hold-ring')).toBeChecked();
	fireEvent.click(document.querySelector('#show-hold-ring')!);
	expect(JSON.parse(localStorage.getItem('six-predictions:settings:v1')!)).toStrictEqual({ langue: 'fr', showHoldRing: false });
	fireEvent.click(screen.getByText('Rétablir les réglages par défaut'));
	expect(document.querySelector('#show-hold-ring')).toBeChecked();
	jest.useRealTimers();
	fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
	cleanup();
});
