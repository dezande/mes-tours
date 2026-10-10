/*
 * Une carte des trois questions : les faces Bicycle des trois paquets (trois-paquets/components/Carte.tsx :
 * FaceBicycle, avec la dame et le roi), et le dos Rider de la Princesse. Les styles des faces et du dos sont ceux de la Princesse, chargés sous
 * .scene-trois-questions (styles/tours/trois-questions/_index.scss).
 *
 *   .carte[.retournee]      la carte, face en l'air si .retournee ; posée par son conteneur
 *     .carte-pivot          la retourne (rotateY)
 *       .carte-face.dos     le dos, dans la couleur des réglages (seulement sur une carte qui se retourne)
 *       .carte-face.avant   la face
 */

import type { Lang } from '../../../logic/i18n.ts';
import { Dos } from '../../princesse/components/DessinsDeCarte.tsx';
import { FaceBicycle } from '../../trois-paquets/components/Carte.tsx';
import { nomDeCarte, type Carte as CarteAJouer } from '../../princesse/logic/cartes.ts';
import { ui } from '../content/interface.ts';
import { idDeCarte } from '../logic/paquet.ts';
import type { Couleur } from '../logic/settings.ts';

interface Props {
	carte: CarteAJouer;
	langue: Lang;
	/** Une carte qui se retourne (celle du spectateur) : son dos, dans cette couleur. Les autres sont faces en l'air. */
	dos?: Couleur;
	/** Face en l'air (toujours, pour une carte sans dos). */
	retournee?: boolean;
	id?: string;
	className?: string;
	/** Les propriétés CSS de sa place (--rang, --dx, --dy, --rot). */
	style?: Record<string, string>;
}

export function Carte({ carte, langue, dos, retournee = true, id, className, style }: Props) {
	const visible = !dos || retournee;
	return (
		<article
			id={id}
			className={`carte${visible ? ' retournee' : ''}${className ? ` ${className}` : ''}`}
			data-couleur={dos}
			data-carte={idDeCarte(carte)}
			aria-roledescription="carte"
			aria-label={visible ? nomDeCarte(carte, langue) : ui('carte.dos', langue)}
			style={style}
		>
			<div className="carte-pivot">
				{dos && <div className="carte-face dos"><Dos /></div>}
				<div className="carte-face avant"><FaceBicycle carte={carte} /></div>
			</div>
		</article>
	);
}
