/*
 * LE TEXTE DE L'INTERFACE (réglages, cartes) dans les deux langues.
 *
 * Chaque entrée donne le texte en français et en anglais ; les composants du tour le lisent avec
 * ui(clé, langue), dans la langue du menu principal.
 */

import { textesInterface, type Lang, type Texte } from '../../../logic/i18n.ts';
import type { CarteJouee } from '../logic/routine.ts';

export const INTERFACE = {
	// Réglages
	'menu.sens': { fr: 'L\'As est posé à', en: 'The Ace lies on' },
	'menu.sensAide': {
		fr: 'L\'As est au bord choisi, puis le 3, le 6 et le 9 ; la Dame est à l\'autre bord. Les coins ne changent pas : pique toujours en haut à gauche.',
		en: 'The Ace is at the chosen edge, then the 3, the 6 and the 9; the Queen is at the other edge. The corners stay the same: spades always top left.',
	},
	'sens.gauche': { fr: 'Gauche', en: 'Left' },
	'sens.droite': { fr: 'Droite', en: 'Right' },
	'menu.couleur': { fr: 'Couleur des dos', en: 'Back colour' },
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
	'entrainement.trouver': { fr: 'À trouver :', en: 'Find:' },
	'entrainement.code': { fr: 'Touché :', en: 'Tapped:' },
	'aide.zones': { fr: 'Test des zones', en: 'Zone test' },
	'aide.reglages': { fr: 'Réglages', en: 'Settings' },
	'aide.quitter': { fr: 'Quitter', en: 'Quit' },
	'zones.invite': { fr: 'Touchez une zone', en: 'Tap a zone' },

	// Le codage, rappelé dans les réglages.
	'codage.titre': { fr: 'Le codage', en: 'The code' },
	'codage.valeur': {
		fr: 'Les cinq cartes sont, depuis le bord réglé ci-dessus, l\'As, le 3, le 6, le 9 et la Dame : toucher celle dont le spectateur a la valeur.',
		en: 'The five cards are, from the edge set above, the Ace, the 3, the 6, the 9 and the Queen: tap the one with the spectator’s value.',
	},
	'codage.couleur': {
		fr: 'La toucher dans son coin : en haut à gauche pique, en haut à droite cœur, en bas à gauche trèfle, en bas à droite carreau. Les coins vont jusqu\'aux bords de l\'écran : toute la colonne de la carte est coupée en quatre par son milieu. Elle se retourne aussitôt sur la carte du spectateur.',
		en: 'Tap it in its corner: top left spades, top right hearts, bottom left clubs, bottom right diamonds. The corners reach the edges of the screen: the card’s whole column is cut in four through its middle. It turns over at once on the spectator’s card.',
	},
	'codage.revelation': {
		fr: 'Chaque toucher retourne ensuite la carte touchée : les autres sont blanches. Les cinq retournées, on ne peut plus que les retourner, dans un sens ou dans l\'autre. Appui de 3 s : retour au menu, d\'où le tour rouvre sur cinq dos.',
		en: 'Each tap then turns over the card you touch: the others are blank. Once all five are face up, you can only turn them over, either way. Press and hold for 3 s: back to the menu, where the routine starts afresh with five backs.',
	},
	'codage.pres': {
		fr: 'À un près : la carte du spectateur n\'est pas parmi les cinq (un 4, un 7…) ? Révéler la carte d\'en dessous, puis toucher l\'As : il se retourne, et toutes les cartes sauf celle du spectateur, l\'As compris, portent « À 1 carte près ».',
		en: 'Off by one: the spectator’s card is not among the five (a 4, a 7…)? Reveal the card just below it, then tap the Ace: it turns over, and every card but the spectator’s, the Ace included, reads “Within one card”.',
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
	'carte.pres': { fr: 'À 1 carte près', en: 'Within one card' },
	'carte.de': { fr: 'de', en: 'of' },
	'valeur.1': { fr: 'As', en: 'Ace' },
	'valeur.12': { fr: 'Dame', en: 'Queen' },
	'couleur.pique': { fr: 'pique', en: 'spades' },
	'couleur.coeur': { fr: 'cœur', en: 'hearts' },
	'couleur.trefle': { fr: 'trèfle', en: 'clubs' },
	'couleur.carreau': { fr: 'carreau', en: 'diamonds' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export const ui = textesInterface(INTERFACE);

/** Le nom d'une carte : « Dame de cœur », « As de pique », « 9 of spades ». */
export function nomDeLaCarte(carte: CarteJouee, langue: Lang): string {
	const valeur = carte.valeur === 12 ? ui('valeur.12', langue) : carte.valeur === 1 ? ui('valeur.1', langue) : String(carte.valeur);
	return `${valeur} ${ui('carte.de', langue)} ${ui(`couleur.${carte.couleur}`, langue)}`;
}
