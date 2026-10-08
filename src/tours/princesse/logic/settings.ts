/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/tours/princesse/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé. La langue, elle, est celle du menu.
 */

import { DESSINS_DE_DOS } from '../../../components/cartes/dos.ts';

/**
 * Les dos des cartes : celui façon Bicycle, dessiné pour ce tour (logic/dessin.ts), puis ceux des
 * autres tours de cartes (src/components/cartes/dos.ts).
 */
export const MOTIFS = ['bicycle', ...DESSINS_DE_DOS] as const;
export type Motif = (typeof MOTIFS)[number];

/** Les couleurs des dos (styles/tours/princesse/_cartes.scss) : le bleu d'un jeu Bicycle d'abord. */
export const COULEURS = ['bleu', 'rouge', 'noir', 'blanc'] as const;
export type Couleur = (typeof COULEURS)[number];

/**
 * Le sens dans lequel se comptent les quatre cartes restantes, pour la première carte retournée
 * (logic/routine.ts) : de gauche à droite, ou de droite à gauche — selon que l'artiste se tient à
 * côté du public ou en face.
 */
export const SENS = ['gauche', 'droite'] as const;
export type Sens = (typeof SENS)[number];

/** Les bornes du temps pendant lequel les cartes restent faces en l'air, en secondes. */
export const DUREE_MIN = 2;
export const DUREE_MAX = 15;

export interface Settings {
	/** Le dessin du dos des cartes. */
	motif: Motif;
	/** La couleur du dos des cartes. */
	couleur: Couleur;
	/** D'où se comptent les quatre cartes restantes : depuis la gauche, ou depuis la droite. */
	sens: Sens;
	/** Temps pendant lequel les cinq cartes restent faces en l'air, en secondes (pas d'une seconde). */
	duree: number;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	motif: 'bicycle',
	couleur: 'bleu',
	sens: 'gauche',
	duree: 5,
	showHoldRing: true,
});

const isMotif = (v: unknown): v is Motif => (MOTIFS as readonly unknown[]).includes(v);
const isCouleur = (v: unknown): v is Couleur => (COULEURS as readonly unknown[]).includes(v);
const isSens = (v: unknown): v is Sens => (SENS as readonly unknown[]).includes(v);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
/** Durée bornée entre DUREE_MIN et DUREE_MAX, arrondie à la seconde du curseur. */
const duree = (v: unknown): number =>
	typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(DUREE_MAX, Math.max(DUREE_MIN, v))) : DEFAULTS.duree;

/** Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur par défaut. */
export function sanitizeSettings(raw: unknown): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		motif: isMotif(src.motif) ? src.motif : DEFAULTS.motif,
		couleur: isCouleur(src.couleur) ? src.couleur : DEFAULTS.couleur,
		sens: isSens(src.sens) ? src.sens : DEFAULTS.sens,
		duree: duree(src.duree),
		showHoldRing: bool(src.showHoldRing, DEFAULTS.showHoldRing),
	};
}
