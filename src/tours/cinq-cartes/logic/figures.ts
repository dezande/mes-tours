/*
 * Les personnages des figures (Valet, Dame, Roi), en pixels, dans l'esprit des cartes de Balatro :
 * une demi-figure, du haut de la coiffe à la taille, que components/FaceDeCarte.tsx pose en haut de
 * la carte puis tête-bêche en bas, comme sur toutes les cartes à jouer. Fonctions pures, sans DOM :
 * testées sous Node (tests/tours/cinq-cartes/figures.test.ts).
 *
 * Chaque figure est dessinée par sa moitié gauche (8 pixels), que le miroir complète : 16 pixels de
 * large pour 18 de haut. Les lettres sont des couleurs, posées par styles/tours/cinq-cartes/_balatro.scss :
 *   o  le contour        p  la peau          y  l'or (couronnes, galons)
 *   h  les cheveux       b  la barbe          e  les yeux
 *   c  la couleur de l'enseigne (les habits)  w  le blanc (col, fraise, gants)
 */

export const LARGEUR_FIGURE = 16;
export const HAUTEUR_FIGURE = 18;

/** Les couleurs des figures, dans l'ordre où elles sont peintes. */
export const TEINTES_FIGURE = ['o', 'p', 'y', 'h', 'b', 'e', 'c', 'w'] as const;

const MOITIES: Readonly<Record<number, readonly string[]>> = {
	// Le Valet : un bonnet à plume, des cheveux courts, un col blanc.
	11: [
		'.....ooo',
		'....occc',
		'...occcc',
		'..oyyyyy',
		'...ohhhh',
		'...ohppp',
		'...ohpep',
		'...opppp',
		'...opppo',
		'....oppp',
		'...owwww',
		'..occwcc',
		'.occcywc',
		'.occcywc',
		'.oyccywc',
		'.occcywc',
		'.occcywc',
		'.ooooooo',
	],
	// La Dame : une couronne fine, de longs cheveux, un collier d'or.
	12: [
		'.....y.y',
		'.....yyy',
		'....oyyy',
		'...ohhhh',
		'..ohhppp',
		'..ohhpep',
		'..ohhppp',
		'..ohhppp',
		'..ohhppc',
		'..ohhhpp',
		'..ohhwyw',
		'.occcwww',
		'.occcccy',
		'.occyccc',
		'.occcccy',
		'.occyccc',
		'.occcccy',
		'.ooooooo',
	],
	// Le Roi : une grande couronne, la barbe blanche, le manteau bordé d'or.
	13: [
		'...y..y.',
		'...y.yy.',
		'...yyyyy',
		'...ycyyy',
		'...yyyyy',
		'...ohhhh',
		'...ohppp',
		'...ohpep',
		'...ohppp',
		'...obbpp',
		'...obbbo',
		'...obbbb',
		'..oybbbb',
		'.occybbb',
		'.occcyww',
		'.occcycc',
		'.occcycc',
		'.ooooooo',
	],
};

/** La moitié gauche, complétée par son miroir : la demi-figure entière, ligne par ligne. */
export function grilleDeFigure(valeur: number): string[] {
	const moitie = MOITIES[valeur];
	if (!moitie) return [];
	return moitie.map((ligne) => {
		const gauche = ligne.slice(0, LARGEUR_FIGURE / 2).padEnd(LARGEUR_FIGURE / 2, '.');
		return gauche + [...gauche].reverse().join('');
	});
}
