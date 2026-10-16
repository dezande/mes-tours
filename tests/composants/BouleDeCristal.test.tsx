// La boule de cristal dans l'app (src/tours/boule-de-cristal/), et avec elle tout ce qu'un tour à
// zones partage (src/components/zones/, src/hooks/usePhasesZones.ts) : les trois bandes, les
// phases d'une routine, le double tap, l'appui de 3 s, le clavier, les réglages et le test des zones.
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';
import { DEFAULTS } from '../../src/tours/boule-de-cristal/logic/settings.ts';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

afterEach(() => {
	jest.useRealTimers();
});

/** La taille donnée à la scène : jsdom ne mesure rien, et les zones ont besoin d'une taille. */
const SCENE = { largeur: 400, hauteur: 600 };
/** Un point au milieu de chaque bande, de haut en bas. */
const BANDES = [100, 300, 500] as const;
/** Pause maximale entre les deux taps d'un double tap (src/logic/gestes-zones.ts). */
const DOUBLE_TAP_GAP = 700;

/** Ouvre le tour à son adresse, attend qu'il soit chargé, puis passe aux minuteries simulées. */
async function ouvrir(adresse: string): Promise<HTMLElement> {
	window.location.hash = adresse;
	render(<App />);
	// Le tour est chargé à sa première ouverture (src/tours/registre.ts).
	await waitFor(() => expect(document.querySelector('#altar')).not.toBeNull());
	const stage = document.querySelector<HTMLElement>('#stage')!;
	Object.defineProperties(stage, { clientWidth: { value: SCENE.largeur, configurable: true }, clientHeight: { value: SCENE.hauteur, configurable: true } });
	// Preact branche les écouteurs (clavier…) après l'affichage : on laisse passer un instant.
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
	// Le délai d'apparition, le fondu et l'appui de 3 s passent sans attendre.
	jest.useFakeTimers();
	return stage;
}

const stage = (): HTMLElement => document.querySelector<HTMLElement>('#stage')!;
const autel = (): HTMLElement => document.querySelector<HTMLElement>('#altar')!;
const nombre = (): HTMLElement => document.querySelector<HTMLElement>('#number')!;
const texteDuNombre = (): string => document.querySelector('#number-text')!.textContent ?? '';

/** Un événement du doigt : jsdom n'a pas de PointerEvent, il est fait d'un MouseEvent. */
function doigt(type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x: number, y: number, id = 1): void {
	const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
	Object.defineProperties(event, { pointerId: { value: id }, pointerType: { value: 'touch' } });
	act(() => {
		stage().dispatchEvent(event);
	});
}

/** Un toucher bref au point (x, y). */
function toucher(x: number, y: number): void {
	doigt('pointerdown', x, y);
	doigt('pointerup', x, y);
}

const attendre = (ms: number): void => {
	act(() => {
		jest.advanceTimersByTime(ms);
	});
};

const touche = (key: string): void => {
	act(() => {
		fireEvent.keyDown(document, { key });
	});
};

/** Arme la bande `bande` (0 : haut) et attend que son nombre soit affiché. */
function montrer(bande: 0 | 1 | 2): void {
	toucher(200, BANDES[bande]);
	attendre(DEFAULTS.delay * 1000);
	expect(autel()).toHaveClass('revealed');
}

test('au repos : la boule vide, rien d’armé, la jauge cachée', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	expect(autel()).not.toHaveClass('stirring');
	expect(autel()).not.toHaveClass('revealed');
	expect(nombre()).not.toHaveClass('shown');
	expect(texteDuNombre()).toBe('');
	expect(document.querySelector('#hold-ring')).toHaveAttribute('hidden');
	// Le fondu réglé est passé aux transitions, la luminosité au voile.
	expect(stage().style.getPropertyValue('--fade')).toBe(`${DEFAULTS.fade}s`);
	expect(document.querySelector<HTMLElement>('#dim')!.style.getPropertyValue('--dim')).toBe('0');
	// Ni réglages ni test des zones.
	expect(document.querySelector('#settings')).toBeNull();
	expect(document.querySelector('#zones')).toBeNull();
});

test('une bande touchée arme son nombre : la brume s’agite, puis le nombre apparaît après le délai réglé', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	toucher(200, BANDES[1]);
	expect(autel()).toHaveClass('stirring');
	expect(texteDuNombre()).toBe('16');
	expect(nombre()).not.toHaveClass('shown');
	attendre(DEFAULTS.delay * 1000 - 50);
	expect(autel()).toHaveClass('stirring');
	attendre(50);
	expect(autel()).not.toHaveClass('stirring');
	expect(autel()).toHaveClass('revealed');
	expect(nombre()).toHaveClass('shown');
	expect(texteDuNombre()).toBe('16');
});

