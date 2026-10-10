/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/tours/trois-questions/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé. La langue, elle, est celle du menu.
 */

import { estUnOrdre } from './paquet.ts';

/**
 * Les couleurs du dos de la carte du spectateur (la seule montrée face en bas, à la révélation) : le
 * dos Rider de Bicycle de la Princesse (styles/tours/princesse/_cartes.scss), bleu, rouge ou noir.
 */
export const COULEURS = ['rouge', 'bleu', 'noir'] as const;
export type Couleur = (typeof COULEURS)[number];

export interface Settings {
	/**
	 * L'ordre du paquet, réglé : 52 identifiants (logic/paquet.ts), la 1re carte en tête ; null, il est
	 * mélangé à chaque nouvelle routine.
	 */
	ordre: readonly string[] | null;
	/** La couleur du dos des cartes. */
	couleur: Couleur;
	/** La carte du spectateur se retourne quand on la touche ; sinon, elle reste face en bas. */
	retournable: boolean;
	/** Vibration quand les trois réponses donnent un code écarté. */
	vibration: boolean;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	ordre: null,
	couleur: 'rouge',
	retournable: true,
	vibration: true,
	showHoldRing: true,
});

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const isCouleur = (v: unknown): v is Couleur => (COULEURS as readonly unknown[]).includes(v);

/** Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur par défaut. */
export function sanitizeSettings(raw: unknown): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		ordre: estUnOrdre(src.ordre) ? [...src.ordre] : DEFAULTS.ordre,
		couleur: isCouleur(src.couleur) ? src.couleur : DEFAULTS.couleur,
		retournable: bool(src.retournable, DEFAULTS.retournable),
		vibration: bool(src.vibration, DEFAULTS.vibration),
		showHoldRing: bool(src.showHoldRing, DEFAULTS.showHoldRing),
	};
}
