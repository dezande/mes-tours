/*
 * La galerie de photos : au public, quelqu'un fait défiler ses photos. Trois diapositives côte à côte,
 * la photo d'avant, celle montrée et celle d'après (logic/routine.ts : voisines), qui suivent le doigt
 * (--decalage) puis glissent jusqu'à leur place (.anime). Aucun bouton, aucun texte, aucun indicateur.
 *
 *   #galerie[.anime]                  la bande ; --decalage, en pixels, écrit par le tour (index.tsx)
 *     .diapo[data-place="-1|0|1"]     une photo, posée à sa place (--i)
 *       .cliche                       la photo elle-même, au format 3 × 4, sur le fond noir
 *         .prise[.rafale]             le cadrage : la rafale est prise d'un peu plus près, un peu de travers
 *           .colonnes > .colonne      les trois colonnes d'une question (data-colonne 1 à 3), ou celles
 *                                     de la révélation (.revelation), la carte du spectateur face en
 *                                     bas (#spectateur) au milieu de la colonne du milieu
 *
 * Une photo garde sa clé d'une place à l'autre : celle qui arrive est la même que celle qui suivait le
 * doigt, et la glissade continue sans saut.
 */

import type { ComponentChildren } from 'preact';
import type { Lang } from '../../../logic/i18n.ts';
import type { Carte as CarteAJouer } from '../../princesse/logic/cartes.ts';
import type { Position } from '../../trois-paquets/logic/disposition.ts';
import type { Photo } from '../logic/routine.ts';
import { SPECTATEUR } from '../logic/revelation.ts';
import type { Couleur } from '../logic/settings.ts';
import { Carte } from './Carte.tsx';

/** Le noir entre deux photos qui glissent, en pixels (--entre, styles/tours/trois-questions/_galerie.scss). */
export const ENTRE = 20;

/** La clé d'une photo : la même tant que c'est la même photo, quelle que soit sa place. */
export const cleDeLaPhoto = (photo: Photo): string => (photo.type === 'revelation' ? 'revelation' : `question-${photo.question}${photo.rafale ? '-rafale' : ''}`);

interface PropsColonnes {
	colonnes: readonly (readonly CarteAJouer[])[];
	desordre: readonly (readonly Position[])[];
	rafale?: boolean;
	langue: Lang;
	/** La révélation : la carte du spectateur (SPECTATEUR) est face en bas, de cette couleur, jusqu'à ce qu'elle soit retournée. */
	spectateur?: { couleur: Couleur; retournee: boolean };
}

/** Une photo de colonnes : les trois colonnes d'une question, ou celles de la révélation, de haut en bas. */
export function PhotoDesColonnes({ colonnes, desordre, rafale = false, langue, spectateur }: PropsColonnes) {
	return (
		<div className={`prise${rafale ? ' rafale' : ''}${spectateur ? ' revelation' : ''}`}>
			<div className="colonnes">
				{colonnes.map((cartes, c) => (
					<div key={c} className="colonne" data-colonne={c + 1} style={{ '--cartes': String(cartes.length) }}>
						{cartes.map((carte, i) => {
							const { dx = 0, dy = 0, rot } = desordre[c]?.[i] ?? { rot: 0 };
							const style = { '--rang': String(i), '--dx': dx.toFixed(3), '--dy': dy.toFixed(3), '--rot': rot.toFixed(2) };
							return spectateur && c === SPECTATEUR.colonne && i === SPECTATEUR.rang
								? <Carte key={i} id="spectateur" carte={carte} langue={langue} dos={spectateur.couleur} retournee={spectateur.retournee} style={style} />
								: <Carte key={i} carte={carte} langue={langue} style={style} />;
						})}
					</div>
				))}
			</div>
		</div>
	);
}

interface Props {
	precedente: Photo | null;
	courante: Photo;
	suivante: Photo | null;
	/** De combien la bande suit le doigt, en pixels (négatif : vers la gauche). */
	decalage: number;
	/** La bande glisse jusqu'à sa place (sinon, elle suit le doigt, ou se pose d'un coup). */
	anime: boolean;
	/** Le contenu d'une photo. */
	rendu: (photo: Photo) => ComponentChildren;
}

export function Galerie({ precedente, courante, suivante, decalage, anime, rendu }: Props) {
	const diapos = ([[precedente, -1], [courante, 0], [suivante, 1]] as const).filter((diapo): diapo is readonly [Photo, -1 | 0 | 1] => diapo[0] !== null);
	return (
		<div id="galerie" className={anime ? 'anime' : undefined} style={{ '--decalage': `${decalage}px`, '--entre': `${ENTRE}px` }} data-photo={cleDeLaPhoto(courante)}>
			{diapos.map(([photo, place]) => (
				<div key={cleDeLaPhoto(photo)} className="diapo" data-place={place} style={{ '--i': String(place) }} aria-hidden={place !== 0}>
					<div className="cliche">{rendu(photo)}</div>
				</div>
			))}
		</div>
	);
}
