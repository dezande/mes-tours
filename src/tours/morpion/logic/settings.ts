/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/tours/morpion/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé. La langue, elle, est celle du menu.
 */

/** Délai le plus long entre le toucher et le retournement, en secondes. */
export const DELAI_MAX = 10;

export interface Settings {
	/** Délai entre le toucher et le retournement du papier, en secondes (pas d'une demi-seconde). */
	delai: number;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	delai: 0,
	showHoldRing: true,
});

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
/** Délai borné entre 0 et DELAI_MAX, arrondi à la demi-seconde du curseur. */
const delai = (v: unknown): number =>
	typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(DELAI_MAX, Math.max(0, v)) * 2) / 2 : DEFAULTS.delai;

/** Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur par défaut. */
export function sanitizeSettings(raw: unknown): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		delai: delai(src.delai),
		showHoldRing: bool(src.showHoldRing, DEFAULTS.showHoldRing),
	};
}
