// Les tests ciblés (outils/tests-cibles.ts) : les fichiers modifiés par rapport à main, d'où qu'ils
// viennent (commits de la branche, index, arbre de travail, nouveaux fichiers), et ce que chacun
// appelle comme tests. Sur un dépôt git dans un dossier temporaire, sans lancer Jest (--dry).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const SCRIPT = resolve('outils/tests-cibles.ts');

/** Un dépôt temporaire : un commit sur main, puis une branche. */
function withRepo(run: (dir: string, git: (...args: string[]) => string) => void): void {
	const dir = mkdtempSync(join(tmpdir(), 'mes-tours-cibles-'));
	const git = (...args: string[]): string => execFileSync('git', args, { cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 't@t' } }).trim();
	try {
		git('init', '-q', '-b', 'main');
		ecrire(dir, 'src/a.ts', '1');
		ecrire(dir, 'README.md', '1');
		git('add', '-A');
		git('commit', '-q', '-m', 'départ');
		git('checkout', '-q', '-b', 'travail');
		run(dir, git);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

function ecrire(dir: string, fichier: string, contenu: string): void {
	mkdirSync(dirname(join(dir, fichier)), { recursive: true });
	writeFileSync(join(dir, fichier), contenu);
}

function cibles(dir: string, ...args: string[]): { ok: boolean; output: string } {
	const result = spawnSync(process.execPath, [SCRIPT, '--dry', ...args], { cwd: dir, encoding: 'utf8' });
	return { ok: result.status === 0, output: result.stdout + result.stderr };
}

test('rien de modifié : rien à tester, la CI vérifie le reste', () => {
	withRepo((dir) => {
		expect(cibles(dir)).toStrictEqual({ ok: true, output: 'Fichiers modifiés par rapport à main : 0\nRien à tester ici : la CI vérifie le reste.\n' });
	});
});

test('les fichiers modifiés viennent des commits de la branche, de l’index, de l’arbre de travail et des nouveaux fichiers ; chacun à sa place', () => {
	withRepo((dir, git) => {
		// Commité sur la branche.
		ecrire(dir, 'src/a.ts', '2');
		ecrire(dir, 'outils/o.ts', '1');
		git('add', '-A');
		git('commit', '-q', '-m', 'a et o');
		// Dans l'index.
		ecrire(dir, 'README.md', '2');
		git('add', 'README.md');
		// Dans l'arbre de travail, et nouveaux.
		ecrire(dir, 'tests/e2e/app.e2e.ts', '1');
		ecrire(dir, 'tests/logic/n.test.ts', '1');
		ecrire(dir, 'src/styles/x.scss', '1');
		ecrire(dir, 'src/types.d.ts', '1');
		const result = cibles(dir);
		expect(result.ok).toBe(true);
		expect(result.output).toBe([
			'Fichiers modifiés par rapport à main : 7',
			'Tests à lancer (jest --findRelatedTests) :',
			'- outils/o.ts',
			'- src/a.ts',
			'- src/types.d.ts',
			'- tests/logic/n.test.ts',
			'Laissés à la CI (tests dans Chrome) :',
			'- tests/e2e/app.e2e.ts',
			'Sans tests ici (styles, images, journal, workflows…) :',
			'- README.md',
			'- src/styles/x.scss',
			'',
		].join('\n'));
	});
});

test('un fichier supprimé n’a plus de tests à lancer ; un fichier modifié puis remis ne compte pas', () => {
	withRepo((dir, git) => {
		git('rm', '-q', 'src/a.ts');
		git('commit', '-q', '-m', 'sans a');
		ecrire(dir, 'README.md', '2');
		ecrire(dir, 'README.md', '1');
		expect(cibles(dir).output).toMatch(/^Fichiers modifiés par rapport à main : 0\n/);
	});
});

test('--base : une autre référence ; une référence inconnue ne lance rien', () => {
	withRepo((dir, git) => {
		ecrire(dir, 'src/a.ts', '2');
		git('commit', '-q', '-am', 'a');
		git('tag', 'avant', 'HEAD~1');
		expect(cibles(dir, '--base', 'avant').output).toMatch(/Fichiers modifiés par rapport à avant : 1\n/);
		expect(cibles(dir, '--base', 'HEAD').output).toMatch(/: 0\n/);
		expect(cibles(dir, '--base').ok).toBe(false);
	});
});
