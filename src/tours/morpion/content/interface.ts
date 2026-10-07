/*
 * LE TEXTE DE L'INTERFACE (réglages, papier) dans les deux langues.
 * Les grilles des prédictions, elles, sont dans grilles.ts.
 *
 * Chaque entrée donne le texte en français et en anglais ; les composants du tour le lisent avec
 * ui(clé, langue), dans la langue du menu principal.
 */

import type { Lang, Texte } from '../../../logic/i18n.ts';

export const INTERFACE = {
	// Réglages
	'menu.delai': { fr: 'Délai avant le retournement', en: 'Delay before the paper turns over' },
	'menu.delaiAide': {
		fr: 'À 0 s, le papier se retourne dès le toucher. Haut de l’écran : la grille du haut ; bas : celle du bas.',
		en: 'At 0 s, the paper turns over as soon as you tap. Top of the screen: the top grid; bottom: the bottom one.',
	},
	'menu.aides': {
		fr: 'Aides visuelles : à masquer avant de jouer si le public voit l\'écran.',
		en: 'Visual aids: hide them before performing if the audience can see the screen.',
	},
	'menu.jauge': { fr: 'Jauge de l\'appui long', en: 'Long-press gauge' },
	'menu.defauts': { fr: 'Rétablir les réglages par défaut', en: 'Restore default settings' },

	// Le papier : le mot écrit au recto, et ce que lisent les lecteurs d'écran.
	'papier.mot': { fr: 'Prédiction', en: 'Prediction' },
	'papier.grille': { fr: 'Grille de morpion', en: 'Tic-tac-toe grid' },
	'papier.croix': { fr: 'croix', en: 'cross' },
	'papier.rond': { fr: 'rond', en: 'nought' },
	'papier.lesDeux': { fr: 'croix et rond superposés', en: 'cross and nought on top of each other' },
	'papier.vide': { fr: 'vide', en: 'empty' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export function ui(cle: CleInterface, lang: Lang): string {
	const value: Texte = INTERFACE[cle];
	return typeof value === 'string' ? value : value[lang];
}
