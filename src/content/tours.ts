/*
 * LES TOURS de l'app « Mes tours » : un par accessoire de scène.
 *
 * Chaque tour a son code dans src/tours/<dossier>/ (branché par src/tours/registre.ts) et ses styles
 * dans src/styles/tours/<dossier>/ ; ses dépôts d'origine ne sont pas touchés. Il s'ouvre en plein
 * écran depuis sa tuile, ses réglages depuis l'écrou ⚙ (src/pages/PageTour.tsx), et revient ici par
 * l'appui de 3 s.
 *
 *   dossier      le dossier du tour dans l'app (et le nom de son dépôt d'origine) ;
 *   nom          ce qui est écrit sur la tuile, en français et en anglais.
 *
 * L'icône de chaque tour est dessinée en pixels dans content/pixels.ts. Les tests
 * (tests/logic/tours.test.ts) vérifient la forme de ce fichier et la présence de chaque copie.
 */

import type { Traduction } from '../logic/i18n.ts';

export interface Tour {
	dossier: string;
	nom: Traduction;
}

export const TOURS: readonly Tour[] = [
	{
		dossier: 'boule-de-cristal',
		nom: { fr: 'Boule de cristal', en: 'Crystal ball' },
	},
	{
		// La routine Arcane Système, qui était jouée dans la boule de cristal : la carte de visite d'une
		// carte du Théâtre Robert-Houdin, avec le numéro au dos.
		dossier: 'carte-de-visite',
		nom: { fr: 'Carte de visite', en: 'Business card' },
	},
	{
		dossier: 'pile-ou-face',
		nom: { fr: 'Pile ou face', en: 'Heads or tails' },
	},
	{
		// Le même système que Pile ou face : le haut ou le bas de l'écran choisit la grille.
		dossier: 'morpion',
		nom: { fr: 'Morpion', en: 'Tic-tac-toe' },
	},
	{
		// La version de « The Princess Card Trick » : cinq cartes, celle qui est pensée disparaît.
		dossier: 'princesse',
		nom: { fr: 'Princesse', en: 'Princess' },
	},
	{
		dossier: 'six-predictions',
		nom: { fr: 'Les six prédictions', en: 'The six predictions' },
	},
	{
		// Cinq cartes face cachée : toutes blanches, sauf celle du spectateur, codée en les touchant.
		dossier: 'cinq-cartes',
		nom: { fr: 'Les cinq cartes', en: 'The five cards' },
	},
	{
		// « Analyseur Q » est le nom de l'appareil : le même dans les deux langues, comme dans le tour.
		dossier: 'analyseur-q',
		nom: { fr: 'Analyseur Q', en: 'Analyseur Q' },
	},
];
