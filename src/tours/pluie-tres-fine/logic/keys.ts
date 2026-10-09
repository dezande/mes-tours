/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonctions pures : testées sous Node (tests/tours/pluie-tres-fine/keys.test.ts).
 *
 * Pour répéter sur ordinateur : P, C, T et D retournent la carte sur la Dame de pique, de cœur, de
 * trèfle ou de carreau (D pour « diamonds »), comme un toucher dans le coin de la famille.
 */

import type { Couleur } from './routine.ts';

export type KeyAction = Couleur | 'remettre' | 'menu' | null;

const KEYS: Record<string, KeyAction> = {
	p: 'pique',
	P: 'pique',
	c: 'coeur',
	C: 'coeur',
	t: 'trefle',
	T: 'trefle',
	d: 'carreau',
	D: 'carreau',
	// La carte face cachée (l'équivalent du double toucher).
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
