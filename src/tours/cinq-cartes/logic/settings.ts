/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/tours/cinq-cartes/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé. La langue, elle, est celle du menu.
 */

import { NOMBRE } from './routine.ts';

/**
 * Les couleurs du dos « Arcade », le dos en pixels du tour (logic/arcade.ts), telles qu'elles sont
 * peintes (styles/tours/cinq-cartes/_balatro.scss). Le dessin, lui, ne se choisit pas.
 */
export const TEINTES = ['noir', 'rouge', 'bleu', 'blanc'] as const;
export type Teinte = (typeof TEINTES)[number];

/**
 * D'où part le codage : la carte qui vaut 1 est au bord gauche (puis 2, 4, 8 vers la droite, la
 * carte de la couleur au bord droit), ou au bord droit (tout est alors en miroir). Les coins de la
 * carte de la couleur, eux, ne changent pas : pique toujours en haut à gauche.
 */
export const SENS = ['gauche', 'droite'] as const;
export type Sens = (typeof SENS)[number];

export interface Settings {
	/** Le bord d'où part le codage : la carte qui vaut 1. */
	sens: Sens;
	/** Couleur du dos des cinq cartes. */
	couleur: Teinte;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	sens: 'gauche',
	// Le dos en pixels, rouge : l'allure de Balatro (styles/tours/cinq-cartes/_balatro.scss).
	couleur: 'rouge',
	showHoldRing: true,
});

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const isSens = (v: unknown): v is Sens => (SENS as readonly unknown[]).includes(v);
const isTeinte = (v: unknown): v is Teinte => (TEINTES as readonly string[]).includes(v as string);

/** Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur par défaut. */
export function sanitizeSettings(raw: unknown): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		sens: isSens(src.sens) ? src.sens : DEFAULTS.sens,
		couleur: isTeinte(src.couleur) ? src.couleur : DEFAULTS.couleur,
		showHoldRing: bool(src.showHoldRing, DEFAULTS.showHoldRing),
	};
}

/**
 * Le rang dans le codage (0 vaut 1, 1 vaut 2… 4 est la carte de la couleur) de la carte posée à la
 * place `place` de la rangée (0 à gauche), selon le sens. Le miroir est sa propre réciproque : la
 * même fonction donne la place d'un rang.
 */
export const rangDeLaPlace = (place: number, sens: Sens): number => (sens === 'gauche' ? place : NOMBRE - 1 - place);
