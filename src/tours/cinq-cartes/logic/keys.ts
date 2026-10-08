/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonctions pures : testées sous Node (tests/tours/cinq-cartes/keys.test.ts).
 *
 * Pour répéter sur ordinateur : 1 à 5 touchent la carte de ce rang du codage (1 : celle qui vaut 1,
 * quel que soit le bord d'où part le codage) ; P, C, T et D touchent la cinquième dans le coin de
 * pique, cœur, trèfle ou carreau (D pour « diamonds »).
 */

import { COULEURS, DERNIERE, type Couleur } from './routine.ts';

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
	// Remettre les cinq cartes face cachée (l'équivalent du double toucher).
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

/** La carte que touche une action du clavier, et le coin pour la cinquième. */
export function toucheDeCarte(action: Exclude<KeyAction, 'remettre' | 'menu' | null>): { index: number; couleur?: Couleur } {
	return (COULEURS as readonly string[]).includes(action) ? { index: DERNIERE, couleur: action as Couleur } : { index: Number(action) - 1 };
}
