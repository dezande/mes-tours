// Les trois paquets dans l'app (src/tours/trois-paquets/) : la routine au clavier, et ses réglages.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';
import { FORCEES } from '../../src/tours/trois-paquets/content/cartes.ts';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

const NOMS_FORCES = FORCEES.map(({ valeur, enseigne }) => `${valeur}-${enseigne}`);

/** Ouvre le tour à son adresse, et attend qu'il soit chargé. */
async function ouvrir(adresse: string): Promise<HTMLElement> {
	window.location.hash = adresse;
	render(<App />);
	// Le tour est chargé à sa première ouverture (src/tours/registre.ts).
	await waitFor(() => expect(document.querySelector('#panneaux')).not.toBeNull());
	// Preact branche les écouteurs (clavier…) après l'affichage : on laisse passer un instant.
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
	return document.querySelector<HTMLElement>('#panneaux')!;
}

const touche = (key: string): void => {
	act(() => {
		fireEvent.keyDown(document, { key });
	});
};

/** Les cartes faces en l'air d'un panneau, en « valeur-enseigne ». */
const faces = (panneau: string): string[] => [...document.querySelectorAll<HTMLElement>(`.${panneau} .carte.retournee`)].map((c) => c.dataset.carte!);

test('d’abord deux mélanges : des cartes en tas, faces en l’air et faces en bas', async () => {
	const panneaux = await ouvrir('#/tours/trois-paquets');
	expect(panneaux.dataset.panneau).toBe('0');
	const melanges = document.querySelectorAll('.panneau.melange');
	expect(melanges).toHaveLength(2);
	for (const melange of melanges) {
		expect(melange.querySelectorAll('.carte.retournee').length).toBeGreaterThan(0);
		expect(melange.querySelectorAll('.carte:not(.retournee)').length).toBeGreaterThan(0);
	}
	touche('ArrowRight');
	expect(panneaux.dataset.panneau).toBe('1');
	touche('ArrowRight');
	expect(panneaux.dataset.panneau).toBe('2');
});

test('panneau 1 : les huit cartes à forcer faces en l’air, sur un tas de dos Bicycle ; les autres faces sont cachées sous un dos', async () => {
	await ouvrir('#/tours/trois-paquets');
	const visibles = faces('salade');
	// Chaque carte à forcer deux fois : elle, et son double.
	expect(visibles.filter((carte) => NOMS_FORCES.includes(carte)).sort()).toStrictEqual([...NOMS_FORCES, ...NOMS_FORCES].sort());
	// Les autres faces en l'air : chacune sous les deux dos qui la suivent, l'un décalé vers la droite, l'autre vers le haut.
	const cartes = [...document.querySelectorAll<HTMLElement>('.salade .carte')];
	const cachees = cartes.filter((c) => c.classList.contains('retournee') && !NOMS_FORCES.includes(c.dataset.carte!));
	expect(cachees).toHaveLength(3);
	for (const face of cachees) {
		const dos = cartes[cartes.indexOf(face) + 1]!;
		expect(dos.classList.contains('retournee')).toBe(false);
		expect(Number(dos.style.getPropertyValue('--z'))).toBe(Number(face.style.getPropertyValue('--z')) + 1);
		expect(dos.style.getPropertyValue('--x')).toBe(face.style.getPropertyValue('--x'));
		expect(dos.style.getPropertyValue('--rot')).toBe(face.style.getPropertyValue('--rot'));
		expect(Number(dos.style.getPropertyValue('--dx'))).toBeGreaterThan(0);
		const haut = cartes[cartes.indexOf(face) + 2]!;
		expect(Number(haut.style.getPropertyValue('--z'))).toBe(Number(face.style.getPropertyValue('--z')) + 2);
		expect(Number(haut.style.getPropertyValue('--dy'))).toBeLessThan(0);
	}
	const dos = document.querySelectorAll('.salade .carte:not(.retournee)');
	expect(dos.length).toBeGreaterThan(8);
	// Les doubles : plus au fond que toutes les cartes de la grille, loin de leur carte, la moitié du
	// bas sous le dos qui les suit.
	const z = (c: HTMLElement): number => Number(c.style.getPropertyValue('--z'));
	const lieu = (c: HTMLElement): { x: number; y: number } => ({ x: Number(c.style.getPropertyValue('--x')), y: Number(c.style.getPropertyValue('--y')) });
	for (const nom of NOMS_FORCES) {
		const [une, autre] = cartes.filter((c) => c.dataset.carte === nom).sort((a, b) => z(a) - z(b));
		const [double, original] = [une!, autre!];
		expect(z(double)).toBeLessThan(Math.min(...cartes.filter((c) => NOMS_FORCES.includes(c.dataset.carte!)).filter((c) => c !== double && z(c) >= 100).map(z)));
		expect(Math.hypot(2 * (lieu(double).x - lieu(original).x), lieu(double).y - lieu(original).y), nom).toBeGreaterThanOrEqual(.55);
		const dos = cartes[cartes.indexOf(double) + 1]!;
		expect(z(dos)).toBe(z(double) + 1);
		expect(Number(dos.style.getPropertyValue('--dy'))).toBeGreaterThan(0);
	}
	// La dame a sa figure, avec son index Q.
	expect(document.querySelector('.salade .carte[data-carte="D-pique"] .figure')).not.toBeNull();
});

