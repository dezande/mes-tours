/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/tours/trois-six-neuf-dame/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé. La langue, elle, est celle du menu.
 */

import { TEINTES, type Teinte } from '../../cinq-cartes/logic/settings.ts';
import { NOMBRE } from './routine.ts';

export { TEINTES, type Teinte } from '../../cinq-cartes/logic/settings.ts';

/**
 * D'où part la rangée : l'As au bord gauche (puis 3, 6, 9, la Dame au bord droit), ou au bord droit
 * (tout est alors en miroir). Les coins, eux, ne changent pas : pique toujours en haut à gauche.
 */
export const SENS = ['gauche', 'droite'] as const;
export type Sens = (typeof SENS)[number];

export interface Settings {
	/** Le bord où est posé l'As. */
	sens: Sens;
	/** Couleur du dos : le dos « Arcade » des cinq cartes. */
	couleur: Teinte;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	sens: 'gauche',
	couleur: 'rouge',
	showHoldRing: true,
});

const isSens = (v: unknown): v is Sens => (SENS as readonly unknown[]).includes(v);
const isTeinte = (v: unknown): v is Teinte => (TEINTES as readonly string[]).includes(v as string);

/** Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur par défaut. */
export function sanitizeSettings(raw: unknown): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		sens: isSens(src.sens) ? src.sens : DEFAULTS.sens,
		couleur: isTeinte(src.couleur) ? src.couleur : DEFAULTS.couleur,
		showHoldRing: typeof src.showHoldRing === 'boolean' ? src.showHoldRing : DEFAULTS.showHoldRing,
	};
}

/**
 * Le rang (0 l'As, 1 le 3, 2 le 6, 3 le 9, 4 la Dame) de la carte posée à la place `place` de la rangée
 * (0 à gauche), selon le sens. Le miroir est sa propre réciproque : la même fonction donne la place d'un rang.
 */
export const rangDeLaPlace = (place: number, sens: Sens): number => (sens === 'gauche' ? place : NOMBRE - 1 - place);
