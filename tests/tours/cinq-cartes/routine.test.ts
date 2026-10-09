// La routine : chaque carte touchée se retourne aussitôt ; le codage des quatre premières cartes et
// du coin de la cinquième, puis la révélation.
import { carteAuHasard, DEPART, estJoker, estRetournee, faceDe, JOKER, memeCarte, poids, toucher, toutesRetournees, valeurDeLaSomme, type Couleur, type Etat } from '../../../src/tours/cinq-cartes/logic/routine.ts';

/** Touche les cartes `indexes` pendant le codage, puis la cinquième dans le coin de `couleur`. */
const coder = (indexes: number[], couleur: Couleur): Etat =>
	toucher(indexes.reduce((etat, i) => toucher(etat, i), DEPART), 4, couleur);

/** Retourne les cartes dans l'ordre donné. */
const retourner = (etat: Etat, ordre: number[]): Etat => ordre.reduce((e, i) => toucher(e, i), etat);

const faceEnLAir = (etat: Etat): number[] => [0, 1, 2, 3, 4].filter((i) => estRetournee(etat, i));

test('les quatre premières cartes valent 1, 2, 4 et 8 ; la cinquième ne vaut rien', () => {
	expect([0, 1, 2, 3, 4].map(poids)).toStrictEqual([1, 2, 4, 8, 0]);
});

test('chaque valeur de l’As au Roi se code', () => {
	for (let valeur = 1; valeur <= 13; valeur++) {
		const cartes = [0, 1, 2, 3].filter((i) => valeur & (2 ** i));
		const etat = coder(cartes, 'pique');
		expect(etat.phase === 'revelation' && etat.carte.valeur, `valeur ${valeur}`).toBe(valeur);
	}
});

test('le coin de la cinquième carte donne la couleur', () => {
	for (const couleur of ['pique', 'coeur', 'trefle', 'carreau'] as const) {
		const etat = coder([2, 3], couleur);
		expect(etat.phase === 'revelation' && etat.carte).toStrictEqual({ valeur: 12, couleur });
	}
});

test('dès le premier toucher, la carte touchée se retourne, blanche', () => {
	const etat = toucher(DEPART, 2);
	expect(faceEnLAir(etat)).toStrictEqual([2]);
	expect(faceDe(etat, 2)).toBeNull();
	// La cinquième se retourne aussi, et termine le codage.
	const codee = toucher(etat, 4, 'coeur');
	expect(faceEnLAir(codee)).toStrictEqual([2, 4]);
	expect(faceDe(codee, 4)).toBeNull();
});

test('toucher deux fois la même carte ne la compte qu’une fois', () => {
	const etat = coder([0, 0, 2, 0, 2], 'coeur');
	expect(etat.phase === 'revelation' && etat.carte.valeur).toBe(5);
});

test('0, 14 et 15 donnent le Joker', () => {
	expect([0, 1, 13, 14, 15].map(valeurDeLaSomme)).toStrictEqual([JOKER, 1, 13, JOKER, JOKER]);
});

test('14 : la dernière carte retournée est un Joker, les autres restent blanches', () => {
	const codee = coder([1, 2, 3], 'coeur');
	expect(codee.phase === 'revelation' && estJoker(codee.carte)).toBe(true);
	for (const i of [1, 2, 3, 4]) expect(faceDe(codee, i), `carte ${i}`).toBeNull();
	// La seule face cachée porte déjà le Joker.
	expect(faceDe(codee, 0)).toStrictEqual({ valeur: JOKER, couleur: 'coeur' });
});

test('15 : les cinq cartes sont retournées au codage, la cinquième montre aussitôt le Joker', () => {
	const codee = coder([0, 1, 2, 3], 'pique');
	expect(toutesRetournees(codee)).toBe(true);
	expect(faceDe(codee, 4)).toStrictEqual({ valeur: JOKER, couleur: 'pique' });
	for (const i of [0, 1, 2, 3]) expect(faceDe(codee, i), `carte ${i}`).toBeNull();
});

test('la cinquième touchée directement : toutes les cartes sont des Jokers, elle comprise', () => {
	const codee = toucher(DEPART, 4, 'trefle');
	const joker = { valeur: JOKER, couleur: 'trefle' };
	expect(faceEnLAir(codee)).toStrictEqual([4]);
	expect(faceDe(codee, 4)).toStrictEqual(joker);
	const finie = retourner(codee, [2, 0, 3, 1]);
	expect(toutesRetournees(finie)).toBe(true);
	for (const i of [0, 1, 2, 3, 4]) expect(faceDe(finie, i), `carte ${i}`).toStrictEqual(joker);
});