test('chaque bande a son nombre : 6 en haut, 16 au milieu, 26 en bas, où que l’on touche en largeur', async () => {
	for (const [bande, valeur] of [[0, '6'], [1, '16'], [2, '26']] as const) {
		localStorage.setItem('voyante:settings:v1', JSON.stringify({ delay: 0 }));
		await ouvrir('#/tours/boule-de-cristal');
		toucher(bande === 1 ? 10 : 390, BANDES[bande]);
		expect(texteDuNombre(), `bande ${bande}`).toBe(valeur);
		attendre(0);
		expect(autel()).toHaveClass('revealed');
		jest.useRealTimers();
		// Chaque tour ouvert à neuf.
		cleanup();
	}
});

test('armé ou affiché, l’écran est verrouillé : un autre toucher ne change rien', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	toucher(200, BANDES[0]);
	expect(texteDuNombre()).toBe('6');
	// Armé : la bande du bas n'arme pas 26.
	toucher(200, BANDES[2]);
	expect(texteDuNombre()).toBe('6');
	expect(autel()).toHaveClass('stirring');
	attendre(DEFAULTS.delay * 1000);
	expect(autel()).toHaveClass('revealed');
	// Affiché : un toucher seul ne fait rien non plus, le nombre reste.
	toucher(200, BANDES[2]);
	attendre(DOUBLE_TAP_GAP + 100);
	expect(texteDuNombre()).toBe('6');
	expect(autel()).toHaveClass('revealed');
});

test('un double tap efface le nombre, et la boule se réarme une fois le fondu fini, sans quitter le tour', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	montrer(0);
	toucher(50, 550);
	attendre(150);
	toucher(60, 540);
	// Le nombre s'efface ; il reste écrit le temps de disparaître.
	expect(autel()).not.toHaveClass('revealed');
	expect(nombre()).not.toHaveClass('shown');
	expect(texteDuNombre()).toBe('6');
	// Pendant la disparition, l'écran est encore verrouillé.
	toucher(200, BANDES[2]);
	expect(texteDuNombre()).toBe('6');
	attendre(DEFAULTS.fade * 1000 + 150);
	// Réarmée : une nouvelle routine, sur place.
	toucher(200, BANDES[2]);
	expect(autel()).toHaveClass('stirring');
	expect(texteDuNombre()).toBe('26');
	expect(window.location.hash).toBe('#/tours/boule-de-cristal');
});

test('deux taps rapprochés au repos arment le nombre sans l’effacer : le tap qui arme ne compte pas pour un double', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	toucher(200, BANDES[1]);
	attendre(150);
	toucher(200, BANDES[1]);
	expect(autel()).toHaveClass('stirring');
	expect(texteDuNombre()).toBe('16');
	// Et deux taps trop espacés, le nombre affiché, ne l'effacent pas.
	attendre(DEFAULTS.delay * 1000);
	toucher(200, 300);
	attendre(DOUBLE_TAP_GAP + 100);
	toucher(200, 300);
	expect(autel()).toHaveClass('revealed');
});

test('R efface le nombre armé ou affiché ; au repos, R ne fait rien', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	touche('r');
	expect(autel()).not.toHaveClass('stirring');
	montrer(2);
	touche('R');
	expect(autel()).not.toHaveClass('revealed');
	attendre(DEFAULTS.fade * 1000 + 150);
	toucher(200, BANDES[0]);
	expect(texteDuNombre()).toBe('6');
});

test('Échap et M ramènent au menu principal', async () => {
	for (const key of ['Escape', 'm']) {
		await ouvrir('#/tours/boule-de-cristal');
		jest.useRealTimers();
		touche(key);
		expect(await screen.findByText('Choisis un tour'), key).toBeInTheDocument();
		cleanup();
	}
});

