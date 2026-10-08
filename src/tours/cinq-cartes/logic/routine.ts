/*
 * La routine des cinq cartes, et ce que chaque toucher en fait. Fonctions pures, sans DOM :
 * testées sous Node (tests/tours/cinq-cartes/routine.test.ts).
 *
 * Les cartes sont comptées ici par leur rang dans le codage, du « 1 » à la carte de la couleur ;
 * leur place sur la table dépend du sens réglé (logic/settings.ts : rangDeLaPlace).
 *
 * Cinq cartes face cachée, en ligne. Chaque carte touchée se retourne aussitôt, dès le premier
 * toucher. Deux temps :
 *
 *   le codage      les quatre premières cartes valent, depuis le bord réglé, 1, 2, 4 et 8 : toucher
 *                  une carte la retourne (blanche) et ajoute sa valeur ; la toucher encore ne change
 *                  rien. Toucher la cinquième la retourne aussi (blanche) et termine le codage : le
 *                  coin touché donne la couleur — en haut à gauche pique, en haut à droite cœur, en
 *                  bas à gauche trèfle, en bas à droite carreau.
 *   la révélation  chaque toucher retourne la carte touchée. Elles sont blanches, sauf la dernière
 *                  retournée, quelle qu'elle soit : c'est la carte du spectateur. Il en reste
 *                  toujours au moins une face cachée à la fin du codage : 13, le Roi, n'en retourne
 *                  que trois parmi les quatre premières (1 + 4 + 8).
 *   la fin         les cinq cartes retournées, on ne peut plus que les retourner : chaque toucher
 *                  retourne la carte touchée, dans un sens ou dans l'autre, et chacune garde sa
 *                  face. Aucun geste ne relance la routine : l'appui de 3 s ramène au menu (au
 *                  clavier seulement, R remet les cinq dos).
 *
 * La somme va de l'As (1) au Roi (13). 0, 14 et 15 ne se codent jamais : s'ils arrivaient, ils
 * seraient ramenés à l'As ou au Roi, plutôt que de montrer une carte qui n'existe pas.
 *
 * Rien de tout cela n'est enregistré : chaque ouverture du tour repart de cinq dos, sans codage.
 */

/** Le nombre de cartes sur la table ; la dernière du codage termine le codage. */
export const NOMBRE = 5;
/** La carte qui termine le codage et donne la couleur. */
export const DERNIERE = NOMBRE - 1;

/** Les quatre couleurs, dans l'ordre des coins de la cinquième carte : haut gauche, haut droite, bas gauche, bas droite. */
export const COULEURS = ['pique', 'coeur', 'trefle', 'carreau'] as const;
export type Couleur = (typeof COULEURS)[number];

/** Les valeurs, de l'As (1) au Roi (13). */
export const VALEUR_MIN = 1;
export const VALEUR_MAX = 13;

/** La carte du spectateur. */
export interface CarteJouee {
	readonly valeur: number;
	readonly couleur: Couleur;
}

export type Etat =
	/** Le codage : la somme des cartes déjà touchées parmi les quatre premières (0 à 15), retournées dans cet ordre. */
	| { readonly phase: 'codage'; readonly somme: number; readonly retournees: readonly number[] }
	/**
	 * La révélation : la carte codée, les cartes déjà retournées une fois, dans l'ordre (c'est cet
	 * ordre qui donne les faces), et, la routine finie, celles qui ont été remises face cachée.
	 */
	| { readonly phase: 'revelation'; readonly carte: CarteJouee; readonly retournees: readonly number[]; readonly cachees: readonly number[] };

/** Cinq dos, rien de codé : l'état à l'ouverture du tour, et après chaque remise en place. */
export const DEPART: Etat = Object.freeze({ phase: 'codage', somme: 0, retournees: Object.freeze([]) });

/** La valeur que vaut la carte d'`index` dans le codage : 1, 2, 4, 8 (0 pour la cinquième). */
export const poids = (index: number): number => (index >= 0 && index < DERNIERE ? 2 ** index : 0);

/** La somme ramenée à une valeur qui existe, de l'As au Roi. */
export const valeurDeLaSomme = (somme: number): number => Math.min(VALEUR_MAX, Math.max(VALEUR_MIN, somme));

const estIndex = (index: number): boolean => Number.isInteger(index) && index >= 0 && index < NOMBRE;

/**
 * État après un toucher sur la carte d'`index`. Pour la cinquième carte pendant le codage,
 * `couleur` est celle du coin touché ; sans elle, ce toucher ne compte pas.
 */
export function toucher(etat: Etat, index: number, couleur?: Couleur | null): Etat {
	if (!estIndex(index)) return etat;
	if (etat.phase === 'codage') {
		if (index === DERNIERE) {
			if (!couleur) return etat;
			const carte = { valeur: valeurDeLaSomme(etat.somme), couleur };
			return { phase: 'revelation', carte, retournees: [...etat.retournees, index], cachees: [] };
		}
		// Une carte déjà retournée ne compte pas deux fois.
		if (etat.retournees.includes(index)) return etat;
		return { phase: 'codage', somme: etat.somme | poids(index), retournees: [...etat.retournees, index] };
	}
	// La routine finie : la carte touchée se retourne, dans un sens ou dans l'autre.
	if (etat.retournees.length === NOMBRE) {
		const cachees = etat.cachees.includes(index) ? etat.cachees.filter((i) => i !== index) : [...etat.cachees, index];
		return { ...etat, cachees };
	}
	if (etat.retournees.includes(index)) return etat;
	return { ...etat, retournees: [...etat.retournees, index] };
}

/** La carte d'`index` montre-t-elle sa face ? */
export const estRetournee = (etat: Etat, index: number): boolean =>
	etat.retournees.includes(index) && !(etat.phase === 'revelation' && etat.cachees.includes(index));

/** Les cinq cartes ont-elles été retournées (la routine est finie) ? */
export const toutesRetournees = (etat: Etat): boolean => etat.retournees.length === NOMBRE;

/**
 * Ce qui est écrit à l'avant de la carte d'`index` : la carte du spectateur, ou rien (une carte
 * blanche). C'est la dernière retournée qui la porte ; elle y est écrite dès qu'il ne reste plus
 * qu'elle face cachée, pour être prête quand elle se retourne. Les cartes retournées pendant le
 * codage sont toujours blanches.
 */
export function faceDe(etat: Etat, index: number): CarteJouee | null {
	if (etat.phase !== 'revelation') return null;
	const rang = etat.retournees.indexOf(index);
	const derniere = rang === -1 ? etat.retournees.length === NOMBRE - 1 : rang === NOMBRE - 1;
	return derniere ? etat.carte : null;
}
