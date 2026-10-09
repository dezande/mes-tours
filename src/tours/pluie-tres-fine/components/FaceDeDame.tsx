/*
 * La face de la carte : la Dame de la famille choisie, imprimée comme sur un jeu des années 1950
 * et 1960. Le dessin vient de logic/dame.ts : les index des deux coins (D ou Q, et l'enseigne), le
 * cadre de la figure coupé à la taille, la demi-figure reprise tête-bêche, l'enseigne et le nom de
 * la reine dans le cadre (en français seulement : les jeux anglais ne les nomment pas).
 *
 * L'allure ancienne : chaque aplat est posé un peu de travers sur son trait (le repérage des presses
 * de l'époque), le papier a son grain et quelques rousseurs, l'encre noire est un peu passée. Les
 * couleurs sont peintes par styles/tours/pluie-tres-fine/_dame.scss (--dame-*), d'après data-couleur.
 */

import type { Lang } from '../../../logic/i18n.ts';
import { SYMBOLES } from '../../cinq-cartes/logic/faces.ts';
import { indexDeLaDame } from '../content/interface.ts';
import { CADRE, DEMI_FIGURE, NOMS, rond, TAILLE } from '../logic/dame.ts';
import type { Couleur } from '../logic/routine.ts';

/** Le décalage des aplats sur le trait : le repérage approximatif des presses. */
const REPERAGE = 'translate(.45 .3)';

/** Une enseigne de `taille`, centrée en (x, y). */
function Enseigne({ couleur, x, y, taille }: { couleur: Couleur; x: number; y: number; taille: number }) {
	return <path className="enseigne" d={SYMBOLES[couleur]} transform={`translate(${x} ${y}) scale(${taille})`} />;
}

/** L'index d'un coin : la lettre, et l'enseigne dessous. Le coin du bas est le même, tête-bêche. */
function Index({ texte, couleur }: { texte: string; couleur: Couleur }) {
	return (
		<g className="index">
			<text x="9" y="17.5" text-anchor="middle" font-size="12">{texte}</text>
			<Enseigne couleur={couleur} x={9} y={25} taille={7} />
		</g>
	);
}

/** Quelques rousseurs du papier, toujours aux mêmes places : la carte a vécu. */
const ROUSSEURS = rond(78, 104, 1.6) + rond(81, 101, .7) + rond(24, 33, 1.1) + rond(12, 124, 1.3) + rond(63, 12, .8) + rond(88, 70, 1);

/** La moitié de la carte, du haut à la taille : la figure, l'enseigne et le nom dans le cadre. */
function Moitie({ couleur, langue }: { couleur: Couleur; langue: Lang }) {
	return (
		<g className="moitie">
			{DEMI_FIGURE.map((element, i) => (
				<g key={i}>
					{element.aplat && element.trait > 0 && <path d={element.d} transform={REPERAGE} fill={`var(--dame-${element.aplat})`} />}
					{element.trait > 0
						? <path d={element.d} fill="none" stroke={element.encre ? `var(--dame-${element.encre})` : 'var(--dame-trait)'} stroke-width={element.trait} stroke-linejoin="round" stroke-linecap="round" />
						: element.aplat && <path d={element.d} fill={`var(--dame-${element.aplat})`} />}
				</g>
			))}
			{/* L'enseigne en haut du cadre, à gauche de la tête ; le nom de la reine le long du bord droit. */}
			<Enseigne couleur={couleur} x={23.5} y={17.5} taille={8} />
			{langue === 'fr' && (
				<text className="nom" x="0" y="0" font-size="4.6" transform="translate(80.2 13) rotate(90)">{NOMS[couleur]}</text>
			)}
		</g>
	);
}

export function FaceDeDame({ couleur, langue }: { couleur: Couleur; langue: Lang }) {
	const texte = indexDeLaDame(langue);
	return (
		<svg className="face-dame" viewBox="0 0 100 140" preserveAspectRatio="none" data-couleur={couleur} data-valeur="12" aria-hidden="true">
			<path className="rousseurs" d={ROUSSEURS} />
			{/* Rouge ou noire : la couleur des index et des enseignes (styles/tours/pluie-tres-fine/_dame.scss). */}
			<g className="encre-enseigne">
				<Index texte={texte} couleur={couleur} />
				<g transform="rotate(180 50 70)"><Index texte={texte} couleur={couleur} /></g>
			</g>
			<Moitie couleur={couleur} langue={langue} />
			<g transform="rotate(180 50 70)"><Moitie couleur={couleur} langue={langue} /></g>
			{/* Le cadre de la figure, et la ligne qui la coupe à la taille. */}
			<rect className="cadre" x={CADRE.x} y={CADRE.y} width={CADRE.largeur} height={CADRE.hauteur} rx="1.5" fill="none" stroke-width=".8" />
			<path className="cadre" d={`M${CADRE.x} ${TAILLE}H${CADRE.x + CADRE.largeur}`} stroke-width=".6" />
		</svg>
	);
}