test('l’appui de 3 s n’importe où ramène au menu, la jauge affichée après la durée d’un tap', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	doigt('pointerdown', 200, BANDES[2]);
	const jauge = document.querySelector<HTMLElement>('#hold-ring')!;
	expect(jauge).toHaveClass('run');
	expect(jauge.style.left).toBe('200px');
	expect(jauge.style.top).toBe('500px');
	expect(jauge.style.getPropertyValue('--ring-delay')).toBe('500ms');
	expect(jauge.style.getPropertyValue('--ring-duration')).toBe('2500ms');
	attendre(2900);
	expect(document.querySelector('#altar')).not.toBeNull();
	attendre(100);
	jest.useRealTimers();
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('un doigt qui glisse, ou qui se lève avant 3 s, abandonne l’appui long', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	doigt('pointerdown', 200, 300);
	doigt('pointermove', 260, 300);
	expect(document.querySelector('#hold-ring')).toHaveAttribute('hidden');
	attendre(3100);
	expect(document.querySelector('#altar')).not.toBeNull();
	doigt('pointerup', 260, 300);
	doigt('pointerdown', 200, 300);
	attendre(1000);
	doigt('pointerup', 200, 300);
	attendre(2100);
	expect(document.querySelector('#altar')).not.toBeNull();
});

