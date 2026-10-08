// Le mélange : des ordres tirés au sort, chacun différent du précédent, le dernier sans aucune carte à sa place de départ.
import { ETAPES, melange, ordreAuHasard, ordreDeDepart, toutesDeplacees } from '../../../src/tours/princesse/logic/melange.ts';

const estUnOrdre = (ordre: readonly number[], nombre: number): boolean => [...ordre].sort((a, b) => a - b).join() === ordreDeDepart(nombre).join();

test('l’ordre de départ : chaque carte à sa place', () => {
	expect(ordreDeDepart(5)).toStrictEqual([0, 1, 2, 3, 4]);
	expect(ordreDeDepart(0)).toStrictEqual([]);
});

test('sur mille semis, le mélange passe par ses étapes et finit sans aucune carte à sa place', () => {
	for (let semis = 0; semis < 1000; semis++) {
		const suite = melange(5, semis * 7919);
		expect(suite, `semis ${semis}`).toHaveLength(ETAPES);
		suite.forEach((ordre, k) => {
			expect(estUnOrdre(ordre, 5), `semis ${semis}, étape ${k} : ${ordre.join()}`).toBe(true);
			const avant = k === 0 ? ordreDeDepart(5) : suite[k - 1]!;
			expect(ordre.join(), `semis ${semis}, étape ${k} : rien n'a bougé`).not.toBe(avant.join());
		});
		expect(toutesDeplacees(suite.at(-1)!), `semis ${semis} : ${suite.at(-1)!.join()}`).toBe(true);
	}
});

test('le même semis donne toujours le même mélange, deux semis des mélanges différents', () => {
	expect(melange(5, 42)).toStrictEqual(melange(5, 42));
	const finals = new Set(Array.from({ length: 200 }, (_, semis) => melange(5, semis).at(-1)!.join()));
	// 44 dérangements de cinq cartes : le hasard en visite beaucoup.
	expect(finals.size).toBeGreaterThan(30);
});

test('les cas limites ne bouclent pas', () => {
	expect(melange(0, 1)).toStrictEqual([]);
	expect(melange(1, 1)).toStrictEqual([[0], [0], [0], [0]]);
	expect(melange(5, 1, 0)).toStrictEqual([]);
	expect(toutesDeplacees(melange(2, 9).at(-1)!)).toBe(true);
});

test('l’ordre des faces montrées est tiré au sort', () => {
	const ordres = new Set(Array.from({ length: 200 }, (_, semis) => ordreAuHasard(5, semis).join()));
	for (const ordre of ordres) expect(estUnOrdre(ordre.split(',').map(Number), 5), ordre).toBe(true);
	expect(ordres.size).toBeGreaterThan(60);
});
