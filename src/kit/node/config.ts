// Réglages de l'app pour les scripts du build et le serveur local.

export const APP = {
	/** Nom de l'app, affiché par le serveur local. */
	name: 'Mes tours',
	/**
	 * Préfixe des caches hors-ligne : mes-tours-<empreinte>. Toutes les apps de dezande.github.io
	 * partagent le même espace de caches : le service worker ne supprime que ceux de ce préfixe.
	 */
	cachePrefix: 'mes-tours',
	/** Fichiers propres à l'app qui doivent exister dans dist/, en plus des fichiers de base. */
	requiredFiles: ['fonts/OFL.txt', 'fonts/OFL-pixelify-sans.txt'],
} as const;
