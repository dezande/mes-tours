/*
 * La carte, seule au centre de la table : son dos « pluie très fine », la Dame à l'avant, et le
 * retournement. L'état est décidé par logic/routine.ts (testé sous Node) et tenu par le tour
 * (index.tsx) ; ce composant ne fait que le montrer.
 *
 *   .carte            la carte, posée au centre (mesurée par le tour : son milieu coupe l'écran en quatre)
 *     .carte-pivot    la retourne (rotateY), en conservant la perspective
 *       .carte-face.dos     le dos, seul visible tant que la carte n'est pas retournée
 *       .carte-face.avant   la Dame de la famille choisie
 *
 * La Dame est écrite au moment où la carte se retourne, et gardée quand elle revient face cachée :
 * le dos ne laisse jamais voir une face qui change.
 */

import type { Ref } from 'preact';
import type { Lang } from '../../../logic/i18n.ts';
import { nomDeLaDame, ui } from '../content/interface.ts';
import type { Couleur, Etat } from '../logic/routine.ts';
import type { Teinte } from '../logic/settings.ts';
import { DosAncien } from './DosAncien.tsx';
import { FaceDeDame } from './FaceDeDame.tsx';

interface Props {
	etat: Etat;
	/** La famille de la Dame écrite à l'avant (gardée quand la carte revient face cachée). */
	ecrite: Couleur | null;
	langue: Lang;
	couleur: Teinte;
	/** Sans transition : la carte revient face cachée d'un coup (ouverture, remise en place au clavier). */
	sansAnimation: boolean;
	/** La carte, que le tour mesure pour savoir quel coin est touché. */
	carteRef: Ref<HTMLElement>;
}

export function Carte({ etat, ecrite, langue, couleur, sansAnimation, carteRef }: Props) {
	const retournee = etat.phase === 'retournee';
	return (
		<div id="table" className={sansAnimation ? 'no-anim' : undefined}>
			<article ref={carteRef} className={`carte${retournee ? ' retournee' : ''}`} aria-roledescription="carte" data-couleur={couleur}>
				<div className="carte-pivot">
					<div className="carte-face dos" aria-hidden={retournee}>
						<DosAncien />
					</div>
					<div className="carte-face avant" aria-hidden={!retournee} aria-label={retournee ? nomDeLaDame(etat.couleur, langue) : undefined}>
						{ecrite && <FaceDeDame couleur={ecrite} langue={langue} />}
					</div>
				</div>
			</article>
		</div>
	);
}

/** Ce qui est à l'écran, pour les lecteurs d'écran seulement. */
export const annonce = (etat: Etat, langue: Lang): string => (etat.phase === 'retournee' ? nomDeLaDame(etat.couleur, langue) : ui('carte.dos', langue));
