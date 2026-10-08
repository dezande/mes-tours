/*
 * Les réglages des cinq cartes, ouverts par l'écrou ⚙ du menu principal : le bord d'où part le
 * codage (comme le sens de comptage de Princesse), couleur du dos des cartes, le rappel du codage,
 * jauge de l'appui long, mode entraînement et test des zones, réglages par défaut.
 */

import { ChoixIllustre } from '../../../components/cartes/ChoixIllustre.tsx';
import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { ui, type CleInterface } from '../content/interface.ts';
import { SENS, TEINTES, type Settings, type Teinte } from '../logic/settings.ts';
import { DosArcade } from './DosArcade.tsx';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
	/** Passe des réglages au mode entraînement. */
	surEntrainement: () => void;
	/** Passe des réglages au test des zones. */
	surTestDesZones: () => void;
}

/** Une petite carte face cachée : le dos « Arcade », dans la couleur demandée. */
function Vignette({ teinte }: { teinte: Teinte }) {
	return <span className="vignette" data-motif="arcade" data-couleur={teinte}><DosArcade /></span>;
}

export function Reglages({ reglages, langue, enregistrer, surEntrainement, surTestDesZones }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });

	return (
		<PanneauReglages
			aide={ui('menu.aides', langue)}
			jauge={{ libelle: ui('menu.jauge', langue), visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			defauts={{ libelle: ui('menu.defauts', langue), retablir: () => enregistrer(null) }}
			// Le mode entraînement et le test des zones sont des aides à la répétition : ils rejoignent les autres.
			autresAides={(
				<>
					<button type="button" id="entrainement-btn" className="aide-btn" onClick={surEntrainement}>{ui('aide.entrainement', langue)}</button>
					<button type="button" id="test-btn" className="aide-btn" onClick={surTestDesZones}>{ui('aide.zones', langue)}</button>
				</>
			)}
		>
			{/* Le sens se lit sur le bouton : les valeurs des cartes posées dans ce sens, puis le nom. */}
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
							<span className="sens-places" aria-hidden="true">{sens === 'gauche' ? '1 2 4 8 ♠' : '♠ 8 4 2 1'}</span>
							<span className="sens-nom">{ui(`sens.${sens}`, langue)}</span>
						</span>
					)}
					choisir={(sens) => changer({ sens })}
				/>
				<p className="hint slider-hint">{ui('menu.sensAide', langue)}</p>
			</div>

			{/* Le dos « Arcade » est celui du tour : seule sa couleur se choisit, en regardant. */}
			<div className="card">
				<div className="row-label">{ui('menu.couleur', langue)}</div>
				<ChoixIllustre id="couleur-choix" etiquette={ui('menu.couleur', langue)} couleurs valeurs={TEINTES} choisie={reglages.couleur} nom={(valeur) => ui(`couleur.${valeur}` as CleInterface, langue)} apercu={(teinte) => <Vignette teinte={teinte} />} choisir={(couleur) => changer({ couleur })} />
			</div>

			<div className="card" id="codage">
				<div className="row-label">{ui('codage.titre', langue)}</div>
				<p className="hint">{ui('codage.valeur', langue)}</p>
				<p className="hint">{ui('codage.couleur', langue)}</p>
				<p className="hint">{ui('codage.revelation', langue)}</p>
			</div>
		</PanneauReglages>
	);
}
