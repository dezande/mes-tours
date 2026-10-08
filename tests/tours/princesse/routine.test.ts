// L'état de la routine : montrée au toucher, retournée et mélangée au bout du temps, la carte touchée disparue, les autres retournées une à une (la place de la première dit la carte cachée, un double toucher sur n'importe quelle carte cache le valet), une carte retournée remise face en bas au toucher suivant, rien ne remet le tour à zéro.
import { apresDoubleToucher, apresMinuterie, apresToucher, CACHEE_PAR_LE_DOUBLE, colonneDuPoint, rangParmiLesRestantes, DEPART, faceEnLAir, facesAffichees, NOMBRE, valetEncoreCachable, type Etat } from '../../../src/tours/princesse/logic/routine.ts';

const MONTRE: Etat = { phase: 'montre' };
const RETOURNE: Etat = { phase: 'retourne' };
const MELANGE: Etat = { phase: 'melange' };
const PRET: Etat = { phase: 'pret' };

test('la rangée est coupée en cinq colonnes égales, une par carte, de gauche à droite', () => {
	// Un éventail de 300 px, qui commence à 40 px du bord de l'écran.
	expect([40, 99, 100, 159, 160, 220, 280, 339].map((x) => colonneDuPoint(x, 40, 300))).toStrictEqual([0, 0, 1, 1, 2, 3, 4, 4]);
	expect(NOMBRE).toBe(5);
});

test('un toucher à côté de la rangée compte pour la carte du bord', () => {
	expect(colonneDuPoint(0, 40, 300)).toBe(0);
	expect(colonneDuPoint(390, 40, 300)).toBe(4);
});

test('une mesure invalide ne choisit aucune colonne', () => {
	for (const [x, gauche, largeur] of [[10, 0, 0], [10, 0, -5], [Number.NaN, 0, 300], [10, Number.NaN, 300], [10, 0, Number.POSITIVE_INFINITY]]) {
		expect(colonneDuPoint(x!, gauche!, largeur!), `${x} dans ${gauche} + ${largeur}`).toBeNull();
	}
});

test('au départ, un toucher montre les cartes, où qu’il soit', () => {
	expect(apresToucher(DEPART, 3)).toStrictEqual(MONTRE);
	expect(apresToucher(DEPART, null)).toStrictEqual(MONTRE);
	expect(faceEnLAir(DEPART, 0)).toBe(false);
	expect([0, 1, 2, 3, 4].every((place) => faceEnLAir(MONTRE, place))).toBe(true);
});

test('le temps écoulé, les cartes se retournent, se mélangent, puis attendent', () => {
	expect(apresMinuterie(MONTRE)).toStrictEqual(RETOURNE);
	expect(apresMinuterie(RETOURNE)).toStrictEqual(MELANGE);
	expect(apresMinuterie(MELANGE)).toStrictEqual(PRET);
	// Rien d'autre n'a de minuterie.
	expect(apresMinuterie(PRET)).toBe(PRET);
	expect(apresMinuterie(DEPART)).toBe(DEPART);
});

test('un toucher pendant que les cartes sont montrées ou se retournent ne fait rien', () => {
	expect(apresToucher(MONTRE, 2)).toBe(MONTRE);
	expect(apresToucher(RETOURNE, 2)).toBe(RETOURNE);
});

/** Les faces visibles (rangs dans content/cartes.ts), place par place. */
const visibles = (etat: Etat): number[] => (etat.phase === 'revele' ? etat.retournees.map((place) => etat.attribuees[place]!) : []);

/** Toutes les façons d'ordonner une liste. */
const permutations = (liste: number[]): number[][] => (liste.length <= 1 ? [liste] : liste.flatMap((x, i) => permutations([...liste.slice(0, i), ...liste.slice(i + 1)]).map((p) => [x, ...p])));

