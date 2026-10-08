/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonction pure : testée sous Node (tests/tours/princesse/keys.test.ts).
 *
 * Les chiffres 1 à 5 sont les cinq places, de gauche à droite : « 1 » touche la carte de la première
 * place (colonneDeLaTouche donne son rang, de 0 à 4). « V » fait un double toucher sur la première
 * carte encore face en bas : il la retourne, et cache le valet. Les touches de
 * « suivant » retournent les cartes au départ.
 */

/** Une colonne, de « 1 » (à gauche) à « 5 » (à droite). */
export type Touche = '1' | '2' | '3' | '4' | '5';
export type KeyAction = 'montrer' | 'remettre' | 'valet' | 'menu' | Touche | null;

const KEYS: Record<string, KeyAction> = {
	1: '1',
	2: '2',
	3: '3',
	4: '4',
	5: '5',
	v: 'valet',
	V: 'valet',
	// Montrer les cartes, au départ de la routine.
	ArrowRight: 'montrer',
	ArrowDown: 'montrer',
	PageDown: 'montrer',
	' ': 'montrer',
	Enter: 'montrer',
	// Remettre les cinq cartes faces en bas : au clavier seulement, aucun geste de la scène ne le fait.
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

/** La colonne d'une touche de chiffre, de 0 (à gauche) à 4 ; null pour une autre action. */
export function colonneDeLaTouche(action: Exclude<KeyAction, null>): number | null {
	return /^[1-5]$/.test(action) ? Number(action) - 1 : null;
}
