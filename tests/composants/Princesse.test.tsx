// La Princesse dans l'app (src/tours/princesse/) : la routine au clavier, et ses réglages.
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

afterEach(() => {
	jest.useRealTimers();
});

/** Ouvre le tour à son adresse, attend qu'il soit chargé, puis passe aux minuteries simulées. */
async function ouvrir(adresse: string): Promise<HTMLElement> {
	window.location.hash = adresse;
	render(<App />);
	// Le tour est chargé à sa première ouverture (src/tours/registre.ts).
	await waitFor(() => expect(document.querySelectorAll('#jeu .carte')).toHaveLength(5));
	// Preact branche les écouteurs (clavier…) après l'affichage : on laisse passer un instant.
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
	// Les cinq secondes et le mélange passent sans attendre.
	jest.useFakeTimers();
	return document.querySelector<HTMLElement>('#jeu')!;
}

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

/** Les faces des cartes encore là (rang dans content/cartes.ts), de gauche à droite. */
const visibles = (jeu: HTMLElement): number[] => [...jeu.querySelectorAll<HTMLElement>('.carte:not(.disparue)')]
	.sort((a, b) => Number(a.dataset.place) - Number(b.dataset.place))
	.map((carte) => Number(carte.dataset.carte));

/** Montre les cartes, et attend qu'elles soient retournées et mélangées. */
function jusquAuMelange(): void {
	touche(' ');
	// Chaque étape à son tour : la minuterie suivante part une fois l'étape affichée.
	attendre(5000);
	attendre(750);
	attendre(2000);
}

test('au départ, les cinq cartes sont faces en bas', async () => {
	const jeu = await ouvrir('#/tours/princesse');
	expect(jeu.dataset.phase).toBe('depart');
	expect(jeu.querySelectorAll('.carte')).toHaveLength(5);
	expect(jeu.querySelectorAll('.carte.retournee')).toHaveLength(0);
	// Chaque carte a son dos (bleu, façon Bicycle, par défaut) et sa face dessinés d'avance.
	expect(jeu.querySelectorAll('.dos .dos-bicycle')).toHaveLength(5);
	expect([...jeu.querySelectorAll('.carte')].every((c) => c.getAttribute('data-couleur') === 'bleu')).toBe(true);
	expect(jeu.querySelectorAll('.avant .face')).toHaveLength(5);
});

test('montrées 5 s dans un ordre tiré au sort, puis retournées et mélangées', async () => {
	const jeu = await ouvrir('#/tours/princesse');
	touche(' ');
	expect(jeu.dataset.phase).toBe('montre');
	expect(jeu.querySelectorAll('.carte.retournee')).toHaveLength(5);
	expect([...visibles(jeu)].sort()).toStrictEqual([0, 1, 2, 3, 4]);
	// Un chiffre pendant que les cartes sont montrées ne fait rien.
	touche('1');
	expect(jeu.dataset.phase).toBe('montre');
	attendre(4900);
	expect(jeu.dataset.phase).toBe('montre');
	attendre(200);
	expect(jeu.dataset.phase).toBe('retourne');
	expect(jeu.querySelectorAll('.carte.retournee')).toHaveLength(0);
	attendre(1000);
	expect(jeu.dataset.phase).toBe('melange');
	attendre(2000);
	expect(jeu.dataset.phase).toBe('pret');
});

test('l’ordre des faces montrées change d’une fois à l’autre', async () => {
	const jeu = await ouvrir('#/tours/princesse');
	const ordres = new Set<string>();
	for (let i = 0; i < 12; i++) {
		touche('r');
		touche(' ');
		ordres.add(visibles(jeu).join());
	}
	expect(ordres.size).toBeGreaterThan(1);
});

