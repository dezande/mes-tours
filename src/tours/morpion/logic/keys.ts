/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonction pure : testée sous Node (tests/tours/morpion/keys.test.ts).
 *
 * Comme à l'écran, le haut donne la grille du haut et le bas celle du bas : sur une télécommande,
 * « précédent » (Page précédente) donne celle du haut et « suivant » (Page suivante) celle du bas.
 */

export type KeyAction = 'haut' | 'bas' | 'cacher' | 'menu' | null;

const KEYS: Record<string, KeyAction> = {
	ArrowUp: 'haut',
	PageUp: 'haut',
	ArrowDown: 'bas',
	PageDown: 'bas',
	// Remettre le papier sur « Prédiction » (l'équivalent du double toucher).
	Home: 'cacher',
	r: 'cacher',
	R: 'cacher',
	Escape: 'menu',
	m: 'menu',
	M: 'menu',
};

export function keyAction(key: string): KeyAction {
	return Object.hasOwn(KEYS, key) ? KEYS[key] : null;
}
