// Le tirage des trois panneaux : le code binaire des paquets, les sosies, le remplissage et la fin.
import { checkCartes, estRouge, type Carte } from '../../../src/tours/princesse/logic/cartes.ts';
import { FORCEES } from '../../../src/tours/trois-paquets/content/cartes.ts';
import {
	CARTES_PAR_MELANGE, CARTES_PAR_PAQUET, carteDuCode, MELANGES, FACES_DE_LA_FIN, codeDesPaquets, dansLePaquet, DOS_DE_LA_SALADE, estForcee, FACES_CACHEES, finale, memeCarte, PAQUETS,
	finaleLiee, photosLiees, sosiesPossibles, tirer, VALEURS_DE_REMPLISSAGE,
} from '../../../src/tours/trois-paquets/logic/tirage.ts';

const nom = ({ valeur, enseigne }: Carte): string => `${valeur} de ${enseigne}`;
const SEMIS = Array.from({ length: 400 }, (_, i) => i * 2654435761 >>> 0);

test('les huit cartes à forcer, dans l’ordre de leur code : le 2♣ vaut 0', () => {
	expect(checkCartes(FORCEES)).toStrictEqual([]);
	expect(FORCEES.map(nom)).toStrictEqual(['2 de trefle', '4 de trefle', '8 de coeur', '5 de carreau', '10 de carreau', 'V de carreau', '10 de pique', 'D de pique']);
	expect(carteDuCode(0)).toStrictEqual({ valeur: '2', enseigne: 'trefle' });
	expect(carteDuCode(1)).toStrictEqual({ valeur: '4', enseigne: 'trefle' });
	expect(carteDuCode(7)).toStrictEqual({ valeur: 'D', enseigne: 'pique' });
	for (const k of [-1, 8, 1.5, NaN]) expect(carteDuCode(k), String(k)).toBeNull();
});

test('le code des paquets : 1 pour le premier, 2 pour le deuxième, 4 pour le troisième', () => {
	expect(codeDesPaquets([0])).toBe(1);
	expect(codeDesPaquets([0, 2])).toBe(5);
	expect(codeDesPaquets([2, 1, 0])).toBe(7);
	expect(codeDesPaquets([1, 1])).toBe(2);
	expect(codeDesPaquets([])).toBe(0);
	// Le 4♣ n'est que dans le premier paquet ; le valet de ♦ dans le premier et le troisième.
	expect([0, 1, 2].map((p) => dansLePaquet(1, p))).toStrictEqual([true, false, false]);
	expect([0, 1, 2].map((p) => dansLePaquet(5, p))).toStrictEqual([true, false, true]);
});

test('les sosies : même valeur, autre enseigne ; jamais une carte à forcer ; les deux 10 gardent leur couleur', () => {
	expect(sosiesPossibles(FORCEES[1]!).map(nom).sort()).toStrictEqual(['4 de carreau', '4 de coeur', '4 de pique']);
	expect(sosiesPossibles(FORCEES[4]!).map(nom)).toStrictEqual(['10 de coeur']);
	expect(sosiesPossibles(FORCEES[6]!).map(nom)).toStrictEqual(['10 de trefle']);
	for (const forcee of FORCEES) {
		for (const sosie of sosiesPossibles(forcee)) {
			expect(sosie.valeur).toBe(forcee.valeur);
			expect(estForcee(sosie), nom(sosie)).toBe(false);
		}
	}
});

test('trois paquets de sept : chaque carte à forcer est là où son code le dit, elle-même ou un sosie', () => {
	for (const semis of SEMIS) {
		const { paquets } = tirer(semis);
		expect(paquets).toHaveLength(PAQUETS);
		paquets.forEach((paquet, p) => {
			expect(paquet, `semis ${semis}, paquet ${p + 1}`).toHaveLength(CARTES_PAR_PAQUET);
			FORCEES.forEach((forcee, rang) => {
				const k = rang;
				const representants = paquet.filter((c) => c.code === k);
				expect(representants.length, `semis ${semis}, paquet ${p + 1}, carte ${k}`).toBe(dansLePaquet(k, p) ? 1 : 0);
				for (const { carte } of representants) {
					expect(carte.valeur).toBe(forcee.valeur);
					expect(memeCarte(carte, forcee) || sosiesPossibles(forcee).some((s) => memeCarte(s, carte)), nom(carte)).toBe(true);
				}
			});
			// Le remplissage : des valeurs qu'aucune carte à forcer n'a.
			for (const { carte } of paquet.filter((c) => c.code === null)) {
				expect(VALEURS_DE_REMPLISSAGE).toContain(carte.valeur);
				expect(FORCEES.some((forcee) => forcee.valeur === carte.valeur), nom(carte)).toBe(false);
			}
			// Le 2♣ (code 0) n'est dans aucun paquet : aucun 2.
			expect(paquet.some(({ carte }) => carte.valeur === '2'), `semis ${semis}, un 2 dans le paquet ${p + 1}`).toBe(false);
		});
		// Aucune carte en double, d'un paquet à l'autre.
		const toutes = paquets.flat().map(({ carte }) => nom(carte));
		expect(new Set(toutes).size, `semis ${semis}`).toBe(toutes.length);
	}
});

