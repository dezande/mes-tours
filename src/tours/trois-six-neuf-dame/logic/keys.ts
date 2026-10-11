/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonctions pures : testées sous Node (tests/tours/trois-six-neuf-dame/keys.test.ts).
 *
 * Pour répéter sur ordinateur : P, C, T et D choisissent le coin du prochain toucher (pique, cœur,
 * trèfle ou carreau, D pour « diamonds ») ; 1 à 5 touchent ensuite la carte de ce rang (1 : l'As,
 * 5 : la Dame, quel que soit le bord réglé), dans ce coin, ou en haut à gauche si aucun n'a été choisi.
 */

import type { Couleur } from './routine.ts';

export type KeyAction = '1' | '2' | '3' | '4' | '5' | Couleur | 'remettre' | 'menu' | null;

const KEYS: Record<string, KeyAction> = {
	1: '1',
	2: '2',
	3: '3',
	4: '4',
	5: '5',
	p: 'pique',
	P: 'pique',
	c: 'coeur',
	C: 'coeur',
	t: 'trefle',
	T: 'trefle',
	d: 'carreau',
	D: 'carreau',
	// Remettre les cinq cartes face cachée.
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

/** Le rang de la carte que touche une touche de 1 à 5, ou null pour une touche de coin. */
export const rangDeLaTouche = (action: Exclude<KeyAction, 'remettre' | 'menu' | null>): number | null =>
	(/^[1-5]$/.test(action) ? Number(action) - 1 : null);