test('panneau 2, trois fois : trois paquets de sept, faces en l’air, les trois copies identiques', async () => {
	const panneaux = await ouvrir('#/tours/trois-paquets');
	for (let i = 0; i < 3; i++) touche('ArrowRight');
	expect(panneaux.dataset.panneau).toBe('3');
	// Mêmes cartes, même ordre, même désordre.
	const copies = [1, 2, 3].map((c) => [...document.querySelectorAll<HTMLElement>(`.panneau.paquets[data-copie="${c}"] .carte`)].map((carte) => `${carte.dataset.carte} ${carte.style.getPropertyValue('--rot')}`));
	expect(copies[0]).toHaveLength(21);
	expect(copies[1]).toStrictEqual(copies[0]);
	expect(copies[2]).toStrictEqual(copies[0]);
	touche('ArrowRight');
	touche('ArrowRight');
	expect(panneaux.dataset.panneau).toBe('5');
	const paquets = document.querySelectorAll('.panneau.paquets[data-copie="1"] .paquet');
	expect(paquets).toHaveLength(3);
	for (const paquet of paquets) expect(paquet.querySelectorAll('.carte.retournee')).toHaveLength(7);
	// Le 2 n'est dans aucun paquet, le 4 que dans le premier ; la dame dans les trois.
	const valeurs = [...paquets].map((paquet) => [...paquet.querySelectorAll<HTMLElement>('.carte')].map((c) => c.dataset.carte!.split('-')[0]));
	expect(valeurs.map((v) => v.includes('2'))).toStrictEqual([false, false, false]);
	expect(valeurs.map((v) => v.includes('4'))).toStrictEqual([true, false, false]);
	expect(valeurs.map((v) => v.includes('D'))).toStrictEqual([true, true, true]);
});

test('panneau 3 : aucune carte à forcer ; les paquets notés ôtent la valeur pensée ; un toucher fait disparaître la carte face en bas', async () => {
	const panneaux = await ouvrir('#/tours/trois-paquets');
	for (let i = 0; i < 3; i++) touche('ArrowRight');
	// Paquets 1 et 3 : 1 + 4 = 5, le valet de carreau ; notés encore sur la copie suivante, sans s'annuler.
	touche('1');
	touche('3');
	touche('ArrowRight');
	touche('1');
	touche('3');
	touche('ArrowRight');
	touche('ArrowRight');
	expect(panneaux.dataset.panneau).toBe('6');
	const fin = faces('fin');
	expect(fin.some((carte) => NOMS_FORCES.includes(carte))).toBe(false);
	expect(fin.some((carte) => carte.startsWith('2-'))).toBe(true);
	expect(fin.some((carte) => carte.startsWith('V-'))).toBe(false);
	expect(fin.some((carte) => carte.startsWith('D-'))).toBe(true);
	// Trois colonnes de sept, la carte face en bas au milieu de la colonne du milieu.
	const colonnes = document.querySelectorAll('.fin .paquet');
	expect(colonnes).toHaveLength(3);
	for (const colonne of colonnes) expect(colonne.querySelectorAll('.carte')).toHaveLength(7);
	const derniere = document.querySelector('#derniere')!;
	expect(colonnes[1]!.querySelectorAll('.carte')[3]).toBe(derniere);
	expect(fin).toHaveLength(20);
	expect(derniere.classList.contains('retournee')).toBe(false);
	expect(derniere.classList.contains('disparue')).toBe(false);
	touche(' ');
	expect(derniere.classList.contains('disparue')).toBe(true);
	// La carte disparue, le tour est figé : ni retour en arrière, ni nouvelle routine.
	touche('ArrowLeft');
	touche('ArrowRight');
	expect(panneaux.dataset.panneau).toBe('6');
	expect(derniere.classList.contains('disparue')).toBe(true);
	// Seul R, au clavier, remet le tour : le premier mélange, la carte revenue.
	touche('r');
	expect(panneaux.dataset.panneau).toBe('0');
	expect(document.querySelector('#derniere')!.classList.contains('disparue')).toBe(false);
});