test('la carte touchée disparaît ; la première retournée cache, par sa place, 4♣, 8♥, 5♦ ou 10♦ ; V cache le valet', async () => {
	const jeu = await ouvrir('#/tours/princesse');
	// [carte qui disparaît, première carte retournée (ou V), carte jamais montrée]
	for (const [disparait, premiere, cachee] of [['1', '2', 0], ['5', '2', 1], ['2', '4', 2], ['3', '5', 3], ['3', 'v', 4]] as const) {
		const cas = `${disparait} puis ${premiere}`;
		touche('r');
		jusquAuMelange();
		touche(disparait);
		expect(jeu.dataset.phase).toBe('revele');
		expect(jeu.querySelector('.carte.disparue')?.getAttribute('data-place'), cas).toBe(String(Number(disparait) - 1));
		// Rien n'est encore montré : les quatre autres sont faces en bas.
		expect(jeu.querySelectorAll('.carte.retournee')).toHaveLength(0);
		touche(premiere);
		expect(jeu.querySelectorAll('.carte.retournee'), cas).toHaveLength(1);
		const premiereFace = jeu.querySelector('.carte.retournee')!.getAttribute('data-carte');
		// Chaque autre carte touchée se retourne, et la carte cachée n'est jamais parmi elles.
		for (const autre of ['1', '2', '3', '4', '5']) {
			if (!jeu.querySelector(`.carte[data-place="${Number(autre) - 1}"]`)!.classList.contains('retournee')) touche(autre);
		}
		expect(jeu.querySelectorAll('.carte.retournee:not(.disparue)'), cas).toHaveLength(4);
		expect([...visibles(jeu)].sort(), cas).toStrictEqual([0, 1, 2, 3, 4].filter((c) => c !== cachee));
		// La première carte retournée n'a pas changé de face en chemin.
		// (V retourne la première carte restante, à gauche.)
		const placePremiere = premiere === 'v' ? [0, 1, 2, 3, 4].find((p) => String(p + 1) !== String(disparait))! : Number(premiere) - 1;
		expect(jeu.querySelector(`.carte[data-place="${placePremiere}"]`)!.getAttribute('data-carte'), cas).toBe(premiereFace);
	}
});

test('écrou ⚙ : comptées de droite à gauche, la première carte de droite cache le 4♣', async () => {
	localStorage.setItem('princesse:settings:v1', JSON.stringify({ sens: 'droite' }));
	const jeu = await ouvrir('#/tours/princesse');
	jusquAuMelange();
	touche('1');
	// Les restantes, comptées depuis la droite : la place 5 est la première (4♣), la place 2 la quatrième (10♦).
	touche('5');
	for (const autre of ['2', '3', '4']) touche(autre);
	expect([...visibles(jeu)].sort()).toStrictEqual([1, 2, 3, 4]);
	touche('r');
	jusquAuMelange();
	touche('1');
	touche('2');
	for (const autre of ['3', '4', '5']) touche(autre);
	expect([...visibles(jeu)].sort()).toStrictEqual([0, 1, 2, 4]);
});

test('un double toucher (V) après deux cartes déjà retournées cache encore le valet', async () => {
	const jeu = await ouvrir('#/tours/princesse');
	/** Les faces des cartes retournées, de gauche à droite. */
	const retournees = (): number[] => [...jeu.querySelectorAll<HTMLElement>('.carte.retournee:not(.disparue)')]
		.sort((a, b) => Number(a.dataset.place) - Number(b.dataset.place))
		.map((carte) => Number(carte.dataset.carte));
	jusquAuMelange();
	touche('3');
	// Deux cartes retournées : la première (place 1) aurait caché le 4♣, et aucune ne montre le valet.
	touche('1');
	touche('2');
	const dejaVues = retournees();
	expect(dejaVues).toHaveLength(2);
	expect(dejaVues).not.toContain(4);
	// V : un double toucher sur la première carte encore face en bas (place 4).
	touche('v');
	touche('5');
	expect(retournees()).toHaveLength(4);
	expect([...retournees()].sort()).toStrictEqual([0, 1, 2, 3]);
	// Les deux premières n'ont pas changé de face.
	expect(retournees().slice(0, 2)).toStrictEqual(dejaVues);
});

test('une carte retournée se remet face en bas quand on la touche encore ; rien ne remet le tour à zéro', async () => {
	const jeu = await ouvrir('#/tours/princesse');
	jusquAuMelange();
	touche('3');
	touche('1');
	const carte = jeu.querySelector('.carte[data-place="0"]')!;
	expect(carte).toHaveClass('retournee');
	touche('1');
	expect(carte).not.toHaveClass('retournee');
	touche('1');
	expect(carte).toHaveClass('retournee');
	// Espace, ou d'autres touchers, ne relancent pas la routine.
	touche(' ');
	attendre(10_000);
	expect(jeu.dataset.phase).toBe('revele');
	expect(jeu.querySelector('.carte.disparue')).not.toBeNull();
	// Seule la touche R, au clavier, remet les cinq cartes.
	touche('r');
	expect(jeu.dataset.phase).toBe('depart');
	expect(jeu.querySelector('.carte.disparue')).toBeNull();
	expect(window.location.hash).toBe('#/tours/princesse');
});

