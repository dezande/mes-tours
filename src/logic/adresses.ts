/*
 * LES ADRESSES DE L'APP, après le « # » de l'adresse (le service worker ne connaît ainsi qu'une
 * page, index.html, qui s'ouvre hors-ligne quel que soit le tour demandé) :
 *
 *   #/                          le menu principal, panneau des tours (une adresse vide aussi)
 *   #/reglages                  le menu principal, panneau des réglages (écrou ⚙ en haut à droite)
 *   #/tours/<dossier>           un tour, prêt pour une nouvelle routine
 *   #/tours/<dossier>?reglages  seulement ses réglages (écrou ⚙ du menu)
 *   #/reglages-generaux         les réglages généraux (depuis le panneau des réglages)
 *   #/journal                   le journal des versions (depuis les réglages généraux)
 *
 * Des adresses strictes : elles sont comparées telles quelles, caractère pour caractère, aux
 * adresses des tours publiés. Rien n'est décodé ni nettoyé. Toute autre adresse — un nom inventé
 * ou hérité de JavaScript (« constructor »), une majuscule, un « / » final, un dossier de plus,
 * un paramètre inconnu ou avec une valeur — est refusée, et l'app ramène au menu.
 *
 * Fonctions pures, testées sous Node (tests/logic/adresses.test.ts). Le suivi de l'adresse dans le
 * navigateur est dans src/routeur.ts.
 */

/** Ce qu'une adresse ouvre. */
export type Page =
	| { readonly page: 'menu' }
	| { readonly page: 'reglages' }
	| { readonly page: 'reglages-generaux' }
	| { readonly page: 'journal' }
	| { readonly page: 'tour'; readonly dossier: string; readonly reglages: boolean }
	| { readonly page: 'refusee' };

/** L'adresse du panneau des réglages du menu. */
export const ADRESSE_DES_REGLAGES = '/reglages';

/** L'adresse de la page des réglages généraux. */
export const ADRESSE_DES_REGLAGES_GENERAUX = '/reglages-generaux';

/** L'adresse du journal des versions. */
export const ADRESSE_DU_JOURNAL = '/journal';

/** L'adresse d'un tour ; `reglages` : seulement ses réglages (écrou ⚙). */
export const adresseDuTour = (dossier: string, reglages = false): string => `/tours/${dossier}${reglages ? '?reglages' : ''}`;

/**
 * Ce que ouvre l'adresse `hash` (location.hash, avec son « # »), parmi les tours publiés
 * `dossiers` (la liste des tours, et rien d'autre).
 */
export function resoudre(hash: string, dossiers: readonly string[]): Page {
	const adresse = hash.startsWith('#') ? hash.slice(1) : hash;
	if (adresse === '' || adresse === '/') return { page: 'menu' };
	if (adresse === ADRESSE_DES_REGLAGES) return { page: 'reglages' };
	if (adresse === ADRESSE_DES_REGLAGES_GENERAUX) return { page: 'reglages-generaux' };
	if (adresse === ADRESSE_DU_JOURNAL) return { page: 'journal' };
	for (const dossier of dossiers) {
		if (adresse === adresseDuTour(dossier)) return { page: 'tour', dossier, reglages: false };
		if (adresse === adresseDuTour(dossier, true)) return { page: 'tour', dossier, reglages: true };
	}
	return { page: 'refusee' };
}
