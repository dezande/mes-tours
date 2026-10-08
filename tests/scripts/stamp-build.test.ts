// outils/stamp-build.ts sur un faux build d'app, dans un vrai dépôt git temporaire :
// le nom du cache doit changer à chaque nouvelle version, même si le code est identique,
// et rester le même quand rien ne change (pas de retéléchargement inutile).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT = resolve('outils/stamp-build.ts');
const SW_SOURCE = readFileSync(resolve('src/sw/sw.ts'), 'utf8');

function git(dir: string, ...args: string[]): string {
	return execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], { cwd: dir, encoding: 'utf8' }).trim();
}

/** Dépôt d'app temporaire. */
function makeApp(): string {
	const dir = mkdtempSync(join(tmpdir(), 'mes-tours-stamp-'));
	git(dir, 'init', '-q', '-b', 'main');
	writeFileSync(join(dir, '.gitignore'), 'dist/\n');
	writeFileSync(join(dir, 'README.md'), 'app');
	git(dir, 'add', '.');
	git(dir, 'commit', '-q', '-m', 'version 1');
	return dir;
}

/** Écrit un dist/ neuf, comme juste après la compilation, et lance le script. */
function stamp(dir: string, appCode = 'console.log("app");'): { cache: string; prefix: string; assets: string; build: string } {
	rmSync(join(dir, 'dist'), { recursive: true, force: true });
	mkdirSync(join(dir, 'dist'), { recursive: true });
	writeFileSync(join(dir, 'dist', 'index.html'), '<!doctype html>');
	writeFileSync(join(dir, 'dist', 'app.js'), appCode);
	writeFileSync(join(dir, 'dist', '.DS_Store'), 'x');
	writeFileSync(join(dir, 'dist', 'version.js'), "export const BUILD = { version: '__APP_VERSION__', commit: '__APP_COMMIT__' };");
	// Le vrai service worker (les annotations TypeScript ne gênent pas les remplacements).
	writeFileSync(join(dir, 'dist', 'sw.js'), SW_SOURCE);
	const result = spawnSync(process.execPath, [SCRIPT], { cwd: dir, encoding: 'utf8' });
	if (result.status !== 0) throw new Error(result.stderr);
	const sw = readFileSync(join(dir, 'dist', 'sw.js'), 'utf8');
	return {
		cache: sw.match(/const CACHE = '([^']+)'/)?.[1] ?? '',
		prefix: sw.match(/const OWN_CACHE_PREFIX = '([^']+)'/)?.[1] ?? '',
		assets: sw.match(/const ASSETS: string\[\] = \[(.*)\]/)?.[1] ?? '',
		build: readFileSync(join(dir, 'dist', 'version.js'), 'utf8'),
	};
}

function withApp(run: (dir: string) => void): void {
	const dir = makeApp();
	try {
		run(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

test('version, commit, fichiers et préfixe de cache inscrits dans le build', () => {
	withApp((dir) => {
		const result = stamp(dir);
		expect(result.build).toMatch(/version: '1'/);
		expect(result.build).toMatch(new RegExp(`commit: '${git(dir, 'rev-parse', '--short=7', 'HEAD')}'`));
		expect(result.cache).toMatch(/^mes-tours-[0-9a-f]{12}$/);
		expect(result.prefix).toBe('mes-tours-');
		expect(result.assets, 'fichiers cachés et sw.js exclus').toBe("'./', './app.js', './index.html', './version.js'");
	});
});

test('même version, même contenu : même cache (rien à retélécharger)', () => {
	withApp((dir) => expect(stamp(dir).cache).toBe(stamp(dir).cache));
});

test('nouvelle version : nouveau cache, même si le code de l’app n’a pas changé', () => {
	withApp((dir) => {
		const v1 = stamp(dir);
		git(dir, 'commit', '-q', '--allow-empty', '-m', 'version 2');
		const v2 = stamp(dir);
		expect(v2.build).toMatch(/version: '2'/);
		expect(v2.cache).not.toBe(v1.cache);
	});
});

test('code modifié : nouveau cache', () => {
	withApp((dir) => expect(stamp(dir).cache).not.toBe(stamp(dir, 'console.log("app modifiée");').cache));
});
