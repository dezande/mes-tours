/*
 * La routine de Trois, six, neuf, Dame, et ce que chaque toucher en fait. Fonctions pures, sans
 * DOM : testées sous Node (tests/tours/trois-six-neuf-dame/routine.test.ts).
 *
 * Les cartes sont comptées ici par leur rang, de l'As à la Dame ; leur place sur la table dépend du
 * sens réglé (logic/settings.ts : rangDeLaPlace).
 *
 * Cinq cartes face cachée, en ligne : un As, un 3, un 6, un 9 et une Dame, sans famille. Deux temps :
 *
 *   le choix       le premier toucher choisit la carte du spectateur : la carte touchée donne la
 *                  valeur (son rang), le coin touché la famille, comme dans les cinq cartes — en
 *                  haut à gauche pique, en haut à droite cœur, en bas à gauche trèfle, en bas à
 *                  droite carreau. Elle se retourne aussitôt sur la carte du spectateur.
 *   la révélation  chaque toucher retourne la carte touchée : les autres sont blanches. Mais si la
 *                  carte choisie n'est pas l'As et que l'As est retourné ensuite, toutes les cartes
 *                  sauf la carte choisie, l'As compris, retournées ou non, portent « À 1 carte
 *                  près ».
 *   la fin         les cinq cartes retournées, on ne peut plus que les retourner : chaque toucher
 *                  retourne la carte touchée, dans un sens ou dans l'autre, et chacune garde sa
 *                  face. Aucun geste ne relance la routine : l'appui de 3 s ramène au menu (au
 *                  clavier seulement, R remet les cinq dos).
 *
 * Rien de tout cela n'est enregistré : chaque ouverture du tour repart de cinq dos.
 */

import { COULEURS, type CarteJouee, type Couleur } from '../../cinq-cartes/logic/routine.ts';

export { COULEURS, memeCarte, type CarteJouee, type Couleur } from '../../cinq-cartes/logic/routine.ts';

/** Les valeurs des cinq cartes, dans l'ordre des rangs : l'As, 3, 6, 9 et la Dame (12). */
export const VALEURS = [1, 3, 6, 9, 12] as const;

/** Le nombre de cartes sur la table. */
export const NOMBRE = VALEURS.length;

/** Le rang de l'As : retourné après une autre carte choisie, il donne « À 1 carte près ». */
export const AS = 0;

export type Etat =
	/** Cinq dos : le premier toucher choisira la carte du spectateur. */
	| { readonly phase: 'choix' }
	/**
	 * La révélation : la carte du spectateur, le rang de la carte qui la porte, les cartes déjà
	 * retournées une fois, dans l'ordre, et, la routine finie, celles qui ont été remises face
	 * cachée. `pres` : l'As a été retourné après une autre carte choisie.
	 */
	| { readonly phase: 'revelation'; readonly carte: CarteJouee; readonly choisie: number; readonly retournees: readonly number[]; readonly cachees: readonly number[]; readonly pres: boolean };

/** Cinq dos : l'état à l'ouverture du tour, et après chaque remise en place. */
export const DEPART: Etat = Object.freeze({ phase: 'choix' });

const estIndex = (index: number): boolean => Number.isInteger(index) && index >= 0 && index < NOMBRE;

/** La carte de rang `index` touchée dans le coin `couleur`. */
export const carteDuToucher = (index: number, couleur: Couleur): CarteJouee => ({ valeur: VALEURS[index]!, couleur });

/**
 * État après un toucher sur la carte d'`index`, dans le coin `coin`. Le premier toucher a besoin du
 * coin, qui donne la famille : sans lui (null ou absent), il ne compte pas.
 */
export function toucher(etat: Etat, index: number, coin?: Couleur | null): Etat {
	if (!estIndex(index)) return etat;
	if (etat.phase === 'choix') {
		if (!coin) return etat;
		return { phase: 'revelation', carte: carteDuToucher(index, coin), choisie: index, retournees: [index], cachees: [], pres: false };
	}
	// La routine finie : la carte touchée se retourne, dans un sens ou dans l'autre.
	if (etat.retournees.length === NOMBRE) {
		const cachees = etat.cachees.includes(index) ? etat.cachees.filter((i) => i !== index) : [...etat.cachees, index];
		return { ...etat, cachees };
	}
	if (etat.retournees.includes(index)) return etat;
	// L'As, retourné après une autre carte : « À 1 carte près ».
	return { ...etat, retournees: [...etat.retournees, index], pres: etat.pres || index === AS };
}

/** La carte d'`index` montre-t-elle sa face ? */
export const estRetournee = (etat: Etat, index: number): boolean =>
	etat.phase === 'revelation' && etat.retournees.includes(index) && !etat.cachees.includes(index);

/** Les cartes retournées une fois, dans l'ordre. */
export const retourneesDe = (etat: Etat): readonly number[] => (etat.phase === 'revelation' ? etat.retournees : []);

/**
 * Ce qui est écrit à l'avant de la carte d'`index` : la carte du spectateur, ou rien (une carte
 * blanche, ou qui porte « À 1 carte près » : aPres).
 */
export const faceDe = (etat: Etat, index: number): CarteJouee | null =>
	(etat.phase === 'revelation' && etat.choisie === index ? etat.carte : null);

/** La carte d'`index` porte-t-elle « À 1 carte près » ? Toutes sauf la carte choisie, l'As compris, une fois l'As retourné. */
export const aPres = (etat: Etat, index: number): boolean =>
	etat.phase === 'revelation' && etat.pres && estIndex(index) && index !== etat.choisie;

/**
 * Une carte tirée au hasard, l'une des cinq valeurs dans l'une des quatre couleurs : celle que le
 * mode entraînement demande de trouver. `tirage` donne un nombre entre 0 (compris) et 1 (exclu).
 */
export function carteAuHasard(tirage: () => number = Math.random): CarteJouee {
	const choisir = (nombre: number): number => Math.min(nombre - 1, Math.floor(tirage() * nombre));
	return carteDuToucher(choisir(NOMBRE), COULEURS[choisir(COULEURS.length)]!);
}
