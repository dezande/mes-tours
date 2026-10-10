/*
 * Le paquet de 52 cartes, sans Joker, et son ordre : mélangé à chaque nouvelle routine, ou réglé par
 * l'artiste pour y mettre son chapelet mémorisé. Fonctions pures, sans DOM : testées sous Node
 * (tests/tours/trois-questions/paquet.test.ts).
 *
 * Une carte s'enregistre par son identifiant : « A-pique », « 10-coeur », « D-trefle » (les valeurs et
 * enseignes de la Princesse : princesse/logic/cartes.ts).
 *
 * Dans les réglages, l'ordre s'écrit en abrégé, dans la langue du menu, une carte après l'autre,
 * séparées par des espaces, des virgules ou des retours à la ligne :
 *   français   la valeur (A, 2 … 10, V, D, R) puis la famille (P pique, C cœur, K carreau, T trèfle) :
 *              « AP 10C DK RT » ;
 *   anglais    la valeur (A, 2 … 10 ou T, J, Q, K) puis la famille (S, H, D, C) : « AS 10H QD KC » ;
 *   partout    les symboles ♠ ♥ ♦ ♣ à la place de la lettre (« 7♦ »).
 * Les minuscules valent les majuscules.
 */

import type { Lang } from '../../../logic/i18n.ts';
import { alea } from '../../princesse/logic/melange.ts';
import { ENSEIGNES, estFigure, VALEURS, type Carte, type Enseigne, type Valeur } from '../../princesse/logic/cartes.ts';

/** Le nombre de cartes du paquet. */
export const NOMBRE_DE_CARTES = 52;

/** L'identifiant d'une carte, celui qui est enregistré. */
export const idDeCarte = (carte: Carte): string => `${carte.valeur}-${carte.enseigne}`;

/** Les 52 cartes à jouer, famille par famille (pique, cœur, carreau, trèfle), de l'As au Roi. */
export const CARTES_A_JOUER: readonly Carte[] = ENSEIGNES.flatMap((enseigne) => VALEURS.map((valeur) => ({ valeur, enseigne })));

/** La carte d'un identifiant, ou null s'il n'en est pas un. */
export function carteDeLId(id: unknown): Carte | null {
	if (typeof id !== 'string') return null;
	return CARTES_A_JOUER.find((carte) => idDeCarte(carte) === id) ?? null;
}

/** Les 52 cartes rangées : famille par famille (pique, cœur, carreau, trèfle), de l'As au Roi. */
export const ORDRE_RANGE: readonly string[] = Object.freeze(CARTES_A_JOUER.map(idDeCarte));

/**
 * Un ordre tiré au sort (Fisher-Yates) à partir d'un semis : celui du paquet, à chaque nouvelle
 * routine, quand aucun ordre n'est réglé.
 */
export function ordreMelange(semis: number): string[] {
	const ordre = [...ORDRE_RANGE];
	for (let i = ordre.length - 1; i > 0; i--) {
		const j = Math.floor(alea(semis, 11000 + i) * (i + 1));
		[ordre[i], ordre[j]] = [ordre[j]!, ordre[i]!];
	}
	return ordre;
}

/** Un ordre est-il valide : 52 identifiants, chaque carte une fois ? */
export function estUnOrdre(ordre: unknown): ordre is readonly string[] {
	if (!Array.isArray(ordre) || ordre.length !== NOMBRE_DE_CARTES) return false;
	return new Set(ordre).size === ordre.length && ordre.every((id) => carteDeLId(id) !== null);
}

/** Les cartes d'un ordre valide (estUnOrdre), dans l'ordre. */
export const cartesDeLOrdre = (ordre: readonly string[]): Carte[] => ordre.map((id) => carteDeLId(id)!);

/* ---------- L'écriture abrégée, dans les réglages ---------- */

const SYMBOLES: Readonly<Record<string, Enseigne>> = { '♠': 'pique', '♤': 'pique', '♥': 'coeur', '♡': 'coeur', '♦': 'carreau', '♢': 'carreau', '♣': 'trefle', '♧': 'trefle' };

const LETTRES_DES_ENSEIGNES: Readonly<Record<Lang, Readonly<Record<Enseigne, string>>>> = {
	fr: { pique: 'P', coeur: 'C', carreau: 'K', trefle: 'T' },
	en: { pique: 'S', coeur: 'H', carreau: 'D', trefle: 'C' },
};

