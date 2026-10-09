/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/tours/pluie-tres-fine/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé. La langue, elle, est celle du menu.
 */

/**
 * Les encres du dos « pluie très fine » (logic/dos.ts), celles des jeux des années 1950 et 1960,
 * telles qu'elles sont imprimées (styles/tours/pluie-tres-fine/_cartes.scss). Le dessin, lui, ne
 * se choisit pas.
 */
export const TEINTES = ['rouge', 'bleu', 'vert', 'brun'] as const;
export type Teinte = (typeof TEINTES)[number];

export interface Settings {
	/** L'encre du dos de la carte. */
	couleur: Teinte;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	couleur: 'rouge',
	showHoldRing: true,
});

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const isTeinte = (v: unknown): v is Teinte => (TEINTES as readonly unknown[]).includes(v);

/** Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur par défaut. */
export function sanitizeSettings(raw: unknown): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		couleur: isTeinte(src.couleur) ? src.couleur : DEFAULTS.couleur,
		showHoldRing: bool(src.showHoldRing, DEFAULTS.showHoldRing),
	};
}
