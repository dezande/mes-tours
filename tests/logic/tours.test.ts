// La liste des tours (src/content/tours.ts) : bien formée, et chaque tour branché dans l'app.
import { existsSync, readFileSync } from 'node:fs';
import { TEXTES } from '../../src/content/textes.ts';
import { LANGS } from '../../src/logic/i18n.ts';
import { REGISTRE } from '../../src/tours/registre.ts';
import { TOURS } from '../../src/content/tours.ts';

test('les onze tours, chacun une seule fois', () => {
	expect(TOURS.map((tour) => tour.dossier)).toStrictEqual(['boule-de-cristal', 'carte-de-visite', 'pile-ou-face', 'morpion', 'princesse', 'six-predictions', 'cinq-cartes', 'trois-paquets', 'pluie-tres-fine', 'trois-questions', 'analyseur-q']);
});

test('chaque tour a un dossier valide et un nom dans les deux langues', () => {
	for (const tour of TOURS) {
		expect(tour.dossier, `dossier « ${tour.dossier} »`).toMatch(/^[a-z0-9-]+$/);
		for (const lang of LANGS) {
			expect(tour.nom[lang]?.trim() ?? '', `${tour.dossier} : nom vide en ${lang}`).not.toBe('');
		}
	}
});

test('chaque tour a son code, ses styles et sa place dans le registre', () => {
	for (const tour of TOURS) {
		expect(existsSync(`src/tours/${tour.dossier}/index.tsx`), `src/tours/${tour.dossier}/index.tsx manquant`).toBeTruthy();
		expect(existsSync(`src/styles/tours/${tour.dossier}/_index.scss`), `src/styles/tours/${tour.dossier}/_index.scss manquant`).toBeTruthy();
		expect(readFileSync('src/styles/main.scss', 'utf8'), `${tour.dossier} : styles non importés par src/styles/main.scss`).toContain(`@use "tours/${tour.dossier}";`);
		expect(readFileSync('src/tours/registre.ts', 'utf8'), `${tour.dossier} absent de src/tours/registre.ts`).toContain(`import('./${tour.dossier}/index.tsx')`);
	}
});

test('chaque texte du menu existe dans les deux langues', () => {
	for (const [cle, texte] of Object.entries(TEXTES)) {
		for (const lang of LANGS) expect(texte[lang].trim(), `« ${cle} » vide en ${lang}`).not.toBe('');
	}
});

test('le registre et la liste des tours nomment exactement les mêmes tours', () => {
	// Un tour en préparation reste hors des deux : seul ce qui est au registre est compilé et publié,
	// et seul ce qui est dans la liste a une tuile et une adresse.
	expect(Object.keys(REGISTRE).sort()).toStrictEqual(TOURS.map((tour) => tour.dossier).sort());
});

test('chaque tour a son propre fond, repris par sa tuile du menu : jamais deux tours avec le même', () => {
	const menu = readFileSync('src/styles/menu/_menu.scss', 'utf8');
	const carte = menu.slice(menu.indexOf('$fonds-des-tours: ('), menu.indexOf('\n);', menu.indexOf('$fonds-des-tours: (')));
	const fonds = TOURS.map((tour) => {
		const debut = carte.indexOf(`"${tour.dossier}":`);
		expect(debut, `${tour.dossier} : pas de fond dans $fonds-des-tours (src/styles/menu/_menu.scss)`).toBeGreaterThan(-1);
		const suite = carte.slice(debut + tour.dossier.length + 3);
		// Le fond est écrit dans la tuile, ou repris d'un tour (son $fond, dans son _tokens.scss, que
		// le menu charge sous un alias : @use "../tours/<dossier>/tokens" as <alias>).
		const alias = /^\s*([\w-]+)\.\$fond,/.exec(suite)?.[1];
		if (alias) {
			const dossier = new RegExp(`@use "\\.\\./tours/([\\w-]+)/tokens" as ${alias};`).exec(menu)?.[1];
			expect(dossier, `${tour.dossier} : alias « ${alias} » inconnu du menu`).toBeDefined();
			const jetons = readFileSync(`src/styles/tours/${dossier}/_tokens.scss`, 'utf8');
			const fond = /^\$fond: \(([\s\S]*?)^\);/m.exec(jetons);
			expect(fond, `${dossier} : $fond introuvable dans son _tokens.scss`).not.toBeNull();
			return fond![1]!.replace(/\s+/g, ' ').trim();
		}
		return suite.slice(0, suite.search(/\n\t\),?\n|\n\t"/)).replace(/\s+/g, ' ').trim();
	});
	const doublons = TOURS.filter((_, i) => fonds.indexOf(fonds[i]!) !== i).map((tour) => tour.dossier);
	expect(doublons, 'des tours partagent le même fond').toStrictEqual([]);
});