test('la durée réglée vaut pour la routine', async () => {
	localStorage.setItem('princesse:settings:v1', JSON.stringify({ duree: 2, showHoldRing: true }));
	const jeu = await ouvrir('#/tours/princesse');
	touche(' ');
	attendre(2100);
	expect(jeu.dataset.phase).toBe('retourne');
});

test('en anglais, les cartes sont annoncées en anglais', async () => {
	localStorage.setItem('mes-tours:langue', '"en"');
	await ouvrir('#/tours/princesse');
	touche(' ');
	for (const nom of ['4 of clubs', '8 of hearts', '5 of diamonds', '10 of diamonds', 'Jack of diamonds']) {
		expect(document.querySelector('#annonce')).toHaveTextContent(nom);
	}
});

test('Échap ramène au menu principal', async () => {
	await ouvrir('#/tours/princesse');
	jest.useRealTimers();
	touche('Escape');
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : la durée est gardée, « Rétablir » la remet à 5 s, la croix ramène au menu', async () => {
	window.location.hash = '#/tours/princesse?reglages';
	render(<App />);
	await waitFor(() => expect(document.querySelector('#duree')).not.toBeNull());
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Princesse');
	expect(document.querySelector('#duree-valeur')).toHaveTextContent('5 s');
	fireEvent.input(document.querySelector('#duree')!, { target: { value: '8' } });
	expect(document.querySelector('#duree-valeur')).toHaveTextContent('8 s');
	expect(JSON.parse(localStorage.getItem('princesse:settings:v1')!)).toMatchObject({ duree: 8 });
	fireEvent.click(screen.getByText('Rétablir les réglages par défaut'));
	expect(document.querySelector('#duree-valeur')).toHaveTextContent('5 s');
	fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : le dos et sa couleur, choisis en regardant, valent pour les cartes', async () => {
	window.location.hash = '#/tours/princesse?reglages';
	render(<App />);
	await waitFor(() => expect(document.querySelector('#motif-choix')).not.toBeNull());
	// Sept dos et quatre couleurs, chacun montré par une petite carte.
	expect(document.querySelectorAll('#motif-choix button')).toHaveLength(7);
	expect(document.querySelectorAll('#couleur-choix button')).toHaveLength(4);
	expect(document.querySelector('#motif-choix [aria-checked="true"]')).toHaveAttribute('data-valeur', 'bicycle');
	expect(document.querySelector('#couleur-choix [aria-checked="true"]')).toHaveAttribute('data-valeur', 'bleu');
	expect(document.querySelector('#sens-choix [aria-checked="true"]')).toHaveAttribute('data-valeur', 'gauche');
	fireEvent.click(document.querySelector('#sens-choix [data-valeur="droite"]')!);
	expect(JSON.parse(localStorage.getItem('princesse:settings:v1')!)).toMatchObject({ sens: 'droite' });
	fireEvent.click(document.querySelector('#motif-choix [data-valeur="deco"]')!);
	fireEvent.click(document.querySelector('#couleur-choix [data-valeur="rouge"]')!);
	expect(JSON.parse(localStorage.getItem('princesse:settings:v1')!)).toMatchObject({ motif: 'deco', couleur: 'rouge' });
	// Les aperçus des couleurs montrent le dos choisi.
	expect([...document.querySelectorAll('#couleur-choix .vignette')].every((v) => v.getAttribute('data-motif') === 'deco')).toBe(true);
	fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
	act(() => {
		window.location.hash = '#/tours/princesse';
	});
	await waitFor(() => expect(document.querySelectorAll('#jeu .carte')).toHaveLength(5));
	expect([...document.querySelectorAll('#jeu .carte')].every((c) => c.getAttribute('data-couleur') === 'rouge')).toBe(true);
	expect(document.querySelectorAll('#jeu .dos[data-motif="deco"] svg.dos-motif')).toHaveLength(5);
});
