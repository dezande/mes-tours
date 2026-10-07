/*
 * Les tracés du papier : le papier froissé et la grille de morpion écrite à la main. Fonctions
 * pures, sans DOM, qui ne rendent que des nombres et des chemins SVG : testées sous Node
 * (tests/tours/morpion/dessin.test.ts) ; components/Papier.tsx les dessine.
 *
 * Les tirages sont déterministes (tremble) : le même papier, les mêmes plis, la même écriture à
 * chaque ouverture — mais jamais tirés à la règle.
 *
 *   contour()   le bord du papier, jamais tout à fait droit (un papier froissé puis déplié) ;
 *   facettes()  les plis : des facettes inégalement éclairées, et leurs arêtes ;
 *   traces()    la grille de morpion, ses croix et ses ronds, et le trait de la ligne gagnante.
 */

import { ligneGagnante, porte, type Grille } from './grilles.ts';

/** Tirage déterministe entre -1 et 1. */
export function tremble(graine: number): number {
	const x = Math.sin(graine * 12.9898 + 78.233) * 43758.5453;
	return (x - Math.floor(x)) * 2 - 1;
}

const f = (n: number): string => n.toFixed(2);

export interface Point {
	x: number;
	y: number;
}

/* ---------- Le papier froissé ---------- */

/** Le papier est découpé en COLS × RANGS cases, dont les sommets bougent : ce sont les plis. */
export const COLS = 4;
export const RANGS = 5;

/**
 * Les sommets des plis, en pourcentage de la feuille (0 à 100). Ceux du bord restent sur le bord,
 * mais glissent le long de lui et rentrent un peu en dedans : le bord du papier ondule.
 */
export function sommets(): Point[][] {
	const points: Point[][] = [];
	for (let r = 0; r <= RANGS; r++) {
		const rang: Point[] = [];
		for (let c = 0; c <= COLS; c++) {
			const g = r * 31 + c * 7;
			const bordX = c === 0 || c === COLS;
			const bordY = r === 0 || r === RANGS;
			let x = (c / COLS) * 100 + (bordX ? 0 : tremble(g) * 9);
			let y = (r / RANGS) * 100 + (bordY ? 0 : tremble(g + 1) * 7);
			// Le bord : jamais droit, toujours un peu en dedans, pour rester dans la feuille.
			if (bordX) x += (c === 0 ? 1 : -1) * Math.abs(tremble(g + 2)) * 0.9;
			if (bordY) y += (r === 0 ? 1 : -1) * Math.abs(tremble(g + 3)) * 0.7;
			rang.push({ x, y });
		}
		points.push(rang);
	}
	return points;
}

const SOMMETS = sommets();

/** Retourné de gauche à droite : le même papier, vu de l'autre côté. */
const miroir = ({ x, y }: Point, verso: boolean): Point => ({ x: verso ? 100 - x : x, y });

/**
 * Le bord du papier, en `polygon()` CSS : on y découpe la feuille. Le verso est le même papier vu
 * de l'autre côté : son bord est retourné de gauche à droite.
 */
export function contour(verso = false): string {
	const tour: Point[] = [
		...SOMMETS[0]!,
		...SOMMETS.slice(1).map((rang) => rang[COLS]!),
		...[...SOMMETS[RANGS]!].reverse().slice(1),
		...SOMMETS.slice(1, RANGS).reverse().map((rang) => rang[0]!),
	];
	return `polygon(${tour.map((p) => miroir(p, verso)).map(({ x, y }) => `${f(x)}% ${f(y)}%`).join(', ')})`;
}

export interface Facette {
	/** Les trois sommets, au format de l'attribut SVG `points`. */
	points: string;
	/** Éclairée (vers la lumière, en haut à gauche) ou dans l'ombre. */
	claire: boolean;
	/** Force de la lumière ou de l'ombre, entre 0 et 1. */
	force: number;
}

/**
 * Les plis du papier : chaque case est coupée en deux triangles, éclairés chacun selon une pente
 * tirée au hasard. Le verso est retourné de gauche à droite : ses plis tombent sur ceux du recto.
 */
export function facettes(verso = false): Facette[] {
	const liste: Facette[] = [];
	let n = 0;
	for (let r = 0; r < RANGS; r++) {
		for (let c = 0; c < COLS; c++) {
			const a = SOMMETS[r]![c]!;
			const b = SOMMETS[r]![c + 1]!;
			const d = SOMMETS[r + 1]![c]!;
			const e = SOMMETS[r + 1]![c + 1]!;
			// La diagonale change de sens d'une case à l'autre : les plis ne s'alignent pas.
			const triangles = (r + c) % 2 === 0 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]];
			for (const t of triangles) {
				const pente = tremble(++n * 3.7);
				// Vu de l'autre côté, une bosse devient un creux : l'éclairage s'inverse au verso.
				liste.push({
					points: t.map((p) => miroir(p, verso)).map(({ x, y }) => `${f(x)},${f(y)}`).join(' '),
					claire: verso ? pente < 0 : pente > 0,
					force: Math.abs(pente),
				});
			}
		}
	}
	return liste;
}

