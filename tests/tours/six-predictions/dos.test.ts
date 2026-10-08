// Les dos des six cartes : un dessin par carte, des couleurs tirées au sort.
import { DESSINS, dessinDeCarte, TEINTES, teintesAuHasard } from '../../../src/tours/six-predictions/logic/dos.ts';

test('le paquet de six montre les six dessins, dans l’ordre', () => {
	expect([0, 1, 2, 3, 4, 5].map(dessinDeCarte)).toStrictEqual([...DESSINS]);
	expect(new Set(DESSINS).size).toBe(6);
});

test('un index inattendu donne quand même un dessin', () => {
	for (const index of [-1, -7, 99, 1000]) expect(DESSINS.includes(dessinDeCarte(index)), `dessin pour ${index}`).toBe(true);
});

test('une couleur par carte, parmi les quatre, jamais la même que sa voisine', () => {
	for (let essai = 0; essai < 200; essai++) {
		const teintes = teintesAuHasard(6);
		expect(teintes).toHaveLength(6);
		teintes.forEach((teinte, i) => {
			expect(TEINTES.includes(teinte)).toBe(true);
			if (i > 0) expect(teinte, `cartes ${i - 1} et ${i}`).not.toBe(teintes[i - 1]);
		});
	}
});

test('le tirage suit le hasard qu’on lui donne, bornes comprises', () => {
	expect(teintesAuHasard(3, () => 0)).toStrictEqual(['noir', 'rouge', 'noir']);
	expect(teintesAuHasard(3, () => .999999)).toStrictEqual(['blanc', 'bleu', 'blanc']);
	expect(teintesAuHasard(2, () => 1)).toStrictEqual(['blanc', 'bleu']);
});

test('toutes les couleurs sortent', () => {
	const vues = new Set(Array.from({ length: 50 }, () => teintesAuHasard(6)).flat());
	expect(vues).toStrictEqual(new Set(TEINTES));
});
