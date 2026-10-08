/*
 * LES CINQ CARTES de la routine, dans leur ordre de départ, de gauche à droite.
 *
 * L'ordre compte : c'est la colonne de départ de chaque carte que l'artiste touche pour la faire
 * disparaître (logic/routine.ts). Toucher la première colonne (à gauche) fait disparaître le 4 de
 * trèfle, la deuxième le 8 de cœur, et ainsi de suite.
 *
 * Chaque carte est dessinée en SVG (components/FaceDeCarte.tsx) : sa valeur et sa couleur suffisent.
 * Les tests (tests/tours/princesse/cartes.test.ts) vérifient la forme de ce fichier.
 */

import type { Carte } from '../logic/cartes.ts';

export const CARTES: readonly Carte[] = [
	{ valeur: '4', enseigne: 'trefle' },
	{ valeur: '8', enseigne: 'coeur' },
	{ valeur: '5', enseigne: 'carreau' },
	{ valeur: '10', enseigne: 'carreau' },
	{ valeur: 'V', enseigne: 'carreau' },
];
