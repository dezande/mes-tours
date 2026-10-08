// Fonctions partagées des scripts (outils/commun.ts).
import { commitDuBuild } from '../../outils/commun.ts';

test('commitDuBuild : le commit de dist/version.js, minifié ou non', () => {
	expect(commitDuBuild('var t={version:`35`,commit:`eb78062`};export{t as n};')).toBe('eb78062');
	expect(commitDuBuild("export const BUILD = { version: '35', commit: 'eb78062' };")).toBe('eb78062');
	expect(commitDuBuild('const BUILD={commit:"eb78062 + modifications locales"}')).toBe('eb78062 + modifications locales');
	expect(commitDuBuild('rien ici')).toBe(null);
});
