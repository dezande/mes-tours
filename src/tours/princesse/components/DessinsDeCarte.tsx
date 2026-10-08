/*
 * Les deux côtés d'une carte : le dos, une photo, et la face, en SVG — index dans les coins,
 * enseignes à leur place, ou le valet. Les tracés de la face viennent de logic/dessin.ts, les places
 * des enseignes de logic/cartes.ts ; les couleurs sont posées par les classes
 * (styles/tours/princesse/_cartes.scss).
 *
 * La face est un dessin vectoriel : nette à toutes les tailles d'écran, elle ne pèse rien dans le
 * cache hors-ligne. Le dos est la photo d'un vrai dos Rider de Bicycle, empaquetée avec l'app.
 */

import photoDuDos from '../../../assets/images/princesse/dos.jpg';
import { CADRE_FIGURE, DEMI_VALET, ENSEIGNE, partage } from '../logic/dessin.ts';
import { estFigure, estRouge, indexDeCarte, placesDesEnseignes, type Carte, type Enseigne } from '../logic/cartes.ts';

/**
 * Le dos : la photo, bleue. Rouge ou noir, elle est passée en niveaux de gris puis teinte par le
 * calque .teinte, qui suit le data-couleur de la carte ou de la vignette.
 */
export function Dos() {
	return (
		<>
			<img className="photo-du-dos" src={photoDuDos} alt="" draggable={false} />
			<span className="teinte" aria-hidden="true" />
		</>
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

/**
 * Le valet : son cadre, sa moitié haute, et la même tête-bêche, partagées en biais ; le grand
 * carreau dans le coin du cadre, et son reflet dans le coin opposé.
 */
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
			<path className="milieu" d={`M${x} ${partage(x)}L${x + l} ${partage(x + l)}`} />
			<EnseigneEn enseigne={enseigne} x={x + 8.5} y={y + 9.5} taille={14} />
			<EnseigneEn enseigne={enseigne} x={x + l - 8.5} y={y + h - 9.5} taille={14} retourne />
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
