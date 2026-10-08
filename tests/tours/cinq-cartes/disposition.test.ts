// La rangée : côte à côte, un peu de travers, sans que deux voisines se touchent.
import { DESORDRE, rangee } from '../../../src/tours/cinq-cartes/logic/disposition.ts';

test('cinq places de gauche à droite, autour du milieu, chacune un peu de travers', () => {
	const places = rangee(5, 1234);
	expect(places).toHaveLength(5);
	places.forEach((p, i) => {
		expect(Math.abs(p.x - (i - 2)) <= DESORDRE.x, `place ${i} : x = ${p.x}`).toBe(true);
		expect(Math.abs(p.y) <= DESORDRE.y && Math.abs(p.rot) <= DESORDRE.rot, `place ${i}`).toBe(true);
	});
});

test('le même semis donne la même rangée, un autre semis une autre', () => {
	expect(rangee(5, 42)).toStrictEqual(rangee(5, 42));
	expect(rangee(5, 42)).not.toStrictEqual(rangee(5, 43));
});

test('deux voisines ne se touchent jamais, même penchées au plus', () => {
	// L'écart vaut 22 % de la largeur (styles/tours/cinq-cartes/_cartes.scss), la carte 1,4 fois plus haute que large.
	const ecart = .22;
	const debord = (1.4 / 2) * Math.sin((DESORDRE.rot * Math.PI) / 180) + DESORDRE.x * (1 + ecart);
	expect(2 * debord < ecart).toBe(true);
	for (let semis = 0; semis < 200; semis++) {
		const places = rangee(5, semis * 7919);
		for (let i = 1; i < 5; i++) expect(places[i]!.x - places[i - 1]!.x > 1 - 2 * DESORDRE.x).toBe(true);
	}
});
