// Petites fonctions partagées par les scripts du build et du déploiement.
import { execFileSync } from 'node:child_process';

/** Arrête le script avec un message d'erreur. */
export function fail(message: string): never {
	console.error(`\n✗ ${message}`);
	process.exit(1);
}

/** Sortie d'une commande git, ou null si elle échoue (pas de dépôt, référence inconnue…). */
export function git(args: string[]): string | null {
	try {
		return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return null;
	}
}

/**
 * Le commit inscrit dans dist/version.js (outils/stamp-build.ts), tel que le site publié le sert.
 * Le fichier est minifié : `commit:` suivi d'une chaîne entre guillemets simples, doubles ou
 * accents graves, selon le compilateur.
 */
export function commitDuBuild(source: string): string | null {
	return /commit:\s*(['"`])([^'"`]+)\1/.exec(source)?.[2] ?? null;
}
