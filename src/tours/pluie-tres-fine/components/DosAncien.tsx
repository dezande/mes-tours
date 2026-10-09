/*
 * Le dos « pluie très fine » (logic/dos.ts), en SVG : sur la carte comme sur les vignettes des
 * réglages. Il est imprimé à l'encre de la carte (currentColor : --encre-dos, d'après la couleur
 * réglée, styles/tours/pluie-tres-fine/_cartes.scss) sur son papier (--papier-dos).
 */

import { dessinDuDos } from '../logic/dos.ts';

// Le dessin ne change jamais : calculé une fois pour toutes les cartes.
const DOS = dessinDuDos();

export function DosAncien() {
	return (
		<svg className="dos-ancien" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
			<rect width="100" height="140" fill="var(--papier-dos)" />
			<path className="pluie" d={DOS.pluie} fill="none" stroke="currentColor" stroke-width=".34" />
			<path d={DOS.reserves} fill="var(--papier-dos)" />
			<path d={DOS.filets} fill="none" stroke="currentColor" stroke-width=".7" />
			<path d={DOS.rosace} fill="currentColor" />
		</svg>
	);
}
