// Les cinq cartes dans l'app (src/tours/cinq-cartes/) : la routine au clavier, et ses réglages.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

const cartes = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('#rangee .carte')];

/** Ouvre le tour à son adresse, et attend qu'il soit chargé. */
async function ouvrir(adresse: string): Promise<void> {
	window.location.hash = adresse;
	render(<App />);
	// Le tour est chargé à sa première ouverture (src/tours/registre.ts).
	await waitFor(() => expect(document.querySelector('#rangee .carte, #menu')).not.toBeNull());
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

const retournees = (): number[] => cartes().flatMap((c, i) => (c.classList.contains('retournee') ? [i] : []));

test('cinq cartes face cachée, rien d’écrit à l’avant', async () => {
	await ouvrir('#/tours/cinq-cartes');
	expect(cartes()).toHaveLength(5);
	expect(retournees()).toStrictEqual([]);
	expect(document.querySelector('.face-carte')).toBeNull();
});

test('chaque carte touchée se retourne aussitôt, blanche ; la dernière retournée est la Dame de cœur', async () => {
	await ouvrir('#/tours/cinq-cartes');
	// 4 + 8 = 12, la Dame : dès le premier toucher, la carte se retourne.
	touches('3');
	expect(retournees()).toStrictEqual([2]);
	touches('4', 'c');
	// La cinquième, touchée en haut à droite (cœur), se retourne aussi.
	expect(retournees()).toStrictEqual([2, 3, 4]);
	expect(document.querySelectorAll('.retournee .face-carte')).toHaveLength(0);
	touches('1');
	expect(retournees()).toStrictEqual([0, 2, 3, 4]);
	expect(cartes()[0]!.querySelector('.face-carte')).toBeNull();
	touches('2');
	const face = cartes()[1]!.querySelector<SVGElement>('.face-carte')!;
	expect(face.dataset.valeur).toBe('12');
	expect(face.dataset.couleur).toBe('coeur');
	expect(face).toHaveTextContent('D');
	expect(document.getElementById('annonce')).toHaveTextContent('Dame de cœur');
});

test('la routine finie, une carte touchée se retourne dans un sens ou dans l’autre, et garde sa face', async () => {
	await ouvrir('#/tours/cinq-cartes');
	// L'As de pique : la carte qui vaut 1, puis la cinquième ; la dernière retournée est la quatrième.
	touches('1', 'p', '2', '3', '4');
	expect(retournees()).toHaveLength(5);
	expect(cartes()[3]!.querySelector<SVGElement>('.face-carte')!.dataset.valeur).toBe('1');
	touches('4');
	expect(retournees()).toStrictEqual([0, 1, 2, 4]);
	touches('2', '4');
	expect(retournees()).toStrictEqual([0, 2, 3, 4]);
	expect(cartes()[3]!.querySelector<SVGElement>('.face-carte')!.dataset.valeur).toBe('1');
	expect(cartes()[1]!.querySelector('.face-carte')).toBeNull();
});

test('la cinquième touchée directement : toutes les cartes sont des Jokers', async () => {
	await ouvrir('#/tours/cinq-cartes');
	touches('d');
	// La cinquième se retourne aussitôt sur un Joker, rouge (coin du carreau).
	expect(retournees()).toStrictEqual([4]);
	expect(cartes()[4]!.querySelector<SVGElement>('.face-carte')!.dataset.valeur).toBe('joker');
	touches('1', '2', '3', '4');
	const faces = cartes().map((c) => c.querySelector<SVGElement>('.face-carte'));
	expect(faces.map((f) => f?.dataset.valeur)).toStrictEqual(['joker', 'joker', 'joker', 'joker', 'joker']);
	// Cinq Jokers différents, un par carte.
	expect(new Set(faces.map((f) => f?.dataset.joker)).size).toBe(5);
	expect(faces[0]).toHaveTextContent('JOKER');
	expect(document.getElementById('annonce')).toHaveTextContent('Joker');
});

test('15 : la cinquième, dernière retournée, est un Joker ; les autres restent blanches', async () => {
	await ouvrir('#/tours/cinq-cartes');
	touches('1', '2', '3', '4', 'p');
	expect(retournees()).toHaveLength(5);
	expect(cartes().map((c) => c.querySelector<SVGElement>('.face-carte')?.dataset.valeur)).toStrictEqual([undefined, undefined, undefined, undefined, 'joker']);
});

test('au clavier seulement, R remet les cinq cartes face cachée, rien de codé : on reste dans le tour', async () => {
	await ouvrir('#/tours/cinq-cartes');
	touches('1', 'p', '2', '3', '4');
	expect(retournees()).toHaveLength(5);
	touches('r');
	expect(retournees()).toStrictEqual([]);
	expect(document.querySelector('.face-carte')).toBeNull();
	expect(window.location.hash).toBe('#/tours/cinq-cartes');
	// Une nouvelle routine : le 2 de trèfle, la dernière retournée est la première carte.
	touches('2', 't', '4', '3', '1');
	expect(cartes()[0]!.querySelector<SVGElement>('.face-carte')!.dataset.valeur).toBe('2');
	expect(cartes()[0]!.querySelector<SVGElement>('.face-carte')!.dataset.couleur).toBe('trefle');
});

test('en anglais, la Dame est une Queen', async () => {
	localStorage.setItem('mes-tours:langue', '"en"');
	await ouvrir('#/tours/cinq-cartes');
	touches('3', '4', 'd', '1', '2');
	expect(cartes()[1]!.querySelector('.face-carte')).toHaveTextContent('Q');
	expect(document.getElementById('annonce')).toHaveTextContent('Queen of diamonds');
});

test('le « 1 » réglé à droite : la carte qui vaut 1 est au bord droit, celle de la couleur au bord gauche', async () => {
	localStorage.setItem('cinq-cartes:settings:v1', JSON.stringify({ sens: 'droite' }));
	await ouvrir('#/tours/cinq-cartes');
	// Les cartes de la table, de gauche à droite : leur rang du codage.
	expect(cartes().map((c) => c.dataset.index)).toStrictEqual(['4', '3', '2', '1', '0']);
	// 1 + 4 = 5 de pique : la carte qui vaut 1 (bord droit) se retourne aussitôt.
	touches('1');
	expect(retournees()).toStrictEqual([4]);
	touches('3', 'p');
	expect(retournees()).toStrictEqual([0, 2, 4]);
	// La dernière retournée, celle qui vaut 2, est la deuxième en partant de la droite.
	touches('4', '2');
	expect(cartes()[3]!.querySelector<SVGElement>('.face-carte')!.dataset.valeur).toBe('5');
	expect(cartes()[3]!.querySelector<SVGElement>('.face-carte')!.dataset.couleur).toBe('pique');
});

test('Échap ramène au menu principal', async () => {
	await ouvrir('#/tours/cinq-cartes');
	touches('Escape');
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : le dos choisi est gardé, « Rétablir » le remet, le codage est rappelé', async () => {
	await ouvrir('#/tours/cinq-cartes?reglages');
	expect(document.querySelector('.titre-reglages')).toHaveTextContent('Réglages');
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Les cinq cartes');
	expect(document.getElementById('codage')).toHaveTextContent('1, 2, 4 et 8');
	expect(document.querySelector('#sens-choix [data-valeur="gauche"]')).toHaveAttribute('aria-checked', 'true');
	fireEvent.click(document.querySelector('#sens-choix [data-valeur="droite"]')!);
	expect(JSON.parse(localStorage.getItem('cinq-cartes:settings:v1')!).sens).toBe('droite');
	fireEvent.click(document.querySelector('#couleur-choix [data-valeur="bleu"]')!);
	expect(JSON.parse(localStorage.getItem('cinq-cartes:settings:v1')!).couleur).toBe('bleu');
	fireEvent.click(document.getElementById('defaults-btn')!);
	await waitFor(() => expect(document.querySelector('#couleur-choix [data-valeur="rouge"]')).toHaveAttribute('aria-checked', 'true'));
});

test('la couleur choisie dans les réglages est celle des dos sur la table', async () => {
	localStorage.setItem('cinq-cartes:settings:v1', JSON.stringify({ couleur: 'bleu' }));
	await ouvrir('#/tours/cinq-cartes');
	const dos = [...document.querySelectorAll<HTMLElement>('#rangee .dos')];
	expect(dos).toHaveLength(5);
	// Le style « Arcade » lit la couleur sur le dos lui-même (styles/tours/cinq-cartes/_balatro.scss).
	for (const d of dos) expect(d.dataset.couleur).toBe('bleu');
});

test('écrou ⚙ : le mode entraînement joue la routine, « Recommencer » remet les dos, « Retour aux réglages » y revient', async () => {
	await ouvrir('#/tours/cinq-cartes?reglages');
	fireEvent.click(document.getElementById('entrainement-btn')!);
	expect(document.querySelector('#menu .sheet')).toBeNull();
	expect(document.getElementById('entrainement')).not.toBeNull();
	touches('1', '3');
	expect(retournees()).toStrictEqual([0, 2]);
	fireEvent.click(document.getElementById('entrainement-recommencer')!);
	expect(retournees()).toStrictEqual([]);
	fireEvent.click(document.getElementById('entrainement-retour')!);
	expect(document.querySelector('#menu .sheet')).not.toBeNull();
	expect(document.getElementById('entrainement')).toBeNull();
	expect(window.location.hash).toBe('#/tours/cinq-cartes?reglages');
});

test('mode entraînement : la carte à coder est demandée, puis la barre dit si elle a été trouvée', async () => {
	await ouvrir('#/tours/cinq-cartes?reglages');
	// Le tirage donne le 5 de pique (valeur 1 + 4, coin en haut à gauche) ; « Recommencer » tire
	// une nouvelle rangée, puis le Roi de carreau.
	const tirages = [4.5 / 13, 0, 0, .999999, .999999];
	const hasard = jest.spyOn(Math, 'random').mockImplementation(() => tirages.shift() ?? 0);
	try {
		fireEvent.click(document.getElementById('entrainement-btn')!);
		const carte = (): HTMLElement => document.getElementById('entrainement-carte')!;
		expect(carte()).toHaveTextContent('À coder : 5 de pique');
		touches('1', '3', 'p');
		expect(carte()).toHaveTextContent('✓ 5 de pique');
		expect(carte()).toHaveAttribute('data-resultat', 'juste');
		fireEvent.click(document.getElementById('entrainement-recommencer')!);
		expect(carte()).toHaveTextContent('À coder : Roi de carreau');
		touches('1', 'p');
		expect(carte()).toHaveTextContent('✗ Codé : As de pique');
		expect(carte()).toHaveAttribute('data-resultat', 'faux');
	} finally {
		hasard.mockRestore();
	}
});

test('écrou ⚙ : le test des zones dessine les colonnes et les coins, sans retourner de carte ; « Réglages » y revient', async () => {
	await ouvrir('#/tours/cinq-cartes?reglages');
	fireEvent.click(document.getElementById('test-btn')!);
	expect(document.querySelector('#menu .sheet')).toBeNull();
	expect(document.querySelectorAll('#zones-cinq .zone-colonne')).toHaveLength(5);
	expect([...document.querySelectorAll('#zones-cinq .zone-colonne .tag')].map((t) => t.textContent)).toStrictEqual(['1', '2', '4', '8', '♠', '♥', '♣', '♦']);
	expect(document.getElementById('test-etat')).toHaveTextContent('Touchez une zone');
	touches('1', 'p');
	expect(retournees(), 'le test des zones a retourné une carte').toStrictEqual([]);
	fireEvent.click(document.getElementById('test-reglages')!);
	expect(document.querySelector('#menu .sheet')).not.toBeNull();
	expect(document.getElementById('zones-cinq')).toBeNull();
});
