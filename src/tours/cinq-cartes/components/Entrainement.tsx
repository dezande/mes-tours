/*
 * LE MODE ENTRAÎNEMENT, ouvert depuis les réglages (aides à la répétition) : la routine telle
 * qu'elle se joue, avec une barre de deux boutons en haut de la scène — « Recommencer » remet les
 * cinq dos, « Retour aux réglages » y revient. La barre est hors de la scène : la toucher ne touche
 * aucune carte. Ses boutons agissent au lever du doigt (hooks/useBoutonsTactiles.ts).
 *
 * Ids : #entrainement, #entrainement-recommencer, #entrainement-retour ; styles :
 * styles/tours/cinq-cartes/_aides.scss.
 */

import type { Lang } from '../../../logic/i18n.ts';
import { useBoutonsTactiles } from '../../../hooks/useBoutonsTactiles.ts';
import { ui } from '../content/interface.ts';

interface Props {
	langue: Lang;
	surRecommencer: () => void;
	surRetour: () => void;
}

export function Entrainement({ langue, surRecommencer, surRetour }: Props) {
	const barre = useBoutonsTactiles<HTMLDivElement>();
	return (
		<div id="entrainement" className="barre-aide" ref={barre}>
			<button type="button" id="entrainement-recommencer" onClick={surRecommencer}>{ui('aide.recommencer', langue)}</button>
			<button type="button" id="entrainement-retour" onClick={surRetour}>{ui('aide.retour', langue)}</button>
		</div>
	);
}
