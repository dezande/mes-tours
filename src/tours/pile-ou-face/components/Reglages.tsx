/*
 * Les réglages de Pile ou face, ouverts par l'écrou ⚙ du menu principal : délai avant le
 * retournement, couleur de l'encre, jauge de l'appui long, réglages par défaut.
 */

import { ChoixIllustre } from '../../../components/cartes/ChoixIllustre.tsx';
import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { ui, type CleInterface } from '../content/interface.ts';
import { DELAI_MAX, TEINTES, type Settings } from '../logic/settings.ts';
import { MotPrediction } from './Carte.tsx';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
}

export function Reglages({ reglages, langue, enregistrer }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });
	// « 0 s » veut dire que la carte se retourne au toucher ; virgule décimale en français.
	const delai = `${String(reglages.delai).replace('.', langue === 'fr' ? ',' : '.')} s`;

	return (
		<PanneauReglages
			aide={ui('menu.aides', langue)}
			jauge={{ libelle: ui('menu.jauge', langue), visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			defauts={{ libelle: ui('menu.defauts', langue), retablir: () => enregistrer(null) }}
		>
			<div className="card">
				<label className="row-label slider-label" htmlFor="delai">
					<span>{ui('menu.delai', langue)}</span> <output id="delai-valeur" htmlFor="delai">{delai}</output>
				</label>
				<input id="delai" type="range" min="0" max={DELAI_MAX} step="0.5" value={reglages.delai} onInput={(event) => changer({ delai: Number(event.currentTarget.value) })} />
				<p className="hint slider-hint">{ui('menu.delaiAide', langue)}</p>
			</div>

			{/* Le dos est un papier marqué « Prédiction » : seule l'encre se choisit, en regardant. */}
			<div className="card">
				<div className="row-label">{ui('menu.couleur', langue)}</div>
				<ChoixIllustre id="couleur-choix" etiquette={ui('menu.couleur', langue)} couleurs valeurs={TEINTES} choisie={reglages.couleur} nom={(valeur) => ui(`couleur.${valeur}` as CleInterface, langue)} apercu={(teinte) => <span className="vignette papier" data-couleur={teinte}><MotPrediction langue={langue} /></span>} choisir={(couleur) => changer({ couleur })} />
			</div>
		</PanneauReglages>
	);
}
