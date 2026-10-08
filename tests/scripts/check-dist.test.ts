// Vérification du build (outils/check-dist.ts), sur un faux dist/ dans un dossier temporaire.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { APP } from '../../outils/config.ts';

const SCRIPT = resolve('outils/check-dist.ts');

/** Dossier temporaire avec un build complet ; `run` peut l'abîmer avant la vérification. */
function withApp(run: (dir: string) => void): void {
	const dir = mkdtempSync(join(tmpdir(), 'mes-tours-check-'));
	try {
		for (const file of ['index.html', 'style.css', 'app.js', 'version.js', 'icons/icon-192.png', ...APP.requiredFiles]) {
			mkdirSync(dirname(join(dir, 'dist', file)), { recursive: true });
			writeFileSync(join(dir, 'dist', file), 'x');
		}
		writeFileSync(join(dir, 'dist', 'manifest.json'), JSON.stringify({ icons: [{ src: 'icons/icon-192.png' }] }));
		writeFileSync(join(dir, 'dist', 'sw.js'), "const CACHE = '__CACHE_PREFIX__-__BUILD_HASH__';");
		run(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

function check(dir: string): { ok: boolean; output: string } {
	const result = spawnSync(process.execPath, [SCRIPT], { cwd: dir, encoding: 'utf8' });
	return { ok: result.status === 0, output: result.stdout + result.stderr };
}

test('build complet : accepté', () => {
	withApp((dir) => expect(check(dir)).toStrictEqual({ ok: true, output: 'Build complet.\n' }));
});

test('fichier de base, numéro de version, icône du manifest ou fichier de l’app manquant : refusé avec la raison', () => {
	for (const [file, reason] of [
		['app.js', 'fichier de base'],
		['version.js', 'numéro de version'],
		['icons/icon-192.png', 'icône du manifest'],
		[APP.requiredFiles[0], 'config.ts'],
	]) {
		withApp((dir) => {
			rmSync(join(dir, 'dist', file));
			const result = check(dir);
			expect(result.ok, file).toBe(false);
			expect(result.output, file).toMatch(new RegExp(`${file.replaceAll('.', '\\.')} manquant \\([^)]*${reason.replaceAll('.', '\\.')}`));
		});
	}
});

test('manifest illisible : refusé avec la raison', () => {
	withApp((dir) => {
		writeFileSync(join(dir, 'dist', 'manifest.json'), '{');
		const result = check(dir);
		expect(result.ok).toBe(false);
		expect(result.output).toMatch(/manifest\.json illisible/);
	});
});

test('service worker qui ne vient pas de src/sw/sw.ts : refusé', () => {
	withApp((dir) => {
		writeFileSync(join(dir, 'dist', 'sw.js'), "const CACHE = 'autre';");
		const result = check(dir);
		expect(result.ok).toBe(false);
		expect(result.output).toMatch(/sw\.js ne vient pas de src\/sw\/sw\.ts/);
	});
});
