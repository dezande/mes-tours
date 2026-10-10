// Trois questions dans l'app (src/tours/trois-questions/) : la galerie jouée au doigt, la révélation, les réglages.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { App } from '../../src/App.tsx';
import { CODES } from '../../src/tours/trois-questions/logic/codes.ts';
import { ecrireOrdre, ORDRE_RANGE } from '../../src/tours/trois-questions/logic/paquet.ts';

/**
 * jsdom ne met rien en page : la photo montrée mesure 300 × 400 à partir du bord de l'app (ses trois
 * colonnes : 0 à 100, 100 à 200, 200 à 300), et la carte du spectateur, à la révélation, 90 × 126, au milieu.
 */
const MESURES: Record<string, { left: number; top: number; width: number; height: number }> = {
	cliche: { left: 0, top: 0, width: 300, height: 400 },
	spectateur: { left: 105, top: 137, width: 90, height: 126 },
};
const mesure = (el: HTMLElement) => (el.id === 'spectateur' ? MESURES.spectateur : el.classList.contains('cliche') ? MESURES.cliche : null);
const proprietes = { offsetLeft: 'left', offsetTop: 'top', offsetWidth: 'width', offsetHeight: 'height' } as const;
const originales = Object.fromEntries(Object.keys(proprietes).map((p) => [p, Object.getOwnPropertyDescriptor(HTMLElement.prototype, p)!]));

beforeAll(() => {
	for (const [propriete, cote] of Object.entries(proprietes)) {
		Object.defineProperty(HTMLElement.prototype, propriete, {
			configurable: true,
			get(this: HTMLElement) {
				return mesure(this)?.[cote] ?? originales[propriete]!.get!.call(this);
			},
		});
	}
});

afterAll(() => {
	for (const [propriete, descripteur] of Object.entries(originales)) Object.defineProperty(HTMLElement.prototype, propriete, descripteur);
});

const vibrate = jest.fn(() => true);

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
	vibrate.mockClear();
	Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
	// Un ordre réglé, pour savoir quelle carte a quel code ; sans ordre, le paquet est mélangé (testé à part).
	localStorage.setItem(CLE, JSON.stringify({ ordre: ORDRE_RANGE }));
});

const CLE = 'trois-questions:settings:v1';

/** Ouvre le tour à son adresse, et attend qu'il soit chargé. */
async function ouvrir(adresse = '#/tours/trois-questions'): Promise<void> {
	window.location.hash = adresse;
	render(<App />);
	// Le tour est chargé à sa première ouverture (src/tours/registre.ts).
	await waitFor(() => expect(document.querySelector('#galerie, #menu')).not.toBeNull());
	// Preact branche les écouteurs (clavier…) après l'affichage : on laisse passer un instant.
	await act(() => new Promise((fin) => setTimeout(fin, 150)));
}

const stage = (): HTMLElement => document.getElementById('stage')!;
const photoMontree = (): string => document.getElementById('galerie')!.dataset.photo!;

/** Un événement du doigt : jsdom n'a pas de PointerEvent, il est fait d'un MouseEvent. */
function doigt(type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number): void {
	const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
	Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'touch' } });
	act(() => {
		stage().dispatchEvent(event);
	});
}

/** Un toucher bref au point (x, y). */
function toucher(x: number, y = 200): void {
	doigt('pointerdown', x, y);
	doigt('pointerup', x, y);
}

/** Un défilement d'un bout à l'autre de la photo : vers la gauche (photo suivante) ou vers la droite. */
function defiler(sens: 'gauche' | 'droite' = 'gauche'): void {
	const [de, a] = sens === 'gauche' ? [280, 40] : [40, 280];
	doigt('pointerdown', de, 200);
	doigt('pointermove', (de + a) / 2, 202);
	doigt('pointermove', a, 204);
	doigt('pointerup', a, 204);
}

/** Laisse passer le double toucher : le toucher d'une colonne est noté, le suivant est un toucher simple. */
const pause = () => act(() => new Promise((fin) => setTimeout(fin, 500)));

/** Touche une colonne, et attend qu'elle soit notée. */
async function colonne(x: number): Promise<void> {
	toucher(x);
	await pause();
}

/** Le double toucher, n'importe où : « aucune ». */
async function aucune(x = 150, y = 200): Promise<void> {
	toucher(x, y);
	toucher(x + 10, y + 10);
	await pause();
}

const spectateur = (): HTMLElement => document.getElementById('spectateur')!;

/** Les cartes de chaque colonne de la photo montrée. */
const colonnesMontrees = (): string[][] => [...document.querySelectorAll('.diapo[data-place="0"] .colonne')].map((c) => [...c.querySelectorAll<HTMLElement>('.carte')].map((carte) => carte.dataset.carte!));

/** La carte de ces réponses, dans l'ordre réglé (les cartes rangées). */
const carteDu = (code: string): string => ORDRE_RANGE[CODES.indexOf(code)]!;

