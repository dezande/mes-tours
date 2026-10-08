/*
 * Les cinq cartes affichées, côte à côte : chacune à sa place d'après l'ordre du mélange, faces en
 * bas ou en l'air d'après l'état de la routine. L'état est décidé par logic/routine.ts (testé sous
 * Node) et tenu par le tour (index.tsx) ; ce composant ne fait que le montrer, les transitions CSS
 * font le reste (styles/tours/princesse/_cartes.scss).
 *
 *   #jeu[data-phase]     la rangée de cartes
 *     .carte             pose la carte à sa place de la rangée, un peu de travers, ou éparpillée
 *                        pendant le mélange (--x, --y, --rot : logic/disposition.ts)
 *       .carte-pivot     la retourne (rotateY), en conservant la perspective
 *         .carte-face.dos     le dos choisi dans les réglages
 *         .carte-face.avant   la face
 *
 * Les cinq cartes sont toujours dans la page, celle qui a disparu comprise (masquée) : rien n'est
 * construit au moment du toucher, la carte disparaît sans le moindre délai. Les autres ne bougent
 * pas : la place de la carte partie reste vide.
 */

import type { Lang } from '../../../logic/i18n.ts';
import { CARTES } from '../content/cartes.ts';
import { ui } from '../content/interface.ts';
import { nomDeCarte } from '../logic/cartes.ts';
import type { Position } from '../logic/disposition.ts';
import { faceEnLAir, type Etat } from '../logic/routine.ts';
import type { Couleur, Motif } from '../logic/settings.ts';
import { Dos, FaceDeCarte } from './DessinsDeCarte.tsx';

interface Props {
	etat: Etat;
	/** `ordre[place]` : la carte de l'écran posée à chaque place de la rangée. */
	ordre: readonly number[];
	/** Chaque place de la rangée, un peu de travers. */
	places: readonly Position[];
	/** Pendant le mélange : la position éparpillée de chaque carte de l'écran. */
	eparpillees: readonly Position[] | null;
	/** `faces[carte]` : la face montrée par chaque carte de l'écran (rang dans content/cartes.ts). */
	faces: readonly number[];
	/** Sans transition : à l'ouverture et quand les cartes reviennent au départ. */
	sansAnimation: boolean;
	langue: Lang;
	motif: Motif;
	couleur: Couleur;
}

export function Jeu({ etat, ordre, places, eparpillees, faces, sansAnimation, langue, motif, couleur }: Props) {
	return (
		<div id="jeu" data-phase={etat.phase} className={sansAnimation ? 'no-anim' : undefined}>
			{faces.map((face, element) => {
				const place = ordre.indexOf(element);
				const partie = etat.phase === 'revele' && etat.place === place;
				const retournee = faceEnLAir(etat, place);
				const carte = CARTES[face]!;
				const { x, y, rot } = eparpillees?.[element] ?? places[place] ?? { x: 0, y: 0, rot: 0 };
				return (
					<article
						key={element}
						className={`carte${retournee ? ' retournee' : ''}${partie ? ' disparue' : ''}`}
						data-carte={face}
						data-place={place}
						data-couleur={couleur}
						aria-roledescription="carte"
						aria-hidden={partie}
						aria-label={retournee ? nomDeCarte(carte, langue) : ui('carte.dos', langue)}
						// Éparpillées, les cartes du bas passent devant celles du haut.
						style={{ '--x': x.toFixed(3), '--y': y.toFixed(3), '--rot': rot.toFixed(2), '--z': String(eparpillees ? Math.round((y + 1) * 20) : place) }}
					>
						<div className="carte-pivot">
							<div className="carte-face dos" data-motif={motif}><Dos motif={motif} /></div>
							<div className="carte-face avant"><FaceDeCarte carte={carte} /></div>
						</div>
					</article>
				);
			})}
		</div>
	);
}
