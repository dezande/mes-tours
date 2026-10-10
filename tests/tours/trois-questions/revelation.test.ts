// La révélation : trois colonnes, pour chacune des 52 cartes et de nombreux tirages.
import { estFigure, type Carte } from '../../../src/tours/princesse/logic/cartes.ts';
import { CARTES_A_JOUER, idDeCarte } from '../../../src/tours/trois-questions/logic/paquet.ts';
import { CARTES_PAR_COLONNE_REVELATION, COIN_DE_LA_FAMILLE, COIN_DE_LA_VALEUR, revelation, SPECTATEUR } from '../../../src/tours/trois-questions/logic/revelation.ts';

const SEMIS = [0, 1, 7, 42, 0xdeadbeef, 0x12345678, 2 ** 32 - 1, ...Array.from({ length: 20 }, (_, i) => i * 7919 + 13)];

type Place = { colonne: number; rang: number };
const a = (colonnes: Carte[][], { colonne, rang }: Place): Carte => colonnes[colonne]![rang]!;
const est = (p: Place, colonne: number, rang: number): boolean => p.colonne === colonne && p.rang === rang;

/** Toutes les révélations : chaque carte du paquet, avec chaque semis. */
const toutes = CARTES_A_JOUER.flatMap((carte) => SEMIS.map((semis) => {
	const colonnes = revelation(carte, semis);
	// Les autres cartes : ni celle du spectateur, ni les deux coins.
	const autres = colonnes.flatMap((cartes, c) => cartes.filter((_, r) => !est(SPECTATEUR, c, r) && !est(COIN_DE_LA_VALEUR, c, r) && !est(COIN_DE_LA_FAMILLE, c, r)));
	return { carte, semis, colonnes, autres, nom: `${idDeCarte(carte)}, semis ${semis}` };
}));

test('trois colonnes de 13 ; la carte du spectateur au milieu de la colonne du milieu ; les coins en haut à gauche et en bas à droite', () => {
	expect(SPECTATEUR).toStrictEqual({ colonne: 1, rang: 6 });
	expect(COIN_DE_LA_VALEUR).toStrictEqual({ colonne: 0, rang: 0 });
	expect(COIN_DE_LA_FAMILLE).toStrictEqual({ colonne: 2, rang: CARTES_PAR_COLONNE_REVELATION - 1 });
	for (const { carte, colonnes, nom } of toutes) {
		expect(colonnes.map((c) => c.length), nom).toStrictEqual([13, 13, 13]);
		expect(a(colonnes, SPECTATEUR), nom).toBe(carte);
	}
});

test('les cartes visibles sont toutes différentes, aucune n’est celle du spectateur', () => {
	for (const { carte, colonnes, nom } of toutes) {
		const visibles = colonnes.flatMap((cartes, c) => cartes.filter((_, r) => !est(SPECTATEUR, c, r)));
		const ids = visibles.map(idDeCarte);
		expect(new Set(ids).size, `${nom} : deux cartes pareilles`).toBe(38);
		expect(ids, nom).not.toContain(idDeCarte(carte));
	}
});

test('en haut à gauche sa valeur, en bas à droite sa famille, jamais une figure', () => {
	for (const { carte, colonnes, nom } of toutes) {
		const valeur = a(colonnes, COIN_DE_LA_VALEUR);
		const famille = a(colonnes, COIN_DE_LA_FAMILLE);
		expect(valeur.valeur, nom).toBe(carte.valeur);
		expect(valeur.enseigne, nom).not.toBe(carte.enseigne);
		expect(famille.enseigne, nom).toBe(carte.enseigne);
		expect(famille.valeur, nom).not.toBe(carte.valeur);
		expect(estFigure(famille.valeur), `${nom} : une figure en bas à droite`).toBe(false);
	}
});

test('les autres cartes : ni la valeur ni la famille de la carte du spectateur', () => {
	for (const { carte, autres, nom } of toutes) {
		expect(autres, nom).toHaveLength(36);
		for (const autre of autres) {
			expect(autre.valeur, nom).not.toBe(carte.valeur);
			expect(autre.enseigne, nom).not.toBe(carte.enseigne);
		}
	}
});

test('le même semis donne les mêmes colonnes ; d’autres semis, un autre ordre', () => {
	const carte = CARTES_A_JOUER[17]!;
	expect(revelation(carte, 99)).toStrictEqual(revelation(carte, 99));
	expect(new Set(SEMIS.map((semis) => revelation(carte, semis).flat().map(idDeCarte).join())).size).toBeGreaterThan(SEMIS.length / 2);
});
