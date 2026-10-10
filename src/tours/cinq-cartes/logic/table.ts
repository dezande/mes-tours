/*
 * Où tombe un toucher sur la table : sur quelle carte, et dans quel coin de la cinquième.
 * Fonctions pures, sans DOM : testées sous Node (tests/tours/cinq-cartes/table.test.ts). Les
 * boîtes sont calculées par le tour (index.tsx), dans le repère de #app : pour savoir quelle
 * carte est touchée, la colonne de chaque carte (toute sa place dans la rangée, écarts compris,
 * sur toute la hauteur de l'écran, comme dans Princesse) ; pour le coin, le milieu de la carte,
 * qui coupe toute sa colonne en quatre : les coins dépassent la carte jusqu'aux bords de l'écran.
 */

import { COULEURS, type Couleur } from './routine.ts';

export interface Boite {
	x: number;
	y: number;
	largeur: number;
	hauteur: number;
}

/**
 * La marge de part et d'autre de la rangée, en pixels, où un toucher compte encore pour la carte
 * du bord : un doigt posé à cheval sur le bord ne doit pas tomber dans le vide. Là où deux
 * colonnes se touchent, le toucher va à celle dont le milieu est le plus proche.
 */
export const MARGE_PX = 16;

/**
 * L'index de la carte touchée à l'abscisse `x` : la colonne qui la contient, à n'importe quelle
 * hauteur, ou null si le doigt est tombé sur la table, à côté de la rangée.
 */
export function carteDuPoint(x: number, colonnes: readonly Boite[]): number | null {
	if (!Number.isFinite(x)) return null;
	let choisie: number | null = null;
	let distance = Infinity;
	colonnes.forEach((b, i) => {
		if (x < b.x - MARGE_PX || x > b.x + b.largeur + MARGE_PX) return;
		const d = Math.abs(x - (b.x + b.largeur / 2));
		if (d < distance) [choisie, distance] = [i, d];
	});
	return choisie;
}

/**
 * La couleur donnée par le coin de la carte `boite` touché au point (x, y) : la colonne de la
 * carte est coupée en quatre par son milieu, sur toute sa largeur et toute la hauteur de l'écran
 * (le doigt n'a pas à tomber sur la carte) — en haut à gauche pique, en haut à droite cœur, en
 * bas à gauche trèfle, en bas à droite carreau.
 */
export function couleurDuPoint(x: number, y: number, boite: Boite): Couleur | null {
	if (!Number.isFinite(x) || !Number.isFinite(y) || !(boite.largeur > 0) || !(boite.hauteur > 0)) return null;
	const droite = x >= boite.x + boite.largeur / 2;
	const bas = y >= boite.y + boite.hauteur / 2;
	return COULEURS[(bas ? 2 : 0) + (droite ? 1 : 0)]!;
}

/**
 * Les boîtes de la rangée posée dans `rangee` (sa boîte dans le repère de #app : cinq places de
 * même largeur), ses cartes de `largeur` × `hauteur` à leurs `places` (logic/disposition.ts) :
 *   colonnes   pour savoir quelle carte est touchée : toute la place de chaque carte, écarts
 *              compris (seule leur largeur compte) ;
 *   cartes     la carte elle-même, pour le coin touché.
 * La petite inclinaison des cartes (quelques degrés) est négligée : elle ne déplace pas leurs coins
 * de plus que la marge d'un toucher.
 */
export function boitesDeLaRangee(rangee: Boite, places: readonly { x: number; y: number }[], largeur: number, hauteur: number): { colonnes: Boite[]; cartes: Boite[] } {
	const pas = rangee.largeur / Math.max(1, places.length);
	const milieu = rangee.x + rangee.largeur / 2;
	const cartes = places.map((p) => ({ x: milieu + p.x * pas - largeur / 2, y: rangee.y + p.y * hauteur, largeur, hauteur }));
	const colonnes = cartes.map((c) => ({ x: c.x + largeur / 2 - pas / 2, y: c.y, largeur: pas, hauteur }));
	return { colonnes, cartes };
}

/**
 * Les quatre coins de la colonne `colonne` (de `hauteur` : celle de l'écran), coupée par le milieu
 * de sa carte `carte`, dans l'ordre de COULEURS : ceux que couleurDuPoint reconnaît, pour le test
 * des zones.
 */
export function coinsDeLaColonne(colonne: Boite, carte: Boite, hauteur: number): Boite[] {
	const mx = Math.min(colonne.x + colonne.largeur, Math.max(colonne.x, carte.x + carte.largeur / 2));
	const my = Math.min(hauteur, Math.max(0, carte.y + carte.hauteur / 2));
	return COULEURS.map((_, i) => {
		const [droite, bas] = [i % 2 === 1, i >= 2];
		const x = droite ? mx : colonne.x;
		const y = bas ? my : 0;
		return { x, y, largeur: droite ? colonne.x + colonne.largeur - mx : mx - colonne.x, hauteur: bas ? hauteur - my : my };
	});
}

/**
 * Les deux moitiés de la colonne `colonne` (de `hauteur` : celle de l'écran), coupée par le milieu
 * de sa carte `carte` : en haut, puis en bas. Ce sont les coins de couleurDuPoint, deux à deux
 * (logic/routine.ts : enHaut), pour le test des zones des codages en haut ou en bas.
 */
export function moitiesDeLaColonne(colonne: Boite, carte: Boite, hauteur: number): [Boite, Boite] {
	const my = Math.min(hauteur, Math.max(0, carte.y + carte.hauteur / 2));
	return [
		{ x: colonne.x, y: 0, largeur: colonne.largeur, hauteur: my },
		{ x: colonne.x, y: my, largeur: colonne.largeur, hauteur: hauteur - my },
	];
}
