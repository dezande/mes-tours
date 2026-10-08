/*
 * Une carte des trois paquets : le dos et la face d'un jeu Bicycle, ceux de la Princesse
 * (princesse/components/DessinsDeCarte.tsx : la photo du dos Rider, les enseignes à leur place, le
 * valet), et la dame et le roi, dessinés ici (logic/dame.ts, logic/roi.ts). Les styles des faces et du dos sont ceux de la
 * Princesse, chargés sous .scene-trois-paquets (styles/tours/trois-paquets/_index.scss).
 *
 *   .carte[.retournee]      la carte, face en l'air si .retournee ; posée par son conteneur
 *     .carte-pivot          la retourne (rotateY)
 *       .carte-face.dos     le dos, dans la couleur des réglages
 *       .carte-face.avant   la face (absente d'une carte qui reste face en bas)
 */

import type { Lang } from '../../../logic/i18n.ts';
import { Dos, EnseigneEn, FaceDeCarte, Index } from '../../princesse/components/DessinsDeCarte.tsx';
import { estRouge, nomDeCarte, type Carte as CarteAJouer, type Enseigne } from '../../princesse/logic/cartes.ts';
import { CADRE_FIGURE, type Piece } from '../../princesse/logic/dessin.ts';
import { ui } from '../content/interface.ts';
import { DEMI_DAME } from '../logic/dame.ts';
import { DEMI_ROI } from '../logic/roi.ts';
import type { Couleur } from '../logic/settings.ts';

/** La dame ou le roi : son cadre, sa moitié haute, et la même tête-bêche ; son enseigne dans deux coins du cadre. */
function Figure({ moitieHaute, enseigne }: { moitieHaute: readonly Piece[]; enseigne: Enseigne }) {
	const { x, y, l, h } = CADRE_FIGURE;
	const moitie = moitieHaute.map((piece, i) => (
		<path key={i} className={`${piece.teinte}${piece.trait ? ' trait' : ''}`} d={piece.d} />
	));
	return (
		<g className="figure">
			<rect className="fond-figure" x={x} y={y} width={l} height={h} />
			<g>{moitie}</g>
			<g transform="rotate(180 50 70)">{moitie}</g>
			<path className="milieu" d={`M${x} 70H${x + l}`} />
			<EnseigneEn enseigne={enseigne} x={x + l - 8} y={y + 9} taille={12} />
			<EnseigneEn enseigne={enseigne} x={x + 8} y={y + h - 9} taille={12} retourne />
			<rect className="cadre-figure" x={x} y={y} width={l} height={h} />
		</g>
	);
}

/** La face d'une carte, aux faces d'un jeu Bicycle : celle de la Princesse, ou la dame, ou le roi. */
export function FaceBicycle({ carte }: { carte: CarteAJouer }) {
	if (carte.valeur !== 'D' && carte.valeur !== 'R') return <FaceDeCarte carte={carte} />;
	return (
		<svg className={`face ${estRouge(carte.enseigne) ? 'rouge' : 'noire'}`} viewBox="0 0 100 140" aria-hidden="true">
			<Index carte={carte} />
			<g transform="rotate(180 50 70)"><Index carte={carte} /></g>
			<Figure moitieHaute={carte.valeur === 'D' ? DEMI_DAME : DEMI_ROI} enseigne={carte.enseigne} />
		</svg>
	);
}

interface Props {
	/** La carte montrée ; null pour une carte qui reste face en bas (on n'en voit que le dos). */
	carte: CarteAJouer | null;
	couleur: Couleur;
	langue: Lang;
	/** La carte a disparu (panneau 3) : masquée d'un coup, sa place reste vide. */
	disparue?: boolean;
	id?: string;
	/** Les propriétés CSS de sa place (--x, --y, --rot, --z ou --rang). */
	style?: Record<string, string>;
}

export function Carte({ carte, couleur, langue, disparue = false, id, style }: Props) {
	return (
		<article
			id={id}
			className={`carte${carte ? ' retournee' : ''}${disparue ? ' disparue' : ''}`}
			data-couleur={couleur}
			data-carte={carte ? `${carte.valeur}-${carte.enseigne}` : undefined}
			aria-roledescription="carte"
			aria-hidden={disparue}
			aria-label={carte ? nomDeCarte(carte, langue) : ui('carte.dos', langue)}
			style={style}
		>
			<div className="carte-pivot">
				<div className="carte-face dos"><Dos /></div>
				{carte && <div className="carte-face avant"><FaceBicycle carte={carte} /></div>}
			</div>
		</article>
	);
}
