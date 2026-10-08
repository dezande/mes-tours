/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonction pure : testée sous Node (tests/tours/trois-paquets/keys.test.ts).
 *
 * → et ← font comme un balayage (panneau suivant, précédent) ; 1, 2, 3 touchent le paquet de ce rang
 * sur le panneau 2 ; Espace touche la scène (la carte face en bas disparaît, sur le panneau 3).
 */

export type KeyAction = 'suivant' | 'precedent' | 'toucher' | '1' | '2' | '3' | 'remettre' | 'menu' | null;

const KEYS: Record<string, KeyAction> = {
	1: '1',
	2: '2',
	3: '3',
	ArrowRight: 'suivant',
	PageDown: 'suivant',
	ArrowLeft: 'precedent',
	PageUp: 'precedent',
	' ': 'toucher',
	Enter: 'toucher',
	// Une nouvelle routine, le premier mélange : au clavier seulement, et même une fois la carte
	// disparue, quand plus aucun balayage ne fait rien.
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

/** Le paquet d'une touche de chiffre, de 0 (à gauche) à 2 ; null pour une autre action. */
export function paquetDeLaTouche(action: Exclude<KeyAction, null>): number | null {
	return /^[1-3]$/.test(action) ? Number(action) - 1 : null;
}
