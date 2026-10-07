/*
 * L'état de la carte, et ce que chaque geste en fait. Fonctions pures, sans DOM :
 * testées sous Node (tests/logic/piece.test.ts).
 *
 * Le même système que la boule de cristal : l'écran est coupé en deux bandes, et la bande touchée
 * choisit la prédiction.
 *
 *   carte face cachée  ──toucher en haut──▶  armée sur « pile »  ──délai──▶  retournée, « pile »
 *   carte face cachée  ──toucher en bas───▶  armée sur « face »  ──délai──▶  retournée, « face »
 *   armée ou retournée ──double toucher──▶  face cachée, la prédiction gardée
 *   face cachée, gardée ──toucher où que ce soit──▶  armée sur la prédiction gardée
 *
 * La première prédiction choisie est gardée jusqu'au retour au menu : on peut cacher la carte et
 * la remontrer autant de fois qu'on veut, elle se retourne toujours sur le même côté, même en
 * touchant l'autre moitié de l'écran. Une fois la carte armée, un toucher ne change plus rien : un
 * doigt posé par mégarde ne la retourne pas sous les yeux du public. Le double toucher ne compte
 * que si ses deux touchers ont lieu sur une carte déjà armée : deux touchers vifs pour armer ne
 * remettent pas aussitôt la carte face cachée.
 *
 * Rien de tout cela n'est enregistré : chaque ouverture du tour (depuis le menu) repart d'une carte
 * face cachée, sans prédiction choisie.
 */

/** Les deux prédictions : pile en haut de l'écran, face en bas. */
export const COTES = ['pile', 'face'] as const;
export type Cote = (typeof COTES)[number];

export type Etat =
	/** Dos visible, prête à jouer ; `garde`, la prédiction déjà choisie depuis l'ouverture du tour. */
	| { readonly phase: 'cachee'; readonly garde?: Cote }
	/** La prédiction est choisie, la carte se retournera au bout du délai. */
	| { readonly phase: 'armee'; readonly cote: Cote }
	/** La carte est retournée, la prédiction est lue. */
	| { readonly phase: 'montree'; readonly cote: Cote };

/** Carte face cachée : l'état à l'ouverture de l'app. */
export const CACHEE: Etat = Object.freeze({ phase: 'cachee' });

/**
 * Le côté choisi par un toucher à la hauteur `y` d'un écran haut de `hauteur` : pile dans la moitié
 * du haut, face dans celle du bas. Un point hors de l'écran (doigt sur le bord) est ramené à la
 * moitié la plus proche ; une hauteur invalide donne null.
 */
export function coteDuPoint(y: number, hauteur: number): Cote | null {
	if (!Number.isFinite(y) || !Number.isFinite(hauteur) || hauteur <= 0) return null;
	return y < hauteur / 2 ? 'pile' : 'face';
}

/**
 * État après un toucher sur le côté `cote`. `geste` vaut « double » quand ce toucher complète un
 * double toucher ; `avantPremierTap` est l'état de la carte avant le premier toucher de la paire.
 */
export function apresGeste(etat: Etat, geste: 'tap' | 'double', cote: Cote, avantPremierTap: Etat): Etat {
	if (geste === 'double' && avantPremierTap.phase !== 'cachee') return cacher(etat);
	if (etat.phase === 'cachee') return { phase: 'armee', cote: etat.garde ?? cote };
	return etat;
}

/** La carte revient face cachée, et garde sa prédiction pour la fois suivante. */
export const cacher = (etat: Etat): Etat => (etat.phase === 'cachee' ? etat : { phase: 'cachee', garde: etat.cote });

/** Le délai est écoulé : la carte armée se retourne. */
export const montrer = (etat: Etat): Etat => (etat.phase === 'armee' ? { phase: 'montree', cote: etat.cote } : etat);

/** La carte est-elle armée ou retournée (un tour est en cours) ? */
export const enJeu = (etat: Etat): boolean => etat.phase !== 'cachee';
