/*
 * Le dos « Arcade » (logic/arcade.ts), en SVG de carrés nets, à toutes les tailles. Ses couleurs
 * viennent de la carte (--arcade-fond, --arcade-clair, --arcade-sombre : styles/tours/cinq-cartes/
 * _balatro.scss), d'après la couleur de dos réglée.
 */

import { cheminDesPixels, grilleDuDos, HAUTEUR, LARGEUR } from '../logic/arcade.ts';

// Le dessin ne change jamais : calculé une fois pour toutes les cartes.
const GRILLE = grilleDuDos();
const CLAIR = cheminDesPixels(GRILLE, 'c');
const SOMBRE = cheminDesPixels(GRILLE, 's');

export function DosArcade() {
	return (
		<svg className="dos-arcade" viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">
			<rect width={LARGEUR} height={HAUTEUR} fill="var(--arcade-fond)" />
			<path d={SOMBRE} fill="var(--arcade-sombre)" />
			<path d={CLAIR} fill="var(--arcade-clair)" />
		</svg>
	);
}

