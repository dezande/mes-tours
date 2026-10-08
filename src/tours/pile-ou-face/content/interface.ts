/*
 * LE TEXTE DE L'INTERFACE (menu, aide, états) dans les deux langues.
 * Le texte des prédictions, lui, est dans predictions.ts.
 *
 * Chaque entrée donne le texte en français et en anglais ; les composants du tour le lisent avec
 * ui(clé, langue), dans la langue du menu principal.
 */

import { textesInterface, type Texte } from '../../../logic/i18n.ts';

export const INTERFACE = {
	// Menu
	'menu.titre': { fr: 'Menu', en: 'Menu' },
	'menu.remettre': { fr: 'Remettre la carte', en: 'Reset the card' },
	'menu.fermer': { fr: 'Fermer', en: 'Close' },
	// Le nom de l'app qui regroupe tous les tours : le même dans les deux langues.
	'menu.mesTours': 'Mes tours',
	'menu.langue': { fr: 'Langue', en: 'Language' },
	'menu.delai': { fr: 'Délai avant le retournement', en: 'Delay before the card flips' },
	'menu.delaiAide': {
		fr: 'À 0 s, la carte se retourne dès le toucher.',
		en: 'At 0 s, the card flips as soon as you tap.',
	},
	'menu.couleur': { fr: 'Couleur de l\'encre', en: 'Ink colour' },
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
	'aide.haut': {
		fr: 'Toucher la moitié du haut de l\'écran : la carte se retourne sur « 0,20 euro pile ».',
		en: 'Tap the top half of the screen: the card flips to “0.20 euro tails”.',
	},
	'aide.bas': {
		fr: 'Toucher la moitié du bas : la carte se retourne sur « 0,20 euro face ».',
		en: 'Tap the bottom half: the card flips to “0.20 euro heads”.',
	},
	'aide.delai': {
		fr: 'Avec un délai, la carte se retourne seule, après le délai réglé ci-dessus. Une fois le choix fait, un autre toucher ne change plus rien.',
		en: 'With a delay, the card flips by itself once the delay set above has passed. Once the choice is made, another tap changes nothing.',
	},
	'aide.double': {
		fr: 'Deux touchers rapprochés : la carte revient face cachée. Elle se retourne ensuite toujours sur la même prédiction, jusqu\'au retour au menu.',
		en: 'Two quick taps: the card turns back face down. It then always flips to the same prediction, until you go back to the menu.',
	},
	'aide.appui': {
		fr: 'Appui de 3 s pendant le tour : on le quitte, retour au menu de Mes tours. Ces réglages s\'ouvrent par l\'écrou ⚙ du menu.',
		en: 'Press and hold for 3 s during the routine: leave it, back to the Mes tours menu. These settings open from the ⚙ in the menu.',
	},
	'aide.clavier': {
		fr: 'Clavier ou télécommande : ↑ ou Page précédente pour pile, ↓ ou Page suivante pour face, R pour remettre la carte, Échap ou M pour quitter le tour.',
		en: 'Keyboard or presenter remote: ↑ or Page Up for pile, ↓ or Page Down for face, R to reset the card, Esc or M to leave.',
	},

	/*
	 * Couleur de l'encre (la valeur enregistrée, elle, ne change pas : logic/settings.ts).
	 * Ces noms ne sont pas écrits dans le menu, où chaque bouton montre le dos lui-même : ils
	 * servent d'étiquette aux lecteurs d'écran, qui ne voient pas les vignettes.
	 */
	'couleur.noir': { fr: 'Noir', en: 'Black' },
	'couleur.rouge': { fr: 'Rouge', en: 'Red' },
	'couleur.bleu': { fr: 'Bleu', en: 'Blue' },

	// La carte.
	'carte.dos': { fr: 'Carte face cachée', en: 'Face-down card' },
	// Le mot écrit au dos de la carte.
	'carte.mot': { fr: 'Prédiction', en: 'Prediction' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export const ui = textesInterface(INTERFACE);