test('la jauge masquée dans les réglages : rien n’apparaît pendant l’appui, qui ramène quand même au menu', async () => {
	localStorage.setItem('voyante:settings:v1', JSON.stringify({ showHoldRing: false }));
	await ouvrir('#/tours/boule-de-cristal');
	doigt('pointerdown', 200, 300);
	expect(document.querySelector('#hold-ring')).toHaveAttribute('hidden');
	attendre(3000);
	jest.useRealTimers();
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('un second doigt annule le geste : rien ne s’arme, l’appui long est abandonné', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	doigt('pointerdown', 200, BANDES[0], 1);
	expect(texteDuNombre()).toBe('6');
	// Deux doigts posés : l'appui long du premier n'aboutira pas.
	doigt('pointerdown', 200, BANDES[2], 2);
	expect(document.querySelector('#hold-ring')).toHaveAttribute('hidden');
	attendre(3100);
	expect(document.querySelector('#altar')).not.toBeNull();
	doigt('pointerup', 200, BANDES[0], 1);
	doigt('pointerup', 200, BANDES[2], 2);
});

test('l’app passée en arrière-plan oublie le doigt posé : l’appui long ne ramène pas au menu plus tard', async () => {
	await ouvrir('#/tours/boule-de-cristal');
	doigt('pointerdown', 200, 300);
	act(() => {
		document.dispatchEvent(new Event('visibilitychange'));
	});
	attendre(3100);
	expect(document.querySelector('#altar')).not.toBeNull();
});

test('écrou ⚙ : le rappel de la routine, les trois curseurs et leur texte, le réglage gardé', async () => {
	await ouvrir('#/tours/boule-de-cristal?reglages');
	expect(document.querySelector('#settings')).not.toBeNull();
	expect(document.querySelector('.titre-reglages')).toHaveTextContent('Réglages');
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Boule de cristal');
	expect(document.querySelector('.row-label')).toHaveTextContent('3 boulettes 3 bandes horizontales');
	expect([...document.querySelectorAll('#routine-values .value-row')].map((ligne) => ligne.textContent)).toStrictEqual(['Haut6', 'Milieu16', 'Bas26']);
	expect(document.querySelector('#delay-out')).toHaveTextContent('3 s');
	expect(document.querySelector('#fade-out')).toHaveTextContent('1,5 s');
	expect(document.querySelector('#brightness-out')).toHaveTextContent('100 %');

	fireEvent.input(document.querySelector('#delay')!, { target: { value: '5' } });
	expect(document.querySelector('#delay-out')).toHaveTextContent('5 s');
	fireEvent.input(document.querySelector('#delay')!, { target: { value: '0' } });
	expect(document.querySelector('#delay-out')).toHaveTextContent('immédiat');
	fireEvent.input(document.querySelector('#brightness')!, { target: { value: '60' } });
	expect(document.querySelector('#brightness-out')).toHaveTextContent('60 %');
	expect(document.querySelector<HTMLElement>('#dim')!.style.getPropertyValue('--dim')).toBe('0.4');
	fireEvent.click(document.querySelector('#show-hold-ring')!);
	expect(JSON.parse(localStorage.getItem('voyante:settings:v1')!)).toStrictEqual({ delay: 0, fade: 1.5, brightness: 60, showHoldRing: false });

	fireEvent.click(screen.getByText('Rétablir les réglages par défaut'));
	expect(document.querySelector('#delay-out')).toHaveTextContent('3 s');
	expect(document.querySelector('#show-hold-ring')).toBeChecked();
	expect(JSON.parse(localStorage.getItem('voyante:settings:v1')!)).toStrictEqual(DEFAULTS);
});

test('écrou ⚙ : les réglages lus sur l’appareil sont bornés ; la croix ramène au menu', async () => {
	localStorage.setItem('voyante:settings:v1', JSON.stringify({ delay: 99, fade: 'vite', brightness: 10 }));
	await ouvrir('#/tours/boule-de-cristal?reglages');
	expect(document.querySelector('#delay-out')).toHaveTextContent('10 s');
	expect(document.querySelector('#fade-out')).toHaveTextContent('1,5 s');
	expect(document.querySelector('#brightness-out')).toHaveTextContent('30 %');
	jest.useRealTimers();
	fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : réglages ouverts, seuls Échap et M agissent ; un toucher sur la scène n’arme rien', async () => {
	await ouvrir('#/tours/boule-de-cristal?reglages');
	touche('r');
	// La scène est sous les réglages : un toucher y arrive, mais rien ne doit changer de visible.
	expect(document.querySelector('#settings')).not.toBeNull();
	jest.useRealTimers();
	touche('Escape');
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('test des zones : les trois bandes dessinées avec leur nom et leur nombre, la phase dans la barre', async () => {
	await ouvrir('#/tours/boule-de-cristal?reglages');
	fireEvent.click(document.querySelector('#test-btn')!);
	expect(document.querySelector('#settings')).toBeNull();
	const zones = [...document.querySelectorAll<HTMLElement>('#zones .zone')];
	expect(zones).toHaveLength(3);
	expect(zones.map((zone) => zone.textContent)).toStrictEqual(['Haut →6', 'Milieu →16', 'Bas →26']);
	expect(zones.map((zone) => zone.style.top)).toStrictEqual(['0px', '200px', '400px']);
	expect(zones.map((zone) => zone.style.height)).toStrictEqual(['200px', '200px', '200px']);
	expect(zones.every((zone) => zone.style.width === '400px' && !zone.classList.contains('right'))).toBe(true);
	expect(document.querySelector('#test-state')).toHaveTextContent('Prêt');

	// La zone touchée clignote, la barre suit les phases.
	toucher(200, BANDES[1]);
	expect(document.querySelector('#zones .zone.hit')).toHaveTextContent('Milieu →16');
	expect(document.querySelector('#test-state')).toHaveTextContent('Armé · verrouillé');
	attendre(DEFAULTS.delay * 1000);
	expect(document.querySelector('#test-state')).toHaveTextContent('Affiché · verrouillé');
	// Les touches agissent : les réglages sont cachés derrière le test.
	touche('r');
	expect(document.querySelector('#test-state')).toHaveTextContent('Réarmement…');
	attendre(DEFAULTS.fade * 1000 + 150);
	expect(document.querySelector('#test-state')).toHaveTextContent('Prêt');

	// Une nouvelle taille de scène : les zones suivent.
	Object.defineProperties(stage(), { clientWidth: { value: 300, configurable: true }, clientHeight: { value: 900, configurable: true } });
	act(() => {
		window.dispatchEvent(new Event('resize'));
	});
	expect([...document.querySelectorAll<HTMLElement>('#zones .zone')].map((zone) => zone.style.top)).toStrictEqual(['0px', '300px', '600px']);
});

test('test des zones : « Réglages » y revient, le tour remis au repos ; « Quitter » ramène au menu', async () => {
	await ouvrir('#/tours/boule-de-cristal?reglages');
	fireEvent.click(document.querySelector('#test-btn')!);
	toucher(200, BANDES[0]);
	expect(document.querySelector('#test-state')).toHaveTextContent('Armé · verrouillé');
	fireEvent.click(document.querySelector('#test-back')!);
	expect(document.querySelector('#zones')).toBeNull();
	expect(document.querySelector('#settings')).not.toBeNull();
	// Au repos sans transition, puis les transitions reviennent.
	expect(autel()).not.toHaveClass('stirring');
	expect(autel()).not.toHaveClass('instant');
	// Le délai de l'ancien armement ne montre rien.
	attendre(DEFAULTS.delay * 1000);
	expect(autel()).not.toHaveClass('revealed');

	fireEvent.click(document.querySelector('#test-btn')!);
	expect(document.querySelector('#test-state')).toHaveTextContent('Prêt');
	jest.useRealTimers();
	fireEvent.click(document.querySelector('#test-quit')!);
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});