test('mélangées, la carte touchée disparaît, sans rien dire encore', () => {
	for (let place = 0; place < NOMBRE; place++) {
		expect(apresToucher(PRET, place)).toMatchObject({ phase: 'revele', place, sens: 'gauche', retournees: [], premiere: null, cachee: null });
	}
	// Pendant le mélange aussi : le geste de l'artiste n'est jamais perdu.
	expect(apresToucher(MELANGE, 3)).toMatchObject({ phase: 'revele', place: 3 });
	// À côté des cartes, rien ne disparaît ; un double toucher pour la faire disparaître ne cache rien.
	expect(apresToucher(PRET, null)).toBe(PRET);
	const partie = apresToucher(PRET, 2);
	expect(apresDoubleToucher(partie, 2, PRET)).toBe(partie);
});

test('la place de la première carte retournée, parmi les quatre restantes, dit la carte cachée', () => {
	// La place vide ne compte pas : les quatre restantes sont numérotées de gauche à droite.
	expect([0, 1, 3, 4].map((place) => rangParmiLesRestantes(place, 2))).toStrictEqual([0, 1, 2, 3]);
	for (let vide = 0; vide < NOMBRE; vide++) {
		const restantes = [0, 1, 2, 3, 4].filter((place) => place !== vide);
		restantes.forEach((place, rang) => {
			const etat = apresToucher(apresToucher(PRET, vide), place);
			expect(etat, `vide ${vide}, première ${place}`).toMatchObject({ retournees: [place], premiere: place, cachee: rang });
		});
	}
});

test('comptées de droite à gauche, la première des restantes est celle de droite', () => {
	expect([4, 3, 1, 0].map((place) => rangParmiLesRestantes(place, 2, 'droite'))).toStrictEqual([0, 1, 2, 3]);
	for (let vide = 0; vide < NOMBRE; vide++) {
		const restantes = [0, 1, 2, 3, 4].filter((place) => place !== vide).reverse();
		restantes.forEach((place, rang) => {
			const etat = apresToucher(apresToucher(PRET, vide, 'droite'), place);
			expect(etat, `vide ${vide}, première ${place}`).toMatchObject({ sens: 'droite', cachee: rang });
		});
	}
	// Le sens est celui du moment où la carte disparaît.
	expect(apresToucher(apresToucher(PRET, 0, 'droite'), 4, 'gauche')).toMatchObject({ cachee: 0 });
});

test('un double toucher sur n’importe quelle carte restante, à n’importe quel moment, cache le valet', () => {
	expect(CACHEE_PAR_LE_DOUBLE).toBe(4);
	const partie = apresToucher(PRET, 0);
	for (const place of [1, 2, 3, 4]) {
		// En premier geste : la carte se retourne, et le valet est caché.
		const premier = apresToucher(partie, place);
		expect(apresDoubleToucher(premier, place, partie)).toMatchObject({ retournees: [place], cachee: 4 });
		// Après deux cartes retournées : encore.
		const deux = apresToucher(apresToucher(partie, 1 === place ? 2 : 1), 3 === place ? 4 : 3);
		const double = apresDoubleToucher(apresToucher(deux, place), place, deux);
		expect(double, `double sur ${place}`).toMatchObject({ cachee: 4 });
	}
	// Sur la place vide, ou à côté des cartes, le double toucher ne cache rien.
	const un = apresToucher(partie, 1);
	expect(apresDoubleToucher(un, 0, un)).toMatchObject({ cachee: 0 });
	expect(apresDoubleToucher(un, null, un)).toMatchObject({ cachee: 0 });
});

test('le valet n’est montré qu’en dernier : jusque-là, le double toucher peut toujours le cacher', () => {
	let etat = apresToucher(PRET, 2);
	for (const place of [0, 1, 3]) {
		etat = apresToucher(etat, place);
		expect(visibles(etat), `après la place ${place}`).not.toContain(4);
		expect(valetEncoreCachable(etat)).toBe(true);
	}
	// La quatrième ne peut plus montrer que le valet : il n'est plus cachable.
	etat = apresToucher(etat, 4);
	expect(visibles(etat)).toContain(4);
	expect(valetEncoreCachable(etat)).toBe(false);
	// Un double toucher, alors, ne fait que retourner et remettre la carte.
	const avant = etat;
	expect(apresDoubleToucher(apresToucher(avant, 1), 1, avant)).toMatchObject({ cachee: 0, retournees: [0, 3, 4, 1] });
});

