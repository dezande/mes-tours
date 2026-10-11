// Trois, six, neuf, Dame dans l'app (src/tours/trois-six-neuf-dame/) : la routine au clavier, et ses réglages.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';

const CLE = 'trois-six-neuf-dame:settings:v1';

beforeEach(() => {
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

const cartes = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('#rangee .carte')];
const face = (place: number): SVGElement | null => cartes()[place]!.querySelector<SVGElement>('.face-carte');
const pres = (): number[] => cartes().flatMap((c, i) => (c.querySelector('.mot-pres') ? [i] : []));

async function ouvrir(adresse: string): Promise<void> {
	window.location.hash = adresse;
	render(<App />);
	await waitFor(() => expect(document.querySelector('#rangee .carte, #menu')).not.toBeNull());
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
}

const touches = (...keys: string[]): void => {
	for (const key of keys) {
		act(() => {
			fireEvent.keyDown(document, { key });
		});
	}
};

const retournees = (): number[] => cartes().flatMap((c, i) => (c.classList.contains('retournee') ? [i] : []));

test('cinq cartes face cachée, rien d’écrit à l’avant', async () => {
	await ouvrir('#/tours/trois-six-neuf-dame');
	expect(cartes()).toHaveLength(5);
	expect(retournees()).toStrictEqual([]);
	expect(document.querySelector('.face-carte, .mot-pres')).toBeNull();
	expect(document.getElementById('annonce')).toHaveTextContent('Cinq cartes face cachée');
});

test('la Dame touchée dans le coin du cœur se retourne sur la Dame de cœur ; les autres sont blanches', async () => {
	await ouvrir('#/tours/trois-six-neuf-dame');
	touches('c', '5');
	expect(retournees()).toStrictEqual([4]);
	expect(face(4)!.dataset.valeur).toBe('12');
	expect(face(4)!.dataset.couleur).toBe('coeur');
	expect(face(4)).toHaveTextContent('D');
	expect(document.getElementById('annonce')).toHaveTextContent('Dame de cœur');
	touches('2', '3', '4');
	expect(retournees()).toStrictEqual([1, 2, 3, 4]);
	expect([1, 2, 3].map(face)).toStrictEqual([null, null, null]);
	expect(document.getElementById('annonce')).toHaveTextContent('Carte blanche');
	expect(pres()).toStrictEqual([]);
});

test('l’As touché après le 6 de pique : « À 1 carte près » sur toutes les autres cartes, l’As compris', async () => {
	await ouvrir('#/tours/trois-six-neuf-dame');
	touches('3', '4', '1');
	expect(face(2)!.dataset.valeur).toBe('6');
	expect(face(0)).toBeNull();
	expect(pres()).toStrictEqual([0, 1, 3, 4]);
	expect(cartes()[0]).toHaveTextContent('À 1 carte près');
	expect(document.getElementById('annonce')).toHaveTextContent('À 1 carte près');
	touches('2');
	expect(document.getElementById('annonce')).toHaveTextContent('À 1 carte près');
	// La routine finie : les cartes se retournent dans un sens ou dans l'autre, et gardent ce qu'elles portent.
	touches('5', '4', '4');
	expect(retournees()).toStrictEqual([0, 1, 2, 3, 4]);
	expect(pres()).toStrictEqual([0, 1, 3, 4]);
});

test('l’As choisi lui-même : l’As de trèfle, les autres restent blanches ; R remet les cinq dos', async () => {
	await ouvrir('#/tours/trois-six-neuf-dame');
	touches('t', '1', '2', '3');
	expect(face(0)!.dataset.couleur).toBe('trefle');
	expect(pres()).toStrictEqual([]);
	touches('r');
	expect(retournees()).toStrictEqual([]);
	expect(window.location.hash).toBe('#/tours/trois-six-neuf-dame');
	// Sans coin choisi au clavier : pique, en haut à gauche.
	touches('4');
	expect(face(3)!.dataset.valeur).toBe('9');
	expect(face(3)!.dataset.couleur).toBe('pique');
});

test('l’As réglé à droite : la Dame est au bord gauche', async () => {
	localStorage.setItem(CLE, JSON.stringify({ sens: 'droite' }));
	await ouvrir('#/tours/trois-six-neuf-dame');
	expect(cartes().map((c) => c.dataset.index)).toStrictEqual(['4', '3', '2', '1', '0']);
	touches('d', '5');
	expect(retournees()).toStrictEqual([0]);
	expect(face(0)!.dataset.couleur).toBe('carreau');
});

test('en anglais, la Dame est une Queen, et « Within one card »', async () => {
	localStorage.setItem('mes-tours:langue', '"en"');
	await ouvrir('#/tours/trois-six-neuf-dame');
	touches('d', '5');
	expect(face(4)).toHaveTextContent('Q');
	expect(document.getElementById('annonce')).toHaveTextContent('Queen of diamonds');
	touches('1');
	expect(document.getElementById('annonce')).toHaveTextContent('Within one card');
	expect(cartes()[2]).toHaveTextContent('Within one card');
});

test('Échap ramène au menu principal', async () => {
	await ouvrir('#/tours/trois-six-neuf-dame');
	touches('Escape');
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : le sens et le dos choisis sont gardés, « Rétablir » les remet, le codage est rappelé', async () => {
	await ouvrir('#/tours/trois-six-neuf-dame?reglages');
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Trois, six, neuf, Dame');
	expect(document.getElementById('codage')).toHaveTextContent('l\'As, le 3, le 6, le 9 et la Dame');
	expect(document.getElementById('codage')).toHaveTextContent('À 1 carte près');
	fireEvent.click(document.querySelector('#sens-choix [data-valeur="droite"]')!);
	expect(JSON.parse(localStorage.getItem(CLE)!).sens).toBe('droite');
	fireEvent.click(document.querySelector('#couleur-choix [data-valeur="bleu"]')!);
	expect(JSON.parse(localStorage.getItem(CLE)!).couleur).toBe('bleu');
	fireEvent.click(document.getElementById('defaults-btn')!);
	await waitFor(() => expect(document.querySelector('#couleur-choix [data-valeur="rouge"]')).toHaveAttribute('aria-checked', 'true'));
});

test('mode entraînement : la carte à trouver est demandée, puis la barre dit si elle a été trouvée', async () => {
	await ouvrir('#/tours/trois-six-neuf-dame?reglages');
	// Le tirage donne le 6 de cœur ; « Recommencer » tire une nouvelle rangée, puis la Dame de carreau.
	const tirages = [.5, .3, 0, .999999, .999999];
	const hasard = jest.spyOn(Math, 'random').mockImplementation(() => tirages.shift() ?? 0);
	try {
		fireEvent.click(document.getElementById('entrainement-btn')!);
		const carte = (): HTMLElement => document.getElementById('entrainement-carte')!;
		expect(carte()).toHaveTextContent('À trouver : 6 de cœur');
		touches('c', '3');
		expect(carte()).toHaveTextContent('✓ 6 de cœur');
		fireEvent.click(document.getElementById('entrainement-recommencer')!);
		expect(carte()).toHaveTextContent('À trouver : Dame de carreau');
		touches('1');
		expect(carte()).toHaveTextContent('✗ Touché : As de pique');
		expect(carte()).toHaveAttribute('data-resultat', 'faux');
	} finally {
		hasard.mockRestore();
	}
});

test('écrou ⚙ : le test des zones dessine les vingt coins, sans retourner de carte', async () => {
	await ouvrir('#/tours/trois-six-neuf-dame?reglages');
	fireEvent.click(document.getElementById('test-btn')!);
	expect(document.querySelectorAll('#zones-cinq .zone-coin')).toHaveLength(20);
	touches('1', 'c', '5');
	expect(retournees()).toStrictEqual([]);
	fireEvent.click(document.getElementById('test-reglages')!);
	expect(document.getElementById('zones-cinq')).toBeNull();
});
