/*
 * LES DEUX PRÉDICTIONS : les grilles écrites au dos du papier sont ici, et nulle part ailleurs.
 *
 *   haut  la grille montrée quand on touche la moitié du haut de l'écran ;
 *   bas   celle montrée quand on touche la moitié du bas.
 *
 * Chaque grille s'écrit en trois lignes de trois cases, comme on la voit :
 *   X  une croix      O  un rond      *  une croix et un rond superposés      .  une case vide
 *
 * Une ligne gagnante est barrée d'un trait, tout seul : il n'y a rien d'autre à écrire. Une case
 * superposée vaut pour les deux joueurs. Les tests (tests/tours/morpion/grilles.test.ts) vérifient
 * l'écriture de chaque grille et, sans case superposée, que c'est une vraie partie (pas plus d'un
 * coup d'écart entre les croix et les ronds, un seul gagnant au plus).
 *
 * En haut, X gagne sur la première ligne, avec une croix et un rond superposés dans le coin en haut
 * à gauche ; en bas, X gagne sur la troisième colonne, la croix et le rond superposés au bout de la
 * deuxième ligne.
 */

import type { GrilleEcrite } from '../logic/grilles.ts';
import type { Cote } from '../logic/papier.ts';

export const GRILLES: Readonly<Record<Cote, GrilleEcrite>> = {
	haut: [
		'*XX',
		'XOO',
		'OOX',
	],
	bas: [
		'OXX',
		'XO*',
		'OOX',
	],
};
