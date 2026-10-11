/*
 * LE TEXTE DU MENU PRINCIPAL, en français et en anglais. Le nom de l'app, « Mes tours », ne se
 * traduit pas : c'est celui qui est écrit sous l'icône du téléphone.
 *
 * La langue choisie ici (bouton FR / EN, src/langue/) vaut aussi pour tous les tours : elle leur est
 * passée par le pont (src/tours/pont.tsx).
 */

import type { Traduction } from '../logic/i18n.ts';

export const TEXTES = {
	invite: { fr: 'Choisis un tour', en: 'Pick a trick' },
	langue: { fr: 'Langue', en: 'Language' },
	// Le panneau des réglages du menu, ouvert par l'écrou ⚙ en haut à droite.
	reglages: { fr: 'Réglages', en: 'Settings' },
	// La page des réglages généraux (src/pages/ReglagesGeneraux.tsx), ouverte depuis ce panneau.
	reglagesGeneraux: { fr: 'Réglages généraux', en: 'General settings' },
	reglagesGenerauxDetail: { fr: 'Langue, apparence, favoris, ordre', en: 'Language, appearance, favourites, order' },
	ordre: { fr: 'Ordre des tours', en: 'Order of tricks' },
	apparence: { fr: 'Apparence', en: 'Appearance' },
	apparenceAuto: { fr: 'Automatique', en: 'Automatic' },
	apparenceClair: { fr: 'Clair', en: 'Light' },
	apparenceSombre: { fr: 'Sombre', en: 'Dark' },
	apparenceAide: { fr: 'Automatique : comme le téléphone. Les tours gardent leur décor.', en: 'Automatic: like the phone. Tricks keep their own scenery.' },
	triPublication: { fr: 'Par date de publication', en: 'By release date' },
	triAlphabetique: { fr: 'Par ordre alphabétique', en: 'Alphabetical' },
	favoris: { fr: 'Favoris', en: 'Favourites' },
	favorisAide: { fr: 'Touche un tour pour l’ajouter à tes favoris, en tête du menu, ou l’en retirer.', en: 'Tap a trick to add it to your favourites, at the top of the menu, or to remove it.' },
	autresTours: { fr: 'Les autres tours', en: 'Other tricks' },
	tours: { fr: 'Tours', en: 'Tricks' },
	// « Réglages : Pile ou face » — le français met une espace avant les deux-points, pas l'anglais.
	reglagesDe: { fr: 'Réglages : ', en: 'Settings: ' },
	version: { fr: 'Version', en: 'Version' },
	// Le journal des versions (src/pages/Journal.tsx), ouvert par un bouton du menu.
	journal: { fr: 'Journal des versions', en: 'Release notes' },
	journalEnFrancais: { fr: 'Le journal est écrit en français.', en: 'The release notes are written in French.' },
	prochaineVersion: { fr: 'Prochaine version', en: 'Next version' },
	fermer: { fr: 'Fermer', en: 'Close' },
} as const satisfies Record<string, Traduction>;
