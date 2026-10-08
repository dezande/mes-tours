// Les tracés des faces : les enseignes et le valet, bien formés et à leur place.
import { CADRE_FIGURE, DEMI_VALET, ENSEIGNE, partage } from '../../../src/tours/princesse/logic/dessin.ts';
import { ENSEIGNES } from '../../../src/tours/princesse/logic/cartes.ts';

/** Les coordonnées absolues d'un tracé (commandes M, L, C, Q, H, V en majuscules seulement). */
function points(d: string): number[][] {
	const nombres = (texte: string): number[] => (texte.match(/-?\d*\.?\d+/g) ?? []).map(Number);
	const liste: number[][] = [];
	for (const [, commande, reste] of d.matchAll(/([MLCQ])([^MLCQHVZmlcqhvzaA]*)/g)) {
		const n = nombres(reste!);
		for (let i = 0; i + 1 < n.length; i += 2) liste.push([n[i]!, n[i + 1]!]);
		void commande;
	}
	return liste;
}

test('chaque enseigne est dessinée, dans sa case de 100 × 100', () => {
	for (const enseigne of ENSEIGNES) {
		const liste = points(ENSEIGNE[enseigne]);
		expect(liste.length, enseigne).toBeGreaterThan(3);
		for (const [x, y] of liste) expect(x! >= 0 && x! <= 100 && y! >= 0 && y! <= 100, `${enseigne} : ${x}, ${y}`).toBe(true);
	}
});

test('la moitié du valet reste dans son cadre, au-dessus de la ligne de partage en biais', () => {
	const { x, y, l } = CADRE_FIGURE;
	// Le partage passe par le centre de la carte : tête-bêche, les deux moitiés s'y rejoignent.
	expect(partage(50)).toBe(70);
	for (const piece of DEMI_VALET) {
		for (const [px, py] of points(piece.d)) {
			expect(px! >= x && px! <= x + l && py! >= y && py! <= partage(px!) + .01, `${piece.teinte} : ${px}, ${py}`).toBe(true);
		}
	}
});
