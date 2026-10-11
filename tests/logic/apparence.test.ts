// L'apparence claire ou sombre (src/apparence/apparence.ts) : le choix, ou le téléphone en automatique.
import { APPARENCES, COULEURS_DU_MENU, estApparence, resoudreTheme } from '../../src/apparence/apparence.ts';

test('automatique : comme le téléphone', () => {
	expect(resoudreTheme('auto', true)).toBe('sombre');
	expect(resoudreTheme('auto', false)).toBe('clair');
});

test('clair ou sombre : toujours, quel que soit le téléphone', () => {
	for (const telephone of [true, false]) {
		expect(resoudreTheme('clair', telephone)).toBe('clair');
		expect(resoudreTheme('sombre', telephone)).toBe('sombre');
	}
});

test('seuls les trois choix sont reconnus', () => {
	expect(APPARENCES.every(estApparence)).toBe(true);
	for (const valeur of ['dark', 'Clair', '', null, 1]) expect(estApparence(valeur), String(valeur)).toBe(false);
});

test('chaque thème a la couleur de sa barre, celle du haut de son ciel (styles/menu/_menu.scss)', async () => {
	const { readFileSync } = await import('node:fs');
	const menu = readFileSync('src/styles/menu/_menu.scss', 'utf8');
	for (const [theme, couleur] of Object.entries(COULEURS_DU_MENU)) {
		const bloc = menu.slice(menu.indexOf(`:root[data-theme="${theme}"] {`));
		expect(/--m-ciel-haut: (#[0-9a-f]+);/.exec(bloc)?.[1], theme).toBe(couleur);
	}
});
