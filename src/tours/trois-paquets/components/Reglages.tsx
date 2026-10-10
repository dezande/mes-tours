/*
 * Les réglages des trois paquets, ouverts par l'écrou ⚙ du menu principal : la routine en bref, la
 * couleur du dos des cartes (choisie en regardant, comme dans les autres tours de cartes), la carte
 * face en bas de la fin qui disparaît ou non, les photos des paquets identiques ou liées, la jauge
 * de l'appui long, les réglages par défaut.
 */

import { ChoixIllustre } from '../../../components/cartes/ChoixIllustre.tsx';
import { Interrupteur, PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { Dos } from '../../princesse/components/DessinsDeCarte.tsx';
import { ui, type CleInterface } from '../content/interface.ts';
import { COULEURS, PHOTOS, type Couleur, type Settings } from '../logic/settings.ts';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
}

/** Une petite carte face cachée, dans la couleur demandée. */
function Vignette({ couleur }: { couleur: Couleur }) {
	return (
		<span className="vignette" data-couleur={couleur}>
			<Dos />
		</span>
	);
}

export function Reglages({ reglages, langue, enregistrer }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });

	return (
		<PanneauReglages
			aide={ui('menu.aides', langue)}
			jauge={{ libelle: ui('menu.jauge', langue), visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			defauts={{ libelle: ui('menu.defauts', langue), retablir: () => enregistrer(null) }}
		>
			<div className="card">
				<div className="row-label">{ui('menu.routine', langue)}</div>
				<p className="hint">{ui('menu.routineAide', langue)}</p>
			</div>

			{/* Le dos est une photo : seule sa couleur se choisit, en regardant la carte telle qu'elle sera. */}
			<div className="card">
				<div className="row-label">{ui('menu.couleur', langue)}</div>
				<ChoixIllustre
					id="couleur-choix"
					etiquette={ui('menu.couleur', langue)}
					couleurs
					valeurs={COULEURS}
					choisie={reglages.couleur}
					nom={(couleur) => ui(`couleur.${couleur}` as CleInterface, langue)}
					apercu={(couleur) => <Vignette couleur={couleur} />}
					choisir={(couleur) => changer({ couleur })}
				/>
			</div>

			{/* Les trois photos des paquets : identiques, ou chacune liée à une colonne. */}
			<div className="card">
				<div className="row-label">{ui('menu.photos', langue)}</div>
				<ChoixIllustre
					id="photos-choix"
					etiquette={ui('menu.photos', langue)}
					valeurs={PHOTOS}
					choisie={reglages.photos}
					nom={(photos) => ui(`photos.${photos}`, langue)}
					apercu={(photos) => <span className="choix-texte">{ui(`photos.${photos}`, langue)}</span>}
					choisir={(photos) => changer({ photos })}
				/>
				<p className="hint slider-hint">{ui(`photos.${reglages.photos}.aide`, langue)}</p>
			</div>

			{/* La fin : la carte face en bas disparaît au toucher, ou reste à sa place. */}
			<div className="card">
				<Interrupteur id="disparition" libelle={ui('menu.disparition', langue)} coche={reglages.disparition} changer={(disparition) => changer({ disparition })} />
				<p className="hint slider-hint">{ui('menu.disparitionAide', langue)}</p>
			</div>
		</PanneauReglages>
	);
}