test('une galerie de photos : trois colonnes de cartes (13, 14, 12), sans bouton ni texte', async () => {
	await ouvrir();
	expect(photoMontree()).toBe('question-0');
	expect(colonnesMontrees().map((c) => c.length)).toStrictEqual([13, 14, 12]);
	// Rien qui trahisse que l'écran note des réponses : ni bouton, ni texte hors des cartes.
	expect(stage().querySelectorAll('button, input, [role="button"]')).toHaveLength(0);
	const texteHorsCartes = [...stage().querySelectorAll('*')].filter((e) => !e.closest('.carte') && [...e.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim() !== ''));
	expect(texteHorsCartes).toHaveLength(0);
});

test('toucher une colonne la note (un instant après) et passe à la photo suivante ; défiler ne note rien ; le double toucher note « aucune »', async () => {
	await ouvrir();
	// Question 1 : la carte est en colonne 2. La photo attend, le temps de voir qu'aucun second toucher ne suit.
	toucher(150);
	expect(photoMontree()).toBe('question-0');
	await pause();
	expect(photoMontree()).toBe('question-1');
	// Question 2 : un défilement, la rafale des mêmes colonnes, rien de noté ; un second, rien de plus.
	const avant = colonnesMontrees();
	defiler();
	expect(photoMontree()).toBe('question-1-rafale');
	expect(colonnesMontrees()).toStrictEqual(avant);
	defiler();
	expect(photoMontree()).toBe('question-1-rafale');
	// … et un retour : toujours la question 2.
	defiler('droite');
	expect(photoMontree()).toBe('question-1');
	// Le double toucher, même sur une colonne : « aucune », et non la colonne.
	await aucune(50);
	expect(photoMontree()).toBe('question-2');
	// Question 3 : colonne 1. Les réponses 2, aucune, 1 : le code 201.
	await colonne(50);
	expect(photoMontree()).toBe('revelation');
	expect(spectateur().dataset.carte).toBe(carteDu('201'));
	expect(spectateur()).not.toHaveClass('retournee');
	expect(vibrate).not.toHaveBeenCalled();
});

test('la révélation : trois colonnes de 13, la carte du spectateur face en bas au milieu de la colonne du milieu', async () => {
	await ouvrir();
	await colonne(250);
	await colonne(50);
	await colonne(250);
	expect(photoMontree()).toBe('revelation');
	expect(colonnesMontrees().map((c) => c.length)).toStrictEqual([13, 13, 13]);
	expect(document.querySelectorAll('.diapo[data-place="0"] .colonne')[1]!.querySelectorAll('.carte')[6]).toBe(spectateur());
	expect(document.querySelectorAll('.diapo[data-place="0"] .carte.retournee')).toHaveLength(38);
	// En haut à gauche, sa valeur ; en bas à droite, sa famille.
	const [valeur, enseigne] = spectateur().dataset.carte!.split('-');
	const cartes = colonnesMontrees();
	expect(cartes[0]![0]!.split('-')[0]).toBe(valeur);
	expect(cartes[2]![12]!.split('-')[1]).toBe(enseigne);
});

test('la révélation : toucher la carte du spectateur la retourne ; le double toucher relance la routine', async () => {
	await ouvrir();
	// 3, 3, aucune : le Roi de trèfle, la dernière des cartes rangées.
	await colonne(250);
	await colonne(250);
	await aucune();
	expect(photoMontree()).toBe('revelation');
	expect(spectateur().dataset.carte).toBe('R-trefle');
	// La dernière photo est bloquée : défiler ne revient pas en arrière, même la carte face en bas.
	defiler('droite');
	defiler();
	expect(photoMontree()).toBe('revelation');
	// Toucher à côté de la carte : rien.
	toucher(20, 20);
	expect(spectateur()).not.toHaveClass('retournee');
	await pause();
	toucher(150, 200);
	expect(spectateur()).toHaveClass('retournee');
	expect(document.getElementById('annonce')).toHaveTextContent('Roi de trèfle');
	// Un défilement ne fait plus rien.
	defiler('droite');
	expect(photoMontree()).toBe('revelation');
	await pause();
	toucher(150, 200);
	toucher(150, 200);
	expect(photoMontree()).toBe('question-0');
	expect(window.location.hash).toBe('#/tours/trois-questions');
});

test('réglage : la carte qui ne se retourne pas reste face en bas ; le double toucher relance aussitôt', async () => {
	localStorage.setItem(CLE, JSON.stringify({ ordre: ORDRE_RANGE, retournable: false }));
	await ouvrir();
	await colonne(250);
	await colonne(250);
	await aucune();
	expect(photoMontree()).toBe('revelation');
	toucher(150, 200);
	await pause();
	expect(spectateur()).not.toHaveClass('retournee');
	act(() => {
		fireEvent.keyDown(document, { key: ' ' });
	});
	expect(spectateur()).not.toHaveClass('retournee');
	toucher(150, 200);
	toucher(150, 200);
	expect(photoMontree()).toBe('question-0');
});

