// Où les cartes sont posées : la rangée un peu de travers, sans que deux voisines se touchent, et le mélange éparpillé en largeur comme en hauteur.
import { DESORDRE, eparpillements, ETENDUE_DU_MELANGE, rangee } from '../../../src/tours/princesse/logic/disposition.ts';

/** L'écart entre deux cartes, en largeurs de carte (--ecart, styles/tours/princesse/_cartes.scss). */
const ECART = .22;
/** Une carte fait 1,4 fois sa largeur en hauteur. */
const RAPPORT = 1.4;

test('la rangée : chaque carte près de sa place, un peu décalée et penchée, jamais deux fois la même', () => {
	const rangees = Array.from({ length: 300 }, (_, semis) => rangee(5, semis * 104729));
	for (const places of rangees) {
		expect(places).toHaveLength(5);
		places.forEach(({ x, y, rot }, place) => {
			expect(Math.abs(x - (place - 2)), `x de la place ${place}`).toBeLessThanOrEqual(DESORDRE.x);
			expect(Math.abs(y)).toBeLessThanOrEqual(DESORDRE.y);
			expect(Math.abs(rot)).toBeLessThanOrEqual(DESORDRE.rot);
		});
	}
	// Pas une rangée au cordeau : les cartes ne sont ni toutes droites, ni toutes à la même hauteur.
	expect(rangees.every((places) => places.some(({ rot }) => Math.abs(rot) > .5))).toBe(true);
	expect(new Set(rangees.map((places) => places.map(({ y }) => y.toFixed(3)).join())).size).toBe(300);
});

test('deux cartes voisines de la rangée ne se touchent jamais, même penchées au plus fort', () => {
	// Ce qu'une carte déborde de sa place sur un côté, en largeurs de carte : son décalage, plus le
	// débord de son inclinaison (la moitié de sa hauteur fois le sinus de l'angle).
	const debord = DESORDRE.x * (1 + ECART) + (RAPPORT / 2) * Math.sin((DESORDRE.rot * Math.PI) / 180);
	expect(2 * debord).toBeLessThan(ECART);
});

test('le mélange éparpille les cartes sur toute la largeur et de part et d’autre en hauteur', () => {
	const etapes = Array.from({ length: 100 }, (_, semis) => eparpillements(5, semis, 4)).flat();
	expect(etapes).toHaveLength(400);
	const tous = etapes.flat();
	for (const { x, y, rot } of tous) {
		expect(Math.abs(x)).toBeLessThanOrEqual(ETENDUE_DU_MELANGE.x);
		expect(Math.abs(y)).toBeLessThanOrEqual(ETENDUE_DU_MELANGE.y);
		expect(Math.abs(rot)).toBeLessThanOrEqual(ETENDUE_DU_MELANGE.rot);
	}
	// Les cartes vont vraiment en haut et en bas, à gauche et à droite.
	expect(tous.some(({ y }) => y < -.2) && tous.some(({ y }) => y > .2)).toBe(true);
	expect(tous.some(({ x }) => x < -1.5) && tous.some(({ x }) => x > 1.5)).toBe(true);
	// Le même semis donne le même mélange.
	expect(eparpillements(5, 7, 4)).toStrictEqual(eparpillements(5, 7, 4));
});
