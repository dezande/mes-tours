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

/**
 * Les trois photos des paquets : trois copies identiques (les paquets notés au toucher), ou liées,
 * chacune à une colonne, avec les vraies cartes à forcer (logic/tirage.ts : photosLiees).
 */
export const PHOTOS = ['identiques', 'liees'] as const;
export type Photos = (typeof PHOTOS)[number];

export interface Settings {
	/** La couleur du dos des cartes. */
	couleur: Couleur;
	/** Les trois photos des paquets : identiques, ou liées chacune à une colonne. */
	photos: Photos;
	/**
	 * La carte face en bas de la fin disparaît-elle au toucher ? Sinon, elle reste à sa place, face
	 * en bas ; le toucher fige quand même le tour.
	 */
	disparition: boolean;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	couleur: 'bleu',
	photos: 'identiques',
	disparition: true,
	showHoldRing: true,
});

const isPhotos = (v: unknown): v is Photos => (PHOTOS as readonly unknown[]).includes(v);
const isCouleur = (v: unknown): v is Couleur => (COULEURS as readonly unknown[]).includes(v);

/** Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur par défaut. */
export function sanitizeSettings(raw: unknown): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		couleur: isCouleur(src.couleur) ? src.couleur : DEFAULTS.couleur,
		photos: isPhotos(src.photos) ? src.photos : DEFAULTS.photos,
		disparition: typeof src.disparition === 'boolean' ? src.disparition : DEFAULTS.disparition,
		showHoldRing: typeof src.showHoldRing === 'boolean' ? src.showHoldRing : DEFAULTS.showHoldRing,
	};
}
