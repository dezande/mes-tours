/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonctions pures : testées sous Node (tests/tours/pluie-tres-fine/keys.test.ts).
 *
 * Pour répéter sur ordinateur : P, C, T et D retournent la carte sur la Dame de pique, de cœur, de
 * trèfle ou de carreau (D pour « diamonds »), comme un toucher dans le coin de la famille. Aucune
 * touche ne remet la carte face cachée : la Dame révélée ne change plus, jusqu'au retour au menu.
 */

import type { Couleur } from './routine.ts';

export type KeyAction = Couleur | 'menu' | null;

const KEYS: Record<string, KeyAction> = {
	p: 'pique',
	P: 'pique',
	c: 'coeur',
	C: 'coeur',
	t: 'trefle',
	T: 'trefle',
	d: 'carreau',
	D: 'carreau',
	Escape: 'menu',
	m: 'menu',
	M: 'menu',
};

export function keyAction(key: string): KeyAction {
	return Object.hasOwn(KEYS, key) ? KEYS[key]! : null;
}
