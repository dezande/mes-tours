// Le paquet de 52 cartes, son ordre réglable, et l'écriture abrégée des réglages.
import { abregeDeCarte, carteDeLAbrege, carteDeLId, ecrireOrdre, estUnOrdre, lireOrdre, ordreMelange, ORDRE_RANGE } from '../../../src/tours/trois-questions/logic/paquet.ts';

test('les 52 cartes rangées, chacune une fois, sans Joker', () => {
	expect(ORDRE_RANGE).toHaveLength(52);
	expect(estUnOrdre(ORDRE_RANGE)).toBe(true);
	expect(ORDRE_RANGE.slice(0, 3)).toStrictEqual(['A-pique', '2-pique', '3-pique']);
	expect(ORDRE_RANGE.at(-1)).toBe('R-trefle');
	expect(new Set(ORDRE_RANGE).size).toBe(52);
});

test('le paquet mélangé : un ordre valide, le même pour un même semis, un autre pour chaque routine', () => {
	const ordres = Array.from({ length: 200 }, (_, semis) => ordreMelange(semis * 7919 + 1));
	for (const ordre of ordres) expect(estUnOrdre(ordre)).toBe(true);
	expect(ordreMelange(42)).toStrictEqual(ordreMelange(42));
	expect(new Set(ordres.map((ordre) => ordre.join())).size).toBe(ordres.length);
	// Une même carte se trouve à bien des places.
	expect(new Set(ordres.map((ordre) => ordre.indexOf('A-pique'))).size).toBeGreaterThan(40);
});

test('un ordre invalide est refusé : carte en double, inconnue, Joker, longueur', () => {
	const double = [...ORDRE_RANGE];
	double[1] = 'A-pique';
	const inconnue = [...ORDRE_RANGE];
	inconnue[0] = 'Z-pique';
	const joker = [...ORDRE_RANGE];
	joker[0] = 'joker';
	for (const ordre of [double, inconnue, joker, [...ORDRE_RANGE, 'joker'], ORDRE_RANGE.slice(1), null, 'A-pique', {}]) expect(estUnOrdre(ordre)).toBe(false);
	expect(carteDeLId('__proto__')).toBeNull();
});

test('chaque carte s’abrège et se relit, en français comme en anglais', () => {
	for (const langue of ['fr', 'en'] as const) {
		for (const id of ORDRE_RANGE) {
			const carte = carteDeLId(id)!;
			expect(carteDeLAbrege(abregeDeCarte(carte, langue), langue), `${id} en ${langue}`).toStrictEqual(carte);
		}
	}
	expect(abregeDeCarte({ valeur: 'D', enseigne: 'carreau' }, 'fr')).toBe('DK');
	expect(abregeDeCarte({ valeur: 'D', enseigne: 'carreau' }, 'en')).toBe('QD');
});

test('l’écriture abrégée accepte les symboles, les minuscules, 1 pour l’As ; pas de Joker', () => {
	expect(carteDeLAbrege('7♦', 'fr')).toStrictEqual({ valeur: '7', enseigne: 'carreau' });
	expect(carteDeLAbrege('rt', 'fr')).toStrictEqual({ valeur: 'R', enseigne: 'trefle' });
	expect(carteDeLAbrege('1c', 'fr')).toStrictEqual({ valeur: 'A', enseigne: 'coeur' });
	expect(carteDeLAbrege('TS', 'en')).toStrictEqual({ valeur: '10', enseigne: 'pique' });
	expect(carteDeLAbrege('kc', 'en')).toStrictEqual({ valeur: 'R', enseigne: 'trefle' });
	expect(carteDeLAbrege('JK', 'fr')).toBeNull();
	expect(carteDeLAbrege('Joker', 'en')).toBeNull();
	// La famille dépend de la langue : C est cœur en français, trèfle en anglais.
	expect(carteDeLAbrege('2C', 'fr')).toStrictEqual({ valeur: '2', enseigne: 'coeur' });
	expect(carteDeLAbrege('2C', 'en')).toStrictEqual({ valeur: '2', enseigne: 'trefle' });
	for (const illisible of ['', 'X', '11P', 'VS', 'JP', 'AZ']) expect(carteDeLAbrege(illisible, 'fr'), illisible).toBeNull();
});

test('un ordre écrit puis relu redonne le même ordre, quel qu’il soit', () => {
	const melange = ordreMelange(7);
	for (const langue of ['fr', 'en'] as const) {
		for (const ordre of [ORDRE_RANGE, melange]) {
			const texte = ecrireOrdre(ordre, langue);
			expect(texte.split('\n'), 'neuf cartes par ligne').toHaveLength(6);
			expect(lireOrdre(texte, langue)).toStrictEqual({ ordre: [...ordre], fautes: [] });
		}
	}
});

test('un ordre écrit à la main dit ses fautes, et n’est pas pris', () => {
	const juste = ecrireOrdre(ORDRE_RANGE, 'fr');
	// Une carte illisible, un double, et donc deux cartes manquantes.
	const { ordre, fautes } = lireOrdre(juste.replace('7P', 'XX').replace('3P', '2P'), 'fr');
	expect(ordre).toBeNull();
	expect(fautes).toStrictEqual([
		{ type: 'double', jeton: '2P' },
		{ type: 'illisible', jeton: 'XX' },
		{ type: 'manquantes', cartes: ['3P', '7P'] },
	]);
	// Un Joker n'a pas sa place dans le paquet.
	expect(lireOrdre(`${juste} JK`, 'fr').fautes).toStrictEqual([{ type: 'illisible', jeton: 'JK' }]);
	// Séparé par des virgules, sur une seule ligne : c'est pareil.
	expect(lireOrdre(juste.replace(/\s+/g, ', '), 'fr').ordre).toStrictEqual([...ORDRE_RANGE]);
});
