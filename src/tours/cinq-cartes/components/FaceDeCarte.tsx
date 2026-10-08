/*
 * La face de la carte du spectateur, en SVG : les index des deux coins, puis les symboles de l'As
 * au 10 à leur place, ou, pour une figure, son personnage en pixels dans un cadre (logic/figures.ts). Le dessin
 * (symboles, places, index) vient de logic/faces.ts ; il s'étire avec la carte, sans rien à
 * mesurer au moment où elle se retourne.
 */

import type { Lang } from '../../../logic/i18n.ts';
import { cheminDesPixels } from '../logic/arcade.ts';
import { estFigure, estRouge, index, placesDesSymboles, SYMBOLES } from '../logic/faces.ts';
import { grilleDeFigure, HAUTEUR_FIGURE, LARGEUR_FIGURE, TEINTES_FIGURE } from '../logic/figures.ts';
import type { CarteJouee, Couleur } from '../logic/routine.ts';

/** Un symbole de `taille` centré en (x, y), tête-bêche s'il le faut. */
function Symbole({ couleur, x, y, taille, retourne = false }: { couleur: Couleur; x: number; y: number; taille: number; retourne?: boolean }) {
	return <path d={SYMBOLES[couleur]} transform={`translate(${x} ${y}) scale(${retourne ? -taille : taille})`} />;
}

/** L'index d'un coin : la valeur, et son petit symbole dessous. Le coin du bas est le même, tête-bêche. */
function Index({ texte, couleur }: { texte: string; couleur: Couleur }) {
	return (
		<g className="index">
			{/* De grands index, lisibles de loin : « 10 », plus large, un peu plus petit. */}
			<text x="12" y="24" text-anchor="middle" font-size={texte.length > 1 ? 16 : 21}>{texte}</text>
			<Symbole couleur={couleur} x={12} y={35} taille={12} />
		</g>
	);
}

/** La taille d'un pixel des figures, dans le repère de la carte (100 × 140). */
const PIXEL = 3;
/** Où commence la demi-figure du haut : centrée, contre le haut du cadre. */
const ORIGINE = { x: 50 - (LARGEUR_FIGURE * PIXEL) / 2, y: 70 - HAUTEUR_FIGURE * PIXEL };

/** Les pixels de chaque figure, une fois pour toutes : un chemin par couleur. */
const FIGURES = new Map([11, 12, 13].map((valeur) => {
	const grille = grilleDeFigure(valeur);
	return [valeur, TEINTES_FIGURE.map((teinte) => [teinte, cheminDesPixels(grille, teinte)] as const)];
}));

/**
 * Le personnage d'une figure : la demi-figure en haut, la même tête-bêche en bas. Les habits
 * prennent la couleur de l'enseigne (currentColor), le reste les couleurs des figures
 * (styles/tours/cinq-cartes/_balatro.scss : --fig-*).
 */
function Personnage({ valeur }: { valeur: number }) {
	const moitie = (
		<g transform={`translate(${ORIGINE.x} ${ORIGINE.y}) scale(${PIXEL})`} shape-rendering="crispEdges">
			{FIGURES.get(valeur)?.map(([teinte, d]) => d && <path key={teinte} d={d} fill={teinte === 'c' ? 'currentColor' : `var(--fig-${teinte})`} />)}
		</g>
	);
	return (
		<g className="personnage">
			{moitie}
			<g transform="rotate(180 50 70)">{moitie}</g>
		</g>
	);
}

export function FaceDeCarte({ carte, langue }: { carte: CarteJouee; langue: Lang }) {
	const { valeur, couleur } = carte;
	const texte = index(valeur, langue);
	return (
		<svg className={`face-carte ${estRouge(couleur) ? 'rouge' : 'noire'}`} viewBox="0 0 100 140" preserveAspectRatio="none" data-couleur={couleur} data-valeur={valeur} aria-hidden="true">
			{/* Rouge ou noir : la couleur du texte (styles/tours/cinq-cartes/_cartes.scss). */}
			<g fill="currentColor">
				<Index texte={texte} couleur={couleur} />
				<g transform="rotate(180 50 70)"><Index texte={texte} couleur={couleur} /></g>
				{estFigure(valeur)
					? (
						<g className="figure" data-figure={valeur}>
							<Personnage valeur={valeur} />
							<rect x="24" y="14" width="52" height="112" rx="3" fill="none" stroke="currentColor" stroke-width="1.2" />
						</g>
					)
					: placesDesSymboles(valeur).map((place, n) => (
						<Symbole key={n} couleur={couleur} x={place.x} y={place.y} taille={valeur === 1 ? 46 : 16} retourne={place.retourne} />
					))}
			</g>
		</svg>
	);
}
