// Le menu principal (src/pages/Menu.tsx) : une tuile carrée par tour, rangées dans la mallette qui
// s'ouvre à l'ouverture de l'app ; l'écrou ⚙ en haut à droite
// ouvre le panneau des réglages : la ligne des réglages généraux (leur page : langue, ordre des
// tours, favoris, journal), et les réglages de chaque tour.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { App } from '../../src/App.tsx';
import { TOURS } from '../../src/content/tours.ts';
import { APP_VERSION } from '../../src/version.ts';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

/** Un doigt posé puis levé sur l'élément, sans clic derrière (Android, appui long). */
function toucher(element: HTMLElement): void {
	const doigt = { clientX: 0, clientY: 0, identifier: 1, target: element };
	fireEvent.touchStart(element, { touches: [doigt], changedTouches: [doigt] });
	fireEvent.touchEnd(element, { touches: [], changedTouches: [doigt] });
}

/** Les tours des tuiles, dans l'ordre affiché. */
const dossiersAffiches = (): string[] => [...document.querySelectorAll<HTMLElement>('#tours .tour')].map((t) => t.dataset.dossier!);
const tuile = (dossier: string): HTMLElement => document.querySelector<HTMLElement>(`#tours .tour[data-dossier="${dossier}"]`)!;

/** Touche l'écrou ⚙ en haut à droite : d'un panneau à l'autre. */
async function basculer(): Promise<void> {
	await act(async () => toucher(screen.getByRole('button', { name: 'Réglages' })));
}

// En premier dans le fichier : la mallette ne s'ouvre qu'au premier affichage du menu depuis le
// chargement de l'app (un état du module Menu.tsx).
test('la mallette s’ouvre au premier affichage du menu seulement ; chaque moitié range la moitié des tours', () => {
	render(<App />);
	expect(document.querySelector('#tours')).toHaveAttribute('data-ouverture');
	// Le couvercle, ses deux faces, les fermoirs, la poignée, les étincelles de l'ouverture.
	expect(document.querySelector('#tours .valise-couvercle .valise-dehors .valise-etoile')).toBeInTheDocument();
	expect(document.querySelectorAll('#tours .valise-fermoir')).toHaveLength(2);
	expect(document.querySelector('#tours .valise-poignee')).toBeInTheDocument();
	expect(document.querySelectorAll('#tours .valise-etincelle')).toHaveLength(3);
	// La première moitié des tours dans la caisse, l'autre dans le couvercle ; tous, dans l'ordre.
	const caisse = [...document.querySelectorAll<HTMLElement>('#tours .valise-caisse .tour')].map((t) => t.dataset.dossier);
	const couvercle = [...document.querySelectorAll<HTMLElement>('#tours .valise-couvercle .tour')].map((t) => t.dataset.dossier);
	expect(caisse).toHaveLength(Math.ceil(TOURS.length / 2));
	expect(couvercle).toHaveLength(Math.floor(TOURS.length / 2));
	expect([...caisse, ...couvercle]).toStrictEqual(dossiersAffiches());
	cleanup();

	// Affiché de nouveau (de retour d'un tour) : déjà ouverte, sans étincelles.
	render(<App />);
	expect(document.querySelector('#tours')).not.toHaveAttribute('data-ouverture');
	expect(document.querySelector('#tours .valise-etincelle')).toBeNull();
});