test('le spectateur qui cherche la valeur de sa carte trouve les bons paquets : son code', () => {
	for (const semis of SEMIS) {
		const { paquets } = tirer(semis);
		FORCEES.forEach((forcee, rang) => {
			// Il voit sa carte dans un paquet s'il y a une carte de même valeur ; pour les deux 10, il faut
			// aussi la même couleur.
			const jumelle = FORCEES.filter((autre) => autre.valeur === forcee.valeur).length > 1;
			const reconnue = (carte: Carte): boolean => carte.valeur === forcee.valeur && (!jumelle || estRouge(carte.enseigne) === estRouge(forcee.enseigne));
			const vus = paquets.flatMap((paquet, p) => (paquet.some(({ carte }) => reconnue(carte)) ? [p] : []));
			expect(codeDesPaquets(vus), `semis ${semis}, ${nom(forcee)}`).toBe(rang);
		});
	}
});

test('les cartes à forcer et leurs sosies sont tirés au sort : tantôt l’une, tantôt l’autre', () => {
	const vues = new Set(SEMIS.flatMap((semis) => tirer(semis).paquets.flat().filter((c) => c.code !== null).map(({ carte }) => nom(carte))));
	// Toutes, sauf le 2♣ (code 0), qui n'est dans aucun paquet.
	const dansLesPaquets = FORCEES.slice(1);
	for (const forcee of dansLesPaquets) expect(vues.has(nom(forcee)), nom(forcee)).toBe(true);
	for (const sosie of dansLesPaquets.flatMap(sosiesPossibles)) expect(vues.has(nom(sosie)), nom(sosie)).toBe(true);
});

test('la salade : les huit cartes à forcer, les dos, et des faces cachées qui ne sont pas à forcer', () => {
	for (const semis of SEMIS.slice(0, 50)) {
		const { salade } = tirer(semis);
		expect(salade.faces.map(nom).sort()).toStrictEqual(FORCEES.map(nom).sort());
		expect(salade.dos).toBe(DOS_DE_LA_SALADE);
		expect(salade.cachees).toHaveLength(FACES_CACHEES);
		expect(salade.cachees.some(estForcee)).toBe(false);
		expect(new Set(salade.cachees.map(nom)).size).toBe(FACES_CACHEES);
	}
});

test('la fin : vingt cartes, aucune à forcer, aucune en double ; un sosie de chacune ; les sosies du panneau 2 d’abord', () => {
	for (const semis of SEMIS) {
		const tirage = tirer(semis);
		for (const code of [null, 0, 1, 2, 3, 4, 5, 6, 7]) {
			const fin = finale(tirage, code);
			expect(fin, `semis ${semis}, code ${code}`).toHaveLength(FACES_DE_LA_FIN);
			expect(fin.some(estForcee), `semis ${semis}`).toBe(false);
			expect(new Set(fin.map(nom)).size).toBe(fin.length);
			for (const forcee of FORCEES.filter((f) => code === null || f.valeur !== carteDuCode(code)!.valeur)) {
				expect(fin.some((c) => sosiesPossibles(forcee).some((s) => memeCarte(s, c))), `semis ${semis}, code ${code}, sosie de ${nom(forcee)}`).toBe(true);
			}
		}
		// Sans valeur ôtée, tous les sosies du panneau 2 y sont.
		const fin = finale(tirage, null);
		for (const { carte, code } of tirage.paquets.flat()) {
			if (code !== null && !estForcee(carte)) expect(fin.some((c) => memeCarte(c, carte)), nom(carte)).toBe(true);
		}
	}
});

test('la fin, les paquets notés : plus aucune carte de la valeur pensée', () => {
	const tirage = tirer(7);
	expect(finale(tirage, 1).some((c) => c.valeur === '4')).toBe(false);
	expect(finale(tirage, 4).some((c) => c.valeur === '10')).toBe(false);
	expect(finale(tirage, 7).some((c) => c.valeur === 'D')).toBe(false);
	expect(finale(tirage, 7).some((c) => c.valeur === 'V')).toBe(true);
	// Rien de noté : le code 0, le 2♣ ; aucun 2.
	expect(finale(tirage, null).some((c) => c.valeur === '2')).toBe(true);
	expect(finale(tirage, 0).some((c) => c.valeur === '2')).toBe(false);
	// Sans valeur ôtée, les cartes de la fin dans leur ordre tiré au sort, complétées par la réserve.
	expect(finale(tirage, null)).toStrictEqual([...tirage.fin, ...tirage.reserve].slice(0, FACES_DE_LA_FIN).filter((c) => finale(tirage, null).includes(c)));
});

