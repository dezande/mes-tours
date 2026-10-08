/*
 * Les cartes à jouer : leur forme, leur nom, l'index imprimé dans leurs coins et la place de leurs
 * enseignes. Fonctions pures, sans DOM : testées sous Node (tests/tours/princesse/cartes.test.ts).
 * Les cinq cartes de la routine sont dans content/cartes.ts, leur dessin dans components/.
 *
 * Les places des enseignes sont celles d'un jeu Bicycle, dans le repère de la carte : 100 de large
 * pour 140 de haut. Celles de la moitié du bas sont imprimées tête-bêche.
 */

import type { Lang } from '../../../logic/i18n.ts';

export const ENSEIGNES = ['pique', 'coeur', 'carreau', 'trefle'] as const;
export type Enseigne = (typeof ENSEIGNES)[number];

export const VALEURS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'] as const;
export type Valeur = (typeof VALEURS)[number];

export interface Carte {
	valeur: Valeur;
	enseigne: Enseigne;
}

/** Les enseignes rouges ; les autres sont noires. */
export const estRouge = (enseigne: Enseigne): boolean => enseigne === 'coeur' || enseigne === 'carreau';

/** Les figures (valet, dame, roi) : un personnage plutôt que des enseignes. */
export const estFigure = (valeur: Valeur): boolean => valeur === 'V' || valeur === 'D' || valeur === 'R';

/**
 * L'index imprimé dans les coins de la carte. Un jeu Bicycle est imprimé à l'anglaise, dans toutes
 * les langues : J, Q, K pour les figures — c'est ce que le public voit sur un vrai jeu.
 */
export function indexDeCarte(valeur: Valeur): string {
	switch (valeur) {
		case 'V': return 'J';
		case 'D': return 'Q';
		case 'R': return 'K';
		default: return valeur;
	}
}

const NOMS_VALEURS: Readonly<Record<Lang, Readonly<Record<Valeur, string>>>> = {
	fr: { A: 'As', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', V: 'Valet', D: 'Dame', R: 'Roi' },
	en: { A: 'Ace', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', V: 'Jack', D: 'Queen', R: 'King' },
};

const NOMS_ENSEIGNES: Readonly<Record<Lang, Readonly<Record<Enseigne, string>>>> = {
	fr: { pique: 'pique', coeur: 'cœur', carreau: 'carreau', trefle: 'trèfle' },
	en: { pique: 'spades', coeur: 'hearts', carreau: 'diamonds', trefle: 'clubs' },
};

/** Le nom de la carte, pour les lecteurs d'écran : « 4 de trèfle », « Jack of diamonds ». */
export function nomDeCarte(carte: Carte, langue: Lang): string {
	return `${NOMS_VALEURS[langue][carte.valeur]} ${langue === 'fr' ? 'de' : 'of'} ${NOMS_ENSEIGNES[langue][carte.enseigne]}`;
}

/** Une enseigne imprimée sur la carte : son centre, et tête-bêche ou non. */
export interface Pip {
	x: number;
	y: number;
	retourne: boolean;
}

// Les colonnes et les rangées des enseignes, dans le repère 100 × 140.
const [G, M, D] = [29, 50, 71];
const [HAUT, BAS] = [30, 110];
/** Les quatre rangées des colonnes de côté, du 9 et du 10. */
const QUART = (BAS - HAUT) / 3;

const pip = (x: number, y: number): Pip => ({ x, y, retourne: y > 70 });

/** Les places des enseignes d'une carte de 1 à 10 ; aucune pour une figure. */
export function placesDesEnseignes(valeur: Valeur): Pip[] {
	const cotes = (rangees: number[]): Pip[] => rangees.flatMap((y) => [pip(G, y), pip(D, y)]);
	const quatre = [HAUT, HAUT + QUART, BAS - QUART, BAS];
	switch (valeur) {
		case 'A': return [pip(M, 70)];
		case '2': return [pip(M, HAUT), pip(M, BAS)];
		case '3': return [pip(M, HAUT), pip(M, 70), pip(M, BAS)];
		case '4': return cotes([HAUT, BAS]);
		case '5': return [...cotes([HAUT, BAS]), pip(M, 70)];
		case '6': return cotes([HAUT, 70, BAS]);
		case '7': return [...cotes([HAUT, 70, BAS]), pip(M, (HAUT + 70) / 2)];
		case '8': return [...cotes([HAUT, 70, BAS]), pip(M, (HAUT + 70) / 2), pip(M, (70 + BAS) / 2)];
		case '9': return [...cotes(quatre), pip(M, 70)];
		case '10': return [...cotes(quatre), pip(M, HAUT + QUART / 2), pip(M, BAS - QUART / 2)];
		default: return [];
	}
}

/**
 * Fautes trouvées dans une liste de cartes : valeur ou enseigne inconnue, champ en trop, carte en
 * double. Une liste vide veut dire que tout va bien. Appelée par les tests : une faute de frappe ne
 * part jamais en scène.
 */
export function checkCartes(cartes: readonly unknown[]): string[] {
	const fautes: string[] = [];
	const vues = new Set<string>();
	cartes.forEach((brute, i) => {
		const numero = `carte ${i + 1}`;
		if (!brute || typeof brute !== 'object') {
			fautes.push(`${numero} : ce n'est pas une carte`);
			return;
		}
		const carte = brute as Record<string, unknown>;
		for (const champ of Object.keys(carte)) {
			if (champ !== 'valeur' && champ !== 'enseigne') fautes.push(`${numero} : champ inconnu « ${champ} »`);
		}
		if (!(VALEURS as readonly unknown[]).includes(carte.valeur)) fautes.push(`${numero} : valeur inconnue « ${String(carte.valeur)} »`);
		if (!(ENSEIGNES as readonly unknown[]).includes(carte.enseigne)) fautes.push(`${numero} : enseigne inconnue « ${String(carte.enseigne)} »`);
		const cle = `${String(carte.valeur)}-${String(carte.enseigne)}`;
		if (vues.has(cle)) fautes.push(`${numero} : déjà dans le jeu`);
		vues.add(cle);
	});
	return fautes;
}
