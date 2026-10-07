// L'état du papier : la grille du haut en haut, celle du bas en bas, armé une seule fois, remis par un double toucher, la grille gardée.
import { apresGeste, CACHE, cacher, coteDuPoint, enJeu, montrer, type Etat } from '../../../src/tours/morpion/logic/papier.ts';

test('la moitié du haut choisit la grille du haut, celle du bas la grille du bas', () => {
	expect(coteDuPoint(0, 800)).toBe('haut');
	expect(coteDuPoint(399, 800)).toBe('haut');
	expect(coteDuPoint(400, 800)).toBe('bas');
	expect(coteDuPoint(799, 800)).toBe('bas');
});

test('un doigt au-delà du bord compte pour la moitié la plus proche', () => {
	expect(coteDuPoint(-12, 800)).toBe('haut');
	expect(coteDuPoint(830, 800)).toBe('bas');
});

test('une mesure invalide ne choisit rien', () => {
	for (const [y, h] of [[10, 0], [10, -5], [Number.NaN, 800], [10, Number.POSITIVE_INFINITY]]) {
		expect(coteDuPoint(y!, h!), `${y} sur ${h}`).toBeNull();
	}
});

test('un toucher arme le papier sur la grille touchée', () => {
	expect(apresGeste(CACHE, 'tap', 'haut', CACHE)).toStrictEqual({ phase: 'arme', cote: 'haut' });
	expect(apresGeste(CACHE, 'tap', 'bas', CACHE)).toStrictEqual({ phase: 'arme', cote: 'bas' });
});

test('une fois armé ou retourné, un toucher ne change plus la grille', () => {
	const arme: Etat = { phase: 'arme', cote: 'haut' };
	const montre: Etat = { phase: 'montre', cote: 'haut' };
	expect(apresGeste(arme, 'tap', 'bas', arme)).toBe(arme);
	expect(apresGeste(montre, 'tap', 'bas', montre)).toBe(montre);
});

test('le double toucher remet le papier sur « Prédiction », seulement s’il était déjà armé', () => {
	const montre: Etat = { phase: 'montre', cote: 'bas' };
	expect(apresGeste(montre, 'double', 'haut', montre)).toStrictEqual({ phase: 'cache', garde: 'bas' });
	// Deux touchers vifs pour armer : le papier reste armé.
	const arme: Etat = { phase: 'arme', cote: 'haut' };
	expect(apresGeste(arme, 'double', 'haut', CACHE)).toBe(arme);
});

test('la grille gardée revient au toucher suivant, même sur l’autre moitié de l’écran', () => {
	const garde = cacher({ phase: 'montre', cote: 'haut' });
	expect(apresGeste(garde, 'tap', 'bas', garde)).toStrictEqual({ phase: 'arme', cote: 'haut' });
	// Déjà sur « Prédiction » : cacher ne change rien.
	expect(cacher(garde)).toBe(garde);
	expect(cacher(CACHE)).toBe(CACHE);
});

test('le délai écoulé retourne le papier armé, et seulement lui', () => {
	expect(montrer({ phase: 'arme', cote: 'bas' })).toStrictEqual({ phase: 'montre', cote: 'bas' });
	expect(montrer(CACHE)).toBe(CACHE);
	expect(enJeu(CACHE)).toBe(false);
	expect(enJeu({ phase: 'arme', cote: 'haut' })).toBe(true);
});
