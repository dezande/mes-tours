// Les dessins de la carte : le dos « pluie très fine » et la Dame à l'ancienne.
import { DEMI_FIGURE, NOMS, TAILLE } from '../../../src/tours/pluie-tres-fine/logic/dame.ts';
import { CHAMP, dessinDuDos, hachures } from '../../../src/tours/pluie-tres-fine/logic/dos.ts';
import { COULEURS } from '../../../src/tours/pluie-tres-fine/logic/routine.ts';

/** Les traits d'un chemin fait de « M x y L x y » : leurs deux bouts. */
const traits = (d: string): number[][] => [...d.matchAll(/M(-?[\d.]+) (-?[\d.]+)L(-?[\d.]+) (-?[\d.]+)/g)].map((m) => m.slice(1).map(Number));

test('les hachures couvrent le champ, coupées à ses bords, toutes penchées pareil', () => {
	const lignes = traits(hachures(CHAMP.x0, CHAMP.y0, CHAMP.x1, CHAMP.y1, 1.15, .42));
	expect(lignes.length).toBeGreaterThan(60);
	for (const [xa, ya, xb, yb] of lignes) {
		for (const x of [xa!, xb!]) expect(x >= CHAMP.x0 - .01 && x <= CHAMP.x1 + .01, `x = ${x} hors du champ`).toBeTruthy();
		for (const y of [ya!, yb!]) expect(y >= CHAMP.y0 - .01 && y <= CHAMP.y1 + .01, `y = ${y} hors du champ`).toBeTruthy();
		// Chaque trait descend vers la droite, de 0,42 pour 1 : une pluie penchée.
		if (yb! - ya! > 1) expect((xb! - xa!) / (yb! - ya!)).toBeCloseTo(.42, 1);
	}
});

test('le dos est le même tête-bêche : chaque hachure a sa jumelle, tournée d’un demi-tour autour du centre', () => {
	const lignes = traits(dessinDuDos().pluie);
	const proche = (a: number[], b: number[]): boolean => a.every((v, i) => Math.abs(v - b[i]!) < .02);
	for (const [xa, ya, xb, yb] of lignes) {
		const jumelle = [100 - xb!, 140 - yb!, 100 - xa!, 140 - ya!];
		expect(lignes.some((l) => proche(l, jumelle)), `pas de jumelle pour ${[xa, ya, xb, yb].join(' ')}`).toBeTruthy();
	}
});

test('des hachures impossibles ne dessinent rien', () => {
	expect(hachures(0, 0, 10, 10, 0, .4)).toBe('');
	expect(hachures(10, 0, 0, 10, 1, .4)).toBe('');
});

test('chaque Dame a son nom, celui des jeux français', () => {
	expect(COULEURS.map((c) => NOMS[c])).toStrictEqual(['PALLAS', 'JUDITH', 'ARGINE', 'RACHEL']);
});

test('la demi-figure reste dans la moitié haute de la carte, sans dépasser la taille', () => {
	for (const element of DEMI_FIGURE) {
		expect(element.d.length).toBeGreaterThan(0);
		// Les ordonnées des commandes absolues M, L, Q, C : un nombre sur deux.
		for (const [, commande, nombres] of element.d.matchAll(/([MLQC])([^A-Za-z]*)/g)) {
			const v = nombres!.trim().split(/[\s,]+/).map(Number);
			for (let i = 1; i < v.length; i += 2) expect(v[i]! <= TAILLE + .01, `${commande} : y = ${v[i]} sous la taille`).toBeTruthy();
		}
	}
});

test('les éléments renvoyés en miroir sont symétriques autour de l’axe de la carte', () => {
	// Le voile : la moitié gauche et sa jumelle de droite.
	const [gauche, droite] = DEMI_FIGURE;
	expect(gauche!.d.startsWith('M42 21')).toBeTruthy();
	expect(droite!.d.startsWith('M58 21')).toBeTruthy();
	expect(droite!.aplat).toBe(gauche!.aplat);
});
