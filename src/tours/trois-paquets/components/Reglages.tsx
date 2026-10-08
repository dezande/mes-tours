/*
 * Les réglages des trois paquets, ouverts par l'écrou ⚙ du menu principal : la routine en bref, la
 * couleur du dos des cartes (choisie en regardant, comme dans les autres tours de cartes), la jauge
 * de l'appui long, les réglages par défaut.
 */

import { ChoixIllustre } from '../../../components/cartes/ChoixIllustre.tsx';
import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { Dos } from '../../princesse/components/DessinsDeCarte.tsx';
import { ui, type CleInterface } from '../content/interface.ts';
import { COULEURS, type Couleur, type Settings } from '../logic/settings.ts';

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
		</PanneauReglages>
	);
}