test('les mélanges : des cartes du jeu, rois compris, sans doublon, tantôt faces en l’air, tantôt en bas', () => {
	for (const semis of SEMIS.slice(0, 50)) {
		const { melanges } = tirer(semis);
		expect(melanges).toHaveLength(MELANGES);
		for (const melange of melanges) {
			expect(melange).toHaveLength(CARTES_PAR_MELANGE);
			const faces = melange.filter((carte): carte is Carte => carte !== null);
			expect(faces.length).toBeGreaterThan(0);
			expect(faces.length).toBeLessThan(CARTES_PAR_MELANGE);
			expect(new Set(faces.map(nom)).size).toBe(faces.length);
		}
	}
	// Les rois y passent, d'un tirage à l'autre.
	expect(SEMIS.slice(0, 50).some((semis) => tirer(semis).melanges.flat().some((carte) => carte?.valeur === 'R'))).toBe(true);
	// Les deux mélanges ne se ressemblent pas.
	const { melanges } = tirer(5);
	expect(melanges[0]).not.toStrictEqual(melanges[1]);
});

test('le même semis donne le même tirage', () => {
	expect(tirer(1234)).toStrictEqual(tirer(1234));
	expect(tirer(1234)).not.toStrictEqual(tirer(1235));
});

describe('les photos liées, chacune à une colonne', () => {
	const cle = (c: { valeur: string; enseigne: string }): string => `${c.valeur}-${c.enseigne}`;

	test('trois photos de trois colonnes de sept, sans double sur une photo', () => {
		for (const semis of SEMIS.slice(0, 200)) {
			const photos = photosLiees(semis);
			expect(photos).toHaveLength(3);
			for (const photo of photos) {
				expect(photo.map((colonne) => colonne.length)).toStrictEqual([7, 7, 7]);
				const cartes = photo.flat().map(({ carte }) => cle(carte));
				expect(new Set(cartes).size, `semis ${semis}`).toBe(21);
			}
		}
	});

	test('la colonne liée porte les vraies cartes de son code ; aucune vraie carte à forcer ailleurs', () => {
		for (const semis of SEMIS.slice(0, 200)) {
			photosLiees(semis).forEach((photo, p) => {
				const attendues = FORCEES.filter((_, k) => dansLePaquet(k, p)).map(cle).sort();
				const vraies = photo[p]!.filter(({ carte }) => estForcee(carte)).map(({ carte }) => cle(carte)).sort();
				expect(vraies, `semis ${semis}, photo ${p + 1}`).toStrictEqual(attendues);
				for (const [c, colonne] of photo.entries()) {
					if (c !== p) for (const { carte } of colonne) expect(estForcee(carte), `semis ${semis}, photo ${p + 1}, ${cle(carte)}`).toBe(false);
				}
			});
		}
	});

	test('les sosies ne sont que ceux des cartes de la colonne liée : un « oui » sur un sosie reste juste', () => {
		let sosies = 0;
		for (const semis of SEMIS.slice(0, 200)) {
			photosLiees(semis).forEach((photo, p) => {
				for (const { carte, code } of photo.flat()) {
					if (code === null) {
						expect(VALEURS_DE_REMPLISSAGE).toContain(carte.valeur);
						continue;
					}
					expect(dansLePaquet(code, p), `semis ${semis}, photo ${p + 1}, ${cle(carte)}`).toBe(true);
					if (!estForcee(carte)) {
						sosies++;
						expect(sosiesPossibles(FORCEES[code]!).map(cle)).toContain(cle(carte));
					}
				}
			});
		}
		expect(sosies).toBeGreaterThan(0);
	});

	test('la fin des photos liées : vingt cartes de remplissage, aucune valeur à forcer', () => {
		for (const semis of SEMIS.slice(0, 50)) {
			const fin = finaleLiee(semis);
			expect(fin).toHaveLength(FACES_DE_LA_FIN);
			expect(new Set(fin.map(cle)).size).toBe(FACES_DE_LA_FIN);
			for (const carte of fin) expect(VALEURS_DE_REMPLISSAGE).toContain(carte.valeur);
		}
		expect(photosLiees(1234)).toStrictEqual(photosLiees(1234));
	});
});
