/*
 * L'état de la routine, et ce que chaque geste en fait. Fonctions pures, sans DOM :
 * testées sous Node (tests/tours/trois-paquets/routine.test.ts).
 *
 * Sept panneaux : deux mélanges (des cartes en tas, faces en l'air ou en bas, pour rien), la salade
 * qui force les huit cartes, trois fois les mêmes paquets (trois copies identiques : mêmes cartes,
 * même ordre), et la fin.
 *
 *   un mélange               ──balayer vers la gauche──▶  le mélange suivant, puis la salade
 *   la salade                ──balayer vers la gauche──▶  les paquets (1re copie)
 *   les paquets              ──balayer vers la gauche──▶  la copie suivante, puis la fin
 *   la fin                   ──toucher──▶  la carte face en bas disparaît
 *   la fin, avant le toucher ──balayer vers la gauche──▶  une nouvelle routine : le premier mélange
 *   balayer vers la droite : le panneau d'avant (rien n'est tiré à nouveau)
 *
 * Une fois la carte disparue, le tour est FIGÉ : plus aucun balayage, ni vers les paquets, ni vers
 * une nouvelle routine. Seuls le retour au menu (appui de 3 s : le tour repart neuf à sa prochaine
 * ouverture) et, au clavier, la touche R le remettent à zéro.
 *
 * Sur chaque copie des paquets, toucher un paquet le NOTE pour cette copie, sans que rien ne se voie
 * (toucher encore : il ne l'est plus). L'artiste y touche les paquets où le spectateur voit sa carte :
 * leur somme (1, 2, 4) est le code de la carte pensée, et la fin ne montre alors aucune carte de sa
 * valeur, pas même un sosie (logic/tirage.ts : finale). Seule compte la DERNIÈRE copie où quelque
 * chose est noté : l'artiste peut noter à chaque passage sans que ses touchers s'annulent. Rien de
 * noté nulle part, c'est le code 0 : le 2♣, et la fin ne montre aucun 2 (sans gêne si l'artiste n'a
 * rien noté : le 2 n'est jamais dans les paquets).
 *
 * Rien de tout cela n'est enregistré : chaque ouverture du tour repart d'un nouveau tirage, le
 * premier mélange.
 */

import { codeDesPaquets, MELANGES, PAQUETS } from './tirage.ts';

/** Le nombre de copies du panneau des paquets. */
export const COPIES = 3;
/**
 * Les sept panneaux : 0 et 1 les mélanges, 2 la salade (SALADE), 3 à 5 les copies des paquets, 6 la
 * fin (FIN).
 */
export type Panneau = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const SALADE = MELANGES as Panneau;
export const FIN: Panneau = 6;

/** La copie des paquets que montre le panneau (1 à COPIES), ou null. */
export const copieDuPanneau = (panneau: number): number | null => (panneau > SALADE && panneau < FIN ? panneau - SALADE : null);

/** Le panneau montre-t-il les paquets (l'une des copies) ? */
export const estPaquets = (panneau: number): boolean => copieDuPanneau(panneau) !== null;

export interface Etat {
	readonly panneau: Panneau;
	/** Le semis du tirage en cours (logic/tirage.ts). */
	readonly semis: number;
	/** Pour chaque copie des paquets, les paquets notés (0, 1, 2), dans l'ordre où ils ont été touchés. */
	readonly notes: readonly (readonly number[])[];
	/** La fin : la carte face en bas a disparu. */
	readonly disparue: boolean;
}

export type Sens = 'suivant' | 'precedent';

/** Une nouvelle routine : le premier mélange, le tirage de ce semis, rien de noté. */
export const depart = (semis: number): Etat => ({ panneau: 0, semis, notes: Array.from({ length: COPIES }, () => []), disparue: false });

/**
 * Après un balayage : vers la gauche, le panneau suivant (après la fin, une nouvelle routine, tirée
 * avec `semisSuivant`) ; vers la droite, le précédent (rien avant le premier mélange). La carte
 * disparue, plus rien : le tour est figé.
 */
export function apresBalayage(etat: Etat, sens: Sens, semisSuivant: number): Etat {
	if (etat.panneau === FIN && etat.disparue) return etat;
	if (sens === 'suivant') return etat.panneau === FIN ? depart(semisSuivant) : { ...etat, panneau: (etat.panneau + 1) as Panneau, disparue: false };
	return etat.panneau === 0 ? etat : { ...etat, panneau: (etat.panneau - 1) as Panneau, disparue: false };
}

/**
 * Après un toucher, sur le paquet `paquet` (0, 1, 2 ; null : hors des paquets) : sur une copie des
 * paquets, il est noté pour cette copie (ou ne l'est plus) ; sur la fin, la carte face en bas
 * disparaît. Rien sur les mélanges ni sur la salade.
 */
export function apresToucher(etat: Etat, paquet: number | null): Etat {
	if (etat.panneau === FIN) return etat.disparue ? etat : { ...etat, disparue: true };
	if (!estPaquets(etat.panneau) || paquet === null || !Number.isInteger(paquet) || paquet < 0 || paquet >= PAQUETS) return etat;
	const copie = copieDuPanneau(etat.panneau)! - 1;
	const notes = etat.notes.map((notees, c) => (c !== copie ? notees : notees.includes(paquet) ? notees.filter((p) => p !== paquet) : [...notees, paquet]));
	return { ...etat, notes };
}

/** Le code de la carte pensée, d'après la dernière copie où des paquets sont notés (0 à 7 ; rien de noté : 0). */
export const codeNote = (etat: Etat): number => codeDesPaquets([...etat.notes].reverse().find((notees) => notees.length > 0) ?? []);

/**
 * Le paquet touché, de 0 (à gauche) à 2 (à droite), à l'abscisse `x`, dans la rangée de paquets qui
 * commence à `gauche` et large de `largeur`. Hors de la rangée, ou largeur invalide : null.
 */
export function paquetDuPoint(x: number, gauche: number, largeur: number): number | null {
	if (![x, gauche, largeur].every(Number.isFinite) || largeur <= 0 || x < gauche || x > gauche + largeur) return null;
	return Math.min(PAQUETS - 1, Math.floor(((x - gauche) / largeur) * PAQUETS));
}
