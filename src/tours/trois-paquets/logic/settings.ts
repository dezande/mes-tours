/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/tours/trois-paquets/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé. La langue, elle, est celle du menu.
 */

/**
 * Les couleurs du dos des cartes : le dos est la photo d'un dos Rider de Bicycle, celle de la
 * Princesse (styles/tours/princesse/_cartes.scss), et seule sa couleur se choisit — le bleu de la
 * photo d'abord, puis le rouge et le noir des mêmes jeux.
 */
export const COULEURS = ['bleu', 'rouge', 'noir'] as const;
export type Couleur = (typeof COULEURS)[number];

export interface Settings {
	/** La couleur du dos des cartes. */
	couleur: Couleur;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	couleur: 'bleu',
	showHoldRing: true,
});

const isCouleur = (v: unknown): v is Couleur => (COULEURS as readonly unknown[]).includes(v);

/** Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur par défaut. */
export function sanitizeSettings(raw: unknown): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		couleur: isCouleur(src.couleur) ? src.couleur : DEFAULTS.couleur,
		showHoldRing: typeof src.showHoldRing === 'boolean' ? src.showHoldRing : DEFAULTS.showHoldRing,
	};
}
