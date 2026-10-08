/*
 * Les cinq cartes, en ligne sur le tapis : leur dos, leur avant (blanc, ou la carte du
 * spectateur) et le retournement. L'état de la routine est décidé par logic/routine.ts (testé
 * sous Node) et tenu par le tour (index.tsx) ; ce composant ne fait que montrer les cartes.
 *
 * La rangée est celle de Princesse : les cinq cartes côte à côte, chacune un peu de travers, sans
 * jamais se toucher (logic/disposition.ts). Chaque carte est celle des tours de cartes
 * (styles/components/_cartes.scss) :
 *   .carte            la carte, à sa place dans la rangée (--x, --y, --rot)
 *     .carte-pivot    la retourne (rotateY), en conservant la perspective
 *       .carte-face.dos     le dos, seul visible tant que la carte n'est pas retournée
 *       .carte-face.avant   blanc, ou la carte du spectateur (FaceDeCarte)
 */

import type { Ref } from 'preact';
import { DosDeCarte } from '../../../components/cartes/DosDeCarte.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import type { Position } from '../logic/disposition.ts';
import { nomDeLaCarte, ui } from '../content/interface.ts';
import { estRetournee, faceDe, NOMBRE, type Etat } from '../logic/routine.ts';
import { rangDeLaPlace, type Dessin, type Sens, type Teinte } from '../logic/settings.ts';
import { DosArcade } from './DosArcade.tsx';
import { FaceDeCarte } from './FaceDeCarte.tsx';

interface Props {
	etat: Etat;
	/** Chaque place de la rangée, un peu de travers. */
	places: readonly Position[];
	/** Le bord d'où part le codage : la place de chaque carte en dépend. */
	sens: Sens;
	/** Sans transition : les cartes reviennent face cachée d'un coup (ouverture, remise en place). */
	sansAnimation: boolean;
	langue: Lang;
	motif: Dessin;
	couleur: Teinte;
	/** La rangée, que le tour mesure pour savoir quelle carte est touchée. */
	rangeeRef: Ref<HTMLDivElement>;
}

const RANGS = Array.from({ length: NOMBRE }, (_, i) => i);

export function Rangee({ etat, places, sens, sansAnimation, langue, motif, couleur, rangeeRef }: Props) {
	return (
		<div id="rangee" ref={rangeeRef} className={sansAnimation ? 'no-anim' : undefined}>
			{/* Les cartes dans l'ordre de la table, de gauche à droite : chacune avec son rang du codage. */}
			{RANGS.map((place) => {
				const i = rangDeLaPlace(place, sens);
				const retournee = estRetournee(etat, i);
				const face = faceDe(etat, i);
				const { x, y, rot } = places[place] ?? { x: 0, y: 0, rot: 0 };
				return (
					<article key={i} className={`carte${retournee ? ' retournee' : ''}${face ? ' spectateur' : ''}`} data-index={i} data-place={place} data-couleur={couleur} aria-roledescription="carte"
						style={{ '--x': x.toFixed(3), '--y': y.toFixed(3), '--rot': rot.toFixed(2) }}>
						<div className="carte-pivot">
							<div className="carte-face dos" data-motif={motif} aria-hidden={retournee}>
								{motif === 'arcade' ? <DosArcade /> : <DosDeCarte dessin={motif} />}
							</div>
							{/* La carte du spectateur est écrite dès qu'elle est la seule face cachée : prête quand elle se retourne. */}
							<div className="carte-face avant" aria-hidden={!retournee} aria-label={retournee ? (face ? nomDeLaCarte(face, langue) : ui('carte.blanche', langue)) : undefined}>
								{face && <FaceDeCarte carte={face} langue={langue} />}
							</div>
						</div>
					</article>
				);
			})}
		</div>
	);
}

/** Ce qui est à l'écran, pour les lecteurs d'écran seulement. */
export function annonce(etat: Etat, langue: Lang): string {
	// La dernière carte retournée face en l'air.
	const derniere = [...etat.retournees].reverse().find((i) => estRetournee(etat, i));
	if (derniere === undefined) return ui('carte.dos', langue);
	const face = faceDe(etat, derniere);
	return face ? nomDeLaCarte(face, langue) : ui('carte.blanche', langue);
}
