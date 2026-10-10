/*
 * La routine des trois questions, et ce que chaque geste en fait. Fonctions pures, sans DOM :
 * testées sous Node (tests/tours/trois-questions/routine.test.ts).
 *
 * Au public, l'écran est une galerie de photos qu'on fait défiler au doigt. Chaque question est une
 * photo : les trois colonnes de cartes, posées sur le tapis. L'artiste y note la réponse du spectateur
 * sans que rien ne se voie :
 *
 *   toucher une colonne de la photo       la réponse est cette colonne ; photo suivante
 *   double toucher, n'importe où          la réponse est « aucune » (la carte est de côté) ; photo
 *                                         suivante
 *   défiler (vers la gauche)              une autre photo des mêmes colonnes, prise en rafale : rien
 *                                         n'est noté ; la galerie s'arrête là
 *   défiler vers la droite                la photo d'avant : la rafale revient à sa première photo ;
 *                                         la première revient à la question d'avant, dont la
 *                                         réponse est oubliée (pour corriger, ou recommencer)
 *
 * Après la 3e réponse, la dernière photo : trois colonnes de cartes (logic/revelation.ts), la carte du
 * spectateur face en bas au milieu de la colonne du milieu.
 *
 *   défiler, d'un côté ou de l'autre      rien : la dernière photo est bloquée
 *   toucher la carte face en bas          elle se retourne (si le réglage le permet)
 *   double toucher, la carte retournée    une nouvelle routine, la première photo (au clavier : R) ;
 *                                         la carte qu'on ne retourne pas, dès qu'elle est là
 *
 * Trois réponses qui donnent un code écarté (logic/codes.ts) : la galerie ne bouge pas, rien ne se
 * voit ; le tour le signale à l'artiste seul (une vibration, index.tsx). Il revient en arrière en
 * défilant vers la droite, et note à nouveau.
 *
 * Rien de tout cela n'est enregistré : chaque ouverture du tour repart de la première photo.
 */

import { COLONNES, placeDesReponses, QUESTIONS, type Reponse } from './codes.ts';

export interface Etat {
	/** Les réponses notées, une par question passée (0 à 3 réponses). */
	readonly reponses: readonly Reponse[];
	/** Un défilement en attente : la photo montrée est la rafale de la question. */
	readonly rafale: boolean;
	/** La carte du spectateur, face en bas à la révélation, est retournée. */
	readonly retournee: boolean;
	/** Le semis de la routine : l'ordre des cartes dans les colonnes, et les cartes de la révélation. */
	readonly semis: number;
}

/** Une photo de la galerie : les colonnes d'une question (la première prise, ou la rafale), ou la révélation. */
export type Photo =
	| { readonly type: 'colonnes'; readonly question: number; readonly rafale: boolean }
	| { readonly type: 'revelation'; readonly reponses: readonly Reponse[]; readonly retournee: boolean };

/** Ce qu'un geste a fait : l'état suivant, et `exclu` quand les trois réponses donnent un code écarté. */
export interface Suite {
	readonly etat: Etat;
	readonly exclu: boolean;
}

/** Une nouvelle routine : la première photo, rien de noté. */
export const depart = (semis: number): Etat => ({ reponses: [], rafale: false, retournee: false, semis });

/** La galerie est-elle sur la révélation (les trois réponses notées) ? */
export const enRevelation = (etat: Etat): boolean => etat.reponses.length >= QUESTIONS;

/** La photo montrée. */
export function photo(etat: Etat): Photo {
	if (enRevelation(etat)) return { type: 'revelation', reponses: etat.reponses, retournee: etat.retournee };
	return { type: 'colonnes', question: etat.reponses.length, rafale: etat.rafale };
}

const sans = (etat: Etat): Suite => ({ etat, exclu: false });

/** Note la réponse de la question en cours. Un code écarté ne note rien : la galerie ne bouge pas. */
function noter(etat: Etat, reponse: Reponse): Suite {
	const reponses = [...etat.reponses, reponse];
	if (reponses.length === QUESTIONS && placeDesReponses(reponses) === null) return { etat, exclu: true };
	return sans({ ...etat, reponses, rafale: false, retournee: false });
}

/** Après un défilement : « suivant » (vers la gauche, la photo d'après) ou « precedent » (vers la droite). */
export function apresDefilement(etat: Etat, sens: 'suivant' | 'precedent'): Suite {
	if (sens === 'suivant') {
		// La rafale, puis la galerie s'arrête : un défilement ne note jamais rien.
		if (enRevelation(etat) || etat.rafale) return sans(etat);
		return sans({ ...etat, rafale: true });
	}
	// La dernière photo est bloquée : plus de retour en arrière.
	if (enRevelation(etat)) return sans(etat);
	if (etat.rafale) return sans({ ...etat, rafale: false });
	if (etat.reponses.length === 0) return sans(etat);
	return sans({ ...etat, reponses: etat.reponses.slice(0, -1), rafale: false });
}

/** Après un toucher sur la colonne `colonne` (1 à 3) d'une photo de colonnes. */
export function apresColonne(etat: Etat, colonne: number): Suite {
	if (enRevelation(etat) || !Number.isInteger(colonne) || colonne < 1 || colonne > COLONNES) return sans(etat);
	return noter(etat, colonne as Reponse);
}

/** Après un double toucher sur une photo de colonnes : la réponse « aucune » (la carte est de côté). */
export const apresAucune = (etat: Etat): Suite => (enRevelation(etat) ? sans(etat) : noter(etat, 0));

/** Après un toucher sur la carte du spectateur, à la révélation : elle se retourne. */
export const apresCentre = (etat: Etat): Etat => (enRevelation(etat) ? { ...etat, retournee: true } : etat);

/**
 * Après un double toucher : une nouvelle routine (semis `semis`), si la carte du spectateur était déjà
 * retournée avant le premier toucher (`avantPremierTap`) — deux touchers vifs sur la carte face en
 * bas la retournent, sans relancer aussitôt la routine. Une carte qui ne se retourne pas (réglage
 * `retournable` à false) : le double toucher relance dès la révélation.
 */
export const apresDouble = (etat: Etat, avantPremierTap: Etat, semis: number, retournable = true): Etat =>
	(enRevelation(etat) && (avantPremierTap.retournee || !retournable) ? depart(semis) : etat);

/** Les photos voisines de celle montrée : celles qu'un défilement montrerait ; null quand il ne bougerait rien. */
export function voisines(etat: Etat): { precedente: Photo | null; suivante: Photo | null } {
	const voisine = (sens: 'suivant' | 'precedent'): Photo | null => {
		const suite = apresDefilement(etat, sens);
		return suite.exclu || suite.etat === etat ? null : photo(suite.etat);
	};
	return { precedente: voisine('precedent'), suivante: voisine('suivant') };
}

/**
 * La colonne (1 à 3) au point d'abscisse `x`, sur une photo de colonnes posée de `gauche` sur
 * `largeur` : la photo est coupée en trois bandes, de haut en bas ; null hors de la photo.
 */
export function colonneDuPoint(x: number, gauche: number, largeur: number): number | null {
	if (!Number.isFinite(x) || !(largeur > 0) || x < gauche || x > gauche + largeur) return null;
	return Math.min(COLONNES, Math.floor(((x - gauche) / largeur) * COLONNES) + 1);
}