const LETTRES_DES_FIGURES: Readonly<Record<Lang, Readonly<Partial<Record<Valeur, string>>>>> = {
	fr: { V: 'V', D: 'D', R: 'R' },
	en: { V: 'J', D: 'Q', R: 'K' },
};

/** L'As et les cartes de 2 à 10 : leur abrégé est leur valeur. */
const NON_FIGURES: readonly Valeur[] = VALEURS.filter((valeur) => !estFigure(valeur));

/** L'abrégé d'une carte, dans la langue demandée : « AP », « 10H ». */
export function abregeDeCarte(carte: Carte, langue: Lang): string {
	return `${LETTRES_DES_FIGURES[langue][carte.valeur] ?? carte.valeur}${LETTRES_DES_ENSEIGNES[langue][carte.enseigne]}`;
}

/** La carte d'un abrégé, dans la langue demandée ; null s'il n'est pas lisible. */
export function carteDeLAbrege(jeton: string, langue: Lang): Carte | null {
	const brut = jeton.trim().toUpperCase();
	// La famille : le dernier caractère (un symbole ou une lettre) ; la valeur : ce qui le précède.
	const caracteres = [...brut];
	const derniere = caracteres.pop() ?? '';
	const enseigne = SYMBOLES[derniere] ?? (Object.entries(LETTRES_DES_ENSEIGNES[langue]).find(([, lettre]) => lettre === derniere)?.[0] as Enseigne | undefined);
	if (!enseigne) return null;
	const v = caracteres.join('');
	const figure = Object.entries(LETTRES_DES_FIGURES[langue]).find(([, lettre]) => lettre === v)?.[0] as Valeur | undefined;
	// L'As s'écrit aussi 1 ; en anglais, le 10 s'écrit aussi T (« TS », le 10 de pique).
	const chiffre = v === '1' ? 'A' : langue === 'en' && v === 'T' ? '10' : v;
	const valeur = figure ?? NON_FIGURES.find((valeurSansFigure) => valeurSansFigure === chiffre);
	return valeur ? { valeur, enseigne } : null;
}

/** L'ordre écrit en abrégé : neuf cartes par ligne (six lignes), qui tiennent sur la largeur d'un téléphone. */
export function ecrireOrdre(ordre: readonly string[], langue: Lang): string {
	const abreges = ordre.map((id) => {
		const carte = carteDeLId(id);
		return carte ? abregeDeCarte(carte, langue) : '?';
	});
	const lignes: string[] = [];
	for (let i = 0; i < abreges.length; i += 9) lignes.push(abreges.slice(i, i + 9).join(' '));
	return lignes.join('\n');
}

/** Ce qui ne va pas dans un ordre écrit à la main. */
export type Faute =
	| { readonly type: 'illisible'; readonly jeton: string }
	| { readonly type: 'double'; readonly jeton: string }
	| { readonly type: 'manquantes'; readonly cartes: readonly string[] };

/**
 * L'ordre écrit en abrégé dans les réglages : les 52 identifiants, ou les fautes trouvées (une liste
 * vide quand l'ordre est bon). Les cartes manquantes sont rendues en abrégé, dans la langue demandée.
 */
export function lireOrdre(texte: string, langue: Lang): { ordre: string[] | null; fautes: Faute[] } {
	const jetons = texte.split(/[\s,;]+/u).filter((jeton) => jeton !== '');
	const fautes: Faute[] = [];
	const ordre: string[] = [];
	const vues = new Set<string>();
	for (const jeton of jetons) {
		const carte = carteDeLAbrege(jeton, langue);
		if (!carte) {
			fautes.push({ type: 'illisible', jeton });
			continue;
		}
		const id = idDeCarte(carte);
		if (vues.has(id)) fautes.push({ type: 'double', jeton });
		vues.add(id);
		ordre.push(id);
	}
	const manquantes = CARTES_A_JOUER.filter((carte) => !vues.has(idDeCarte(carte))).map((carte) => abregeDeCarte(carte, langue));
	if (manquantes.length > 0) fautes.push({ type: 'manquantes', cartes: manquantes });
	return { ordre: fautes.length === 0 && estUnOrdre(ordre) ? ordre : null, fautes };
}
