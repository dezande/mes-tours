// Le journal des versions lu pour sa page : les versions, leurs listes, le gras et le code.
import { readFileSync } from 'node:fs';
import { lireJournal, segments } from '../../src/logic/journal.ts';
import { APP_VERSION } from '../../src/version.ts';

const MD = `# Journal

| Version | Commits |
| --- | --- |
| [1.0.0] | 3 |

---

## [Non publié]

- **Un tour** : nouveau.
  - Un détail, \`R\` au clavier.
  - Un autre.
- Une correction.

## [1.0.0] — 2026-10-03

3 commits

- Première version, voir [le site](https://example.com).

---

### Publier

- pas une version
`;

test('les versions, de la plus récente à la plus ancienne, jusqu’au filet qui les clôt', () => {
	const versions = lireJournal(MD);
	expect(versions.map((v) => [v.numero, v.date])).toStrictEqual([['Non publié', null], ['1.0.0', '2026-10-03']]);
	expect(versions[0]!.blocs).toStrictEqual([{
		type: 'liste',
		points: [
			{ texte: '**Un tour** : nouveau.', sous: ['Un détail, `R` au clavier.', 'Un autre.'] },
			{ texte: 'Une correction.', sous: [] },
		],
	}]);
	expect(versions[1]!.blocs).toStrictEqual([
		{ type: 'paragraphe', texte: '3 commits' },
		{ type: 'liste', points: [{ texte: 'Première version, voir [le site](https://example.com).', sous: [] }] },
	]);
});

test('le texte : gras, code, et le texte seul des liens', () => {
	expect(segments('**Un tour** : `R`, voir [le site](https://example.com).')).toStrictEqual([
		{ texte: 'Un tour', gras: true },
		{ texte: ' : ' },
		{ texte: 'R', code: true },
		{ texte: ', voir ' },
		{ texte: 'le site' },
		{ texte: '.' },
	]);
	expect(segments('rien de spécial')).toStrictEqual([{ texte: 'rien de spécial' }]);
});

test('le vrai journal : toutes les versions, la version de l’app comprise, chacune avec du contenu', () => {
	const versions = lireJournal(readFileSync('CHANGELOG.md', 'utf8'));
	expect(versions.length).toBeGreaterThan(20);
	expect(versions.map((v) => v.numero)).toContain(APP_VERSION);
	expect(versions.at(-1)!.numero).toBe('0.1.0');
	for (const version of versions) expect(version.blocs.length, version.numero).toBeGreaterThan(0);
});
