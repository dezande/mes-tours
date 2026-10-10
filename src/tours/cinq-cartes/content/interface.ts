/*
 * LE TEXTE DE L'INTERFACE (réglages, cartes) dans les deux langues.
 *
 * Chaque entrée donne le texte en français et en anglais ; les composants du tour le lisent avec
 * ui(clé, langue), dans la langue du menu principal.
 */

import { textesInterface, type Lang, type Texte } from '../../../logic/i18n.ts';
import { estJoker, type CarteJouee } from '../logic/routine.ts';

export const INTERFACE = {
	// Réglages
	'menu.sens': { fr: 'Le « 1 » part de', en: 'The “1” starts from' },
	'menu.sensAide': {
		fr: 'La carte qui vaut 1 est au bord choisi, puis 2, 4 et 8 ; la carte de la couleur est à l\'autre bord. Ses coins ne changent pas : pique toujours en haut à gauche.',
		en: 'The card worth 1 is at the chosen edge, then 2, 4 and 8; the suit card is at the other edge. Its corners stay the same: spades always top left.',
	},
	'sens.gauche': { fr: 'La gauche', en: 'The left' },
	'sens.droite': { fr: 'La droite', en: 'The right' },
	'menu.couleur': { fr: 'Couleur des dos', en: 'Back colour' },
	'menu.famille': { fr: 'Codage de la famille', en: 'Suit code' },
	'famille.coins': { fr: 'Les coins de la cinquième', en: 'The fifth card’s corners' },
	'famille.cinquieme': { fr: 'Rouge ou noire, puis la cinquième', en: 'Red or black, then the fifth' },
	'famille.deuxieme': { fr: 'Rouge ou noire, puis la deuxième', en: 'Red or black, then the second' },
	'menu.aides': {
		fr: 'Aides visuelles : à masquer avant de jouer si le public voit l\'écran.',
		en: 'Visual aids: hide them before performing if the audience can see the screen.',
	},
	'menu.jauge': { fr: 'Jauge de l\'appui long', en: 'Long-press gauge' },
	'menu.defauts': { fr: 'Rétablir les réglages par défaut', en: 'Restore default settings' },

	// Les aides à la répétition : le mode entraînement et le test des zones.
	'aide.entrainement': { fr: 'Mode entraînement', en: 'Training mode' },
	'aide.recommencer': { fr: 'Recommencer', en: 'Start again' },
	'aide.retour': { fr: 'Retour aux réglages', en: 'Back to settings' },
	'entrainement.trouver': { fr: 'À coder :', en: 'Code:' },
	'entrainement.code': { fr: 'Codé :', en: 'Coded:' },
	'aide.zones': { fr: 'Test des zones', en: 'Zone test' },
	'aide.reglages': { fr: 'Réglages', en: 'Settings' },
	'aide.quitter': { fr: 'Quitter', en: 'Quit' },
	'zones.invite': { fr: 'Touchez une zone', en: 'Tap a zone' },
	'zones.carte': { fr: 'Carte', en: 'Card' },
	'zones.couleur': { fr: 'Couleur', en: 'Suit' },
	'zones.famille': { fr: 'Famille', en: 'Suit' },
	'zones.haut': { fr: 'en haut', en: 'top' },
	'zones.bas': { fr: 'en bas', en: 'bottom' },
	'zones.haut.famille': { fr: 'majeure', en: 'major' },
	'zones.bas.famille': { fr: 'mineure', en: 'minor' },

	// Le codage, rappelé dans les réglages.
	'codage.titre': { fr: 'Le codage', en: 'The code' },
	'codage.valeur': {
		fr: 'Les quatre premières cartes valent, depuis le bord réglé ci-dessus, 1, 2, 4 et 8 : toucher celles dont la somme fait la valeur (As 1, Valet 11, Dame 12, Roi 13). Chaque carte touchée se retourne aussitôt, blanche.',
		en: 'The first four cards are worth, from the edge set above, 1, 2, 4 and 8: tap those that add up to the value (Ace 1, Jack 11, Queen 12, King 13). Each card you tap turns over at once, blank.',
	},
	'codage.couleur': {
		fr: 'Puis toucher la cinquième carte, à l\'autre bord, dans son coin (elle se retourne aussi, blanche) : en haut à gauche pique, en haut à droite cœur, en bas à gauche trèfle, en bas à droite carreau. Les coins vont jusqu\'aux bords de l\'écran : toute la colonne de la carte est coupée en quatre par son milieu.',
		en: 'Then tap the fifth card, at the other edge, in its corner (it turns over too, blank): top left spades, top right hearts, bottom left clubs, bottom right diamonds. The corners reach the edges of the screen: the card’s whole column is cut in four through its middle.',
	},
	'codage.couleur.cinquieme': {
		fr: 'La première carte touchée, quelle qu\'elle soit : en haut, une carte rouge ; en bas, une noire. Puis toucher la cinquième carte, à l\'autre bord (elle se retourne aussi, blanche) : en haut, une famille majeure (pique, cœur) ; en bas, une mineure (trèfle, carreau). Le haut et le bas vont jusqu\'aux bords de l\'écran : toute la colonne de la carte est coupée en deux par son milieu.',
		en: 'The first card you tap, whichever it is: top for a red card, bottom for a black one. Then tap the fifth card, at the other edge (it turns over too, blank): top for a major suit (spades, hearts), bottom for a minor one (clubs, diamonds). Top and bottom reach the edges of the screen: the card’s whole column is cut in two through its middle.',
	},
	'codage.couleur.deuxieme': {
		fr: 'La première carte touchée, quelle qu\'elle soit : en haut, une carte rouge ; en bas, une noire. La deuxième touchée : en haut, une famille majeure (pique, cœur) ; en bas, une mineure (trèfle, carreau). Si une seule carte suffit à la valeur, c\'est la cinquième, la deuxième touchée, qui le dit. Toucher la cinquième, à l\'autre bord, termine le codage (elle se retourne aussi, blanche). Le haut et le bas vont jusqu\'aux bords de l\'écran : toute la colonne de la carte est coupée en deux par son milieu.',
		en: 'The first card you tap, whichever it is: top for a red card, bottom for a black one. The second card you tap: top for a major suit (spades, hearts), bottom for a minor one (clubs, diamonds). If one card is enough for the value, the fifth card, tapped second, tells it. Tapping the fifth card, at the other edge, ends the code (it turns over too, blank). Top and bottom reach the edges of the screen: the card’s whole column is cut in two through its middle.',
	},
	'codage.revelation': {
		fr: 'Chaque toucher retourne ensuite la carte touchée : elles sont blanches, sauf la dernière retournée, la carte du spectateur. Au-delà du Roi (14, 15), c\'est un Joker ; la cinquième touchée directement, sans rien coder : toutes les cartes sont des Jokers. Les cinq retournées, on ne peut plus que les retourner, dans un sens ou dans l\'autre. Appui de 3 s : retour au menu, d\'où le tour rouvre prêt pour un nouveau codage.',
		en: 'Each tap then turns over the card you touch: they are blank, except the last one turned over, the spectator’s card. Beyond the King (14, 15), it is a Joker; tap the fifth card straight away, with nothing coded, and every card is a Joker. Once all five are face up, you can only turn them over, either way. Press and hold for 3 s: back to the menu, where the routine starts afresh.',
	},

	/*
	 * Couleurs du dos (la valeur enregistrée, elle, ne change pas : logic/settings.ts). Ces noms
	 * servent d'étiquette aux lecteurs d'écran, qui ne voient pas les vignettes.
	 */
	'couleur.noir': { fr: 'Noir', en: 'Black' },
	'couleur.rouge': { fr: 'Rouge', en: 'Red' },
	'couleur.bleu': { fr: 'Bleu', en: 'Blue' },
	'couleur.blanc': { fr: 'Blanc', en: 'White' },

	// Les cartes, pour les lecteurs d'écran.
	'carte.dos': { fr: 'Cinq cartes face cachée', en: 'Five face-down cards' },
	'carte.blanche': { fr: 'Carte blanche', en: 'Blank card' },
	'carte.de': { fr: 'de', en: 'of' },
	'valeur.1': { fr: 'As', en: 'Ace' },
	'valeur.11': { fr: 'Valet', en: 'Jack' },
	'valeur.12': { fr: 'Dame', en: 'Queen' },
	'valeur.13': { fr: 'Roi', en: 'King' },
	'carte.joker': { fr: 'Joker', en: 'Joker' },
	'couleur.pique': { fr: 'pique', en: 'spades' },
	'couleur.coeur': { fr: 'cœur', en: 'hearts' },
	'couleur.trefle': { fr: 'trèfle', en: 'clubs' },
	'couleur.carreau': { fr: 'carreau', en: 'diamonds' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export const ui = textesInterface(INTERFACE);

/** Le nom d'une carte : « Dame de cœur », « 7 of spades », « Joker ». */
export function nomDeLaCarte(carte: CarteJouee, langue: Lang): string {
	if (estJoker(carte)) return ui('carte.joker', langue);
	const cle = `valeur.${carte.valeur}`;
	const valeur = Object.hasOwn(INTERFACE, cle) ? ui(cle as CleInterface, langue) : String(carte.valeur);
	return `${valeur} ${ui('carte.de', langue)} ${ui(`couleur.${carte.couleur}`, langue)}`;
}
