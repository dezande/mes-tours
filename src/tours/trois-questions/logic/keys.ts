/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonctions pures : testées sous Node (tests/tours/trois-questions/keys.test.ts).
 *
 * Pour répéter sur ordinateur : → et ← font défiler la galerie ; 1, 2, 3 touchent cette colonne de la
 * photo ; 0 répond « aucune » (comme le double toucher) ; Espace touche la carte du spectateur à la
 * révélation ; R relance la routine.
 */

export type KeyAction = 'suivant' | 'precedent' | 'aucune' | '1' | '2' | '3' | 'centre' | 'remettre' | 'menu' | null;

const KEYS: Record<string, KeyAction> = {
	0: 'aucune',
	1: '1',
	2: '2',
	3: '3',
	ArrowRight: 'suivant',
	PageDown: 'suivant',
	ArrowLeft: 'precedent',
	PageUp: 'precedent',
	' ': 'centre',
	Enter: 'centre',
	// Une nouvelle routine, la première photo (l'équivalent du double toucher sur la carte retournée).
	Home: 'remettre',
	r: 'remettre',
	R: 'remettre',
	Escape: 'menu',
	m: 'menu',
	M: 'menu',
};

export function keyAction(key: string): KeyAction {
	return Object.hasOwn(KEYS, key) ? KEYS[key]! : null;
}

/** La colonne d'une touche de chiffre (1 à 3) ; null pour une autre action. */
export const colonneDeLaTouche = (action: Exclude<KeyAction, null>): number | null => (/^[1-3]$/.test(action) ? Number(action) : null);
