/*
 * Les sept panneaux, côte à côte sur une bande qui glisse d'un panneau à l'autre (le balayage) ;
 * --i, la place de chacun sur la bande :
 *
 *   #panneaux[data-panneau]   la bande ; --panneau la fait glisser (styles/tours/trois-paquets/)
 *     .panneau.melange        panneaux 1 et 2 [data-melange] : des cartes en tas, faces en l'air ou en bas
 *     .panneau.salade         panneau 3 : les huit cartes à forcer faces en l'air, sur un tas de dos,
 *                             et plus au fond, loin de chacune, son double
 *     .panneau.paquets        panneaux 4, 5 et 6 [data-copie] : trois copies identiques des paquets
 *                             (ou trois photos liées, chacune à une colonne : les réglages),
 *                             .colonnes, trois .paquet de sept cartes, de haut en bas
 *     .panneau.fin            panneau 7 : .colonnes de même, les cartes restantes, et au milieu la
 *                             carte face en bas (#derniere)
 *
 * Tout est décidé par logic/ (tirage, disposition, routine) et tenu par le tour (index.tsx) ; ce
 * composant ne fait que le montrer. Les sept panneaux sont toujours dans la page : rien n'est
 * construit au moment d'un geste, la carte de la fin disparaît sans le moindre délai.
 */

import type { Lang } from '../../../logic/i18n.ts';
import type { Carte as CarteAJouer } from '../../princesse/logic/cartes.ts';
import { ui } from '../content/interface.ts';
import type { Position } from '../logic/disposition.ts';
import { COPIES, FIN, SALADE, type Etat } from '../logic/routine.ts';
import type { Couleur } from '../logic/settings.ts';
import type { CarteDuPaquet } from '../logic/tirage.ts';
import { Carte } from './Carte.tsx';

/** Une carte de la salade, posée à sa position (logic/disposition.ts) ; null : face en bas. */
export interface CarteEnSalade {
	carte: CarteAJouer | null;
	position: Position;
}

interface Props {
	etat: Etat;
	/** La carte face en bas de la fin disparaît au toucher (réglages) ; sinon, elle reste à sa place. */
	disparition: boolean;
	/** Les mélanges, avant la salade : des cartes en tas, faces en l'air ou en bas. */
	melanges: readonly (readonly CarteEnSalade[])[];
	salade: readonly CarteEnSalade[];
	paquets: readonly (readonly CarteDuPaquet[])[];
	/** Le désordre des cartes des colonnes (logic/disposition.ts) : celui des paquets, celui de la fin. */
	desordre: { paquets: readonly (readonly Position[])[]; fin: readonly (readonly Position[])[] };
	/** Panneau 3 : trois colonnes de sept cartes ; null, la carte face en bas, au milieu. */
	fin: readonly (readonly (CarteAJouer | null)[])[];
	/** Les trois photos liées, chacune ses trois colonnes (logic/tirage.ts : photosLiees) ; absentes : trois copies des paquets. */
	photos?: readonly (readonly (readonly CarteDuPaquet[])[])[] | null;
	/** Sans transition : à l'ouverture et à chaque nouvelle routine. */
	sansAnimation: boolean;
	couleur: Couleur;
	langue: Lang;
}

const place = ({ x, y, rot, z, dx = 0, dy = 0 }: Position) => ({
	'--x': x.toFixed(4), '--y': y.toFixed(4), '--rot': rot.toFixed(2), '--z': String(z), '--dx': dx.toFixed(4), '--dy': dy.toFixed(4),
});

function Salade({ cartes, couleur, langue }: { cartes: readonly CarteEnSalade[]; couleur: Couleur; langue: Lang }) {
	return (
		<div className="table">
			{cartes.map(({ carte, position }, i) => (
				<Carte key={i} carte={carte} couleur={couleur} langue={langue} style={place(position)} />
			))}
		</div>
	);
}

/** Trois colonnes de sept cartes, de haut en bas (les paquets, la fin) ; null : la carte face en bas, qui disparaît. */
function Colonnes({ paquets = false, colonnes, desordre, disparue = false, couleur, langue }: { paquets?: boolean; colonnes: readonly (readonly (CarteAJouer | null)[])[]; desordre: readonly (readonly Position[])[]; disparue?: boolean; couleur: Couleur; langue: Lang }) {
	return (
		<div className="colonnes">
			{colonnes.map((colonne, p) => (
				<div key={p} className="paquet" aria-label={paquets ? `${ui('paquet', langue)} ${p + 1}` : undefined}>
					{colonne.map((carte, i) => (
						<Carte key={i} carte={carte} couleur={couleur} langue={langue} disparue={carte === null && disparue} id={carte === null ? 'derniere' : undefined} style={{ ...place(desordre[p]?.[i] ?? { x: 0, y: 0, rot: 0, z: i }), '--rang': String(i) }} />
					))}
				</div>
			))}
		</div>
	);
}

export function Panneaux({ etat, disparition, melanges, salade, desordre, paquets, fin, photos, sansAnimation, couleur, langue }: Props) {
	const colonnesDe = (copie: readonly (readonly CarteDuPaquet[])[]) => copie.map((paquet) => paquet.map(({ carte }) => carte));
	const colonnes = colonnesDe(paquets);
	return (
		<div id="panneaux" data-panneau={etat.panneau} className={sansAnimation ? 'no-anim' : undefined} style={{ '--panneau': String(etat.panneau) }}>
			{melanges.map((cartes, m) => (
				<section key={m} className="panneau melange" data-melange={m + 1} style={{ '--i': String(m) }} aria-label={ui('panneau.melange', langue)} aria-hidden={etat.panneau !== m}>
					<Salade cartes={cartes} couleur={couleur} langue={langue} />
				</section>
			))}
			<section className="panneau salade" style={{ '--i': String(SALADE) }} aria-label={ui('panneau.salade', langue)} aria-hidden={etat.panneau !== SALADE}>
				<Salade cartes={salade} couleur={couleur} langue={langue} />
			</section>
			{/* Trois copies identiques des paquets : mêmes cartes, même ordre ; ou trois photos liées, chacune à une colonne. */}
			{Array.from({ length: COPIES }, (_, c) => (
				<section key={c} className="panneau paquets" data-copie={c + 1} style={{ '--i': String(SALADE + c + 1) }} aria-label={ui('panneau.paquets', langue)} aria-hidden={etat.panneau !== SALADE + c + 1}>
					<Colonnes paquets colonnes={photos?.[c] ? colonnesDe(photos[c]) : colonnes} desordre={desordre.paquets} couleur={couleur} langue={langue} />
				</section>
			))}
			<section className="panneau fin" style={{ '--i': String(FIN) }} aria-label={ui('panneau.fin', langue)} aria-hidden={etat.panneau !== FIN}>
				<Colonnes colonnes={fin} desordre={desordre.fin} disparue={etat.disparue && disparition} couleur={couleur} langue={langue} />
			</section>
		</div>
	);
}
