// Le texte de l'interface : chaque entrée dans les deux langues, et le nom des cartes.
import { LANGS } from '../../../src/logic/i18n.ts';
import { INTERFACE, nomDeLaCarte, ui, type CleInterface } from '../../../src/tours/cinq-cartes/content/interface.ts';
import { nomDeLaZone } from '../../../src/tours/cinq-cartes/components/TestDesZones.tsx';

test('chaque texte existe dans les deux langues', () => {
	for (const cle of Object.keys(INTERFACE) as CleInterface[]) {
		for (const lang of LANGS) expect(ui(cle, lang).trim(), `« ${cle} » vide en ${lang}`).not.toBe('');
	}
});

test('le nom des cartes, en français et en anglais', () => {
	expect(nomDeLaCarte({ valeur: 12, couleur: 'coeur' }, 'fr')).toBe('Dame de cœur');
	expect(nomDeLaCarte({ valeur: 1, couleur: 'pique' }, 'fr')).toBe('As de pique');
	expect(nomDeLaCarte({ valeur: 7, couleur: 'trefle' }, 'en')).toBe('7 of clubs');
	expect(nomDeLaCarte({ valeur: 13, couleur: 'carreau' }, 'en')).toBe('King of diamonds');
});

test('le nom des zones, dans la barre du test des zones', () => {
	expect(nomDeLaZone({ rang: 2 }, 'fr')).toBe('Carte 3 : 4');
	expect(nomDeLaZone({ rang: 4, couleur: 'coeur' }, 'fr')).toBe('Couleur : cœur ♥');
	expect(nomDeLaZone({ rang: 0 }, 'en')).toBe('Card 1: 1');
});
