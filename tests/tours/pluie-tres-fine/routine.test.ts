// La routine de Pluie très fine : la carte, et la famille du coin touché.
import { apresToucher, CACHEE, coinsDeLEcran, COULEURS, couleurDuPoint, type Etat } from '../../../src/tours/pluie-tres-fine/logic/routine.ts';

const retournee = (couleur: (typeof COULEURS)[number]): Etat => ({ phase: 'retournee', couleur });

test('un toucher retourne la carte face cachée sur la Dame de la famille du coin', () => {
	for (const couleur of COULEURS) expect(apresToucher(CACHEE, couleur)).toStrictEqual(retournee(couleur));
});

test('retournée, plus rien ne change la carte, ni ne la remet face cachée', () => {
	const dame = retournee('coeur');
	for (const couleur of [...COULEURS, null]) expect(apresToucher(dame, couleur), String(couleur)).toBe(dame);
});

test('un toucher hors de tout coin (mesure impossible) ne retourne rien', () => {
	expect(apresToucher(CACHEE, null)).toBe(CACHEE);
});

test('l’écran est coupé en quatre par le milieu de la carte : pique, cœur, trèfle, carreau', () => {
	const carte = { x: 50, y: 100, largeur: 200, hauteur: 280 };
	// Le milieu de la carte : (150, 240).
	expect(couleurDuPoint(10, 10, carte)).toBe('pique');
	expect(couleurDuPoint(380, 5, carte)).toBe('coeur');
	expect(couleurDuPoint(0, 800, carte)).toBe('trefle');
	expect(couleurDuPoint(390, 840, carte)).toBe('carreau');
	// Sur la carte elle-même, juste de part et d'autre du milieu.
	expect(couleurDuPoint(149, 239, carte)).toBe('pique');
	expect(couleurDuPoint(150, 240, carte)).toBe('carreau');
});

test('un point ou une carte invalides ne donnent aucune famille', () => {
	const carte = { x: 0, y: 0, largeur: 100, hauteur: 140 };
	expect(couleurDuPoint(Number.NaN, 10, carte)).toBeNull();
	expect(couleurDuPoint(10, Number.POSITIVE_INFINITY, carte)).toBeNull();
	expect(couleurDuPoint(10, 10, { ...carte, largeur: 0 })).toBeNull();
});

test('les quatre coins de l’écran couvrent tout l’écran, sans se chevaucher, et chacun donne sa famille', () => {
	const carte = { x: 50, y: 100, largeur: 200, hauteur: 280 };
	const coins = coinsDeLEcran(carte, 390, 844);
	expect(coins).toStrictEqual([
		{ x: 0, y: 0, largeur: 150, hauteur: 240 },
		{ x: 150, y: 0, largeur: 240, hauteur: 240 },
		{ x: 0, y: 240, largeur: 150, hauteur: 604 },
		{ x: 150, y: 240, largeur: 240, hauteur: 604 },
	]);
	expect(coins.reduce((aire, c) => aire + c.largeur * c.hauteur, 0)).toBe(390 * 844);
	coins.forEach((coin, i) => expect(couleurDuPoint(coin.x + coin.largeur / 2, coin.y + coin.hauteur / 2, carte)).toBe(COULEURS[i]));
});
