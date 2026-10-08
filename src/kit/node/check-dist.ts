// Vérifie que le build de l'app est complet (lancé depuis sa racine, avant node/stamp-build.ts) :
// fichiers de base, numéro de version, icônes du manifest et fichiers propres à l'app (config.ts).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP } from './config.ts';

const DIST = 'dist';
const errors: string[] = [];
const expectFile = (file: string, reason: string): void => {
	if (!existsSync(join(DIST, file))) errors.push(`${file} manquant (${reason})`);
};

for (const file of ['index.html', 'style.css', 'app.js', 'sw.js', 'manifest.json']) expectFile(file, 'fichier de base');
expectFile('kit/web/build.js', 'numéro de version');
for (const file of APP.requiredFiles) expectFile(file, 'fichier de l’app, config.ts');

try {
	if (existsSync(join(DIST, 'manifest.json'))) {
		const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8')) as { icons: { src: string }[] };
		for (const icon of manifest.icons) expectFile(icon.src, 'icône du manifest');
	}
} catch (error) {
	errors.push(`manifest.json illisible : ${(error as Error).message}`);
}
const sw = existsSync(join(DIST, 'sw.js')) ? readFileSync(join(DIST, 'sw.js'), 'utf8') : '';
if (sw && !sw.includes('__CACHE_PREFIX__')) errors.push('sw.js ne vient pas du kit (kit/sw/sw.ts)');

if (errors.length > 0) {
	console.error(`Build incomplet :\n- ${errors.join('\n- ')}`);
	process.exit(1);
}
console.log('Build complet.');
