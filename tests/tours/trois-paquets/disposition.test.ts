// La salade : une grille lâche, les cartes dans la place libre, et un tas dessous.
import { BORD_VISIBLE, DESORDRE, DESORDRE_DES_COLONNES, desordreDesColonnes, nappe, distance, doublon, ECART_DU_DOUBLE, faceCachee, grille, HAUT_CACHE, recouvrements, tas, type Position } from '../../../src/tours/trois-paquets/logic/disposition.ts';

const dansLaPlace = ({ x, y }: { x: number; y: number }): boolean => x >= 0 && x <= 1 && y >= 0 && y <= 1;

test('la grille : une carte par case, dans la place libre, un peu de travers ; les rangées du bas passent devant', () => {
	for (const semis of [1, 2, 3, 99]) {
		const positions = grille(17, 4, semis);
		expect(positions).toHaveLength(17);
		expect(positions.every(dansLaPlace)).toBe(true);
		expect(positions.every(({ rot }) => Math.abs(rot) <= DESORDRE.rot)).toBe(true);
		// Chaque rangée est plus bas que la précédente, même de travers.
		for (let i = 4; i < 17; i++) expect(positions[i]!.y > positions[i - 4]!.y - .01, `carte ${i}`).toBe(true);
		expect(positions.map(({ z }) => z)).toStrictEqual(positions.map((_, i) => 100 + 4 * i));
	}
});

test('la grille : la dernière rangée, incomplète, est centrée', () => {
	const sansDesordre = grille(7, 3, 5).map(({ x }) => Math.round(x * 4) / 4);
	expect(sansDesordre[6]).toBe(.5);
});

test('le tas : dans la place libre, sous la grille', () => {
	const positions = tas(13, 8);
	expect(positions).toHaveLength(13);
	expect(positions.every(dansLaPlace)).toBe(true);
	expect(Math.max(...positions.map(({ z }) => z))).toBeLessThan(100);
	expect(tas(13, 8)).toStrictEqual(positions);
	// Un autre tas du même semis : ailleurs, et ses rangs d'empilement à la suite.
	const fond = tas(4, 8, 20, 1);
	expect(fond.map(({ z }) => z)).toStrictEqual([20, 21, 22, 23]);
	expect(fond[0]!.x).not.toBe(positions[0]!.x);
	expect(grille(0, 3, 1)).toStrictEqual([]);
});

test('les recouvrements : chacun juste au-dessus de sa carte, sous les suivantes, décalé vers le bas ; jamais sur la dernière rangée', () => {
	for (const semis of [1, 2, 3, 99, 12345]) {
		const places = grille(8, 3, semis);
		const dessus = recouvrements(places, 3, 4, semis);
		expect(dessus).toHaveLength(4);
		expect(dessus.every(dansLaPlace)).toBe(true);
		expect(new Set(dessus.map(({ z }) => z)).size).toBe(4);
		for (const { x, y, z, rot } of dessus) {
			const cible = places.find((p) => p.z === z - 1)!;
			expect(cible, `pas de carte sous ${z}`).toBeDefined();
			// Hors de la dernière rangée (les cartes 7 et 8, en bas).
			expect(places.indexOf(cible)).toBeLessThan(6);
			// Plus bas, et pas plus à gauche : l'index en haut à gauche de sa carte reste visible.
			expect(y - cible.y).toBeGreaterThan(.2);
			expect(x).toBeGreaterThanOrEqual(cible.x);
			expect(Math.abs(rot)).toBeLessThanOrEqual(DESORDRE.rot);
			// Toutes les cartes suivantes de la grille passent devant lui, et devant une face cachée et ses deux dos.
			for (const suivante of places.slice(places.indexOf(cible) + 1)) expect(suivante.z).toBeGreaterThan(z + 2);
		}
	}
	expect(recouvrements(grille(7, 3, 1), 3, 0, 1)).toStrictEqual([]);
	expect(recouvrements(grille(3, 3, 1), 3, 2, 1)).toStrictEqual([]);
});

