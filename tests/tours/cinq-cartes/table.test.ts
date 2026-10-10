// Où tombe un toucher : la carte sous le doigt, et le coin de la cinquième.
import { boitesDeLaRangee, carteDuPoint, coinsDeLaColonne, couleurDuPoint, MARGE_PX, type Boite, moitiesDeLaColonne } from '../../../src/tours/cinq-cartes/logic/table.ts';

// Cinq cartes de 100 × 140, à 20 px les unes des autres (des colonnes sans écart, pour les coins).
const BOITES: Boite[] = [0, 1, 2, 3, 4].map((i) => ({ x: 20 + i * 120, y: 50, largeur: 100, hauteur: 140 }));

test('le toucher compte pour la colonne sous le doigt, à n’importe quelle hauteur', () => {
	expect(carteDuPoint(70, BOITES)).toBe(0);
	expect(carteDuPoint(310, BOITES)).toBe(2);
	expect(carteDuPoint(600, BOITES)).toBe(4);
});

test('un doigt à cheval sur le bord de la rangée compte encore ; plus loin, il est sur la table', () => {
	expect(carteDuPoint(20 - MARGE_PX, BOITES)).toBe(0);
	expect(carteDuPoint(600 + MARGE_PX, BOITES)).toBe(4);
	expect(carteDuPoint(20 - MARGE_PX - 1, BOITES)).toBeNull();
	expect(carteDuPoint(Number.NaN, BOITES)).toBeNull();
	expect(carteDuPoint(70, [])).toBeNull();
});

test('les quatre coins de la cinquième carte : pique, cœur, trèfle, carreau', () => {
	const b = BOITES[4]!;
	expect(couleurDuPoint(b.x + 10, b.y + 10, b)).toBe('pique');
	expect(couleurDuPoint(b.x + 90, b.y + 10, b)).toBe('coeur');
	expect(couleurDuPoint(b.x + 10, b.y + 130, b)).toBe('trefle');
	expect(couleurDuPoint(b.x + 90, b.y + 130, b)).toBe('carreau');
});

test('un coin dans la marge, hors de la carte, reste celui du côté touché', () => {
	const b = BOITES[4]!;
	expect(couleurDuPoint(b.x - 3, b.y - 3, b)).toBe('pique');
	expect(couleurDuPoint(b.x + b.largeur + 3, b.y + b.hauteur + 3, b)).toBe('carreau');
});

test('la colonne de la cinquième est coupée en quatre jusqu’aux bords de l’écran : le doigt n’a pas à tomber sur la carte', () => {
	const b = BOITES[4]!;
	// Tout en haut et tout en bas de l'écran, au-dessus et au-dessous de la carte.
	expect(couleurDuPoint(b.x + 5, 0, b)).toBe('pique');
	expect(couleurDuPoint(b.x + 95, 2, b)).toBe('coeur');
	expect(couleurDuPoint(b.x + 5, 400, b)).toBe('trefle');
	expect(couleurDuPoint(b.x + 95, 400, b)).toBe('carreau');
	// Les quatre coins couvrent toute la colonne, sans trou, coupés au milieu de la carte.
	const colonne = { x: b.x - 10, y: b.y, largeur: 120, hauteur: 140 };
	const coins = coinsDeLaColonne(colonne, b, 400);
	expect(coins).toStrictEqual([
		{ x: 490, y: 0, largeur: 60, hauteur: 120 },
		{ x: 550, y: 0, largeur: 60, hauteur: 120 },
		{ x: 490, y: 120, largeur: 60, hauteur: 280 },
		{ x: 550, y: 120, largeur: 60, hauteur: 280 },
	]);
	// Chaque coin donne sa couleur, partout où on le touche.
	coins.forEach((c, i) => {
		for (const [x, y] of [[c.x + 1, c.y + 1], [c.x + c.largeur - 1, c.y + c.hauteur - 1]]) {
			expect(couleurDuPoint(x!, y!, b)).toBe(['pique', 'coeur', 'trefle', 'carreau'][i]);
		}
	});
});

test('une carte sans taille ne donne aucune couleur', () => {
	expect(couleurDuPoint(10, 10, { x: 0, y: 0, largeur: 0, hauteur: 0 })).toBeNull();
});

test('là où deux boîtes se touchent, le toucher va à celle dont le milieu est le plus proche', () => {
	const colonnes: Boite[] = [{ x: 0, y: 0, largeur: 100, hauteur: 140 }, { x: 100, y: 0, largeur: 100, hauteur: 140 }];
	expect(carteDuPoint(98, colonnes)).toBe(0);
	expect(carteDuPoint(102, colonnes)).toBe(1);
});

test('la rangée : une colonne par place, écarts compris, et chaque carte à sa position', () => {
	const places = [-2, -1, 0, 1, 2].map((x) => ({ x, y: 0 }));
	places[2] = { x: 0.03, y: -0.05 };
	const { colonnes, cartes } = boitesDeLaRangee({ x: 10, y: 20, largeur: 610, hauteur: 140 }, places, 100, 140);
	// Cinq places de 122 px : les colonnes couvrent toute la rangée, sans trou.
	expect(colonnes[0]).toStrictEqual({ x: 10, y: 20, largeur: 122, hauteur: 140 });
	expect(colonnes[4]!.x + colonnes[4]!.largeur).toBeCloseTo(620);
	expect(cartes[0]).toStrictEqual({ x: 21, y: 20, largeur: 100, hauteur: 140 });
	// La carte du milieu, un peu décalée : sa boîte la suit.
	expect(cartes[2]!.x).toBeCloseTo(315 - 50 + 0.03 * 122);
	expect(cartes[2]!.y).toBeCloseTo(20 - 7);
	expect(carteDuPoint(131, colonnes), 'dans l’écart, le toucher va à la carte la plus proche').toBe(0);
});

test('une colonne coupée en deux par le milieu de sa carte, jusqu’aux bords de l’écran', () => {
	const colonne = { x: 100, y: 40, largeur: 80, hauteur: 120 };
	const carte = { x: 110, y: 40, largeur: 60, hauteur: 120 };
	expect(moitiesDeLaColonne(colonne, carte, 400)).toStrictEqual([
		{ x: 100, y: 0, largeur: 80, hauteur: 100 },
		{ x: 100, y: 100, largeur: 80, hauteur: 300 },
	]);
});
