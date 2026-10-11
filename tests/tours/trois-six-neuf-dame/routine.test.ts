// La routine de Trois, six, neuf, Dame : le premier toucher choisit la carte, les autres sont
// blanches, ou « À 1 carte près » quand l'As est retourné après.
import { aPres, AS, carteAuHasard, DEPART, estRetournee, faceDe, NOMBRE, toucher, VALEURS, type Etat } from '../../../src/tours/trois-six-neuf-dame/logic/routine.ts';
import { COULEURS } from '../../../src/tours/cinq-cartes/logic/routine.ts';

const jouer = (...touchers: [number, (typeof COULEURS)[number]?][]): Etat => touchers.reduce<Etat>((etat, [i, coin]) => toucher(etat, i, coin), DEPART);
const RANGS = [0, 1, 2, 3, 4];

test('cinq cartes : l’As, un 3, un 6, un 9 et une Dame ; l’As au premier rang', () => {
	expect(NOMBRE).toBe(5);
	expect(VALEURS).toStrictEqual([1, 3, 6, 9, 12]);
	expect(AS).toBe(0);
});

test('au départ, cinq dos, rien d’écrit', () => {
	for (const i of RANGS) {
		expect(estRetournee(DEPART, i)).toBe(false);
		expect(faceDe(DEPART, i)).toBeNull();
		expect(aPres(DEPART, i)).toBe(false);
	}
});

test('la carte touchée donne la valeur, le coin touché la famille : les vingt cartes', () => {
	for (const i of RANGS) {
		for (const couleur of COULEURS) {
			const etat = toucher(DEPART, i, couleur);
			expect(estRetournee(etat, i)).toBe(true);
			expect(faceDe(etat, i)).toStrictEqual({ valeur: VALEURS[i], couleur });
			for (const j of RANGS) if (j !== i) expect(estRetournee(etat, j)).toBe(false);
		}
	}
});

test('sans coin (ou hors de la rangée), le premier toucher ne compte pas', () => {
	expect(toucher(DEPART, 2)).toBe(DEPART);
	expect(toucher(DEPART, 2, null)).toBe(DEPART);
	expect(toucher(DEPART, 5, 'pique')).toBe(DEPART);
	expect(toucher(DEPART, -1, 'pique')).toBe(DEPART);
	expect(toucher(DEPART, 1.5, 'pique')).toBe(DEPART);
});

test('ensuite chaque carte touchée se retourne, blanche ; la toucher encore ne change rien avant la fin', () => {
	const etat = jouer([4, 'coeur'], [1, 'trefle']);
	expect(estRetournee(etat, 1)).toBe(true);
	expect(faceDe(etat, 1)).toBeNull();
	expect(aPres(etat, 1)).toBe(false);
	expect(faceDe(etat, 4)).toStrictEqual({ valeur: 12, couleur: 'coeur' });
	expect(toucher(etat, 1, 'pique')).toBe(etat);
	expect(toucher(etat, 4)).toBe(etat);
});

test('l’As retourné après une autre carte : « À 1 carte près » sur toutes les autres, l’As compris', () => {
	// Le 3 de cœur, une carte blanche, puis l'As.
	const avant = jouer([1, 'coeur'], [3]);
	expect(aPres(avant, 3)).toBe(false);
	const etat = toucher(avant, AS);
	expect(faceDe(etat, 1)).toStrictEqual({ valeur: 3, couleur: 'coeur' });
	expect(aPres(etat, 1)).toBe(false);
	// Retournées ou non, les autres portent « À 1 carte près », sans face, l'As compris.
	for (const i of [AS, 2, 3, 4]) {
		expect(aPres(etat, i)).toBe(true);
		expect(faceDe(etat, i)).toBeNull();
	}
	// Et elles le gardent jusqu'à la fin, dans un sens ou dans l'autre.
	const fin = jouer([1, 'coeur'], [3], [0], [2], [4], [2], [2]);
	expect([0, 1, 2, 3, 4].every((i) => estRetournee(fin, i))).toBe(true);
	expect([0, 2, 3, 4].every((i) => aPres(fin, i))).toBe(true);
});

test('l’As choisi lui-même : la carte du spectateur, les autres restent blanches', () => {
	const etat = jouer([AS, 'trefle'], [1], [2], [3], [4]);
	expect(faceDe(etat, AS)).toStrictEqual({ valeur: 1, couleur: 'trefle' });
	for (const i of [1, 2, 3, 4]) {
		expect(faceDe(etat, i)).toBeNull();
		expect(aPres(etat, i)).toBe(false);
	}
});

test('les cinq retournées, chaque toucher retourne la carte dans un sens ou dans l’autre, qui garde sa face', () => {
	let etat = jouer([2, 'carreau'], [0], [1], [3], [4]);
	expect(RANGS.every((i) => estRetournee(etat, i))).toBe(true);
	etat = toucher(etat, 2);
	expect(estRetournee(etat, 2)).toBe(false);
	etat = toucher(etat, 2);
	expect(estRetournee(etat, 2)).toBe(true);
	expect(faceDe(etat, 2)).toStrictEqual({ valeur: 6, couleur: 'carreau' });
});

test('le mode entraînement tire l’une des vingt cartes', () => {
	expect(carteAuHasard(() => 0)).toStrictEqual({ valeur: 1, couleur: 'pique' });
	expect(carteAuHasard(() => .999999)).toStrictEqual({ valeur: 12, couleur: 'carreau' });
	for (let n = 0; n < 50; n++) expect(VALEURS).toContain(carteAuHasard().valeur);
});