test('un code écarté : la photo ne bouge pas, le téléphone vibre ; défiler vers la droite revient en arrière', async () => {
	await ouvrir();
	// 1, 2, 3 : le code 123 n'est celui d'aucune carte.
	await colonne(50);
	await colonne(150);
	await colonne(250);
	expect(photoMontree()).toBe('question-2');
	expect(vibrate).toHaveBeenCalledTimes(1);
	// Rien de visible : pas de révélation, la même photo, aucun texte.
	expect(document.getElementById('spectateur')).toBeNull();
	// En arrière, puis une autre réponse : 1, 3, 2.
	defiler('droite');
	expect(photoMontree()).toBe('question-1');
	await colonne(250);
	await colonne(150);
	expect(photoMontree()).toBe('revelation');
	expect(spectateur().dataset.carte).toBe(carteDu('132'));
});

test('la vibration se coupe dans les réglages', async () => {
	localStorage.setItem(CLE, JSON.stringify({ ordre: ORDRE_RANGE, vibration: false }));
	await ouvrir();
	// Aucune, colonne 1, puis aucune : le code 010 n'est celui d'aucune carte.
	await aucune();
	await colonne(50);
	await aucune();
	expect(photoMontree()).toBe('question-2');
	expect(vibrate).not.toHaveBeenCalled();
});

test('au clavier : 1 à 3 touchent une colonne, 0 répond « aucune », Espace retourne la carte, R relance', async () => {
	await ouvrir();
	for (const key of ['3', '0', '2', ' ']) act(() => {
		fireEvent.keyDown(document, { key });
	});
	expect(spectateur().dataset.carte).toBe(carteDu('302'));
	expect(spectateur()).toHaveClass('retournee');
	act(() => {
		fireEvent.keyDown(document, { key: 'r' });
	});
	expect(photoMontree()).toBe('question-0');
});

test('l’ordre du paquet réglé (un chapelet mémorisé) donne les cartes', async () => {
	// L'ordre à l'envers : le Roi de trèfle en tête, au plus petit code (001).
	const ordre = [...ORDRE_RANGE].reverse();
	localStorage.setItem(CLE, JSON.stringify({ ordre }));
	await ouvrir();
	for (const key of ['0', '0', '1']) act(() => {
		fireEvent.keyDown(document, { key });
	});
	expect(spectateur().dataset.carte).toBe('R-trefle');
	// En haut à gauche un Roi, en bas à droite un trèfle.
	const cartes = colonnesMontrees();
	expect(cartes[0]![0]).toMatch(/^R-/);
	expect(cartes[2]![12]).toMatch(/-trefle$/);
});

test('sans ordre réglé, le paquet est mélangé à chaque routine, et la carte suivie est bien retrouvée', async () => {
	localStorage.removeItem(CLE);
	await ouvrir();
	const premieres = colonnesMontrees();
	// La carte suivie : la première de la colonne 2. À chaque photo, sa colonne (1 à 3), ou 0 : « aucune ».
	const suivie = premieres[1]![0]!;
	for (let question = 0; question < 3; question++) {
		const colonne = colonnesMontrees().findIndex((cartes) => cartes.includes(suivie)) + 1;
		act(() => {
			fireEvent.keyDown(document, { key: String(colonne) });
		});
	}
	expect(photoMontree()).toBe('revelation');
	expect(spectateur().dataset.carte).toBe(suivie);
	// Une nouvelle routine : un autre mélange.
	act(() => {
		fireEvent.keyDown(document, { key: 'r' });
	});
	expect(colonnesMontrees()).not.toStrictEqual(premieres);
});

test('réglages : vide, le paquet est mélangé ; un ordre écrit en abrégé n’est enregistré que complet et juste', async () => {
	localStorage.removeItem(CLE);
	await ouvrir('#/tours/trois-questions?reglages');
	const champ = screen.getByLabelText('Ordre du paquet') as HTMLTextAreaElement;
	expect(champ.value).toBe('');
	expect(document.getElementById('ordre-etat')).toHaveTextContent('mélangé');
	// Une carte en double : les fautes sont dites, rien n'est enregistré.
	fireEvent.input(champ, { target: { value: ecrireOrdre(ORDRE_RANGE, 'fr').replace('AP', '2P') } });
	expect(document.getElementById('ordre-etat')).toHaveTextContent('En double : 2P');
	expect(document.getElementById('ordre-etat')).toHaveTextContent('Manquantes : AP');
	expect(localStorage.getItem(CLE)).toBeNull();
	// L'ordre à l'envers, juste : enregistré.
	const envers = [...ORDRE_RANGE].reverse();
	fireEvent.input(champ, { target: { value: ecrireOrdre(envers, 'fr') } });
	expect(document.getElementById('ordre-etat')).toHaveTextContent('52 cartes');
	expect(JSON.parse(localStorage.getItem(CLE)!).ordre).toStrictEqual(envers);
	// De nouveau mélangé à chaque routine, d'un bouton.
	fireEvent.click(screen.getByText('Mélanger à chaque routine'));
	expect(JSON.parse(localStorage.getItem(CLE)!).ordre).toBeNull();
	expect(champ.value).toBe('');
});
