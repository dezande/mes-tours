// Pluie très fine dans l'app (src/tours/pluie-tres-fine/) : la routine au clavier, et ses réglages.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

const carte = (): HTMLElement => document.querySelector<HTMLElement>('#table .carte')!;
const face = (): SVGElement | null => document.querySelector<SVGElement>('#table .face-dame');

/** Ouvre le tour à son adresse, et attend qu'il soit chargé. */
async function ouvrir(adresse: string): Promise<void> {
	window.location.hash = adresse;
	render(<App />);
	// Le tour est chargé à sa première ouverture (src/tours/registre.ts).
	await waitFor(() => expect(document.querySelector('#table .carte, #menu')).not.toBeNull());
	// Preact branche les écouteurs (clavier…) après l'affichage : on laisse passer un instant.
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
}

const touches = (...keys: string[]): void => {
	for (const key of keys) {
		act(() => {
			fireEvent.keyDown(document, { key });
		});
	}
};

test('une carte face cachée, au dos « pluie très fine », rien d’écrit à l’avant', async () => {
	await ouvrir('#/tours/pluie-tres-fine');
	expect(document.querySelectorAll('#table .carte')).toHaveLength(1);
	expect(carte()).not.toHaveClass('retournee');
	expect(carte().querySelector('.dos .dos-ancien .pluie')).not.toBeNull();
	expect(face()).toBeNull();
	expect(document.getElementById('annonce')).toHaveTextContent('Une carte face cachée');
});

test('C retourne la carte sur la Dame de cœur, Judith ; un autre coin ne la change plus', async () => {
	await ouvrir('#/tours/pluie-tres-fine');
	touches('c');
	expect(carte()).toHaveClass('retournee');
	expect(face()!.dataset.couleur).toBe('coeur');
	expect(face()!.dataset.valeur).toBe('12');
	expect(face()).toHaveTextContent('D');
	expect(face()).toHaveTextContent('JUDITH');
	expect(document.getElementById('annonce')).toHaveTextContent('Dame de cœur');
	touches('p');
	expect(face()!.dataset.couleur).toBe('coeur');
});

test('la Dame révélée ne change plus : R ne la remet pas face cachée, on reste dans le tour', async () => {
	await ouvrir('#/tours/pluie-tres-fine');
	touches('t');
	expect(face()!.dataset.couleur).toBe('trefle');
	touches('r', 'Home', 'd');
	expect(carte()).toHaveClass('retournee');
	expect(face()!.dataset.couleur).toBe('trefle');
	expect(window.location.hash).toBe('#/tours/pluie-tres-fine');
});

test('en anglais, la Dame est une Queen, et ne porte pas de nom', async () => {
	localStorage.setItem('mes-tours:langue', '"en"');
	await ouvrir('#/tours/pluie-tres-fine');
	touches('p');
	expect(face()).toHaveTextContent('Q');
	expect(face()).not.toHaveTextContent('PALLAS');
	expect(document.getElementById('annonce')).toHaveTextContent('Queen of spades');
});

test('la couleur choisie dans les réglages est celle du dos', async () => {
	localStorage.setItem('pluie-tres-fine:settings:v1', JSON.stringify({ couleur: 'vert' }));
	await ouvrir('#/tours/pluie-tres-fine');
	expect(carte().dataset.couleur).toBe('vert');
});

test('Échap ramène au menu principal', async () => {
	await ouvrir('#/tours/pluie-tres-fine');
	touches('Escape');
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : la couleur du dos est gardée, « Rétablir » la remet, le trucage est rappelé', async () => {
	await ouvrir('#/tours/pluie-tres-fine?reglages');
	expect(document.querySelector('.titre-reglages')).toHaveTextContent('Réglages');
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Pluie très fine');
	expect(document.getElementById('trucage')).toHaveTextContent('en haut à gauche pique');
	expect([...document.querySelectorAll('#couleur-choix button')].map((b) => b.getAttribute('data-valeur'))).toStrictEqual(['rouge', 'bleu', 'vert', 'brun']);
	expect(document.querySelectorAll('#couleur-choix .vignette .dos-ancien')).toHaveLength(4);
	expect(document.querySelector('#couleur-choix [data-valeur="rouge"]')).toHaveAttribute('aria-checked', 'true');
	fireEvent.click(document.querySelector('#couleur-choix [data-valeur="brun"]')!);
	expect(JSON.parse(localStorage.getItem('pluie-tres-fine:settings:v1')!).couleur).toBe('brun');
	fireEvent.click(document.getElementById('defaults-btn')!);
	await waitFor(() => expect(document.querySelector('#couleur-choix [data-valeur="rouge"]')).toHaveAttribute('aria-checked', 'true'));
});

test('écrou ⚙ : le test des zones dessine les quatre coins, sans retourner la carte ; « Réglages » y revient', async () => {
	await ouvrir('#/tours/pluie-tres-fine?reglages');
	fireEvent.click(document.getElementById('test-btn')!);
	expect(document.querySelector('#menu .sheet')).toBeNull();
	expect([...document.querySelectorAll('#zones-pluie .zone-coin .tag')].map((t) => t.textContent)).toStrictEqual(['♠', '♥', '♣', '♦']);
	expect(document.getElementById('test-etat')).toHaveTextContent('Touchez une zone');
	touches('c');
	expect(carte(), 'le test des zones a retourné la carte').not.toHaveClass('retournee');
	fireEvent.click(document.getElementById('test-reglages')!);
	expect(document.querySelector('#menu .sheet')).not.toBeNull();
	expect(document.getElementById('zones-pluie')).toBeNull();
});
