/*
 * Le dos « pluie très fine », celui d'un jeu des années 1950 : une marge blanche, un champ couvert
 * de hachures très fines et serrées, penchées comme une pluie, deux filets autour, et au centre un
 * médaillon ovale réservé en blanc, avec sa rosace. Une seule encre, celle du réglage. Fonctions
 * pures, sans DOM : testées sous Node (tests/tours/pluie-tres-fine/dos.test.ts) ;
 * components/DosAncien.tsx en fait un SVG.
 *
 * Le repère est celui des autres dos (src/components/cartes/dos.ts) : 100 de large pour 140 de
 * haut. Tout le dessin est symétrique autour du centre de la carte (50, 70) : une carte posée
 * tête-bêche montre le même dos.
 */

/** Un nombre arrondi au centième : des chemins courts, sans « 0.30000000000000004 ». */
const n = (v: number): number => Math.round(v * 100) / 100;

/** Le centre de la carte. */
export const CENTRE = { x: 50, y: 70 } as const;

/** Le champ hachuré, dans la marge blanche : de (8, 8) à (92, 132). */
export const CHAMP = { x0: 8, y0: 8, x1: 92, y1: 132 } as const;

/** Le médaillon ovale du centre, réservé en blanc. */
export const MEDAILLON = { rx: 19, ry: 26 } as const;

/**
 * Des hachures parallèles qui couvrent le rectangle (x0, y0)–(x1, y1), une tous les `pas`, penchées
 * de `pente` (le décalage en x pour 1 de descente : 0 les met d'aplomb). Chaque trait est coupé aux
 * bords du rectangle. Les traits sont placés depuis le centre du rectangle, dans les deux sens :
 * le dessin reste le même tête-bêche.
 */
export function hachures(x0: number, y0: number, x1: number, y1: number, pas: number, pente: number): string {
	if (!(pas > 0) || !(x1 > x0) || !(y1 > y0)) return '';
	const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
	// Chaque trait est la droite x = c + pente * y : c va d'un coin à l'autre du rectangle.
	const coins = [x0 - pente * y0, x1 - pente * y0, x0 - pente * y1, x1 - pente * y1];
	const c0 = cx - pente * cy;
	// Autant de traits de part et d'autre du trait du centre : le même nombre dans les deux sens.
	const demi = Math.floor((Math.max(...coins) - c0) / pas + 1e-9);
	let d = '';
	for (let k = -demi; k <= demi; k++) {
		const c = c0 + k * pas;
		// La droite coupée aux bords haut et bas, puis aux bords gauche et droit.
		let [ya, yb] = [y0, y1];
		if (pente !== 0) {
			const [yg, yd] = [(x0 - c) / pente, (x1 - c) / pente];
			ya = Math.max(ya, Math.min(yg, yd));
			yb = Math.min(yb, Math.max(yg, yd));
		} else if (c < x0 || c > x1) continue;
		// Un bout de trait trop court dans un coin ne se verrait pas.
		if (yb - ya < .05) continue;
		d += `M${n(c + pente * ya)} ${n(ya)}L${n(c + pente * yb)} ${n(yb)}`;
	}
	return d;
}

/** Une ellipse de rayons `rx`, `ry` autour du centre de la carte, en chemin. */
export const ellipse = (rx: number, ry: number): string =>
	`M${n(CENTRE.x - rx)} ${CENTRE.y}a${rx} ${ry} 0 1 0 ${n(2 * rx)} 0a${rx} ${ry} 0 1 0 ${n(-2 * rx)} 0Z`;

/** Un point (x, y) tourné de `degres` autour du centre de la carte. */
function tourner(x: number, y: number, degres: number): [number, number] {
	const a = (degres * Math.PI) / 180;
	const [dx, dy] = [x - CENTRE.x, y - CENTRE.y];
	return [n(CENTRE.x + dx * Math.cos(a) - dy * Math.sin(a)), n(CENTRE.y + dx * Math.sin(a) + dy * Math.cos(a))];
}

/**
 * La rosace du médaillon : `petales` pétales en amande autour du centre, de longueur `longueur`.
 * Un nombre pair de pétales la garde symétrique tête-bêche.
 */
export function rosace(petales: number, longueur: number, largeur: number): string {
	let d = '';
	for (let i = 0; i < petales; i++) {
		const angle = (360 / petales) * i;
		const [bx, by] = tourner(CENTRE.x, CENTRE.y - longueur, angle);
		const [g1x, g1y] = tourner(CENTRE.x - largeur, CENTRE.y - longueur * .55, angle);
		const [d1x, d1y] = tourner(CENTRE.x + largeur, CENTRE.y - longueur * .55, angle);
		d += `M${CENTRE.x} ${CENTRE.y}Q${g1x} ${g1y} ${bx} ${by}Q${d1x} ${d1y} ${CENTRE.x} ${CENTRE.y}Z`;
	}
	return d;
}

/** Un rectangle de (x0, y0) à (x1, y1), en chemin. */
const rect = (x0: number, y0: number, x1: number, y1: number): string => `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;

/**
 * Les éventails des quatre coins du champ : un quart de cercle réservé en blanc, et trois rayons.
 * Le coin opposé est le même, tourné d'un demi-tour.
 */
function eventails(rayon: number): { fond: string; traits: string } {
	let [fond, traits] = ['', ''];
	for (const [x, y, sx, sy] of [[CHAMP.x0, CHAMP.y0, 1, 1], [CHAMP.x1, CHAMP.y0, -1, 1], [CHAMP.x1, CHAMP.y1, -1, -1], [CHAMP.x0, CHAMP.y1, 1, -1]] as const) {
		fond += `M${x} ${y}H${x + sx * rayon}A${rayon} ${rayon} 0 0 ${sx * sy > 0 ? 1 : 0} ${x} ${y + sy * rayon}Z`;
		traits += `M${x + sx * rayon} ${y}A${rayon} ${rayon} 0 0 ${sx * sy > 0 ? 1 : 0} ${x} ${y + sy * rayon}`;
		for (const a of [22.5, 45, 67.5]) {
			const r = (a * Math.PI) / 180;
			traits += `M${x} ${y}L${n(x + sx * rayon * .8 * Math.cos(r))} ${n(y + sy * rayon * .8 * Math.sin(r))}`;
		}
	}
	return { fond, traits };
}

/** Le dos entier, couche par couche, du fond vers le dessus. */
export interface DessinDuDos {
	/** Les hachures de la pluie, sur tout le champ. */
	pluie: string;
	/** Ce qui est réservé en blanc par-dessus : le médaillon et les éventails des coins. */
	reserves: string;
	/** Les traits pleins : les filets du champ, du médaillon, des éventails. */
	filets: string;
	/** La rosace du médaillon, en aplat. */
	rosace: string;
}

export function dessinDuDos(): DessinDuDos {
	const coins = eventails(11);
	return {
		pluie: hachures(CHAMP.x0, CHAMP.y0, CHAMP.x1, CHAMP.y1, 1.15, .42),
		reserves: ellipse(MEDAILLON.rx, MEDAILLON.ry) + coins.fond,
		filets: rect(CHAMP.x0, CHAMP.y0, CHAMP.x1, CHAMP.y1) + rect(5.5, 5.5, 94.5, 134.5)
			+ ellipse(MEDAILLON.rx, MEDAILLON.ry) + ellipse(MEDAILLON.rx - 2.5, MEDAILLON.ry - 2.5) + coins.traits,
		rosace: rosace(8, 13, 3.6) + ellipse(2.4, 2.4),
	};
}
