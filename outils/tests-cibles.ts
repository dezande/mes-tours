/*
 * Les tests qui concernent ce qui a changé, et eux seuls. Les fichiers modifiés par rapport à main
 * (commits de la branche, index, arbre de travail, nouveaux fichiers) sont passés à Jest, qui ne
 * lance que les tests qui en dépendent (--findRelatedTests) : quelques secondes au lieu de la suite
 * entière. Les tests dans Chrome (tests/e2e/, quatre à cinq minutes) et la suite complète restent à
 * la CI GitHub Actions (.github/workflows/ci.yml), qui vérifie chaque pull request.
 *
 * Usage, depuis la racine : node outils/tests-cibles.ts [--base main] [--dry]   (ou npm run test:cibles)
 *   --base   la référence comparée (main par défaut) ;
 *   --dry    dit ce qui serait lancé, sans rien lancer.
 */
import { spawnSync } from 'node:child_process';
import { fail, git } from './commun.ts';

/* ---------- Options ---------- */

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const baseIndex = args.indexOf('--base');
const base = baseIndex >= 0 ? args[baseIndex + 1] : 'main';
if (!base) fail('--base attend une référence git (main, origin/main…).');

/* ---------- Les fichiers modifiés ---------- */

/** Une liste de fichiers, par ligne, vide si la commande échoue. */
const lignes = (commande: string[]): string[] => (git(commande) ?? '').split('\n').filter(Boolean);

// Les fichiers supprimés n'ont plus de tests à lancer (--diff-filter=d les écarte).
const modifies = new Set([
	// Les commits de la branche depuis son départ de la base ; sans base commune, tout ce qui diffère.
	...(git(['merge-base', base, 'HEAD']) !== null ? lignes(['diff', '--name-only', '--diff-filter=d', `${base}...HEAD`]) : lignes(['diff', '--name-only', '--diff-filter=d', base])),
	// L'index et l'arbre de travail.
	...lignes(['diff', '--name-only', '--diff-filter=d', 'HEAD']),
	// Les nouveaux fichiers, pas encore suivis.
	...lignes(['ls-files', '--others', '--exclude-standard']),
]);

/* ---------- Ce que chaque fichier appelle comme tests ---------- */

const tests: string[] = [];
const chrome: string[] = [];
const sansTests: string[] = [];
for (const fichier of [...modifies].sort()) {
	if (fichier.startsWith('tests/e2e/')) chrome.push(fichier);
	else if (/^(src|outils|tests)\/.*\.tsx?$/.test(fichier)) tests.push(fichier);
	else sansTests.push(fichier);
}

console.log(`Fichiers modifiés par rapport à ${base} : ${modifies.size}`);
if (tests.length > 0) console.log(`Tests à lancer (jest --findRelatedTests) :\n- ${tests.join('\n- ')}`);
if (chrome.length > 0) console.log(`Laissés à la CI (tests dans Chrome) :\n- ${chrome.join('\n- ')}`);
if (sansTests.length > 0) console.log(`Sans tests ici (styles, images, journal, workflows…) :\n- ${sansTests.join('\n- ')}`);

if (tests.length === 0) {
	console.log('Rien à tester ici : la CI vérifie le reste.');
	process.exit(0);
}
if (dry) process.exit(0);

/* ---------- Jest ---------- */

const jest = spawnSync('npx', ['jest', '--selectProjects', 'unitaires', 'composants', '--findRelatedTests', ...tests], { stdio: 'inherit' });
process.exit(jest.status ?? 1);
