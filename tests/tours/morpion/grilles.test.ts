// Les grilles : les deux prédictions sont de vraies parties, et la ligne gagnante est bien trouvée.
import { GRILLES } from '../../../src/tours/morpion/content/grilles.ts';
import { ligneGagnante, lire, verifier } from '../../../src/tours/morpion/logic/grilles.ts';
import { COTES } from '../../../src/tours/morpion/logic/papier.ts';

test('les deux prédictions, haut et bas, sont des parties jouables', () => {
	expect(Object.keys(GRILLES).sort()).toStrictEqual([...COTES].sort());
	for (const cote of COTES) expect(verifier(GRILLES[cote]), cote).toStrictEqual([]);
});

test('les deux prédictions : X barre la première ligne en haut, la troisième colonne en bas', () => {
	expect(ligneGagnante(lire(GRILLES.haut))).toStrictEqual([0, 1, 2]);
	expect(ligneGagnante(lire(GRILLES.bas))).toStrictEqual([2, 5, 8]);
});

test('lire : neuf cases, de gauche à droite et de haut en bas', () => {
	expect(lire(['XO.', '.X.', '..O'])).toStrictEqual(['X', 'O', null, null, 'X', null, null, null, 'O']);
});

test('la ligne gagnante : rangée, colonne, diagonale, ou rien', () => {
	expect(ligneGagnante(lire(['XXX', 'OO.', '...']))).toStrictEqual([0, 1, 2]);
	expect(ligneGagnante(lire(['O.X', 'O.X', 'O..']))).toStrictEqual([0, 3, 6]);
	expect(ligneGagnante(lire(['..X', '.XO', 'XO.']))).toStrictEqual([2, 4, 6]);
	expect(ligneGagnante(lire(['XOX', 'XOO', 'OXX']))).toBeNull();
	expect(ligneGagnante(lire(['...', '...', '...']))).toBeNull();
});

test('verifier refuse une grille mal écrite ou impossible', () => {
	expect(verifier(['XO', 'XOO', 'OXX'])).toHaveLength(1);
	expect(verifier(['XOA', 'XOO', 'OXX'])).toHaveLength(1);
	expect(verifier(['XOX', 'XOO'])).toStrictEqual(['trois lignes attendues']);
	expect(verifier('XOXXOOOXX')).toStrictEqual(['trois lignes attendues']);
	// Trois croix pour aucun rond : les coups n'alternent pas.
	expect(verifier(['XXX', '...', '...'])).toHaveLength(1);
	// Les deux joueurs gagnent à la fois.
	expect(verifier(['XXX', 'OOO', '...'])).toContain('les deux joueurs gagnent à la fois');
});

test('une case superposée : la croix et le rond, qui comptent pour les deux joueurs', () => {
	expect(lire(['*..', '...', '...'])[0]).toBe('XO');
	expect(ligneGagnante(lire(['X*X', 'O.O', '...']))).toStrictEqual([0, 1, 2]);
	expect(ligneGagnante(lire(['O*O', 'X.X', '...']))).toStrictEqual([0, 1, 2]);
	expect(ligneGagnante(lire(['***', '...', '...']))).toStrictEqual([0, 1, 2]);
	// Avec une case superposée, la grille n'est plus une partie ordinaire : seule l'écriture compte.
	expect(verifier(['***', '***', '***'])).toStrictEqual([]);
	expect(verifier(['**#', '...', '...'])).toHaveLength(1);
});