test('une seule carte touchée avant la cinquième suffit : une seule carte a une face, et ce n’est pas un Joker', () => {
	// 1 : l'As.
	const codee = retourner(coder([0], 'carreau'), [1, 2, 3]);
	expect([0, 1, 2, 3, 4].filter((i) => faceDe(codee, i) !== null)).toStrictEqual([3]);
	expect(faceDe(codee, 3)).toStrictEqual({ valeur: 1, couleur: 'carreau' });
});

test('la cinquième sans coin ne fait rien', () => {
	const etat = toucher(toucher(DEPART, 1), 4);
	expect(etat).toStrictEqual({ phase: 'codage', somme: 2, retournees: [1] });
});

test('un toucher hors des cinq cartes ne change rien', () => {
	for (const i of [-1, 5, 1.5, Number.NaN]) expect(toucher(DEPART, i, 'pique')).toBe(DEPART);
});

test('il reste toujours une carte face cachée après le codage, même pour le Roi', () => {
	for (let valeur = 1; valeur <= 13; valeur++) {
		const etat = coder([0, 1, 2, 3].filter((i) => valeur & (2 ** i)), 'trefle');
		expect(toutesRetournees(etat), `valeur ${valeur}`).toBe(false);
	}
});

test('la dernière carte retournée porte la carte du spectateur, quel que soit l’ordre', () => {
	// 5 de trèfle : les cartes 1 et 3 retournées au codage, puis la cinquième.
	for (const ordre of [[1, 3], [3, 1]]) {
		const codee = coder([0, 2], 'trefle');
		const quatre = retourner(codee, ordre.slice(0, 1));
		// Les quatre retournées sont blanches.
		for (const i of [0, 2, 4, ordre[0]!]) expect(faceDe(quatre, i), `ordre ${ordre}, carte ${i}`).toBeNull();
		// La dernière face cachée porte déjà la carte : prête quand elle se retourne.
		expect(faceDe(quatre, ordre[1]!)).toStrictEqual({ valeur: 5, couleur: 'trefle' });
		const finie = toucher(quatre, ordre[1]!);
		expect(toutesRetournees(finie)).toBe(true);
		expect(faceDe(finie, ordre[1]!)).toStrictEqual({ valeur: 5, couleur: 'trefle' });
	}
});

test('pour le Roi (1 + 4 + 8), la carte qui vaut 2 est déjà la carte du spectateur', () => {
	const etat = coder([0, 2, 3], 'coeur');
	expect(faceDe(etat, 1)).toStrictEqual({ valeur: 13, couleur: 'coeur' });
});

test('à la révélation, une carte déjà retournée ne se retourne pas deux fois', () => {
	const etat = retourner(coder([0], 'pique'), [1, 1, 1]);
	expect(etat.phase === 'revelation' && etat.retournees).toStrictEqual([0, 4, 1]);
});

test('la routine finie, chaque toucher retourne la carte dans un sens ou dans l’autre, et elle garde sa face', () => {
	const finie = retourner(coder([0, 1], 'carreau'), [2, 3]);
	expect(toutesRetournees(finie)).toBe(true);
	const remise = toucher(finie, 3);
	expect(faceEnLAir(remise)).toStrictEqual([0, 1, 2, 4]);
	expect(toutesRetournees(remise), 'la routine ne repart pas').toBe(true);
	const encore = toucher(toucher(remise, 0), 3);
	expect(faceEnLAir(encore)).toStrictEqual([1, 2, 3, 4]);
	// La carte du spectateur reste la dernière retournée ; les autres restent blanches.
	expect(faceDe(encore, 3)).toStrictEqual({ valeur: 3, couleur: 'carreau' });
	expect(faceDe(encore, 0)).toBeNull();
});

test('la carte du mode entraînement est tirée parmi les 52, de l’As de pique au Roi de carreau', () => {
	expect(carteAuHasard(() => 0)).toStrictEqual({ valeur: 1, couleur: 'pique' });
	expect(carteAuHasard(() => .999999)).toStrictEqual({ valeur: 13, couleur: 'carreau' });
	for (let i = 0; i < 200; i++) {
		const { valeur, couleur } = carteAuHasard();
		expect(valeur >= 1 && valeur <= 13 && Number.isInteger(valeur)).toBe(true);
		expect(['pique', 'coeur', 'trefle', 'carreau']).toContain(couleur);
	}
});

test('deux cartes sont la même si elles ont la même valeur et la même couleur', () => {
	expect(memeCarte({ valeur: 5, couleur: 'pique' }, { valeur: 5, couleur: 'pique' })).toBe(true);
	expect(memeCarte({ valeur: 5, couleur: 'pique' }, { valeur: 5, couleur: 'coeur' })).toBe(false);
	expect(memeCarte({ valeur: 5, couleur: 'pique' }, { valeur: 6, couleur: 'pique' })).toBe(false);
});
