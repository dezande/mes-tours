/*
 * Les deux côtés d'une carte, en SVG : le dos (façon Bicycle, ou l'un de ceux des autres tours de
 * cartes, au choix des réglages), et la face — index dans les coins, enseignes à leur place, ou le
 * valet. Les tracés viennent de logic/dessin.ts, les places des enseignes de logic/cartes.ts ; les
 * couleurs sont posées par les classes (styles/tours/princesse/_cartes.scss).
 *
 * Un dessin vectoriel plutôt qu'une image : net à toutes les tailles d'écran, il ne pèse rien dans
 * le cache hors-ligne.
 */

import { DosDeCarte } from '../../../components/cartes/DosDeCarte.tsx';
import type { Motif } from '../logic/settings.ts';
import { CADRE_FIGURE, DEMI_VALET, DESSIN_DU_DOS, ENSEIGNE } from '../logic/dessin.ts';
import { estFigure, estRouge, indexDeCarte, placesDesEnseignes, type Carte, type Enseigne } from '../logic/cartes.ts';

/**
 * Le dos choisi dans les réglages. Façon Bicycle : marge blanche, champ tramé, médaillons aux roues
 * de bicyclette, fleurons d'angle. Les autres sont ceux des tours de cartes (src/components/cartes/).
 * Les couleurs suivent le data-couleur de la carte ou de la vignette.
 */
export function Dos({ motif }: { motif: Motif }) {
	return motif === 'bicycle' ? <DosBicycle /> : <DosDeCarte dessin={motif} />;
}

function DosBicycle() {
	const d = DESSIN_DU_DOS;
	return (
		<svg className="dos-bicycle" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
			<rect className="marge" width="100" height="140" />
			<path className="champ" d={d.champ} />
			<path className="trame" d={d.trame} />
			<path className="filet" d={d.filet} />
			<path className="fleurons" d={d.fleurons} />
			<path className="medaillons" d={d.medaillons} />
			<path className="cadres" d={d.cadres} />
			<path className="jantes" d={d.jantes} />
			<path className="rayons" d={d.rayons} />
			<path className="moyeux" d={d.moyeux} />
		</svg>
	);
}

/** Une enseigne de `taille` de large, centrée en (x, y), tête-bêche si demandé. */
function EnseigneEn({ enseigne, x, y, taille, retourne = false }: { enseigne: Enseigne; x: number; y: number; taille: number; retourne?: boolean }) {
	const echelle = taille / 100;
	const transformation = `translate(${x} ${y})${retourne ? ' rotate(180)' : ''} scale(${echelle}) translate(-50 -50)`;
	return <path className="enseigne" d={ENSEIGNE[enseigne]} transform={transformation} />;
}

/** L'index d'un coin : la valeur, et l'enseigne en petit dessous. */
function Index({ carte }: { carte: Carte }) {
	const texte = indexDeCarte(carte.valeur);
	return (
		<g className="index">
			{/* « 10 » est serré pour tenir dans la largeur d'une seule lettre. */}
			<text x="10.5" y="17.5" text-anchor="middle" className={texte.length > 1 ? 'serre' : undefined}>{texte}</text>
			<EnseigneEn enseigne={carte.enseigne} x={10.5} y={25.5} taille={9.5} />
		</g>
	);
}

/** Le valet : son cadre, sa moitié haute, et la même tête-bêche ; son enseigne dans le coin du cadre. */
function Valet({ enseigne }: { enseigne: Enseigne }) {
	const { x, y, l, h } = CADRE_FIGURE;
	const moitie = DEMI_VALET.map((piece, i) => (
		<path key={i} className={`${piece.teinte}${piece.trait ? ' trait' : ''}`} d={piece.d} />
	));
	return (
		<g className="figure">
			<rect className="fond-figure" x={x} y={y} width={l} height={h} />
			<g>{moitie}</g>
			<g transform="rotate(180 50 70)">{moitie}</g>
			<path className="milieu" d={`M${x} 70H${x + l}`} />
			<EnseigneEn enseigne={enseigne} x={x + 7} y={y + 7.5} taille={9} />
			<EnseigneEn enseigne={enseigne} x={x + l - 7} y={y + h - 7.5} taille={9} retourne />
			<rect className="cadre-figure" x={x} y={y} width={l} height={h} />
		</g>
	);
}

/** La face : l'index dans deux coins opposés, puis les enseignes ou la figure. */
export function FaceDeCarte({ carte }: { carte: Carte }) {
	return (
		<svg className={`face ${estRouge(carte.enseigne) ? 'rouge' : 'noire'}`} viewBox="0 0 100 140" aria-hidden="true">
			<Index carte={carte} />
			<g transform="rotate(180 50 70)"><Index carte={carte} /></g>
			{estFigure(carte.valeur)
				? <Valet enseigne={carte.enseigne} />
				: placesDesEnseignes(carte.valeur).map(({ x, y, retourne }, i) => (
					<EnseigneEn key={i} enseigne={carte.enseigne} x={x} y={y} taille={carte.valeur === '10' ? 16 : 18} retourne={retourne} />
				))}
		</svg>
	);
}
