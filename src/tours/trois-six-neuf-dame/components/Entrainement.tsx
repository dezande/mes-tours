/*
 * LE MODE ENTRAÎNEMENT, ouvert depuis les réglages (aides à la répétition) : la routine telle
 * qu'elle se joue, avec une barre en haut de la scène — la carte à trouver, tirée au hasard, puis
 * deux boutons : « Recommencer » remet les cinq dos et tire une nouvelle carte, « Retour aux
 * réglages » y revient. Le premier toucher fait, la barre dit si c'est la bonne carte, ou laquelle
 * a été touchée. La barre est hors de la scène : la toucher ne touche aucune carte.
 *
 * Ids : ceux des cinq cartes (#entrainement, #entrainement-carte, #entrainement-recommencer,
 * #entrainement-retour), dont les styles sont repris.
 */

import type { Lang } from '../../../logic/i18n.ts';
import { useBoutonsTactiles } from '../../../hooks/useBoutonsTactiles.ts';
import { nomDeLaCarte, ui } from '../content/interface.ts';
import { memeCarte, type CarteJouee, type Etat } from '../logic/routine.ts';

interface Props {
	langue: Lang;
	/** La carte à trouver. */
	demandee: CarteJouee;
	etat: Etat;
	surRecommencer: () => void;
	surRetour: () => void;
}

/** Ce que dit la barre : la carte à trouver, puis, le premier toucher fait, si c'est elle. */
function consigne(demandee: CarteJouee, etat: Etat, langue: Lang): string {
	const nom = nomDeLaCarte(demandee, langue);
	if (etat.phase === 'choix') return `${ui('entrainement.trouver', langue)} ${nom}`;
	if (memeCarte(etat.carte, demandee)) return `✓ ${nom}`;
	return `✗ ${ui('entrainement.code', langue)} ${nomDeLaCarte(etat.carte, langue)}`;
}

export function Entrainement({ langue, demandee, etat, surRecommencer, surRetour }: Props) {
	const barre = useBoutonsTactiles<HTMLDivElement>();
	const resultat = etat.phase === 'revelation' ? (memeCarte(etat.carte, demandee) ? 'juste' : 'faux') : undefined;
	return (
		<div id="entrainement" className="barre-aide" ref={barre}>
			<span id="entrainement-carte" className="etat" data-resultat={resultat} aria-live="polite">{consigne(demandee, etat, langue)}</span>
			<button type="button" id="entrainement-recommencer" onClick={surRecommencer}>{ui('aide.recommencer', langue)}</button>
			<button type="button" id="entrainement-retour" onClick={surRetour}>{ui('aide.retour', langue)}</button>
		</div>
	);
}