test('une face cachée : tête-bêche à la place d’un recouvrement, ses deux dos posés sur elle, l’un le long de la carte, l’autre vers son haut ; on ne voit qu’une bande blanche', () => {
	const place = recouvrements(grille(8, 3, 3), 3, 1, 3)[0]!;
	const [face, droite, haut] = faceCachee(place);
	expect(face).toStrictEqual({ ...place, rot: place.rot + 180 });
	expect(droite).toStrictEqual({ ...face, z: place.z + 1, dx: BORD_VISIBLE });
	expect(haut).toStrictEqual({ ...face, z: place.z + 2, dy: HAUT_CACHE - 1 });
	// La bande visible reste avant les enseignes (20 % de la largeur) et le cadre des figures (17 %) ;
	// le dos du haut couvre l'index du coin (jusqu'à 22 % de la hauteur : y = 31 sur 140).
	expect(BORD_VISIBLE).toBeLessThan(.17);
	expect(HAUT_CACHE).toBeGreaterThan(31 / 140);
});

test('le double d’une carte à forcer : loin d’elle, loin des autres doubles, la moitié du bas sous un dos', () => {
	for (const semis of [1, 2, 3, 99, 12345]) {
		const grilleDesFaces = grille(8, 4, semis);
		const posees: Position[] = [];
		grilleDesFaces.forEach((original, i) => {
			const [double, dos] = doublon(original, posees, semis, i, 30 + 2 * i);
			expect(dansLaPlace(double)).toBe(true);
			expect(distance(double, original), `semis ${semis}, carte ${i}`).toBeGreaterThanOrEqual(ECART_DU_DOUBLE);
			expect(double.z).toBe(30 + 2 * i);
			expect(dos).toStrictEqual({ ...double, z: double.z + 1, dy: .5 });
			posees.push(double);
		});
		// Les doubles ne s'entassent pas : deux d'entre eux ne sont jamais au même endroit.
		for (const [i, a] of posees.entries()) for (const b of posees.slice(i + 1)) expect(distance(a, b)).toBeGreaterThan(.02);
	}
});

test('la nappe d’un mélange : toute la table et au-delà, sans grand trou ; empilée au hasard', () => {
	const positions = nappe(40, 8, 7, .2);
	expect(positions).toHaveLength(40);
	// Elle déborde de part et d'autre, jamais plus loin que le débord.
	expect(positions.some(({ x }) => x < 0) && positions.some(({ x }) => x > 1)).toBe(true);
	expect(positions.every(({ x, y }) => x >= -.2 && x <= 1.2 && y >= -.2 && y <= 1.2)).toBe(true);
	// Chaque case d'une grille de 4 × 2 sur la place libre reçoit au moins une carte.
	for (let cx = 0; cx < 4; cx++) for (let cy = 0; cy < 2; cy++) {
		expect(positions.some(({ x, y }) => x >= cx / 4 && x < (cx + 1) / 4 && y >= cy / 2 && y < (cy + 1) / 2), `case ${cx}, ${cy}`).toBe(true);
	}
	expect(positions.map(({ z }) => z).sort((a, b) => a - b)).toStrictEqual(Array.from({ length: 40 }, (_, i) => i));
	expect(nappe(0, 8, 7, .2)).toStrictEqual([]);
});

test('le désordre des colonnes : petit, comme la rangée de la Princesse ; le même pour le même semis', () => {
	const desordre = desordreDesColonnes(3, 7, 9);
	expect(desordre).toHaveLength(3);
	for (const colonne of desordre) {
		expect(colonne).toHaveLength(7);
		for (const { dx = 0, dy = 0, rot } of colonne) {
			expect(Math.abs(dx)).toBeLessThanOrEqual(DESORDRE_DES_COLONNES.x);
			expect(Math.abs(dy)).toBeLessThanOrEqual(DESORDRE_DES_COLONNES.y);
			expect(Math.abs(rot)).toBeLessThanOrEqual(DESORDRE_DES_COLONNES.rot);
		}
	}
	expect(desordreDesColonnes(3, 7, 9)).toStrictEqual(desordre);
	expect(desordreDesColonnes(3, 7, 9, 1)).not.toStrictEqual(desordre);
	// Pas toutes droites : un vrai désordre.
	expect(desordre.flat().some(({ rot }) => Math.abs(rot) > 1)).toBe(true);
});
