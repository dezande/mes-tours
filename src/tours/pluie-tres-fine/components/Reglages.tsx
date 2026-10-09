/*
 * Les réglages de Pluie très fine, ouverts par l'écrou ⚙ du menu principal : la couleur du dos,
 * choisie en regardant, le rappel du trucage, la jauge de l'appui long, le test des zones, les
 * réglages par défaut.
 */

import { ChoixIllustre } from '../../../components/cartes/ChoixIllustre.tsx';
import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { ui } from '../content/interface.ts';
import { TEINTES, type Settings, type Teinte } from '../logic/settings.ts';
import { DosAncien } from './DosAncien.tsx';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
	/** Passe des réglages au test des zones. */
	surTestDesZones: () => void;
}

/** Une petite carte face cachée : le dos « pluie très fine », à l'encre demandée. */
function Vignette({ teinte }: { teinte: Teinte }) {
	return <span className="vignette" data-couleur={teinte}><DosAncien /></span>;
}

export function Reglages({ reglages, langue, enregistrer, surTestDesZones }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });

	return (
		<PanneauReglages
			aide={ui('menu.aides', langue)}
			jauge={{ libelle: ui('menu.jauge', langue), visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			defauts={{ libelle: ui('menu.defauts', langue), retablir: () => enregistrer(null) }}
			// Le test des zones est une aide à la répétition : il rejoint les autres.
			autresAides={<button type="button" id="test-btn" className="aide-btn" onClick={surTestDesZones}>{ui('aide.zones', langue)}</button>}
		>
			{/* Le dos est celui du tour : seule son encre se choisit, en regardant. */}
			<div className="card">
				<div className="row-label">{ui('menu.couleur', langue)}</div>
				<ChoixIllustre id="couleur-choix" etiquette={ui('menu.couleur', langue)} couleurs valeurs={TEINTES} choisie={reglages.couleur} nom={(teinte) => ui(`teinte.${teinte}`, langue)} apercu={(teinte) => <Vignette teinte={teinte} />} choisir={(couleur) => changer({ couleur })} />
				<p className="hint">{ui('menu.couleurAide', langue)}</p>
			</div>

			<div className="card" id="trucage">
				<div className="row-label">{ui('trucage.titre', langue)}</div>
				<p className="hint">{ui('trucage.coins', langue)}</p>
				<p className="hint">{ui('trucage.fin', langue)}</p>
			</div>
		</PanneauReglages>
	);
}
