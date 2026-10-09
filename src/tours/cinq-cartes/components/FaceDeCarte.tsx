/*
 * La face de la carte du spectateur, en SVG : les index des deux coins, puis les symboles de l'As
 * au 10 à leur place, ou, pour une figure, son personnage en pixels dans un cadre (logic/figures.ts) ;
 * chacun des cinq Jokers a le sien, sa couleur et son cadre, et « JOKER » écrit en colonne dans
 * ses coins. Le dessin
 * (symboles, places, index) vient de logic/faces.ts ; il s'étire avec la carte, sans rien à
 * mesurer au moment où elle se retourne.
 */

import type { Lang } from '../../../logic/i18n.ts';
import { cheminDesPixels } from '../logic/arcade.ts';
import { estFigure, estRouge, index, placesDesSymboles, SYMBOLES } from '../logic/faces.ts';
import { grilleDeFigure, grilleDeJoker, HAUTEUR_FIGURE, LARGEUR_FIGURE, NOMBRE_DE_JOKERS, TEINTES_FIGURE } from '../logic/figures.ts';
import { estJoker, type CarteJouee, type Couleur } from '../logic/routine.ts';

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

/** L'index des coins du Joker : « JOKER », une lettre sous l'autre. Le coin du bas est le même, tête-bêche. */
function IndexJoker() {
	return (
		<g className="index">
			{[...'JOKER'].map((lettre, n) => <text key={n} x="10" y={17 + n * 11} text-anchor="middle" font-size="12">{lettre}</text>)}
		</g>
	);
}

/** La taille d'un pixel des figures, dans le repère de la carte (100 × 140). */
const PIXEL = 3;
/** Où commence la demi-figure du haut : centrée, contre le haut du cadre. */
const ORIGINE = { x: 50 - (LARGEUR_FIGURE * PIXEL) / 2, y: 70 - HAUTEUR_FIGURE * PIXEL };

type Pixels = readonly (readonly [string, string])[];
/** Les pixels d'une demi-figure : un chemin par couleur. */
const pixels = (grille: string[]): Pixels => TEINTES_FIGURE.map((teinte) => [teinte, cheminDesPixels(grille, teinte)] as const);
/** Ceux de chaque figure et de chaque Joker, une fois pour toutes. */
const FIGURES = new Map([11, 12, 13].map((valeur) => [valeur, pixels(grilleDeFigure(valeur))]));
const JOKERS = Array.from({ length: NOMBRE_DE_JOKERS }, (_, variante) => pixels(grilleDeJoker(variante)));

/**
 * Le personnage d'une figure ou d'un Joker : la demi-figure en haut, la même tête-bêche en bas. Les
 * habits prennent la couleur de l'enseigne, ou celle du Joker (currentColor), le reste les couleurs
 * des figures (styles/tours/cinq-cartes/_balatro.scss : --fig-*).
 */
function Personnage({ pixels }: { pixels: Pixels | undefined }) {
	const moitie = (
		<g transform={`translate(${ORIGINE.x} ${ORIGINE.y}) scale(${PIXEL})`} shape-rendering="crispEdges">
			{pixels?.map(([teinte, d]) => d && <path key={teinte} d={d} fill={teinte === 'c' ? 'currentColor' : `var(--fig-${teinte})`} />)}
		</g>
	);
	return (
		<g className="personnage">
			{moitie}
			<g transform="rotate(180 50 70)">{moitie}</g>
		</g>
	);
}

/** Le cadre des figures, autour du personnage. */
const CADRE = { x: 24, y: 14, width: 52, height: 112 } as const;

/**
 * Le cadre de chaque Joker, pour qu'aucun ne ressemble à un autre : son arrondi, un fond teinté de
 * sa couleur, et parfois un second filet ou des pointillés.
 */
const CADRES_JOKER: readonly { rx: number; fond: number; double?: boolean; tirets?: string }[] = [
	{ rx: 3, fond: .1 },
	{ rx: 0, fond: .14, double: true },
	{ rx: 10, fond: .12, tirets: '4 2.5' },
	{ rx: 0, fond: .18, tirets: '1.5 1.5' },
	{ rx: 6, fond: .1, double: true },
];

/** Le Joker `variante` : « JOKER » dans les coins, son personnage dans son cadre. */
function Joker({ variante }: { variante: number }) {
	const cadre = CADRES_JOKER[variante] ?? CADRES_JOKER[0]!;
	return (
		<g className="joker">
			<IndexJoker />
			<g transform="rotate(180 50 70)"><IndexJoker /></g>
			<rect {...CADRE} rx={cadre.rx} fill="currentColor" fill-opacity={cadre.fond} />
			<g className="figure" data-figure="joker">
				<Personnage pixels={JOKERS[variante]} />
			</g>
			<rect {...CADRE} rx={cadre.rx} fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray={cadre.tirets} />
			{cadre.double && <rect x={CADRE.x + 2.5} y={CADRE.y + 2.5} width={CADRE.width - 5} height={CADRE.height - 5} rx={Math.max(0, cadre.rx - 2)} fill="none" stroke="currentColor" stroke-width=".7" />}
		</g>
	);
}

/**
 * La face d'une carte. Un Joker n'a pas d'enseigne : `variante` (0 à 4) choisit lequel des cinq
 * Jokers, et sa couleur (styles/tours/cinq-cartes/_balatro.scss : data-joker).
 */
export function FaceDeCarte({ carte, langue, variante = 0 }: { carte: CarteJouee; langue: Lang; variante?: number }) {
	const { valeur, couleur } = carte;
	if (estJoker(carte)) {
		const joker = ((variante % NOMBRE_DE_JOKERS) + NOMBRE_DE_JOKERS) % NOMBRE_DE_JOKERS;
		return (
			<svg className="face-carte" viewBox="0 0 100 140" preserveAspectRatio="none" data-valeur="joker" data-joker={joker} aria-hidden="true">
				<g fill="currentColor"><Joker variante={joker} /></g>
			</svg>
		);
	}
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
							<Personnage pixels={FIGURES.get(valeur)} />
							<rect {...CADRE} rx="3" fill="none" stroke="currentColor" stroke-width="1.2" />
						</g>
					)
					: placesDesSymboles(valeur).map((place, n) => (
						<Symbole key={n} couleur={couleur} x={place.x} y={place.y} taille={valeur === 1 ? 46 : 16} retourne={place.retourne} />
					))}
			</g>
		</svg>
	);
}
