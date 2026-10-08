/*
 * Le tirage des cartes des trois panneaux. Fonctions pures, sans DOM : testées sous Node
 * (tests/tours/trois-paquets/tirage.test.ts). Le même semis donne toujours le même tirage.
 *
 *   les mélanges           avant tout : des cartes du jeu en tas, faces en l'air ou en bas, au hasard ;
 *   panneau 1, la salade   les huit cartes à forcer faces en l'air (content/cartes.ts), leurs
 *                          doubles plus au fond, et d'autres cartes en tas : faces en bas, ou faces
 *                          en l'air mais cachées ;
 *   panneau 2, les paquets trois paquets de sept cartes. Une carte à forcer de code k (0 à 7) est
 *                          dans le paquet 1 si k compte 1, dans le paquet 2 s'il compte 2, dans le
 *                          paquet 3 s'il compte 4 (le 2♣, code 0, n'est dans aucun) : elle-même ou un SOSIE (une carte de même valeur,
 *                          d'une autre enseigne), tiré au sort. Le spectateur dit dans quels paquets
 *                          il voit sa carte : la somme des paquets (1, 2, 4) donne son code (aucun : 0). Chaque
 *                          paquet est complété par des cartes de REMPLISSAGE, de valeurs qui ne sont
 *                          celles d'aucune carte à forcer ;
 *   panneau 3, la fin      trois colonnes de sept, comme les paquets : les cartes du panneau 2 qui ne
 *                          sont pas à forcer (sosies et remplissage), un sosie de chaque carte à
 *                          forcer qui n'en avait pas, d'autres cartes de remplissage s'il en
 *                          manque, et au milieu une carte face en
 *                          bas, qui disparaît. Aucune carte à forcer n'y est : celle du spectateur a
 *                          disparu. Aucune carte de la valeur pensée non plus, d'après les paquets
 *                          notés par l'artiste (logic/routine.ts) — aucun noté : pas de 2.
 *
 * Aucune carte n'est jamais en double dans un panneau, ni d'un paquet à l'autre : comme dans un vrai
 * jeu. Les sosies ne sont jamais d'autres cartes à forcer ; ceux des deux 10 gardent leur couleur
 * (sosiesPossibles).
 */

import { alea } from '../../princesse/logic/melange.ts';
import { ENSEIGNES, estRouge, VALEURS, type Carte, type Valeur } from '../../princesse/logic/cartes.ts';
import { FORCEES } from '../content/cartes.ts';

/** Les mélanges avant la salade : combien, de combien de cartes, et la part de celles qui sont faces en l'air. */
export const MELANGES = 2;
export const CARTES_PAR_MELANGE = 40;
export const PART_EN_L_AIR = .5;

/** Le nombre de paquets du panneau 2, et le nombre de cartes de chaque paquet. */
export const PAQUETS = 3;
export const CARTES_PAR_PAQUET = 7;

/**
 * Les valeurs des cartes de remplissage : aucune n'est celle d'une carte à forcer (ni 2, ni 4, 5, 8,
 * 10, ni valet ni dame).
 */
export const VALEURS_DE_REMPLISSAGE: readonly Valeur[] = ['A', '3', '6', '7', '9', 'R'];

/**
 * Les cartes faces en bas de la salade du panneau 1 : la plupart sous les cartes à forcer,
 * quelques places par-dessus (DOS_PAR_DESSUS), qui en couvrent une partie : un dos, ou une carte
 * face en l'air cachée sous deux dos (FACES_CACHEES : on n'en voit qu'un bord blanc, ni sa valeur ni
 * ses enseignes) ; un sur le bas du double de chaque carte à forcer (logic/disposition.ts : doublon).
 */
export const DOS_DE_LA_SALADE = 24;
export const DOS_PAR_DESSUS = 5;
export const FACES_CACHEES = 3;


export const memeCarte = (a: Carte, b: Carte): boolean => a.valeur === b.valeur && a.enseigne === b.enseigne;

const contient = (cartes: readonly Carte[], carte: Carte): boolean => cartes.some((autre) => memeCarte(autre, carte));

/** Une carte à forcer ? */
export const estForcee = (carte: Carte): boolean => contient(FORCEES, carte);

/** Le code d'une carte à forcer : son rang dans content/cartes.ts (0 à 7). */
export const code = (rang: number): number => rang;

/** La carte à forcer de ce code (0 à 7), ou null. */
export const carteDuCode = (k: number): Carte | null => (Number.isInteger(k) && k >= 0 && k < FORCEES.length ? FORCEES[k]! : null);

