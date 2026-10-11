/*
 * L'apparence du menu, des réglages généraux et du journal : claire ou sombre, comme les autres
 * applications. Choisie dans les réglages généraux et enregistrée sur l'appareil ; « automatique »,
 * le défaut, suit le téléphone (prefers-color-scheme). Les tours gardent leur décor de scène.
 *
 * Fonctions pures, testées sous Node (tests/logic/apparence.test.ts) ; le fournisseur est dans
 * ApparenceContext.tsx, les couleurs dans styles/menu/_menu.scss (html[data-theme]).
 */

/** Le choix des réglages généraux. */
export type Apparence = 'auto' | 'clair' | 'sombre';
/** Ce qui s'affiche. */
export type Theme = 'clair' | 'sombre';

export const APPARENCES: readonly Apparence[] = ['auto', 'clair', 'sombre'];

/** La couleur de la barre du téléphone (meta theme-color) : le haut du ciel du menu. */
export const COULEURS_DU_MENU: Record<Theme, string> = { sombre: '#0b0b2b', clair: '#8fcfff' };

export const estApparence = (valeur: unknown): valeur is Apparence => APPARENCES.includes(valeur as Apparence);

/** Le thème affiché : celui choisi, ou celui du téléphone en automatique. */
export function resoudreTheme(apparence: Apparence, telephoneSombre: boolean): Theme {
	if (apparence !== 'auto') return apparence;
	return telephoneSombre ? 'sombre' : 'clair';
}
