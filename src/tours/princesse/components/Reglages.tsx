/*
 * Les réglages de la Princesse, ouverts par l'écrou ⚙ du menu principal : le sens dans lequel se
 * comptent les cartes restantes, la couleur du dos des cartes (choisie en regardant, comme dans
 * les autres tours de cartes), le temps pendant lequel les cartes restent faces en l'air, la jauge
 * de l'appui long, les réglages par défaut.
 */

import { ChoixIllustre } from '../../../components/cartes/ChoixIllustre.tsx';
import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { ui, type CleInterface } from '../content/interface.ts';
import { COULEURS, DUREE_MAX, DUREE_MIN, SENS, type Couleur, type Settings } from '../logic/settings.ts';
import { Dos } from './DessinsDeCarte.tsx';

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
			{/* Le sens se lit sur le bouton : une flèche, et les places numérotées dans ce sens. */}
			<div className="card">
				<div className="row-label">{ui('menu.sens', langue)}</div>
				<ChoixIllustre
					id="sens-choix"
					etiquette={ui('menu.sens', langue)}
					valeurs={SENS}
					choisie={reglages.sens}
					nom={(sens) => ui(`sens.${sens}`, langue)}
					apercu={(sens) => (
						<span className="sens">
							<span className="sens-places" aria-hidden="true">{sens === 'gauche' ? '1 2 3 4 →' : '← 4 3 2 1'}</span>
							<span className="sens-nom">{ui(`sens.${sens}`, langue)}</span>
						</span>
					)}
					choisir={(sens) => changer({ sens })}
				/>
				<p className="hint slider-hint">{ui('menu.sensAide', langue)}</p>
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

			<div className="card">
				<label className="row-label slider-label" htmlFor="duree">
					<span>{ui('menu.duree', langue)}</span> <output id="duree-valeur" htmlFor="duree">{`${reglages.duree} s`}</output>
				</label>
				<input id="duree" type="range" min={DUREE_MIN} max={DUREE_MAX} step="1" value={reglages.duree} onInput={(event) => changer({ duree: Number(event.currentTarget.value) })} />
				<p className="hint slider-hint">{ui('menu.dureeAide', langue)}</p>
			</div>
		</PanneauReglages>
	);
}
