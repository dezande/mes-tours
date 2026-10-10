/*
 * La révélation : trois colonnes de cartes, comme les photos des questions, et la carte du spectateur
 * face en bas au milieu de la colonne du milieu. Fonctions pures, sans DOM : testées sous Node
 * (tests/tours/trois-questions/revelation.test.ts). Le même semis donne toujours les mêmes colonnes.
 *
 * Les autres cartes sont faces en l'air, toutes différentes, et différentes de celle du spectateur.
 * Deux d'entre elles disent la carte à l'artiste avant qu'elle ne soit retournée :
 *   en haut à gauche   la 1re carte de la colonne 1 : la même valeur, une autre famille ;
 *   en bas à droite    la dernière carte de la colonne 3, la seule entière : la même famille, une
 *                      autre valeur, et jamais une figure (Valet, Dame, Roi).
 *
 * Les autres sont tirées au sort parmi les 52 cartes, sans la valeur ni la famille de la carte du
 * spectateur : rien ne brouille les deux coins. Il en reste exactement 36 (12 valeurs dans 3 familles) :
 * trois colonnes de 13 les prennent toutes.
 */

import { alea } from '../../princesse/logic/melange.ts';
import { estFigure, type Carte } from '../../princesse/logic/cartes.ts';
import { COLONNES } from './codes.ts';
import { CARTES_A_JOUER } from './paquet.ts';

/** Les cartes de chaque colonne de la révélation. */
export const CARTES_PAR_COLONNE_REVELATION = 13;

/** La place de la carte du spectateur : la colonne du milieu, au milieu (de 0 à 12, la 7e). */
export const SPECTATEUR = { colonne: 1, rang: 6 } as const;
/** Les deux coins qui la disent : en haut à gauche, en bas à droite. */
export const COIN_DE_LA_VALEUR = { colonne: 0, rang: 0 } as const;
export const COIN_DE_LA_FAMILLE = { colonne: COLONNES - 1, rang: CARTES_PAR_COLONNE_REVELATION - 1 } as const;

/** `nombre` cartes de `parmi`, tirées au sort sans remise (Fisher-Yates), à partir du semis et d'un rang. */
function tirer<T>(parmi: readonly T[], nombre: number, semis: number, rang: number): T[] {
	const sac = [...parmi];
	for (let i = sac.length - 1; i > 0; i--) {
		const j = Math.floor(alea(semis, rang * 97 + i) * (i + 1));
		[sac[i], sac[j]] = [sac[j]!, sac[i]!];
	}
	return sac.slice(0, nombre);
}

/** Les deux coins qui disent la carte : en haut à gauche, puis en bas à droite. */
export function coins(carte: Carte, semis: number): [Carte, Carte] {
	const [valeur] = tirer(CARTES_A_JOUER.filter((c) => c.valeur === carte.valeur && c.enseigne !== carte.enseigne), 1, semis, 2);
	const [famille] = tirer(CARTES_A_JOUER.filter((c) => c.enseigne === carte.enseigne && c.valeur !== carte.valeur && !estFigure(c.valeur)), 1, semis, 3);
	return [valeur!, famille!];
}

const ici = (place: { colonne: number; rang: number }, colonne: number, rang: number): boolean => place.colonne === colonne && place.rang === rang;

/**
 * Les trois colonnes de la révélation, de haut en bas : la carte du spectateur à sa place
 * (SPECTATEUR), les deux coins qui la disent, et les autres cartes tirées au sort.
 */
export function revelation(carte: Carte, semis: number): Carte[][] {
	const [haut, bas] = coins(carte, semis);
	const libres = CARTES_A_JOUER.filter((c) => c.valeur !== carte.valeur && c.enseigne !== carte.enseigne);
	const autres = tirer(libres, COLONNES * CARTES_PAR_COLONNE_REVELATION - 3, semis, 4);
	return Array.from({ length: COLONNES }, (_, colonne) => Array.from({ length: CARTES_PAR_COLONNE_REVELATION }, (_, rang) => {
		if (ici(SPECTATEUR, colonne, rang)) return carte;
		if (ici(COIN_DE_LA_VALEUR, colonne, rang)) return haut;
		if (ici(COIN_DE_LA_FAMILLE, colonne, rang)) return bas;
		return autres.shift()!;
	}));
}