test('une tuile par tour, avec son nom, qui lance le tour ; ni réglages ni langue sur ce panneau', () => {
	render(<App />);
	expect([...dossiersAffiches()].sort()).toStrictEqual(TOURS.map((tour) => tour.dossier).sort());
	for (const tour of TOURS) {
		expect(within(tuile(tour.dossier)).getByRole('button', { name: tour.nom.fr })).toHaveClass('tour-lancer');
	}
	expect(document.querySelector('.tour-reglages')).toBeNull();
	expect(document.querySelector('#reglages-generaux-btn')).toBeNull();
	// Aucun favori, aucune étoile : les deux moitiés de la mallette, par date de publication.
	expect(document.querySelectorAll('#tours .grille')).toHaveLength(2);
	expect(document.querySelector('#tours .favori')).toBeNull();
	expect(dossiersAffiches().slice(0, 5)).toStrictEqual(['boule-de-cristal', 'pile-ou-face', 'six-predictions', 'analyseur-q', 'carte-de-visite']);
	expect(screen.getByRole('button', { name: 'Réglages' })).toHaveAttribute('aria-pressed', 'false');
});

test('l’écrou ⚙ en haut à droite ouvre les réglages : la ligne générale, puis une tuile de réglages par tour', async () => {
	render(<App />);
	await basculer();
	expect(window.location.hash).toBe('#/reglages');
	expect(screen.getByRole('button', { name: 'Réglages' })).toHaveAttribute('aria-pressed', 'true');
	// La ligne des réglages généraux, au-dessus des tuiles.
	expect(screen.getByRole('button', { name: /^Réglages généraux/ })).toBeInTheDocument();
	expect(screen.queryByRole('radio', { name: 'FR' })).toBeNull();
	for (const tour of TOURS) {
		expect(within(tuile(tour.dossier)).getByRole('button', { name: `Réglages : ${tour.nom.fr}` })).toBeInTheDocument();
	}
	expect(document.querySelector('.tour-lancer')).toBeNull();

	// L'écrou, de nouveau : retour aux tours.
	await basculer();
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
	expect(window.location.hash).toBe('');
	// Et de nouveau les réglages : le menu, gardé d'un panneau à l'autre, répond encore.
	await basculer();
	expect(window.location.hash).toBe('#/reglages');
});

test('le geste retour referme les réglages ; l’écrou les rouvre ensuite', async () => {
	render(<App />);
	await basculer();
	expect(window.location.hash).toBe('#/reglages');
	await act(async () => {
		history.back();
		await new Promise((fin) => setTimeout(fin, 50));
	});
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
	await basculer();
	expect(window.location.hash).toBe('#/reglages');
});

test('ouvert à son adresse, le panneau des réglages se ferme par Échap, vers les tours', async () => {
	window.location.hash = '#/reglages';
	render(<App />);
	expect(screen.getByRole('button', { name: /^Réglages généraux/ })).toBeInTheDocument();
	act(() => {
		fireEvent.keyDown(document, { key: 'Escape' });
	});
	expect(window.location.hash).toBe('#/');
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

/** Ouvre les réglages généraux depuis le menu : l'écrou ⚙, puis leur ligne. */
async function ouvrirReglagesGeneraux(): Promise<void> {
	render(<App />);
	await basculer();
	await act(async () => toucher(screen.getByRole('button', { name: /^Réglages généraux/ })));
	expect(window.location.hash).toBe('#/reglages-generaux');
	expect(await screen.findByRole('heading', { level: 1, name: 'Réglages généraux' })).toBeInTheDocument();
}

/** Ferme la page par sa croix, et attend la page d'avant. */
async function fermer(): Promise<void> {
	await act(async () => {
		toucher(screen.getByRole('button', { name: /^(Fermer|Close)$/ }));
		await new Promise((fin) => setTimeout(fin, 50));
	});
}

test('FR / EN, dans les réglages généraux : le menu change de langue, et s’en souvient', async () => {
	await ouvrirReglagesGeneraux();
	expect(screen.getByRole('radio', { name: 'FR' })).toHaveAttribute('aria-checked', 'true');
	fireEvent.click(screen.getByRole('radio', { name: 'EN' }));
	expect(screen.getByRole('heading', { level: 1, name: 'General settings' })).toBeInTheDocument();
	expect(document.documentElement.lang).toBe('en');
	await fermer();
	expect(await screen.findByRole('heading', { level: 2, name: 'Settings' })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: `Settings: ${TOURS[0]!.nom.en}` })).toBeInTheDocument();
	cleanup();

	render(<App />);
	expect(document.documentElement.lang).toBe('en');
});

