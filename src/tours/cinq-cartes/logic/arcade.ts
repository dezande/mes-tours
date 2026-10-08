/*
 * Le dos « Arcade », dans l'esprit des cartes de Balatro : une grille de gros pixels, un cadre
 * clair, un semis de losanges et un grand losange au centre. Fonctions pures, sans DOM : testées
 * sous Node (tests/tours/cinq-cartes/arcade.test.ts) ; components/DosArcade.tsx en fait un SVG net.
 *
 * Le dessin est engendré, pas recopié : ni image ni motif d'un jeu existant, seulement son allure.
 * Il est symétrique de gauche à droite et de haut en bas, comme tous les dos : une carte posée
 * tête-bêche montre le même dos.
 */

/** La grille du dos : 20 pixels de large pour 28 de haut, le rapport d'une carte à jouer. */
export const LARGEUR = 20;
export const HAUTEUR = 28;

/** Chaque pixel : le fond (« . »), le clair (« c ») ou le sombre (« s »). */
export type Pixel = '.' | 'c' | 's';

export function pixelDuDos(x: number, y: number): Pixel {
	const [cx, cy] = [(LARGEUR - 1) / 2, (HAUTEUR - 1) / 2];
	const bord = Math.min(x, y, LARGEUR - 1 - x, HAUTEUR - 1 - y);
	// Le cadre : un filet clair, puis un filet sombre à l'intérieur.
	if (bord === 1) return 'c';
	if (bord === 2) return 's';
	if (bord < 1) return '.';
	// Le grand losange du centre, cerné de sombre, et son cœur sombre.
	const d = Math.abs(x - cx) + Math.abs(y - cy);
	if (d <= 1.5) return 's';
	if (d <= 4.5) return 'c';
	if (d <= 5.5) return 's';
	// Le semis : un petit losange clair aux nœuds d'une grille en quinconce.
	const [u, v] = [Math.abs(x - cx) - .5, Math.abs(y - cy) - .5];
	return (u + v) % 4 === 0 && u % 2 === 0 ? 'c' : '.';
}

/** La grille entière, ligne par ligne. */
export const grilleDuDos = (): string[] =>
	Array.from({ length: HAUTEUR }, (_, y) => Array.from({ length: LARGEUR }, (_, x) => pixelDuDos(x, y)).join(''));

/** Les pixels d'une couleur (une lettre de la grille), en un seul chemin SVG : un carré par pixel. */
export function cheminDesPixels(grille: readonly string[], couleur: string): string {
	let d = '';
	grille.forEach((ligne, y) => {
		for (let x = 0; x < ligne.length; x++) if (ligne[x] === couleur) d += `M${x} ${y}h1v1h-1z`;
	});
	return d;
}
