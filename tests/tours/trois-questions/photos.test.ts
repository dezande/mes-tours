// Les photos de colonnes : les bonnes cartes dans chaque colonne, mélangées, les mêmes pour la rafale.
import { groupes, QUESTIONS } from '../../../src/tours/trois-questions/logic/codes.ts';
import { CARTES_PAR_COLONNE, colonnes, desordre } from '../../../src/tours/trois-questions/logic/photos.ts';

const PLACES = Array.from({ length: 52 }, (_, i) => i);

test('chaque colonne montre exactement ses cartes, dans un autre ordre que celui du paquet', () => {
	for (let question = 0; question < QUESTIONS; question++) {
		const [deCote, ...attendues] = groupes(PLACES, question);
		const montrees = colonnes(PLACES, question, 2024);
		expect(montrees.map((c) => [...c].sort((a, b) => a - b))).toStrictEqual(attendues);
		// Le groupe de côté n'est jamais montré.
		expect(montrees.flat().some((place) => deCote.includes(place))).toBe(false);
		expect(montrees.some((c, i) => c.join() !== attendues[i]!.join()), 'aucune colonne mélangée').toBe(true);
	}
});

test('le même semis donne les mêmes photos ; un désordre pour chaque carte des colonnes', () => {
	expect(colonnes(PLACES, 1, 5)).toStrictEqual(colonnes(PLACES, 1, 5));
	expect(colonnes(PLACES, 1, 5)).not.toStrictEqual(colonnes(PLACES, 1, 6));
	const d = desordre(0, 5);
	expect(d).toHaveLength(3);
	for (const colonne of d) expect(colonne).toHaveLength(CARTES_PAR_COLONNE);
	expect(Math.max(...colonnes(PLACES, 0, 5).map((c) => c.length))).toBe(CARTES_PAR_COLONNE);
});