test('l’ordre des tours : par date de publication, ou alphabétique, gardé d’une ouverture à l’autre', async () => {
	await ouvrirReglagesGeneraux();
	expect(screen.getByRole('radio', { name: 'Par date de publication' })).toHaveAttribute('aria-checked', 'true');
	fireEvent.click(screen.getByRole('radio', { name: 'Par ordre alphabétique' }));
	await fermer();
	await basculer();
	const noms = TOURS.map((tour) => tour.nom.fr).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
	expect(dossiersAffiches().map((d) => TOURS.find((t) => t.dossier === d)!.nom.fr)).toStrictEqual(noms);
	expect(dossiersAffiches()[0]).toBe('analyseur-q');
});

test('les favoris : touchés dans les réglages généraux, en tête du menu, puis les autres tours', async () => {
	await ouvrirReglagesGeneraux();
	const favori = (nom: string) => within(document.querySelector<HTMLElement>('#favoris')!).getByRole('switch', { name: nom });
	expect(favori('Morpion')).toHaveAttribute('aria-checked', 'false');
	fireEvent.click(favori('Morpion'));
	fireEvent.click(favori('Pile ou face'));
	expect(favori('Morpion')).toHaveAttribute('aria-checked', 'true');
	// Touché une seconde fois : retiré.
	fireEvent.click(favori('Princesse'));
	fireEvent.click(favori('Princesse'));
	expect(favori('Princesse')).toHaveAttribute('aria-checked', 'false');
	expect(JSON.parse(localStorage.getItem('mes-tours:favoris')!)).toStrictEqual(['morpion', 'pile-ou-face']);
	await fermer();
	await basculer();
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();

	// Les favoris d'abord (dans l'ordre choisi : par date de publication), une étoile dans leur coin,
	// puis les autres ; l'étoile ne change pas le nom de la tuile.
	const favoris = [...document.querySelectorAll<HTMLElement>('#tours .tour[data-favori]')].map((t) => t.dataset.dossier);
	expect(favoris).toStrictEqual(['pile-ou-face', 'morpion']);
	expect(dossiersAffiches().slice(0, 2)).toStrictEqual(['pile-ou-face', 'morpion']);
	expect(dossiersAffiches()).toHaveLength(TOURS.length);
	expect(dossiersAffiches().slice(2)).not.toContain('morpion');
	expect(within(tuile('morpion')).getByRole('button', { name: 'Morpion' })).toContainElement(tuile('morpion').querySelector('.favori'));
	expect(within(tuile('boule-de-cristal')).getByRole('button', { name: 'Boule de cristal' }).querySelector('.favori')).toBeNull();
});

test('l’apparence : automatique par défaut, puis claire ou sombre au choix, gardée', async () => {
	await ouvrirReglagesGeneraux();
	// jsdom ne dit pas le mode du téléphone : automatique, le menu reste sombre, son allure d'origine.
	expect(screen.getByRole('radio', { name: 'Automatique' })).toHaveAttribute('aria-checked', 'true');
	expect(document.documentElement.dataset.theme).toBe('sombre');
	fireEvent.click(screen.getByRole('radio', { name: 'Clair' }));
	expect(document.documentElement.dataset.theme).toBe('clair');
	expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute('content') ?? 'light').toBe('light');
	expect(JSON.parse(localStorage.getItem('mes-tours:apparence')!)).toBe('clair');
	cleanup();

	render(<App />);
	expect(document.documentElement.dataset.theme).toBe('clair');
});

