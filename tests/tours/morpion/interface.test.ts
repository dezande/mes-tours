// Le texte de l'interface : chaque entrée dans les deux langues, et rien de vide.
import { INTERFACE, ui, type CleInterface } from '../../../src/tours/morpion/content/interface.ts';
import { LANGS } from '../../../src/logic/i18n.ts';

test('chaque texte existe dans les deux langues', () => {
	for (const cle of Object.keys(INTERFACE) as CleInterface[]) {
		for (const lang of LANGS) expect(ui(cle, lang).trim(), `« ${cle} » vide en ${lang}`).not.toBe('');
	}
});

test('le mot du recto', () => {
	expect(ui('papier.mot', 'fr')).toBe('Prédiction');
	expect(ui('papier.mot', 'en')).toBe('Prediction');
});
