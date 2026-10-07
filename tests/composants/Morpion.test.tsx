// Le Morpion dans l'app (src/tours/morpion/) : la routine au clavier, et ses réglages.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

/** Ouvre le tour à son adresse, et attend qu'il soit chargé. */
async function ouvrir(adresse: string): Promise<HTMLElement> {
	window.location.hash = adresse;
	render(<App />);
	// Le tour est chargé à sa première ouverture (src/tours/registre.ts).
	await waitFor(() => expect(document.querySelector('#table .papier')).not.toBeNull());
	// Preact branche les écouteurs (clavier…) après l'affichage : on laisse passer un instant.
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
	return document.querySelector<HTMLElement>('#table .papier')!;
}

const touche = (key: string): void => {
	act(() => {
		fireEvent.keyDown(document, { key });
	});
};

test('le papier montre « Prédiction », sans grille écrite', async () => {
	const papier = await ouvrir('#/tours/morpion');
	expect(papier).not.toHaveClass('retourne');
	expect(papier.querySelector('.recto .mot')).toHaveTextContent('Prédiction');
	expect(papier.querySelector('.grille')).toBeNull();
});

test('↑ retourne le papier sur la grille du haut, R le remet sur « Prédiction » : on reste dans le tour', async () => {
	const papier = await ouvrir('#/tours/morpion');
	touche('ArrowUp');
	expect(papier).toHaveClass('retourne');
	expect(papier.dataset.cote).toBe('haut');
	// X gagne sur la première ligne, une croix et un rond superposés en haut à gauche : la case 0 porte les deux.
	expect(papier.querySelectorAll('.grille .signe-x')).toHaveLength(5);
	expect(papier.querySelectorAll('.grille .signe-o')).toHaveLength(5);
	expect([...papier.querySelectorAll('.grille [data-case="0"]')].map((m) => m.getAttribute('class'))).toStrictEqual(['signe-o', 'signe-x']);
	expect(papier.querySelector('.grille .gagnante')).not.toBeNull();
	touche('r');
	expect(papier).not.toHaveClass('retourne');
	expect(window.location.hash).toBe('#/tours/morpion');
});

test('↓ donne la grille du bas, et une autre touche ne la change plus', async () => {
	const papier = await ouvrir('#/tours/morpion');
	touche('ArrowDown');
	touche('ArrowUp');
	expect(papier.dataset.cote).toBe('bas');
	// X gagne sur la troisième colonne, une croix et un rond superposés au bout de la deuxième ligne.
	expect(papier.querySelectorAll('.grille .signe-x, .grille .signe-o')).toHaveLength(10);
	expect([...papier.querySelectorAll('.grille [data-case="5"]')].map((m) => m.getAttribute('class'))).toStrictEqual(['signe-o', 'signe-x']);
	expect(papier.querySelector('.grille .gagnante')).not.toBeNull();
});

test('en anglais, le papier dit « Prediction »', async () => {
	localStorage.setItem('mes-tours:langue', '"en"');
	const papier = await ouvrir('#/tours/morpion');
	expect(papier.querySelector('.recto .mot')).toHaveTextContent('Prediction');
});

test('Échap ramène au menu principal', async () => {
	await ouvrir('#/tours/morpion');
	touche('Escape');
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : le délai est gardé, « Rétablir » le remet à 0 s, la croix ramène au menu', async () => {
	await ouvrir('#/tours/morpion?reglages');
	expect(document.querySelector('.titre-reglages')).toHaveTextContent('Réglages');
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Morpion');
	fireEvent.input(document.querySelector('#delai')!, { target: { value: '2.5' } });
	expect(document.querySelector('#delai-valeur')).toHaveTextContent('2,5 s');
	expect(JSON.parse(localStorage.getItem('morpion:settings:v1')!)).toMatchObject({ delai: 2.5 });
	fireEvent.click(screen.getByText('Rétablir les réglages par défaut'));
	expect(document.querySelector('#delai-valeur')).toHaveTextContent('0 s');
	fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});
