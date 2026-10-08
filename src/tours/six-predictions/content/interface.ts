/*
 * LE TEXTE DE L'INTERFACE (menu, aide, états) dans les deux langues.
 * Le texte des prédictions, lui, est dans cartes.ts.
 *
 * Chaque entrée donne le texte en français et en anglais ; les composants du tour le lisent avec
 * ui(clé, langue), dans la langue du menu principal.
 */

import { textesInterface, type Texte } from '../../../logic/i18n.ts';

export const INTERFACE = {
	// Menu
	'menu.titre': { fr: 'Menu', en: 'Menu' },
	'menu.aller': { fr: 'Aller à la carte', en: 'Go to card' },
	'menu.remettre': { fr: 'Remettre le paquet', en: 'Reset the deck' },
	'menu.fermer': { fr: 'Fermer', en: 'Close' },
	// Le nom de l'app qui regroupe tous les tours : le même dans les deux langues.
	'menu.mesTours': 'Mes tours',
	'menu.langue': { fr: 'Langue', en: 'Language' },
	'menu.aides': {
		fr: 'Aides visuelles : à masquer avant de jouer si le public voit l\'écran.',
		en: 'Visual aids: hide them before performing if the audience can see the screen.',
	},
	'menu.jauge': { fr: 'Jauge de l\'appui long', en: 'Long-press gauge' },
	'menu.version': { fr: 'Version', en: 'Version' },
	'menu.cache': { fr: 'Cache hors-ligne', en: 'Offline cache' },
	'menu.stockage': { fr: 'Stockage', en: 'Storage' },
	'menu.affichage': { fr: 'Affichage', en: 'Display' },
	'menu.defauts': { fr: 'Rétablir les réglages par défaut', en: 'Restore default settings' },

	// Aide (gestes et touches)
	'aide.titre': { fr: 'Gestes et touches', en: 'Gestures and keys' },
	'aide.premier': {
		fr: 'Premier toucher sur la carte du dessus : elle se retourne et montre sa prédiction.',
		en: 'First tap on the top card: it flips over and shows its prediction.',
	},
	'aide.second': {
		fr: 'Second toucher : la carte sort du cadre et découvre la suivante.',
		en: 'Second tap: the card leaves the frame, uncovering the next one.',
	},
	'aide.vide': {
		fr: 'Les six cartes sorties, l\'écran reste vide. Deux touchers rapprochés remettent le paquet, faces en bas.',
		en: 'Once all six cards are gone, the screen stays empty. Two quick taps put the deck back, face down.',
	},
	'aide.appui': {
		fr: 'Appui de 3 s pendant le tour : on le quitte, retour au menu de Mes tours. Ces réglages s\'ouvrent par l\'écrou ⚙ du menu.',
		en: 'Press and hold for 3 s during the routine: leave it, back to the Mes tours menu. These settings open from the ⚙ in the menu.',
	},
	'aide.clavier': {
		fr: 'Clavier ou télécommande : → espace Page suivante pour toucher la carte, R pour remettre le paquet, Échap ou M pour quitter le tour.',
		en: 'Keyboard or presenter remote: → space Page Down to tap the card, R to reset the deck, Esc or M to leave.',
	},

	// Cartes et paquet.
	'carte.vide': { fr: 'Le paquet est vide', en: 'The deck is empty' },
	'carte.dos': { fr: 'Carte face cachée', en: 'Face-down card' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export const ui = textesInterface(INTERFACE);
