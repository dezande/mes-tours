/*
 * LES HUIT CARTES À FORCER, dans l'ordre de leur code : la première vaut 0, la deuxième 1, et ainsi
 * de suite jusqu'à la huitième, qui vaut 7.
 *
 * L'ordre compte : le code de chaque carte, écrit en binaire (1, 2, 4), dit dans quels paquets du
 * deuxième panneau elle se trouve (logic/tirage.ts). Le 2♣ (0) n'est dans aucun paquet, le 4♣ (1)
 * que dans le premier, le valet de ♦ (5 = 1 + 4) dans le premier et le troisième, la dame de ♠ (7)
 * dans les trois.
 *
 * Chaque carte est dessinée en SVG, aux faces d'un jeu Bicycle (components/Carte.tsx) : sa valeur et
 * son enseigne suffisent. Les tests (tests/tours/trois-paquets/tirage.test.ts) vérifient ce fichier.
 */

import type { Carte } from '../../princesse/logic/cartes.ts';

export const FORCEES: readonly Carte[] = [
	{ valeur: '2', enseigne: 'trefle' },
	{ valeur: '4', enseigne: 'trefle' },
	{ valeur: '8', enseigne: 'coeur' },
	{ valeur: '5', enseigne: 'carreau' },
	{ valeur: '10', enseigne: 'carreau' },
	{ valeur: 'V', enseigne: 'carreau' },
	{ valeur: '10', enseigne: 'pique' },
	{ valeur: 'D', enseigne: 'pique' },
];
