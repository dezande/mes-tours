/*
 * ORIENTATION DE L'APP : les calculs des deux verrous, sans DOM, testés sous Node
 * (tests/logic/orientation.test.ts).
 *
 * - Verrou portrait, pour toute l'app : sur un téléphone tourné en paysage, l'affichage pivote pour
 *   rester dans l'axe du téléphone (iOS ne permet pas à une page web de verrouiller l'orientation).
 * - Verrou paysage, pour un tour qui se joue téléphone tenu en largeur (la carte de visite) : l'app
 *   installée est verrouillée en portrait (manifest.json), donc tenu en largeur, le téléphone garde
 *   un écran en portrait. Toute la scène pivote alors d'un quart de tour, le haut de la scène du côté
 *   droit de l'écran : c'est le côté qui monte quand on tourne le téléphone vers la gauche, le
 *   paysage habituel. Si l'écran est déjà en paysage (navigateur non verrouillé), rien ne pivote.
 */

/** Rotation appliquée à l'app, en degrés : 0 (portrait), -90 ou 90. */
export type Rotation = 0 | -90 | 90;

export interface Viewport {
	/** Taille de la fenêtre, en pixels CSS. */
	width: number;
	height: number;
	/** Angle de l'écran (screen.orientation.angle) : 0, 90, 180 ou 270 (parfois -90). */
	angle: number;
	/** Écran tactile (pointeur grossier) : sur ordinateur, on ne pivote jamais. */
	touch: boolean;
}

/**
 * Rotation qui garde l'affichage en portrait par rapport au téléphone.
 * Téléphone tourné vers la gauche (angle 90) : le haut du téléphone est à gauche de l'écran,
 * l'app pivote de -90°. Vers la droite (angle 270) : +90°.
 */
export function portraitRotation({ width, height, angle, touch }: Viewport): Rotation {
	if (!touch || width <= height) return 0;
	const normalized = ((angle % 360) + 360) % 360;
	return normalized === 270 ? 90 : -90;
}

/** Rotation qui met la scène en paysage : 90° sur un écran en portrait, rien sinon. */
export function landscapeRotation(width: number, height: number): Rotation {
	return width < height ? 90 : 0;
}

/** Taille de l'app une fois pivotée : largeur et hauteur échangées en paysage. */
export function appSize(viewport: Viewport, rotation: Rotation): { width: number; height: number } {
	return rotation === 0
		? { width: viewport.width, height: viewport.height }
		: { width: viewport.height, height: viewport.width };
}

/** Point de l'écran (clientX, clientY) exprimé dans le repère de l'app pivotée. */
export function toAppPoint(x: number, y: number, viewport: Viewport, rotation: Rotation): { x: number; y: number } {
	switch (rotation) {
		case 0: return { x, y };
		// Haut de l'app à gauche de l'écran, gauche de l'app en bas de l'écran.
		case -90: return { x: viewport.height - y, y: x };
		// Haut de l'app à droite de l'écran, gauche de l'app en haut de l'écran.
		case 90: return { x: y, y: viewport.width - x };
	}
}
