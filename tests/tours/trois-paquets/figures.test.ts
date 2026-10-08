// Les tracés de la dame et du roi : bien formés, dans leur cadre, au-dessus du milieu.
import { CADRE_FIGURE } from '../../../src/tours/princesse/logic/dessin.ts';
import { DEMI_DAME } from '../../../src/tours/trois-paquets/logic/dame.ts';
import { DEMI_ROI } from '../../../src/tours/trois-paquets/logic/roi.ts';

/** Les coordonnées absolues d'un tracé (commandes M, L, C, Q, H, V en majuscules seulement). */
function points(d: string): number[][] {
	const nombres = (texte: string): number[] => (texte.match(/-?\d*\.?\d+/g) ?? []).map(Number);
	const resultat: number[][] = [];
	let [x, y] = [0, 0];
	for (const [, commande, reste] of d.matchAll(/([MLCQHVZa])([^MLCQHVZa]*)/g)) {
		const n = nombres(reste!);
		if (commande === 'H') x = n.at(-1)!;
		else if (commande === 'V') y = n.at(-1)!;
		else if (commande === 'a') {
			// Un arc relatif (les cercles) : il revient à son point de départ, ses bords restent à vérifier par le rayon.
			const r = n[0]!;
			resultat.push([x + 2 * r, y + r], [x, y - r]);
			continue;
		} else if (commande !== 'Z') for (let i = 0; i + 1 < n.length; i += 2) resultat.push([n[i]!, n[i + 1]!]);
		if (commande !== 'Z' && n.length >= 2 && commande !== 'H' && commande !== 'V') [x, y] = [n.at(-2)!, n.at(-1)!];
		resultat.push([x, y]);
	}
	return resultat;
}

test.each([['la dame', DEMI_DAME], ['le roi', DEMI_ROI]] as const)('la moitié de %s reste dans son cadre, au-dessus du milieu de la carte', (_, moitie) => {
	const { x, y, l } = CADRE_FIGURE;
	expect(moitie.length).toBeGreaterThan(10);
	for (const piece of moitie) {
		expect(piece.d).toMatch(/^M/);
		for (const [px, py] of points(piece.d)) {
			expect(px! >= x && px! <= x + l && py! >= y && py! <= 70, `${piece.teinte} : ${px}, ${py}`).toBe(true);
		}
	}
});
