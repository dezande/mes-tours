/*
 * LE TEXTE DE L'INTERFACE (réglages, carte) dans les deux langues.
 *
 * Chaque entrée donne le texte en français et en anglais ; les composants du tour le lisent avec
 * ui(clé, langue), dans la langue du menu principal.
 */

import { textesInterface, type Lang, type Texte } from '../../../logic/i18n.ts';
import type { Couleur } from '../logic/routine.ts';

export const INTERFACE = {
	// Réglages
	'menu.couleur': { fr: 'Couleur du dos', en: 'Back colour' },
	'menu.couleurAide': {
		fr: 'Le dos d\'un jeu des années 1950 : des hachures très fines, comme une pluie, et un médaillon au centre. Seule l\'encre se choisit.',
		en: 'The back of a 1950s deck: very fine hatching, like rain, and a medallion in the middle. Only the ink can be chosen.',
	},
	'menu.aides': {
		fr: 'Aides visuelles : à masquer avant de jouer si le public voit l\'écran.',
		en: 'Visual aids: hide them before performing if the audience can see the screen.',
	},
	'menu.jauge': { fr: 'Jauge de l\'appui long', en: 'Long-press gauge' },
	'menu.defauts': { fr: 'Rétablir les réglages par défaut', en: 'Restore default settings' },

	// Le trucage, rappelé dans les réglages.
	'trucage.titre': { fr: 'Le trucage', en: 'The secret' },
	'trucage.coins': {
		fr: 'La carte est une Dame, face cachée. Le coin de l\'écran touché choisit sa famille : en haut à gauche pique, en haut à droite cœur, en bas à gauche trèfle, en bas à droite carreau. L\'écran est coupé en quatre par le milieu de la carte, jusqu\'à ses bords : le doigt n\'a pas à tomber sur la carte.',
		en: 'The card is a Queen, face down. The corner of the screen you tap picks her suit: top left spades, top right hearts, bottom left clubs, bottom right diamonds. The screen is cut in four through the middle of the card, right to its edges: your finger need not land on the card.',
	},
	'trucage.fin': {
		fr: 'La carte se retourne aussitôt. Retournée, plus rien ne la change, pas même un double toucher. Appui de 3 s : retour au menu, d\'où le tour rouvre face cachée.',
		en: 'The card turns over at once. Once face up, nothing changes it any more, not even a double tap. Press and hold for 3 s: back to the menu, where the card starts face down again.',
	},

	// Le test des zones.
	'aide.zones': { fr: 'Test des zones', en: 'Zone test' },
	'aide.reglages': { fr: 'Réglages', en: 'Settings' },
	'aide.quitter': { fr: 'Quitter', en: 'Quit' },
	'zones.invite': { fr: 'Touchez une zone', en: 'Tap a zone' },

	/*
	 * Les encres du dos (la valeur enregistrée, elle, ne change pas : logic/settings.ts). Ces noms
	 * servent d'étiquette aux lecteurs d'écran, qui ne voient pas les vignettes.
	 */
	'teinte.rouge': { fr: 'Rouge', en: 'Red' },
	'teinte.bleu': { fr: 'Bleu', en: 'Blue' },
	'teinte.vert': { fr: 'Vert', en: 'Green' },
	'teinte.brun': { fr: 'Brun', en: 'Brown' },

	// La carte, pour les lecteurs d'écran.
	'carte.dos': { fr: 'Une carte face cachée', en: 'A face-down card' },
	'carte.dame': { fr: 'Dame de', en: 'Queen of' },
	'couleur.pique': { fr: 'pique', en: 'spades' },
	'couleur.coeur': { fr: 'cœur', en: 'hearts' },
	'couleur.trefle': { fr: 'trèfle', en: 'clubs' },
	'couleur.carreau': { fr: 'carreau', en: 'diamonds' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export const ui = textesInterface(INTERFACE);

/** Le nom de la carte : « Dame de cœur », « Queen of spades ». */
export const nomDeLaDame = (couleur: Couleur, langue: Lang): string => `${ui('carte.dame', langue)} ${ui(`couleur.${couleur}`, langue)}`;

/** L'index des coins : D en français, Q en anglais. */
export const indexDeLaDame = (langue: Lang): string => (langue === 'en' ? 'Q' : 'D');
