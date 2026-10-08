/*
 * LE TEXTE DE L'INTERFACE (réglages, annonces) dans les deux langues.
 * Les cartes à forcer, elles, sont dans cartes.ts.
 *
 * Chaque entrée donne le texte en français et en anglais ; les composants du tour le lisent avec
 * ui(clé, langue), dans la langue du menu principal.
 */

import { textesInterface, type Texte } from '../../../logic/i18n.ts';

export const INTERFACE = {
	// Réglages
	'menu.routine': { fr: 'La routine', en: 'The routine' },
	'menu.routineAide': {
		fr: 'Balayez vers la gauche pour passer au panneau suivant, vers la droite pour revenir. D’abord deux mélanges, des cartes faces en l’air ou en bas, pour rien. Puis 1 : la salade, les huit cartes à forcer faces en l’air, et leurs doubles plus au fond ; d’autres le sont aussi, mais on n’en voit qu’un bord. 2, trois fois à l’identique : trois paquets de sept ; le spectateur dit où il voit sa carte, et la somme des paquets (1, 2, 4) donne sa carte : aucun paquet le 2♣, 1 le 4♣, 2 le 8♥, 3 le 5♦, 4 le 10♦, 5 le valet de ♦, 6 le 10♠, 7 la dame de ♠. Touchez ces paquets, rien ne se voit (la dernière fois où vous en touchez compte) : le panneau 3 ne montrera aucune carte de cette valeur (aucun paquet touché : aucun 2). 3 : aucune carte à forcer, et une carte face en bas, qui disparaît au toucher. Ensuite, plus aucun balayage : l’appui de 3 s ramène au menu, et le tour repart neuf à sa prochaine ouverture.',
		en: 'Swipe left for the next panel, right to go back. First two mixes, cards face up or down, for nothing. Then 1: the salad, the eight force cards face up, and their doubles further down; others are too, but only an edge shows. 2, three identical times: three packets of seven; the spectator says where they see their card, and the sum of the packets (1, 2, 4) gives the card: no packet the 2♣, 1 the 4♣, 2 the 8♥, 3 the 5♦, 4 the 10♦, 5 the jack of ♦, 6 the 10♠, 7 the queen of ♠. Tap those packets, nothing shows (the last time you tap some counts): panel 3 will show no card of that value (no packet tapped: no 2). 3: no force card, and one face-down card, which vanishes when you tap. Then no swipe works any more: a 3 s press goes back to the menu, and the trick starts afresh next time.',
	},
	'menu.couleur': { fr: 'Couleur du dos', en: 'Back colour' },
	'menu.aides': {
		fr: 'Aides visuelles : à masquer avant de jouer si le public voit l\'écran.',
		en: 'Visual aids: hide them before performing if the audience can see the screen.',
	},
	'menu.jauge': { fr: 'Jauge de l\'appui long', en: 'Long-press gauge' },
	'menu.defauts': { fr: 'Rétablir les réglages par défaut', en: 'Restore default settings' },

	/*
	 * Couleurs du dos. Ces noms ne sont pas écrits dans les réglages, où chaque bouton montre le dos
	 * lui-même : ils servent d'étiquette aux lecteurs d'écran.
	 */
	'couleur.bleu': { fr: 'Bleu', en: 'Blue' },
	'couleur.rouge': { fr: 'Rouge', en: 'Red' },
	'couleur.noir': { fr: 'Noir', en: 'Black' },

	// Ce que lisent les lecteurs d'écran.
	'panneau.melange': { fr: 'Des cartes en tas', en: 'Cards in a heap' },
	'panneau.salade': { fr: 'Les cartes en salade', en: 'The cards in a heap' },
	'panneau.paquets': { fr: 'Trois paquets de sept cartes', en: 'Three packets of seven cards' },
	'panneau.fin': { fr: 'Les cartes restantes', en: 'The remaining cards' },
	'paquet': { fr: 'Paquet', en: 'Packet' },
	'carte.dos': { fr: 'Carte face cachée', en: 'Face-down card' },
	'annonce.disparue': { fr: 'La carte face cachée a disparu', en: 'The face-down card has vanished' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export const ui = textesInterface(INTERFACE);
