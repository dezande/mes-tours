/*
 * Numéro de version de l'app (semver) : celui du journal des versions (CHANGELOG.md) et des
 * étiquettes git. Il se change dans le commit « Version X.Y.Z », en même temps que le journal —
 * tests/logic/version.test.ts refuse un écart entre les deux.
 */

export const APP_VERSION = '1.8.0';

/**
 * Numéro de build (nombre de commits) et commit court, inscrits au build par outils/stamp-build.ts.
 * Ce module garde son propre fichier (dist/version.js, vite.config.ts) : le déploiement le relit
 * sur le site publié.
 */
export const BUILD = { version: '__APP_VERSION__', commit: '__APP_COMMIT__' };
