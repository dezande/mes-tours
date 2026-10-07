/*
 * Les réglages du Morpion, ouverts par l'écrou ⚙ du menu principal : délai avant le retournement,
 * jauge de l'appui long, réglages par défaut.
 */

import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { ui } from '../content/interface.ts';
import { DELAI_MAX, type Settings } from '../logic/settings.ts';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
}

export function Reglages({ reglages, langue, enregistrer }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });
	// « 0 s » veut dire que le papier se retourne au toucher ; virgule décimale en français.
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
		</PanneauReglages>
	);
}
