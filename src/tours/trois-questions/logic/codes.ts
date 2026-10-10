/*
 * Le codage des 52 cartes : trois questions, et la carte retrouvée par ses trois réponses. Fonctions
 * pures, sans DOM : testées sous Node (tests/tours/trois-questions/codes.test.ts).
 *
 * À chaque question, les cartes sont réparties en quatre groupes : les colonnes 1, 2 et 3, montrées,
 * et un groupe « de côté », jamais montré. Le spectateur dit dans quelle colonne est sa carte, ou
 * qu'elle n'y est pas (« aucune » : elle est de côté).
 *
 * Chaque carte a un code de trois chiffres en base 4 (000 à 333) : son chiffre n° t est sa place à
 * la question t, 0 de côté, 1 à 3 la colonne. Dix codes sont écartés (EXCLUS) ; il en reste 54
 * (CODES_POSSIBLES), donnés dans l'ordre croissant aux cartes dans l'ordre du paquet : la 1re carte a le
 * plus petit code, la 52e le 52e. Les deux derniers, 331 et 332, ne sont ceux d'aucune carte : comme
 * un code écarté, leurs réponses ne donnent rien. Les trois réponses sont le code de la carte.
 *
 * Avec les 54 codes, chaque question aurait 13 cartes de côté et 13, 14, 14 dans les trois colonnes ;
 * sans 331 ni 332, la 3e colonne en a deux de moins aux questions 1 et 2, et les colonnes 1 et 2 une
 * de moins chacune à la question 3 (13 de côté, puis 12, 13, 14).
 */

import { NOMBRE_DE_CARTES } from './paquet.ts';

/** Le nombre de questions, et de colonnes montrées à chacune. */
export const QUESTIONS = 3;
export const COLONNES = 3;

/** Une réponse : 0 « aucune » (la carte est de côté), 1 à 3 la colonne. */
export type Reponse = 0 | 1 | 2 | 3;

/** Les dix codes écartés. */
export const EXCLUS: readonly string[] = Object.freeze(['000', '111', '222', '333', '012', '123', '230', '301', '010', '101']);

/** Les 64 codes de 000 à 333, dans l'ordre croissant. */
const TOUS = Array.from({ length: 4 ** QUESTIONS }, (_, n) => n.toString(4).padStart(QUESTIONS, '0'));

/** Les 54 codes qui ne sont pas écartés, dans l'ordre croissant. */
export const CODES_POSSIBLES: readonly string[] = Object.freeze(TOUS.filter((code) => !EXCLUS.includes(code)));

/** Les 52 codes donnés aux cartes : CODES[i] est celui de la carte n° i + 1 du paquet. */
export const CODES: readonly string[] = Object.freeze(CODES_POSSIBLES.slice(0, NOMBRE_DE_CARTES));

/** Le code de trois réponses : « 302 ». */
export const codeDesReponses = (reponses: readonly Reponse[]): string => reponses.join('');

/** Ce code est-il écarté ? */
export const estExclu = (code: string): boolean => EXCLUS.includes(code);

/** La place dans le paquet (0 à 51) de la carte aux trois réponses données ; null pour un code sans carte (écarté, 331 ou 332) ou incomplet. */
export function placeDesReponses(reponses: readonly Reponse[]): number | null {
	const place = CODES.indexOf(codeDesReponses(reponses));
	return reponses.length === QUESTIONS && place >= 0 ? place : null;
}

/** La place de la carte n° `place` (0 à 51) à la question `question` (0 à 2) : 0 de côté, 1 à 3 la colonne. */
export const placeALaQuestion = (place: number, question: number): Reponse => Number(CODES[place]![question]) as Reponse;

/**
 * Les quatre groupes de la question `question` (0 à 2) : [de côté, colonne 1, colonne 2, colonne 3],
 * chacun dans l'ordre du paquet `cartes` (52 cartes).
 */
export function groupes<T>(cartes: readonly T[], question: number): [T[], T[], T[], T[]] {
	const quatre: [T[], T[], T[], T[]] = [[], [], [], []];
	cartes.forEach((carte, place) => quatre[placeALaQuestion(place, question)].push(carte));
	return quatre;
}
