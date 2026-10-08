/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/logic/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé.
 */

import { isLang, type Lang } from '../../../logic/i18n.ts';

/**
 * Les couleurs de l'encre (styles/tours/pile-ou-face/_cartes.scss) : le dos de la carte est un
 * papier marqué « Prédiction », et seule l'encre se choisit — celle du mot et de la prédiction.
 */
export const TEINTES = ['noir', 'bleu', 'rouge'] as const;
export type Teinte = (typeof TEINTES)[number];

/** Délai le plus long entre le toucher et le retournement, en secondes. */
export const DELAI_MAX = 10;

export interface Settings {
	/** Lang de l'interface. */
	langue: Lang;
	/** Couleur de l'encre, au dos (« Prédiction ») comme à l'avant (la prédiction). */
	couleur: Teinte;
	/** Délai entre le toucher et le retournement de la carte, en secondes (pas d'une demi-seconde). */
	delai: number;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

/**
 * Valeurs par défaut. La langue par défaut dépend du téléphone (i18n.ts : deviceLang) :
 * elle est passée à sanitizeSettings, celle inscrite ici n'est qu'un dernier recours.
 */
export const DEFAULTS: Readonly<Settings> = Object.freeze({
	langue: 'fr',
	couleur: 'noir',
	delai: 0,
	showHoldRing: true,
});

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const isTeinte = (v: unknown): v is Teinte => (TEINTES as readonly string[]).includes(v as string);
/** Délai borné entre 0 et DELAI_MAX, arrondi à la demi-seconde du curseur. */
const delai = (v: unknown): number =>
	typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(DELAI_MAX, Math.max(0, v)) * 2) / 2 : DEFAULTS.delai;

/**
 * Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur
 * par défaut. `defaultLang` est la langue à prendre quand aucune n'est enregistrée (celle du
 * téléphone, calculée par l'app).
 */
export function sanitizeSettings(raw: unknown, defaultLang: Lang = DEFAULTS.langue): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		langue: isLang(src.langue) ? src.langue : defaultLang,
		couleur: isTeinte(src.couleur) ? src.couleur : DEFAULTS.couleur,
		delai: delai(src.delai),
		showHoldRing: bool(src.showHoldRing, DEFAULTS.showHoldRing),
	};
}