test('automatique, l’apparence suit le téléphone, même quand il change', async () => {
	let sombre = false;
	const ecouteurs = new Set<() => void>();
	window.matchMedia = ((requete: string) => ({
		get matches() { return requete.includes('dark') ? sombre : requete.includes('light') ? !sombre : false; },
		addEventListener: (_: string, f: () => void) => ecouteurs.add(f),
		removeEventListener: (_: string, f: () => void) => ecouteurs.delete(f),
	})) as unknown as typeof window.matchMedia;
	try {
		render(<App />);
		expect(document.documentElement.dataset.theme).toBe('clair');
		sombre = true;
		act(() => ecouteurs.forEach((f) => f()));
		expect(document.documentElement.dataset.theme).toBe('sombre');
	} finally {
		delete (window as { matchMedia?: unknown }).matchMedia;
	}
});

test('des favoris abîmés ou inconnus sont ignorés', () => {
	localStorage.setItem('mes-tours:favoris', '["tour-secret","morpion","morpion"]');
	localStorage.setItem('mes-tours:tri', '"au-hasard"');
	render(<App />);
	expect([...document.querySelectorAll<HTMLElement>('#tours .tour[data-favori]')].map((t) => t.dataset.dossier)).toStrictEqual(['morpion']);
	expect(dossiersAffiches()[1]).toBe('boule-de-cristal');
});

test('un appui long sur une tuile agit au lever du doigt, sans attendre de clic', async () => {
	render(<App />);
	const tuile = document.querySelector<HTMLElement>('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer')!;
	await act(async () => toucher(tuile));
	expect(window.location.hash).toBe('#/tours/pile-ou-face');
});

test('dans le panneau des réglages, une tuile ouvre seulement les réglages du tour', async () => {
	window.location.hash = '#/reglages';
	render(<App />);
	await act(async () => {
		fireEvent.click(screen.getByRole('button', { name: 'Réglages : Pile ou face' }));
	});
	expect(window.location.hash).toBe('#/tours/pile-ou-face?reglages');
});

test('un doigt qui ne s’est pas posé sur le bouton ne déclenche rien, même suivi d’un clic', () => {
	render(<App />);
	const tuile = document.querySelector<HTMLElement>('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer')!;
	// Le clic qu'envoie le navigateur après le doigt de l'appui de 3 s, relevé sur le menu.
	fireEvent.click(tuile, { detail: 1 });
	expect(window.location.hash).toBe('');
});

test('le bouton du journal des versions ouvre le journal ; la croix ramène aux réglages généraux', async () => {
	await ouvrirReglagesGeneraux();
	expect(document.querySelector('#version')).toHaveTextContent(`Version ${APP_VERSION}`);
	toucher(screen.getByRole('button', { name: 'Journal des versions' }));
	expect(window.location.hash).toBe('#/journal');
	expect(await screen.findByRole('heading', { level: 1, name: 'Journal des versions' })).toBeInTheDocument();
	// Les versions, la plus récente d'abord ; la version de l'app est dedans.
	await screen.findByText('0.1.0');
	expect(document.querySelector(`#journal .version[data-version="${APP_VERSION}"]`)).not.toBeNull();
	expect(document.querySelectorAll('#journal .version').length).toBeGreaterThan(20);
	expect(document.querySelector('#journal strong')).not.toBeNull();
	await act(async () => {
		toucher(screen.getByRole('button', { name: 'Fermer' }));
		await new Promise((fin) => setTimeout(fin, 50));
	});
	expect(await screen.findByRole('heading', { level: 1, name: 'Réglages généraux' })).toBeInTheDocument();
});

test('en anglais, le journal dit qu’il est écrit en français ; Échap le ferme', async () => {
	localStorage.setItem('mes-tours:langue', '"en"');
	window.location.hash = '#/journal';
	render(<App />);
	expect(await screen.findByRole('heading', { level: 1, name: 'Release notes' })).toBeInTheDocument();
	expect(screen.getByText('The release notes are written in French.')).toBeInTheDocument();
	act(() => {
		fireEvent.keyDown(document, { key: 'Escape' });
	});
	expect(await screen.findByText('Pick a trick')).toBeInTheDocument();
});
