// La routine : ce que chaque geste note, et la photo montrée.
import { CODES, EXCLUS, type Reponse } from '../../../src/tours/trois-questions/logic/codes.ts';
import { apresAucune, apresCentre, apresColonne, apresDefilement, apresDouble, colonneDuPoint, depart, enRevelation, photo, voisines, type Etat } from '../../../src/tours/trois-questions/logic/routine.ts';

const DEPART = depart(1234);

/** Joue une suite de gestes : « 1 » à « 3 » touchent une colonne, « 0 » est le double toucher, « > » et « < » font défiler. */
function jouer(gestes: string, etat: Etat = DEPART): { etat: Etat; exclus: number } {
	let exclus = 0;
	for (const geste of gestes) {
		const suite = geste === '>' ? apresDefilement(etat, 'suivant') : geste === '<' ? apresDefilement(etat, 'precedent') : geste === '0' ? apresAucune(etat) : apresColonne(etat, Number(geste));
		if (suite.exclu) exclus++;
		etat = suite.etat;
	}
	return { etat, exclus };
}

/** Les gestes qui donnent ces réponses : la colonne touchée, ou le double toucher (« 0 ») pour « aucune ». */
const gestesDe = (reponses: readonly Reponse[]): string => reponses.join('');

test('le départ : la première photo de la question 1, rien de noté', () => {
	expect(photo(DEPART)).toStrictEqual({ type: 'colonnes', question: 0, rafale: false });
	expect(DEPART.reponses).toStrictEqual([]);
});

test('toucher une colonne la note, et passe à la photo de la question suivante', () => {
	const { etat } = jouer('2');
	expect(etat.reponses).toStrictEqual([2]);
	expect(photo(etat)).toStrictEqual({ type: 'colonnes', question: 1, rafale: false });
});

test('défiler ne note jamais rien : la rafale de la même question, puis la galerie s’arrête', () => {
	const { etat } = jouer('>');
	expect(etat.reponses).toStrictEqual([]);
	expect(photo(etat)).toStrictEqual({ type: 'colonnes', question: 0, rafale: true });
	// Un second défilement : rien de plus.
	expect(jouer('>>>').etat).toStrictEqual(etat);
	// Puis une colonne touchée sur la rafale : c'est elle qui est notée.
	expect(jouer('3', etat).etat.reponses).toStrictEqual([3]);
});

test('le double toucher note « aucune », sur la première photo comme sur la rafale', () => {
	const { etat } = jouer('0');
	expect(etat.reponses).toStrictEqual([0]);
	expect(photo(etat)).toStrictEqual({ type: 'colonnes', question: 1, rafale: false });
	expect(jouer('>0').etat.reponses).toStrictEqual([0]);
	// Un défilement, puis un retour : rien de noté, la première photo.
	expect(jouer('><').etat).toStrictEqual(DEPART);
	// Sur la révélation, rien.
	const fin = jouer('132').etat;
	expect(apresAucune(fin).etat).toBe(fin);
});

test('pour chacune des 52 cartes, les gestes de ses réponses mènent à sa révélation', () => {
	for (const code of CODES) {
		const reponses = [...code].map(Number) as Reponse[];
		const { etat, exclus } = jouer(gestesDe(reponses));
		expect(exclus, code).toBe(0);
		expect(enRevelation(etat), code).toBe(true);
		expect(photo(etat), code).toStrictEqual({ type: 'revelation', reponses, retournee: false });
	}
});

test('un code écarté ne note rien et ne bouge rien : il est signalé ; défiler vers la droite revient en arrière', () => {
	for (const code of EXCLUS) {
		const reponses = [...code].map(Number) as Reponse[];
		const avant = jouer(gestesDe(reponses.slice(0, 2))).etat;
		const { etat, exclus } = jouer(gestesDe(reponses.slice(2)), avant);
		expect(exclus, code).toBe(1);
		expect(etat.reponses, code).toStrictEqual(reponses.slice(0, 2));
		expect(enRevelation(etat), code).toBe(false);
		// Pour recommencer : vers la droite, question après question, jusqu'à la première photo.
		expect(jouer('<<<<', etat).etat.reponses, code).toStrictEqual([]);
	}
});

