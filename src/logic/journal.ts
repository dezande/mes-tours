/*
 * LE JOURNAL DES VERSIONS (CHANGELOG.md) lu pour la page du journal (src/pages/Journal.tsx) : les
 * versions, de la plus récente à la plus ancienne, et ce que chacune a changé. Fonctions pures,
 * testées sous Node (tests/logic/journal.test.ts).
 *
 * Seules les versions sont gardées : de la première « ## [x] » jusqu'au filet « --- » qui les clôt
 * (après lui, la marche à suivre pour publier, qui ne regarde que l'artiste). Dans chaque version,
 * des paragraphes (« 54 commits ») et des listes à deux niveaux (« - », puis « ␣␣- »). Dans le
 * texte, **gras**, `code` et [liens](…) (dont seul le texte est gardé : l'app est hors-ligne).
 */

/** Un morceau de texte, en gras ou en code. */
export interface Segment {
	readonly texte: string;
	readonly gras?: boolean;
	readonly code?: boolean;
}

/** Un point d'une liste, et ses sous-points. */
export interface Point {
	readonly texte: string;
	readonly sous: readonly string[];
}

export type Bloc = { readonly type: 'paragraphe'; readonly texte: string } | { readonly type: 'liste'; readonly points: readonly Point[] };

export interface Version {
	/** « 1.7.0 », ou « Non publié ». */
	readonly numero: string;
	/** « 2026-10-09 », ou null (non publiée). */
	readonly date: string | null;
	readonly blocs: readonly Bloc[];
}

/** Le numéro et la date d'un titre de version : « ## [1.7.0] — 2026-10-09 ». */
const TITRE = /^## \[([^\]]+)\](?:\s*[—-]\s*(\S+))?\s*$/;
const POINT = /^- (.*)$/;
const SOUS_POINT = /^(?: {2,}|\t+)- (.*)$/;

/** Les versions du journal `md`, dans son ordre. */
export function lireJournal(md: string): Version[] {
	const versions: { numero: string; date: string | null; blocs: Bloc[] }[] = [];
	for (const ligne of md.split(/\r?\n/)) {
		const titre = TITRE.exec(ligne);
		if (titre) {
			versions.push({ numero: titre[1]!, date: titre[2] ?? null, blocs: [] });
			continue;
		}
		const version = versions.at(-1);
		if (!version) continue;
		if (ligne.trim() === '---') break;
		if (ligne.trim() === '') continue;
		const derniere = version.blocs.at(-1);
		const point = POINT.exec(ligne);
		const sous = SOUS_POINT.exec(ligne);
		if (point) {
			const nouveau = { texte: point[1]!, sous: [] };
			if (derniere?.type === 'liste') (derniere.points as Point[]).push(nouveau);
			else version.blocs.push({ type: 'liste', points: [nouveau] });
		} else if (sous && derniere?.type === 'liste') {
			(derniere.points.at(-1)!.sous as string[]).push(sous[1]!);
		} else {
			version.blocs.push({ type: 'paragraphe', texte: ligne.trim() });
		}
	}
	return versions;
}

/** Le texte en morceaux : **gras**, `code`, et le texte seul des [liens](…). */
export function segments(texte: string): Segment[] {
	const resultat: Segment[] = [];
	const motif = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\([^)]*\)/g;
	let debut = 0;
	for (const trouve of texte.matchAll(motif)) {
		if (trouve.index > debut) resultat.push({ texte: texte.slice(debut, trouve.index) });
		if (trouve[1] !== undefined) resultat.push({ texte: trouve[1], gras: true });
		else if (trouve[2] !== undefined) resultat.push({ texte: trouve[2], code: true });
		else resultat.push({ texte: trouve[3]! });
		debut = trouve.index + trouve[0].length;
	}
	if (debut < texte.length) resultat.push({ texte: texte.slice(debut) });
	return resultat;
}