/**
 * Les arêtes des plis : au recto, les rangées de sommets sont des plis en creux (un fil sombre) et
 * les colonnes des plis en relief (un fil clair) ; au verso, c'est l'inverse.
 */
export function aretes(verso = false): { creux: string[]; reliefs: string[] } {
	const chemin = (points: Point[]): string => points.map((p) => miroir(p, verso)).map(({ x, y }, i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');
	const rangees = SOMMETS.slice(1, RANGS).map(chemin);
	const colonnes = Array.from({ length: COLS - 1 }, (_, c) => chemin(SOMMETS.map((rang) => rang[c + 1]!)));
	return verso ? { creux: colonnes, reliefs: rangees } : { creux: rangees, reliefs: colonnes };
}

/* ---------- La grille de morpion ---------- */

/** Un trait à main levée de (x1, y1) à (x2, y2) : il ondule un peu et ne finit pas tout droit. */
function trait(x1: number, y1: number, x2: number, y2: number, graine: number): string {
	const [dx, dy] = [x2 - x1, y2 - y1];
	const long = Math.hypot(dx, dy);
	// La perpendiculaire, pour faire onduler le trait de part et d'autre.
	const [px, py] = [-dy / long, dx / long];
	const o1 = tremble(graine) * long * 0.025;
	const o2 = tremble(graine + 1) * long * 0.025;
	return `M${f(x1)} ${f(y1)}C${f(x1 + dx / 3 + px * o1)} ${f(y1 + dy / 3 + py * o1)} ${f(x1 + (2 * dx) / 3 + px * o2)} ${f(y1 + (2 * dy) / 3 + py * o2)} ${f(x2)} ${f(y2)}`;
}

/** Une croix dans la case de centre (cx, cy) : deux traits vifs, jamais tout à fait d'équerre. */
function croix(cx: number, cy: number, graine: number): string {
	const r = 8;
	const t = (k: number): number => tremble(graine + k) * 1.3;
	return trait(cx - r + t(0), cy - r + t(1), cx + r + t(2), cy + r + t(3), graine + 4)
		+ trait(cx + r + t(5), cy - r + t(6), cx - r + t(7), cy + r + t(8), graine + 9);
}

/**
 * Un rond dans la case de centre (cx, cy) : une boucle d'un seul geste, un peu ovale, qui dépasse
 * son point de départ — comme on ferme un rond au stylo.
 */
function rond(cx: number, cy: number, graine: number): string {
	const rx = 8.3 + tremble(graine) * 0.6;
	const ry = 8.9 + tremble(graine + 1) * 0.6;
	const depart = -Math.PI / 2 - 0.5 + tremble(graine + 2) * 0.4;
	const pas = 48;
	let d = '';
	for (let i = 0; i <= pas; i++) {
		const a = depart + (i / pas) * Math.PI * 2.12;
		// Le rayon s'éloigne un peu au fil du tour : la fin ne retombe pas sur le début.
		const e = 1 + (i / pas) * 0.07;
		d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * rx * e)} ${f(cy + Math.sin(a) * ry * e)}`;
	}
	return d;
}

/** Centre de la case `i` (0 à 8) dans le repère 100 × 100 de la grille. */
export const centre = (i: number): [number, number] => [(i % 3) * 33.33 + 16.67, Math.floor(i / 3) * 33.33 + 16.67];

export interface Traces {
	/** Les quatre traits de la grille, en un seul chemin. */
	grille: string;
	/** Les marques des cases remplies : croix ou rond, et son chemin ; deux pour une case superposée. */
	marques: { case: number; signe: 'X' | 'O'; d: string }[];
	/** Le trait qui barre la ligne gagnante, ou null (match nul, partie en cours). */
	gagnante: string | null;
}

/** Ce qu'il faut tracer pour écrire `cases`, dans un repère de 100 × 100. */
export function traces(cases: Grille): Traces {
	const marques: Traces['marques'] = [];
	cases.forEach((c, i) => {
		const [cx, cy] = centre(i);
		// Une case superposée porte les deux : le rond d'abord, la croix tracée par-dessus.
		if (porte(c, 'O')) marques.push({ case: i, signe: 'O', d: rond(cx, cy, 20 + i * 11) });
		if (porte(c, 'X')) marques.push({ case: i, signe: 'X', d: croix(cx, cy, 20 + i * 11) });
	});
	const gagne = ligneGagnante(cases);
	let gagnante: string | null = null;
	if (gagne) {
		const [ax, ay] = centre(gagne[0]);
		const [bx, by] = centre(gagne[2]);
		// Le trait part un peu avant la première case et finit un peu après la dernière.
		const [dx, dy] = [(bx - ax) * 0.2, (by - ay) * 0.2];
		gagnante = trait(ax - dx, ay - dy, bx + dx, by + dy, 90);
	}
	return {
		grille: [trait(33.5, 2, 32.5, 98, 1), trait(66.5, 1, 67.5, 97, 2), trait(2, 33, 98, 34, 3), trait(1, 66.5, 97, 66, 4)].join(''),
		marques,
		gagnante,
	};
}
