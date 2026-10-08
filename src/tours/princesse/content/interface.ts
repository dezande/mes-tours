/*
 * LE TEXTE DE L'INTERFACE (réglages, annonces) dans les deux langues.
 * Les cartes de la routine, elles, sont dans cartes.ts.
 *
 * Chaque entrée donne le texte en français et en anglais ; les composants du tour le lisent avec
 * ui(clé, langue), dans la langue du menu principal.
 */

import { textesInterface, type Texte } from '../../../logic/i18n.ts';

export const INTERFACE = {
	// Réglages
	'menu.duree': { fr: 'Cartes montrées pendant', en: 'Cards shown for' },
	'menu.dureeAide': {
		fr: 'Un toucher retourne les cinq cartes, dans un ordre tiré au sort, puis elles se remettent faces en bas et se mélangent. Touchez alors une carte : elle disparaît. Chaque autre carte touchée se retourne ; la première dit la carte pensée, qui ne sera pas montrée, par sa place parmi les quatre restantes : 1re le 4♣, 2e le 8♥, 3e le 5♦, 4e le 10♦ ; un double toucher sur n’importe quelle carte, le valet de ♦.',
		en: 'A tap turns the five cards face up, in a random order, then they turn face down and shuffle. Then tap a card: it vanishes. Each other card you tap turns face up; the first one names the chosen card, which will not be shown, by its place among the four left: 1st the 4♣, 2nd the 8♥, 3rd the 5♦, 4th the 10♦; a double tap on any card, the jack of ♦.',
	},
	'menu.motif': { fr: 'Dos des cartes', en: 'Card back' },
	'menu.couleur': { fr: 'Couleur du dos', en: 'Back colour' },
	'menu.sens': { fr: 'Compter les cartes restantes', en: 'Count the remaining cards' },
	'menu.sensAide': {
		fr: 'La première carte retournée dit la carte cachée par sa place parmi les quatre restantes : 1re le 4♣, 2e le 8♥, 3e le 5♦, 4e le 10♦. Comptée depuis la gauche ou depuis la droite de l’écran, tel que vous le voyez.',
		en: 'The first card turned over names the hidden card by its place among the four left: 1st the 4♣, 2nd the 8♥, 3rd the 5♦, 4th the 10♦. Counted from the left or from the right of the screen, as you see it.',
	},
	'sens.gauche': { fr: 'De gauche à droite', en: 'Left to right' },
	'sens.droite': { fr: 'De droite à gauche', en: 'Right to left' },
	'menu.aides': {
		fr: 'Aides visuelles : à masquer avant de jouer si le public voit l\'écran.',
		en: 'Visual aids: hide them before performing if the audience can see the screen.',
	},
	'menu.jauge': { fr: 'Jauge de l\'appui long', en: 'Long-press gauge' },
	'menu.defauts': { fr: 'Rétablir les réglages par défaut', en: 'Restore default settings' },

	/*
	 * Dos des cartes. Ces noms ne sont pas écrits dans les réglages, où chaque bouton montre le dos
	 * lui-même : ils servent d'étiquette aux lecteurs d'écran.
	 */
	'motif.bicycle': { fr: 'Façon Bicycle', en: 'Bicycle style' },
	'motif.deco': { fr: 'Art déco', en: 'Art deco' },
	'motif.nouveau': { fr: 'Art nouveau', en: 'Art nouveau' },
	'motif.pixel': { fr: 'Pixel art', en: 'Pixel art' },
	'motif.minimal': { fr: 'Minimaliste', en: 'Minimalist' },
	'motif.pop': { fr: 'Pop art', en: 'Pop art' },
	'motif.futuriste': { fr: 'Futuriste', en: 'Futuristic' },
	'couleur.bleu': { fr: 'Bleu', en: 'Blue' },
	'couleur.rouge': { fr: 'Rouge', en: 'Red' },
	'couleur.noir': { fr: 'Noir', en: 'Black' },
	'couleur.blanc': { fr: 'Blanc', en: 'White' },

	// Ce que lisent les lecteurs d'écran.
	'annonce.dos': { fr: 'Cinq cartes faces en bas', en: 'Five cards face down' },
	'annonce.melange': { fr: 'Les cartes se mélangent', en: 'The cards are shuffling' },
	'annonce.disparue': { fr: 'Une carte a disparu ; quatre cartes faces en bas', en: 'A card has vanished; four cards face down' },
	'annonce.pret': { fr: 'Cinq cartes mélangées, faces en bas', en: 'Five shuffled cards, face down' },
	'carte.dos': { fr: 'Carte face cachée', en: 'Face-down card' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export const ui = textesInterface(INTERFACE);
