// La page d'un tour (src/pages/PageTour.tsx) : le tour chargé à sa première ouverture, et le retour
// au menu si son fichier est introuvable (hors-ligne avant la fin du cache, version remplacée).
import { act, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';
import { REGISTRE } from '../../src/tours/registre.ts';

beforeEach(() => {
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

test('la barre du téléphone prend la couleur du tour, et retrouve celle du menu en le quittant', async () => {
	const meta = document.createElement('meta');
	meta.name = 'theme-color';
	meta.content = '#000000';
	document.head.append(meta);
	window.location.hash = '#/tours/morpion';
	render(<App />);
	await waitFor(() => expect(document.querySelector('.scene-morpion')!.childElementCount).toBeGreaterThan(0));
	expect(document.documentElement.dataset.tour).toBe('morpion');
	expect(meta.content).toBe(REGISTRE['morpion']!.couleurTheme);
	act(() => {
		window.location.hash = '';
	});
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
	// Preact nettoie les effets du tour parti juste après l'affichage du menu.
	await waitFor(() => expect(document.documentElement.dataset.tour).toBeUndefined());
	expect(meta.content).not.toBe(REGISTRE['morpion']!.couleurTheme);
	meta.remove();
});

test('le fichier du tour introuvable : retour au menu, plutôt qu’une scène vide sans sortie', async () => {
	// Un tour jamais ouvert dans ce fichier de tests, dont le chargement échoue.
	const entree = REGISTRE['princesse']!;
	const charger = entree.charger;
	entree.charger = () => Promise.reject(new Error('Failed to fetch dynamically imported module'));
	try {
		window.location.hash = '#/tours/princesse';
		render(<App />);
		expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
		expect(window.location.hash).toBe('#/');
		expect(document.querySelector('.scene-princesse')).toBeNull();
	} finally {
		entree.charger = charger;
	}
});