/** Le paquet `paquet` (0, 1, 2) contient-il la carte à forcer de code `k` ? */
export const dansLePaquet = (k: number, paquet: number): boolean => (k & (1 << paquet)) !== 0;

/** Le code dit par les paquets désignés (0, 1, 2) : 1 pour le premier, 2 pour le deuxième, 4 pour le troisième. */
export const codeDesPaquets = (paquets: Iterable<number>): number => [...new Set(paquets)].reduce((somme, p) => somme + (1 << p), 0);

/**
 * Les sosies possibles d'une carte à forcer : même valeur, autre enseigne, jamais une autre carte à
 * forcer. Quand une autre carte à forcer a la même valeur (les deux 10), le sosie garde aussi la
 * couleur : le 10 qui représente le 10♠ est toujours noir, celui du 10♦ toujours rouge. Sans quoi le
 * spectateur qui pense au 10♦ reconnaîtrait sa carte dans le 10♥ d'un paquet où seul le 10♠ est.
 */
export function sosiesPossibles(carte: Carte): Carte[] {
	const jumelle = FORCEES.some((autre) => autre.valeur === carte.valeur && autre.enseigne !== carte.enseigne);
	return ENSEIGNES.filter((enseigne) => enseigne !== carte.enseigne && (!jumelle || estRouge(enseigne) === estRouge(carte.enseigne)))
		.map((enseigne) => ({ valeur: carte.valeur, enseigne }))
		.filter((sosie) => !estForcee(sosie));
}

/** Tirage pas à pas, à partir d'un semis. */
class Tireur {
	#rang = 0;
	readonly semis: number;
	constructor(semis: number) {
		this.semis = semis;
	}