test('panneau 3, aucun paquet noté : le code 0, le 2♣ ; aucun 2 dans la fin', async () => {
	await ouvrir('#/tours/trois-paquets');
	for (let i = 0; i < 6; i++) touche('ArrowRight');
	expect(faces('fin').some((carte) => carte.startsWith('2-'))).toBe(false);
	expect(faces('fin').some((carte) => carte.startsWith('4-'))).toBe(true);
});

test('écrou ⚙ : la couleur du dos se choisit, et vaut pour toutes les cartes', async () => {
	await ouvrir('#/tours/trois-paquets?reglages');
	fireEvent.click(screen.getByRole('radio', { name: 'Rouge' }));
	await waitFor(() => expect(localStorage.getItem('trois-paquets:settings:v1')).toContain('rouge'));
	expect(document.querySelectorAll('.salade .carte[data-couleur="rouge"]').length).toBeGreaterThan(7);
});

test('réglages : la carte face en bas peut rester à sa place ; le toucher fige quand même le tour', async () => {
	localStorage.setItem('trois-paquets:settings:v1', JSON.stringify({ disparition: false }));
	await ouvrir('#/tours/trois-paquets');
	for (let i = 0; i < 6; i++) touche('ArrowRight');
	const panneaux = document.getElementById('panneaux')!;
	expect(panneaux.dataset.panneau).toBe('6');
	touche(' ');
	expect(document.querySelector('#derniere')!.classList.contains('disparue')).toBe(false);
	expect(document.getElementById('annonce')).toHaveTextContent('Les cartes restantes');
	touche('ArrowLeft');
	touche('ArrowRight');
	expect(panneaux.dataset.panneau).toBe('6');
});

test('écrou ⚙ : la case « La carte face en bas disparaît » est cochée par défaut, et se décoche', async () => {
	await ouvrir('#/tours/trois-paquets?reglages');
	const caseDisparition = document.getElementById('disparition') as HTMLInputElement;
	expect(caseDisparition.checked).toBe(true);
	fireEvent.click(caseDisparition);
	await waitFor(() => expect(JSON.parse(localStorage.getItem('trois-paquets:settings:v1')!).disparition).toBe(false));
});

test('photos liées : chaque photo montre les vraies cartes dans sa colonne ; toucher ne note rien ; la fin, que du remplissage', async () => {
	localStorage.setItem('trois-paquets:settings:v1', JSON.stringify({ photos: 'liees' }));
	await ouvrir('#/tours/trois-paquets');
	const colonne = (copie: number, c: number): string[] =>
		[...document.querySelectorAll<HTMLElement>(`.panneau.paquets[data-copie="${copie}"] .paquet`)[c]!.querySelectorAll<HTMLElement>('.carte')].map((carte) => carte.dataset.carte!);
	// La photo 1 et sa première colonne : le 4♣, le 5♦, le valet de ♦, la dame de ♠.
	expect(colonne(1, 0)).toEqual(expect.arrayContaining(['4-trefle', '5-carreau', 'V-carreau', 'D-pique']));
	// La photo 2 et sa deuxième colonne : le 8♥, le 5♦, le 10♠, la dame de ♠ ; la photo 3 et la troisième.
	expect(colonne(2, 1)).toEqual(expect.arrayContaining(['8-coeur', '5-carreau', '10-pique', 'D-pique']));
	expect(colonne(3, 2)).toEqual(expect.arrayContaining(['10-carreau', 'V-carreau', '10-pique', 'D-pique']));
	for (let i = 0; i < 6; i++) {
		touche('1');
		touche('ArrowRight');
	}
	expect(document.getElementById('panneaux')!.dataset.panneau).toBe('6');
	const fin = faces('fin');
	expect(fin).toHaveLength(20);
	for (const carte of fin) expect(['A', '3', '6', '7', '9', 'R']).toContain(carte.split('-')[0]);
});
