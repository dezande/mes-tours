// Le rangement des tuiles du menu (src/logic/rangement.ts) : les favoris d'abord, l'ordre choisi.
import { TOURS, type Tour } from '../../src/content/tours.ts';
import { comparerVersions, ranger, trier } from '../../src/logic/rangement.ts';

const tour = (dossier: string, publie: string, fr: string, en = fr): Tour => ({ dossier, publie, nom: { fr, en } });
const LISTE = [
	tour('b', '1.9.0', 'Écrou', 'Nut'),
	tour('a', '1.10.0', 'arbre', 'Tree'),
	tour('c', '0.1.0', 'Zèbre', 'Zebra'),
	tour('d', '0.1.0', 'Bal', 'Ball'),
];
const dossiers = (tours: readonly Tour[]): string[] => tours.map((t) => t.dossier);

test('comparerVersions : nombre à nombre, pas lettre à lettre', () => {
	expect(comparerVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
	expect(comparerVersions('0.10.0', '1.0.0')).toBeLessThan(0);
	expect(comparerVersions('1.2.3', '1.2.3')).toBe(0);
});

test('ordre de publication : de la première version à la dernière, la liste à égalité', () => {
	expect(dossiers(trier(LISTE, 'publication', 'fr'))).toStrictEqual(['c', 'd', 'b', 'a']);
});

test('ordre alphabétique : dans la langue du menu, sans accents ni majuscules', () => {
	expect(dossiers(trier(LISTE, 'alphabetique', 'fr'))).toStrictEqual(['a', 'd', 'b', 'c']);
	expect(dossiers(trier(LISTE, 'alphabetique', 'en'))).toStrictEqual(['d', 'b', 'a', 'c']);
});

test('les favoris d’abord, puis les autres, chacun dans l’ordre choisi', () => {
	expect(ranger(LISTE, ['a', 'c'], 'publication', 'fr')).toStrictEqual({ favoris: [LISTE[2], LISTE[1]], autres: [LISTE[3], LISTE[0]] });
	expect(ranger(LISTE, [], 'alphabetique', 'fr').favoris).toStrictEqual([]);
});

test('les vrais tours, par publication : les quatre premiers, puis la carte de visite, jusqu’aux trois questions', () => {
	expect(dossiers(trier(TOURS, 'publication', 'fr'))).toStrictEqual(['boule-de-cristal', 'pile-ou-face', 'six-predictions', 'analyseur-q', 'carte-de-visite', 'morpion', 'princesse', 'cinq-cartes', 'trois-paquets', 'pluie-tres-fine', 'trois-questions', 'trois-six-neuf-dame']);
});