	/** Entre 0 et 1. */
	suivant(): number {
		return alea(this.semis, this.#rang++);
	}

	/** Un élément au hasard. */
	parmi<T>(liste: readonly T[]): T {
		return liste[Math.floor(this.suivant() * liste.length)]!;
	}

	/** Mélange de Fisher-Yates. */
	melanger<T>(liste: readonly T[]): T[] {
		const copie = [...liste];
		for (let i = copie.length - 1; i > 0; i--) {
			const j = Math.floor(this.suivant() * (i + 1));
			[copie[i], copie[j]] = [copie[j]!, copie[i]!];
		}
		return copie;
	}
}

/** Tout le jeu : les cartes des mélanges. */
const JEU: readonly Carte[] = VALEURS.flatMap((valeur) => ENSEIGNES.map((enseigne) => ({ valeur, enseigne })));

const REMPLISSAGE: readonly Carte[] = VALEURS_DE_REMPLISSAGE.flatMap((valeur) => ENSEIGNES.map((enseigne) => ({ valeur, enseigne })));

/** Une carte du panneau 2 : la carte montrée, et le code de la carte à forcer qu'elle représente (null : remplissage). */
export interface CarteDuPaquet {
	carte: Carte;
	code: number | null;
}

/** Une carte d'un mélange : null, face en bas ; sinon, la carte montrée. */
export type CarteDuMelange = Carte | null;

export interface Tirage {
	/** Les mélanges, avant la salade : des cartes du jeu, faces en l'air ou en bas, tirées au sort. */
	melanges: CarteDuMelange[][];
	/**
	 * Panneau 1 : les cartes à forcer, dans l'ordre de la salade (faces en l'air) ; le nombre de cartes
	 * faces en bas ; les cartes faces en l'air cachées sous l'une d'elles (aucune à forcer).
	 */
	salade: { faces: Carte[]; dos: number; cachees: Carte[] };
	/** Panneau 2 : trois paquets de sept cartes, de haut en bas. */
	paquets: CarteDuPaquet[][];
	/** Panneau 3 : les cartes faces en l'air, avant d'ôter la valeur pensée (voir finale()). */
	fin: Carte[];
	/** Des cartes de remplissage qui ne sont nulle part ailleurs : elles complètent la fin. */
	reserve: Carte[];
}

/** Le tirage complet des trois panneaux. */
export function tirer(semis: number): Tirage {
	const tireur = new Tireur(semis);
	const prises: Carte[] = [];
	const prendre = (carte: Carte): Carte => {
		prises.push(carte);
		return carte;
	};

	// Les places des cartes à forcer, paquet par paquet, prises dans un ordre tiré au sort : aucune
	// valeur n'est favorisée quand les sosies se font rares (les 10, les dames).
	const places = Array.from({ length: PAQUETS }, (_, paquet) => FORCEES.map((_, rang) => code(rang)).filter((k) => dansLePaquet(k, paquet)).map((k) => ({ paquet, k })));
	const choisies = new Map<string, Carte>();
	for (const { paquet, k } of tireur.melanger(places.flat())) {
		const forcee = carteDuCode(k)!;
		const sosies = sosiesPossibles(forcee).filter((sosie) => !contient(prises, sosie));
		const elleMeme = !contient(prises, forcee);
		// La carte elle-même ou un sosie, à pile ou face ; un sosie quand elle est déjà dans un autre paquet.
		const carte = elleMeme && (sosies.length === 0 || tireur.suivant() < .5) ? forcee : tireur.parmi(sosies);
		if (!carte) throw new Error(`Plus de sosie pour la carte ${k}`);
		choisies.set(`${paquet}:${k}`, prendre(carte));
	}

	const paquets = Array.from({ length: PAQUETS }, (_, paquet) => {
		const codees: CarteDuPaquet[] = places[paquet]!.map(({ k }) => ({ carte: choisies.get(`${paquet}:${k}`)!, code: k }));
		const remplissage: CarteDuPaquet[] = Array.from({ length: CARTES_PAR_PAQUET - codees.length }, () => ({
			carte: prendre(tireur.parmi(REMPLISSAGE.filter((carte) => !contient(prises, carte)))),
			code: null,
		}));
		return tireur.melanger([...codees, ...remplissage]);
	});

	// La fin : les cartes du panneau 2 qui ne sont pas à forcer, et un sosie de chaque carte à forcer
	// qui n'y en a pas encore (une carte jamais vue, si possible).
	const nonForcees = paquets.flat().map(({ carte }) => carte).filter((carte) => !estForcee(carte));
	const fin = [...nonForcees];
	FORCEES.forEach((forcee, rang) => {
		const dejaLa = paquets.flat().some(({ carte, code: k }) => k === code(rang) && !estForcee(carte));
		if (dejaLa) return;
		const neufs = sosiesPossibles(forcee).filter((sosie) => !contient(fin, sosie));
		if (neufs.length > 0) fin.push(prendre(tireur.parmi(neufs)));
	});

	// La réserve : des cartes de remplissage jamais vues, pour compléter la fin.
	const reserve = tireur.melanger(REMPLISSAGE.filter((carte) => !contient(prises, carte)));
	// Les faces cachées de la salade : des cartes de remplissage, qu'on ne voit pas.
	const cachees = tireur.melanger(REMPLISSAGE).slice(0, FACES_CACHEES);

	// Les mélanges : des cartes du jeu, tirées au sort, la moitié faces en l'air.
	const melanges = Array.from({ length: MELANGES }, () =>
		tireur.melanger(JEU).slice(0, CARTES_PAR_MELANGE).map((carte) => (tireur.suivant() < PART_EN_L_AIR ? carte : null)));

	return {
		melanges,
		salade: { faces: tireur.melanger(FORCEES), dos: DOS_DE_LA_SALADE, cachees },
		paquets,
		fin: tireur.melanger(fin),
		reserve,
	};
}

/** Le nombre de cartes faces en l'air du panneau 3 : trois colonnes de sept, moins la carte face en bas. */
export const FACES_DE_LA_FIN = PAQUETS * CARTES_PAR_PAQUET - 1;

/**
 * Les cartes faces en l'air du panneau 3, FACES_DE_LA_FIN exactement : celles du tirage, sans aucune
 * carte de la valeur de la carte pensée (`codeNote` de 0 à 7, d'après les paquets notés ; toutes
 * avec null). Les sosies d'abord, puis le remplissage ; complétées par la réserve s'il en manque.
 */
export function finale(tirage: Tirage, codeNote: number | null): Carte[] {
	const pensee = codeNote === null ? null : carteDuCode(codeNote);
	const restantes = tirage.fin.filter((carte) => carte.valeur !== pensee?.valeur);
	const estSosie = (carte: Carte): boolean => FORCEES.some((forcee) => forcee.valeur === carte.valeur);
	const triees = [...restantes.filter(estSosie), ...restantes.filter((carte) => !estSosie(carte)), ...tirage.reserve];
	const gardees = new Set(triees.slice(0, FACES_DE_LA_FIN));
	// Dans l'ordre tiré au sort de la fin, la réserve à la suite.
	return [...restantes, ...tirage.reserve].filter((carte) => gardees.has(carte));
}
