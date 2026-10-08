/*
 * Les réglages des six prédictions, ouverts par l'écrou ⚙ du menu principal : jauge de l'appui
 * long, réglages par défaut. Les dos des cartes ne se règlent pas : chaque carte a son dessin, et
 * les couleurs sont tirées au sort à chaque paquet (logic/dos.ts).
 */

import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { ui } from '../content/interface.ts';
import type { Settings } from '../logic/settings.ts';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
}

export function Reglages({ reglages, langue, enregistrer }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });

	return (
		<PanneauReglages
			aide={ui('menu.aides', langue)}
			jauge={{ libelle: ui('menu.jauge', langue), visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			defauts={{ libelle: ui('menu.defauts', langue), retablir: () => enregistrer(null) }}
		/>
	);
}