test('331 et 332, qu’aucune carte n’a, sont signalés comme des codes écartés', () => {
	for (const code of ['331', '332']) {
		const { etat, exclus } = jouer(code);
		expect(exclus, code).toBe(1);
		expect(etat.reponses, code).toStrictEqual([3, 3]);
	}
	expect(enRevelation(jouer('330').etat)).toBe(true);
});

test('défiler vers la droite revient à la question d’avant et oublie sa réponse', () => {
	const { etat } = jouer('10');
	expect(etat.reponses).toStrictEqual([1, 0]);
	const retour = apresDefilement(etat, 'precedent').etat;
	expect(retour.reponses).toStrictEqual([1]);
	expect(photo(retour)).toStrictEqual({ type: 'colonnes', question: 1, rafale: false });
	// Au tout début, rien avant.
	expect(apresDefilement(DEPART, 'precedent').etat).toBe(DEPART);
});

test('la révélation : la dernière photo est bloquée ; toucher la carte la retourne', () => {
	const { etat } = jouer('132');
	expect(apresColonne(etat, 1).etat, 'une colonne sur la révélation').toBe(etat);
	expect(apresDefilement(etat, 'suivant').etat, 'au bout de la galerie').toBe(etat);
	const retournee = apresCentre(etat);
	expect(retournee.retournee).toBe(true);
	expect(apresDefilement(retournee, 'precedent').etat).toBe(retournee);
	// Même avant d'être retournée : aucun défilement ne revient en arrière.
	expect(apresDefilement(etat, 'precedent').etat).toBe(etat);
	expect(voisines(etat)).toStrictEqual({ precedente: null, suivante: null });
	// Hors révélation, toucher le centre ne fait rien.
	expect(apresCentre(DEPART)).toBe(DEPART);
});

test('le double toucher relance la routine, seulement sur la carte déjà retournée', () => {
	const { etat } = jouer('132');
	const retournee = apresCentre(etat);
	// Deux touchers vifs sur la carte face en bas : retournée, pas relancée.
	expect(apresDouble(retournee, etat, 99)).toBe(retournee);
	expect(apresDouble(retournee, retournee, 99)).toStrictEqual(depart(99));
	// Sur une photo de colonnes, rien.
	expect(apresDouble(DEPART, DEPART, 99)).toBe(DEPART);
	// Une carte qui ne se retourne pas (réglage) : le double toucher relance dès la révélation.
	expect(apresDouble(etat, etat, 99, false)).toStrictEqual(depart(99));
	expect(apresDouble(DEPART, DEPART, 99, false)).toBe(DEPART);
});

test('une colonne hors de 1 à 3 ne note rien', () => {
	for (const colonne of [0, 4, -1, 1.5, Number.NaN]) expect(apresColonne(DEPART, colonne).etat).toBe(DEPART);
});

test('les photos voisines : celles que montrerait un défilement, null au bout de la galerie', () => {
	expect(voisines(DEPART)).toStrictEqual({ precedente: null, suivante: { type: 'colonnes', question: 0, rafale: true } });
	// La rafale : la galerie s'arrête là.
	expect(voisines(jouer('>').etat)).toStrictEqual({ precedente: { type: 'colonnes', question: 0, rafale: false }, suivante: null });
	// La question 2 : avant elle, la question 1.
	expect(voisines(jouer('2').etat).precedente).toStrictEqual({ type: 'colonnes', question: 0, rafale: false });
});

test('la colonne touchée : la photo coupée en trois bandes, de gauche à droite', () => {
	expect(colonneDuPoint(10, 0, 300)).toBe(1);
	expect(colonneDuPoint(150, 0, 300)).toBe(2);
	expect(colonneDuPoint(299, 0, 300)).toBe(3);
	expect(colonneDuPoint(300, 0, 300)).toBe(3);
	expect(colonneDuPoint(-1, 0, 300)).toBeNull();
	expect(colonneDuPoint(340, 50, 300)).toBe(3);
	expect(colonneDuPoint(400, 50, 300)).toBeNull();
	expect(colonneDuPoint(5, 50, 300)).toBeNull();
	expect(colonneDuPoint(100, 0, 0)).toBeNull();
});
