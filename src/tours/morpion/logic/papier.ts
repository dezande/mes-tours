/*
 * L'état du papier, et ce que chaque geste en fait. Fonctions pures, sans DOM :
 * testées sous Node (tests/tours/morpion/papier.test.ts).
 *
 * Le même système que Pile ou face : l'écran est coupé en deux bandes, et la bande touchée choisit
 * la grille écrite au dos du papier.
 *
 *   « Prédiction »      ──toucher en haut──▶  armé sur la grille du haut  ──délai──▶  retourné
 *   « Prédiction »      ──toucher en bas───▶  armé sur la grille du bas   ──délai──▶  retourné
 *   armé ou retourné    ──double toucher──▶  « Prédiction », la grille gardée
 *   « Prédiction », gardée ──toucher où que ce soit──▶  armé sur la grille gardée
 *
 * La première grille choisie est gardée jusqu'au retour au menu : on peut remettre le papier sur
 * « Prédiction » et le retourner autant de fois qu'on veut, il montre toujours la même grille,
 * même en touchant l'autre moitié de l'écran. Une fois le papier armé, un toucher ne change plus
 * rien : un doigt posé par mégarde ne le retourne pas sous les yeux du public. Le double toucher
 * ne compte que si ses deux touchers ont lieu sur un papier déjà armé : deux touchers vifs pour
 * armer ne le remettent pas aussitôt.
 *
 * Rien de tout cela n'est enregistré : chaque ouverture du tour (depuis le menu) repart du côté
 * « Prédiction », sans grille choisie.
 */

/** Les deux prédictions : la grille du haut de l'écran, et celle du bas. */
export const COTES = ['haut', 'bas'] as const;
export type Cote = (typeof COTES)[number];

export type Etat =
	/** Le côté « Prédiction » est visible, prêt à jouer ; `garde`, la grille déjà choisie depuis l'ouverture du tour. */
	| { readonly phase: 'cache'; readonly garde?: Cote }
	/** La grille est choisie, le papier se retournera au bout du délai. */
	| { readonly phase: 'arme'; readonly cote: Cote }
	/** Le papier est retourné, la grille est montrée. */
	| { readonly phase: 'montre'; readonly cote: Cote };

/** Le côté « Prédiction » : l'état à l'ouverture du tour. */
export const CACHE: Etat = Object.freeze({ phase: 'cache' });

/**
 * La grille choisie par un toucher à la hauteur `y` d'un écran haut de `hauteur` : celle du haut
 * dans la moitié du haut, celle du bas dans l'autre. Un point hors de l'écran (doigt sur le bord)
 * est ramené à la moitié la plus proche ; une hauteur invalide donne null.
 */
export function coteDuPoint(y: number, hauteur: number): Cote | null {
	if (!Number.isFinite(y) || !Number.isFinite(hauteur) || hauteur <= 0) return null;
	return y < hauteur / 2 ? 'haut' : 'bas';
}

/**
 * État après un toucher sur le côté `cote`. `geste` vaut « double » quand ce toucher complète un
 * double toucher ; `avantPremierTap` est l'état du papier avant le premier toucher de la paire.
 */
export function apresGeste(etat: Etat, geste: 'tap' | 'double', cote: Cote, avantPremierTap: Etat): Etat {
	if (geste === 'double' && avantPremierTap.phase !== 'cache') return cacher(etat);
	if (etat.phase === 'cache') return { phase: 'arme', cote: etat.garde ?? cote };
	return etat;
}

/** Le papier revient sur « Prédiction », et garde sa grille pour la fois suivante. */
export const cacher = (etat: Etat): Etat => (etat.phase === 'cache' ? etat : { phase: 'cache', garde: etat.cote });

/** Le délai est écoulé : le papier armé se retourne. */
export const montrer = (etat: Etat): Etat => (etat.phase === 'arme' ? { phase: 'montre', cote: etat.cote } : etat);

/** Le papier est-il armé ou retourné (un tour est en cours) ? */
export const enJeu = (etat: Etat): boolean => etat.phase !== 'cache';
