// Le codage des 52 cartes : les codes, leur répartition, et la carte retrouvée par ses trois réponses.
import { CODES, CODES_POSSIBLES, codeDesReponses, EXCLUS, estExclu, groupes, placeALaQuestion, placeDesReponses, QUESTIONS, type Reponse } from '../../../src/tours/trois-questions/logic/codes.ts';
import { cartesDeLOrdre, idDeCarte, ORDRE_RANGE } from '../../../src/tours/trois-questions/logic/paquet.ts';

/** Les trois réponses d'un code : « 302 » → [3, 0, 2]. */
const reponsesDu = (code: string): Reponse[] => [...code].map(Number) as Reponse[];

test('54 codes possibles de trois chiffres en base 4, tous distincts, dans l’ordre croissant ; les 52 premiers aux cartes', () => {
	expect(CODES_POSSIBLES).toHaveLength(54);
	expect(new Set(CODES_POSSIBLES).size).toBe(54);
	for (const code of CODES_POSSIBLES) expect(code).toMatch(/^[0-3]{3}$/);
	expect([...CODES_POSSIBLES].sort()).toStrictEqual([...CODES_POSSIBLES]);
	expect(CODES).toStrictEqual(CODES_POSSIBLES.slice(0, 52));
});

test('aucun des dix codes écartés n’est donné à une carte', () => {
	expect([...EXCLUS].sort()).toStrictEqual(['000', '010', '012', '101', '111', '123', '222', '230', '301', '333']);
	for (const code of EXCLUS) expect(CODES_POSSIBLES, code).not.toContain(code);
	// Les 54 et les 10 font les 64 codes de 000 à 333.
	expect(new Set([...CODES_POSSIBLES, ...EXCLUS]).size).toBe(64);
});

test('avec les 54 codes : 13 de côté, 13 en colonne 1, 14 en colonne 2, 14 en colonne 3, à chaque question', () => {
	for (let question = 0; question < QUESTIONS; question++) {
		const tailles = [0, 1, 2, 3].map((c) => CODES_POSSIBLES.filter((code) => Number(code[question]) === c).length);
		expect(tailles, `question ${question + 1}`).toStrictEqual([13, 13, 14, 14]);
	}
});

test('avec les 52 cartes : sans 331 ni 332, des colonnes de 12 à 14 cartes, 13 de côté', () => {
	expect(groupes(ORDRE_RANGE, 0).map((groupe) => groupe.length)).toStrictEqual([13, 13, 14, 12]);
	expect(groupes(ORDRE_RANGE, 1).map((groupe) => groupe.length)).toStrictEqual([13, 13, 14, 12]);
	expect(groupes(ORDRE_RANGE, 2).map((groupe) => groupe.length)).toStrictEqual([13, 12, 13, 14]);
});

test('chaque carte, par ses trois réponses, est retrouvée — et elle seule', () => {
	const cartes = cartesDeLOrdre(ORDRE_RANGE);
	cartes.forEach((carte, place) => {
		// Ses réponses : la colonne où elle est montrée à chaque question, ou « aucune » (0).
		const reponses = Array.from({ length: QUESTIONS }, (_, question) => {
			const [deCote, ...colonnes] = groupes(cartes.map((_, i) => i), question);
			if (deCote.includes(place)) return 0;
			return colonnes.findIndex((colonne) => colonne.includes(place)) + 1;
		}) as Reponse[];
		expect(reponses, idDeCarte(carte)).toStrictEqual(Array.from({ length: QUESTIONS }, (_, q) => placeALaQuestion(place, q)));
		expect(placeDesReponses(reponses), idDeCarte(carte)).toBe(place);
	});
});

test('la 1re carte du paquet a le plus petit code, la 52e le plus grand ; 331 et 332 ne sont ceux d’aucune carte', () => {
	expect(CODES[0]).toBe('001');
	expect(CODES.at(-1)).toBe('330');
	const cartes = cartesDeLOrdre(ORDRE_RANGE);
	expect(idDeCarte(cartes[placeDesReponses([3, 3, 0])!]!)).toBe('R-trefle');
	expect(placeDesReponses([3, 3, 1])).toBeNull();
	expect(placeDesReponses([3, 3, 2])).toBeNull();
});

test('les codes écartés sont reconnus : leurs réponses ne donnent aucune carte', () => {
	for (const code of EXCLUS) {
		expect(estExclu(code), code).toBe(true);
		expect(placeDesReponses(reponsesDu(code)), code).toBeNull();
	}
	for (const code of CODES) expect(estExclu(code), code).toBe(false);
	// Incomplet : pas encore de carte.
	expect(placeDesReponses([1, 2])).toBeNull();
	expect(codeDesReponses([3, 0, 2])).toBe('302');
});
