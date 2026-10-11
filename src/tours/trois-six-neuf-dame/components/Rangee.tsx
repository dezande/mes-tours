/*
 * Les cinq cartes, en ligne sur le tapis : leur dos, leur avant (blanc, la carte du spectateur
 * ou « À 1 carte près ») et le retournement. L'état de la routine est décidé
 * par logic/routine.ts (testé sous Node) et tenu par le tour (index.tsx) ; ce composant ne fait que
 * montrer les cartes.
 *
 * La rangée, le dos « Arcade » et la face sont ceux des cinq cartes (src/tours/cinq-cartes/), comme
 * leurs styles (styles/tours/trois-six-neuf-dame/_index.scss les reprend) :
 *   .carte            la carte, à sa place dans la rangée (--x, --y, --rot)
 *     .carte-pivot    la retourne (rotateY), en conservant la perspective
 *       .carte-face.dos     le dos, seul visible tant que la carte n'est pas retournée
 *       .carte-face.avant   blanc, la carte du spectateur (FaceDeCarte), ou .mot-pres
 */

import type { Ref } from 'preact';
import type { Lang } from '../../../logic/i18n.ts';
import { DosArcade } from '../../cinq-cartes/components/DosArcade.tsx';
import { FaceDeCarte } from '../../cinq-cartes/components/FaceDeCarte.tsx';
import type { Position } from '../../cinq-cartes/logic/disposition.ts';
import { nomDeLaCarte, ui } from '../content/interface.ts';
import { aPres, estRetournee, faceDe, NOMBRE, retourneesDe, type Etat } from '../logic/routine.ts';
import { rangDeLaPlace, type Sens, type Teinte } from '../logic/settings.ts';

interface Props {
	etat: Etat;
	/** Chaque place de la rangée, un peu de travers. */
	places: readonly Position[];
	/** Le bord où est posé l'As : la place de chaque carte en dépend. */
	sens: Sens;
	/** Sans transition : les cartes reviennent face cachée d'un coup (ouverture, remise en place). */
	sansAnimation: boolean;
	langue: Lang;
	couleur: Teinte;
	/** La rangée, que le tour mesure pour savoir quelle carte est touchée. */
	rangeeRef: Ref<HTMLDivElement>;
}

const PLACES = Array.from({ length: NOMBRE }, (_, i) => i);

export function Rangee({ etat, places, sens, sansAnimation, langue, couleur, rangeeRef }: Props) {
	return (
		<div id="rangee" ref={rangeeRef} className={sansAnimation ? 'no-anim' : undefined}>
			{/* Les cartes dans l'ordre de la table, de gauche à droite : chacune avec son rang (0 l'As… 4 la Dame). */}
			{PLACES.map((place) => {
				const i = rangDeLaPlace(place, sens);
				const retournee = estRetournee(etat, i);
				const face = faceDe(etat, i);
				const pres = aPres(etat, i);
				const { x, y, rot } = places[place] ?? { x: 0, y: 0, rot: 0 };
				return (
					<article key={i} className={`carte${retournee ? ' retournee' : ''}${face ? ' spectateur' : ''}`} data-index={i} data-place={place} data-couleur={couleur} aria-roledescription="carte"
						style={{ '--x': x.toFixed(3), '--y': y.toFixed(3), '--rot': rot.toFixed(2) }}>
						<div className="carte-pivot">
							<div className="carte-face dos" data-motif="arcade" data-couleur={couleur} aria-hidden={retournee}>
								<DosArcade />
							</div>
							<div className="carte-face avant" aria-hidden={!retournee} aria-label={retournee ? (face ? nomDeLaCarte(face, langue) : ui(pres ? 'carte.pres' : 'carte.blanche', langue)) : undefined}>
								{face && <FaceDeCarte carte={face} langue={langue} />}
								{pres && <p className="mot-pres" aria-hidden="true">{ui('carte.pres', langue)}</p>}
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
	const derniere = [...retourneesDe(etat)].reverse().find((i) => estRetournee(etat, i));
	if (derniere === undefined) return ui('carte.dos', langue);
	const face = faceDe(etat, derniere);
	if (face) return nomDeLaCarte(face, langue);
	return ui(aPres(etat, derniere) ? 'carte.pres' : 'carte.blanche', langue);
}
