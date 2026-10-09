/*
 * La routine de Pluie très fine, et ce que chaque geste en fait. Fonctions pures, sans DOM :
 * testées sous Node (tests/tours/pluie-tres-fine/routine.test.ts).
 *
 * Une seule carte, face cachée : une Dame. Sa famille n'est choisie qu'au moment où elle se
 * retourne, par le coin de l'écran touché — le trucage de la carte de la couleur des cinq cartes.
 * L'écran est coupé en quatre par le milieu de la carte, jusqu'à ses bords : le doigt n'a pas à
 * tomber sur la carte.
 *
 *   en haut à gauche  pique        en haut à droite  cœur
 *   en bas à gauche   trèfle       en bas à droite   carreau
 *
 *   face cachée  ──toucher dans un coin──▶  retournée : la Dame de la famille du coin
 *   retournée    ──toucher──▶               rien : un doigt posé par mégarde ne change pas la carte
 *   retournée    ──double toucher──▶        face cachée, prête pour une nouvelle routine
 *
 * Le double toucher ne compte que si la carte était déjà retournée avant son premier toucher :
 * deux touchers vifs sur la carte face cachée la retournent, et ne la remettent pas aussitôt.
 *
 * Rien n'est enregistré : chaque ouverture du tour repart d'une carte face cachée.
 */

/** Les quatre familles, dans l'ordre des coins de l'écran : haut gauche, haut droite, bas gauche, bas droite. */
export const COULEURS = ['pique', 'coeur', 'trefle', 'carreau'] as const;
export type Couleur = (typeof COULEURS)[number];

export type Etat =
	/** Le dos visible, prête à jouer. */
	| { readonly phase: 'cachee' }
	/** La carte est retournée : la Dame de cette famille. */
	| { readonly phase: 'retournee'; readonly couleur: Couleur };

/** La carte face cachée : l'état à l'ouverture du tour, et après chaque remise en place. */
export const CACHEE: Etat = Object.freeze({ phase: 'cachee' });

/**
 * État après un geste dans le coin de la famille `couleur`. `geste` vaut « double » quand ce
 * toucher complète un double toucher ; `avantPremierTap` est l'état de la carte avant le premier
 * toucher de la paire.
 */
export function apresGeste(etat: Etat, geste: 'tap' | 'double', couleur: Couleur | null, avantPremierTap: Etat): Etat {
	if (geste === 'double' && avantPremierTap.phase === 'retournee') return CACHEE;
	if (etat.phase === 'cachee' && couleur) return { phase: 'retournee', couleur };
	return etat;
}

/** La carte revient face cachée (au clavier, R). */
export const cacher = (): Etat => CACHEE;

/** Une boîte dans le repère de l'app : celle de la carte, ou d'un coin de l'écran. */
export interface Boite {
	x: number;
	y: number;
	largeur: number;
	hauteur: number;
}

/**
 * La famille du coin touché au point (x, y) : l'écran est coupé en quatre par le milieu de la
 * `carte` — en haut à gauche pique, en haut à droite cœur, en bas à gauche trèfle, en bas à
 * droite carreau. Un point ou une carte invalides donnent null.
 */
export function couleurDuPoint(x: number, y: number, carte: Boite): Couleur | null {
	if (!Number.isFinite(x) || !Number.isFinite(y) || !(carte.largeur > 0) || !(carte.hauteur > 0)) return null;
	const droite = x >= carte.x + carte.largeur / 2;
	const bas = y >= carte.y + carte.hauteur / 2;
	return COULEURS[(bas ? 2 : 0) + (droite ? 1 : 0)]!;
}

/**
 * Les quatre coins d'un écran de `largeur` × `hauteur`, coupé par le milieu de la `carte`, dans
 * l'ordre de COULEURS : ceux que couleurDuPoint reconnaît, pour le test des zones.
 */
export function coinsDeLEcran(carte: Boite, largeur: number, hauteur: number): Boite[] {
	const mx = Math.min(largeur, Math.max(0, carte.x + carte.largeur / 2));
	const my = Math.min(hauteur, Math.max(0, carte.y + carte.hauteur / 2));
	return COULEURS.map((_, i) => {
		const [droite, bas] = [i % 2 === 1, i >= 2];
		return {
			x: droite ? mx : 0,
			y: bas ? my : 0,
			largeur: droite ? largeur - mx : mx,
			hauteur: bas ? hauteur - my : my,
		};
	});
}