test('ensuite, chaque carte touchée se retourne, et se remet face en bas au toucher suivant, en gardant sa face', () => {
	let etat = apresToucher(PRET, 1);
	expect(apresToucher(etat, 1)).toBe(etat);
	etat = apresToucher(etat, 3);
	expect(etat).toMatchObject({ retournees: [3], premiere: 3, cachee: 2 });
	expect(faceEnLAir(etat, 3)).toBe(true);
	expect(faceEnLAir(etat, 0)).toBe(false);
	const face = visibles(etat)[0];
	// Touchée à nouveau, elle se remet face en bas ; retournée encore, elle montre la même face.
	etat = apresToucher(etat, 3);
	expect(etat).toMatchObject({ retournees: [], premiere: 3, cachee: 2 });
	etat = apresToucher(etat, 3);
	expect(visibles(etat)).toStrictEqual([face]);
});

test('après la disparition, aucun geste ne remet le tour à zéro', () => {
	let etat = apresToucher(PRET, 2);
	for (const place of [0, 1, 3, 4]) etat = apresToucher(etat, place);
	for (const place of [null, 0, 1, 2, 3, 4]) {
		const apres = apresDoubleToucher(apresToucher(etat, place), place, etat);
		expect(apres.phase, `double toucher en ${place}`).toBe('revele');
	}
	expect(apresMinuterie(etat)).toBe(etat);
	// Au départ, deux touchers vifs montrent les cartes, sans plus.
	expect(apresDoubleToucher(MONTRE, 1, DEPART)).toBe(MONTRE);
});

test('la carte cachée n’est jamais montrée, quel que soit l’ordre des gestes, et une face montrée ne change jamais', () => {
	// Les gestes après la disparition : une place touchée, ou « d » + place pour un double toucher.
	const suites: (number | string)[][] = [];
	const places = [0, 1, 3, 4];
	for (const ordre of permutations(places)) {
		suites.push(ordre);
		for (let k = 0; k < ordre.length; k++) suites.push(ordre.map((p, i) => (i === k ? `d${p}` : p)));
		// Une carte remise face en bas puis retournée, au milieu.
		suites.push([ordre[0]!, ordre[0]!, ...ordre]);
	}
	for (const naturelles of permutations([0, 1, 2, 3, 4])) {
		for (const sens of ['gauche', 'droite'] as const) {
			for (const suite of suites) {
				let etat = apresToucher(PRET, 2, sens, naturelles);
				const montrees = new Map<number, number>();
				for (const geste of suite) {
					if (typeof geste === 'number') etat = apresToucher(etat, geste);
					else {
						const place = Number(geste.slice(1));
						const avant = etat;
						etat = apresDoubleToucher(apresToucher(avant, place), place, avant);
					}
					const cas = `${naturelles} ${sens} ${suite.join(' ')}`;
					if (etat.phase !== 'revele') throw new Error(cas);
					for (const place of etat.retournees) {
						const face = etat.attribuees[place]!;
						expect(face, cas).not.toBe(etat.cachee);
						if (montrees.has(place)) expect(face, `${cas} : la place ${place} a changé de face`).toBe(montrees.get(place));
						montrees.set(place, face);
					}
				}
				// Toutes retournées : les quatre cartes sauf la cachée, chacune une fois.
				const toutes = [...new Set(montrees.values())].sort();
				if (montrees.size === 4) expect(toutes).toStrictEqual([0, 1, 2, 3, 4].filter((c) => c !== (etat.phase === 'revele' ? etat.cachee : -1)));
			}
		}
	}
});

test('les faces affichées : celles déjà montrées, sinon celles tirées au sort', () => {
	const faces = [3, 0, 4, 1, 2];
	const ordre = [2, 0, 4, 1, 3];
	expect(facesAffichees(faces, ordre, PRET)).toStrictEqual(faces);
	const naturelles = ordre.map((element) => faces[element]!);
	const etat = apresToucher(apresToucher(PRET, 0, 'gauche', naturelles), 1);
	if (etat.phase !== 'revele') throw new Error('pas révélé');
	const affichees = facesAffichees(faces, ordre, etat);
	expect(affichees[ordre[1]!]).toBe(etat.attribuees[1]);
	expect(affichees[ordre[3]!]).toBe(faces[ordre[3]!]);
});
