// La routine : balayer d'un panneau à l'autre (deux mélanges, puis 1, 2, 2, 2, 3), noter les paquets, faire disparaître la carte.
import { apresBalayage, apresToucher, codeNote, copieDuPanneau, COPIES, depart, estPaquets, FIN, paquetDuPoint, SALADE, type Etat } from '../../../src/tours/trois-paquets/logic/routine.ts';
import { MELANGES } from '../../../src/tours/trois-paquets/logic/tirage.ts';

const vide = [[], [], []];

test('sept panneaux : deux mélanges, la salade, les paquets trois fois, la fin ; après la fin, une nouvelle routine', () => {
	let etat = depart(1);
	expect(etat).toStrictEqual({ panneau: 0, semis: 1, notes: vide, disparue: false });
	const vus: number[] = [0];
	for (let i = 0; i < 6; i++) {
		etat = apresBalayage(etat, 'suivant', 2);
		vus.push(etat.panneau);
	}
	expect(vus).toStrictEqual([0, 1, SALADE, 3, 4, 5, FIN]);
	expect(SALADE).toBe(MELANGES);
	expect(FIN).toBe(SALADE + COPIES + 1);
	expect(vus.map(estPaquets)).toStrictEqual([false, false, false, true, true, true, false]);
	expect(vus.map(copieDuPanneau)).toStrictEqual([null, null, null, 1, 2, 3, null]);
	expect(apresBalayage(etat, 'suivant', 2)).toStrictEqual(depart(2));
});

test('balayer vers la droite : le panneau d’avant ; rien avant le premier', () => {
	const premier = depart(1);
	expect(apresBalayage(premier, 'precedent', 2)).toBe(premier);
	expect(apresBalayage({ ...premier, panneau: FIN }, 'precedent', 2)).toStrictEqual({ panneau: 5, semis: 1, notes: vide, disparue: false });
});

test('la carte disparue, le tour est figé : plus aucun balayage, ni en arrière ni vers une nouvelle routine', () => {
	const fin = apresToucher({ ...depart(1), panneau: FIN }, null);
	expect(fin.disparue).toBe(true);
	expect(apresBalayage(fin, 'precedent', 2)).toBe(fin);
	expect(apresBalayage(fin, 'suivant', 2)).toBe(fin);
});

test('les paquets : toucher un paquet le note pour cette copie, toucher encore l’oublie ; le code est leur somme (aucun : 0)', () => {
	let etat: Etat = { ...depart(1), panneau: 3 };
	// Rien de noté : le code 0, celui du 2♣.
	expect(codeNote(etat)).toBe(0);
	etat = apresToucher(etat, 2);
	etat = apresToucher(etat, 0);
	expect(etat.notes).toStrictEqual([[2, 0], [], []]);
	expect(codeNote(etat)).toBe(5);
	etat = apresToucher(etat, 0);
	expect(codeNote(etat)).toBe(4);
	for (const hors of [null, -1, 3, 1.5]) expect(apresToucher(etat, hors), String(hors)).toBe(etat);
});

test('les copies : chacune ses notes ; la dernière copie où quelque chose est noté donne le code', () => {
	let etat: Etat = { ...depart(1), panneau: 3 };
	etat = apresToucher(etat, 0);
	etat = apresToucher(etat, 2);
	// Les mêmes paquets touchés à nouveau sur la copie suivante ne s'annulent pas.
	etat = apresToucher(apresBalayage(etat, 'suivant', 2), 0);
	etat = apresToucher(etat, 2);
	expect(etat.notes).toStrictEqual([[0, 2], [0, 2], []]);
	expect(codeNote(etat)).toBe(5);
	// La troisième copie, notée autrement : c'est elle qui compte.
	etat = apresToucher(apresBalayage(etat, 'suivant', 2), 1);
	expect(codeNote(etat)).toBe(2);
	// Sans rien de noté sur la troisième, la deuxième compte encore.
	etat = apresToucher(etat, 1);
	expect(codeNote(etat)).toBe(5);
});

test('les touchers ne font rien sur les mélanges ni sur la salade, ni sur une carte déjà disparue', () => {
	const premier = depart(1);
	for (const panneau of [0, 1, SALADE] as const) {
		const etat: Etat = { ...premier, panneau };
		expect(apresToucher(etat, 0)).toBe(etat);
	}
	const disparue = apresToucher({ ...premier, panneau: FIN }, 1);
	expect(apresToucher(disparue, 1)).toBe(disparue);
	expect(disparue.notes).toStrictEqual(vide);
});

test('le paquet touché, d’après l’abscisse', () => {
	expect([10, 109, 110, 209, 210, 309].map((x) => paquetDuPoint(x, 10, 300))).toStrictEqual([0, 0, 1, 1, 2, 2]);
	expect(paquetDuPoint(310, 10, 300)).toBe(2);
	for (const x of [9, 311, NaN]) expect(paquetDuPoint(x, 10, 300), String(x)).toBeNull();
	expect(paquetDuPoint(50, 10, 0)).toBeNull();
});
