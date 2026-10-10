/*
 * LE TEXTE DE L'INTERFACE (réglages, annonces) dans les deux langues.
 *
 * Chaque entrée donne le texte en français et en anglais ; les composants du tour le lisent avec
 * ui(clé, langue), dans la langue du menu principal. La scène, elle, n'écrit rien : au public, c'est
 * une galerie de photos.
 */

import { textesInterface, type Lang, type Texte } from '../../../logic/i18n.ts';
import type { Faute } from '../logic/paquet.ts';

export const INTERFACE = {
	// Réglages
	'menu.routine': { fr: 'La routine', en: 'The routine' },
	'menu.routineQuestions': {
		fr: 'Trois photos, une par question : les cartes en trois colonnes. Le spectateur dit dans quelle colonne est sa carte. Touchez cette colonne : la photo suivante arrive, un instant après. S\'il ne la voit pas, touchez deux fois, vite, n\'importe où. Défiler vers la gauche ne note rien : une autre photo des mêmes colonnes. Défiler vers la droite revient en arrière et oublie la réponse.',
		en: 'Three photos, one per question: the cards in three columns. The spectator says which column holds their card. Tap that column: the next photo comes a moment later. If they don\'t see it, double tap anywhere. Swiping left notes nothing: another photo of the same columns. Swiping right goes back and forgets the answer.',
	},
	'menu.routineRevelation': {
		fr: 'Après la troisième : trois colonnes de cartes, celle du spectateur face en bas au milieu de la colonne du milieu ; cette dernière photo est bloquée. Touchée, elle se retourne, grandit et passe devant les autres (si le réglage le permet). Avant, la carte en haut à gauche a sa valeur, la carte en bas à droite sa famille (jamais une figure). Double toucher, la carte retournée (ou qui ne se retourne pas) : une nouvelle routine. Appui de 3 s : retour au menu.',
		en: 'After the third: three columns of cards, the spectator\'s face down in the middle of the middle column; this last photo is locked. Touched, it turns over, grows and comes in front of the others (if the setting allows). Before that, the top-left card shows its value, the bottom-right card its suit (never a court card). Double tap once the card is face up (or if it does not turn over): a new routine. Press and hold for 3 s: back to the menu.',
	},
	'menu.revelation': { fr: 'La révélation', en: 'The reveal' },
	'menu.retournable': { fr: 'Retourner la carte du spectateur', en: 'Turn the spectator\'s card over' },
	'menu.retournableAide': {
		fr: 'Touchée, elle se retourne, grandit et passe au premier plan. Décoché, elle reste face en bas : à vous de la nommer ; le double toucher relance alors la routine.',
		en: 'When touched, it turns over, grows and comes to the front. Unticked, it stays face down: you name it; a double tap then starts a new routine.',
	},
	'menu.ordre': { fr: 'Ordre du paquet', en: 'Deck order' },
	'menu.ordreVide': { fr: 'Vide : mélangé à chaque routine', en: 'Empty: shuffled every routine' },
	'menu.ordreMelange': { fr: 'Aucun ordre réglé : le paquet est mélangé, autrement, à chaque nouvelle routine.', en: 'No order set: the deck is shuffled, differently, for every new routine.' },
	'menu.ordreEffacer': { fr: 'Mélanger à chaque routine', en: 'Shuffle every routine' },
	'menu.ordreAide': {
		fr: 'Par défaut, le paquet est mélangé à chaque routine. Pour un ordre fixe (un chapelet mémorisé) : les 52 cartes de la 1re à la dernière, séparées par des espaces : la valeur (A, 2 … 10, V, D, R) puis la famille (P pique, C cœur, K carreau, T trèfle), ou son symbole. Exemple : AP 10C DK RT.',
		en: 'By default, the deck is shuffled for every routine. For a fixed order (a memorised stack): the 52 cards from first to last, separated by spaces: the value (A, 2 … 10, J, Q, K) then the suit (S, H, D, C), or its symbol. Example: AS 10H QD KC.',
	},
	'menu.ordreBon': { fr: '52 cartes : l\'ordre est enregistré.', en: '52 cards: the order is saved.' },
	'faute.illisible': { fr: 'Illisible :', en: 'Unreadable:' },
	'faute.double': { fr: 'En double :', en: 'Twice:' },
	'faute.manquantes': { fr: 'Manquantes :', en: 'Missing:' },
	'faute.attente': { fr: 'L\'ordre enregistré reste celui d\'avant, jusqu\'à ce que celui-ci soit complet.', en: 'The saved order stays the previous one until this one is complete.' },
	'menu.couleur': { fr: 'Couleur du dos', en: 'Back colour' },
	'menu.aides': {
		fr: 'Aides visuelles : à masquer avant de jouer si le public voit l\'écran.',
		en: 'Visual aids: hide them before performing if the audience can see the screen.',
	},
	'menu.jauge': { fr: 'Jauge de l\'appui long', en: 'Long-press gauge' },
	'menu.vibration': { fr: 'Vibrer si les réponses ne donnent aucune carte', en: 'Vibrate if the answers match no card' },
	'menu.vibrationAide': {
		fr: 'Douze combinaisons de réponses ne sont celles d\'aucune carte : la photo ne bouge pas, et le téléphone vibre (sur iPhone, il ne vibre pas : seule la photo qui ne bouge pas le dit). Défilez vers la droite pour revenir aux questions d\'avant.',
		en: 'Twelve answer combinations match no card: the photo does not move, and the phone vibrates (an iPhone does not vibrate: only the photo standing still tells you). Swipe right to go back to the earlier questions.',
	},
	'menu.defauts': { fr: 'Rétablir les réglages par défaut', en: 'Restore default settings' },

	/*
	 * Couleurs du dos. Ces noms ne sont pas écrits dans les réglages, où chaque bouton montre le dos
	 * lui-même : ils servent d'étiquette aux lecteurs d'écran.
	 */
	'couleur.rouge': { fr: 'Rouge', en: 'Red' },
	'couleur.bleu': { fr: 'Bleu', en: 'Blue' },
	'couleur.noir': { fr: 'Noir', en: 'Black' },

	// Pour les lecteurs d'écran seulement.
	'annonce.photo': { fr: 'Photo', en: 'Photo' },
	'carte.dos': { fr: 'Une carte face en bas', en: 'A face-down card' },
} as const satisfies Record<string, Texte>;

export type CleInterface = keyof typeof INTERFACE;

/** Texte de l'interface dans la langue demandée. */
export const ui = textesInterface(INTERFACE);

/** Une faute de l'ordre écrit à la main, en une ligne. */
export function texteDeLaFaute(faute: Faute, langue: Lang): string {
	switch (faute.type) {
		case 'illisible': return `${ui('faute.illisible', langue)} ${faute.jeton}`;
		case 'double': return `${ui('faute.double', langue)} ${faute.jeton}`;
		case 'manquantes': return `${ui('faute.manquantes', langue)} ${faute.cartes.join(' ')}`;
	}
}
