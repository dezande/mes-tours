/*
 * Morpion : sur un fond bleu ciel, un papier froissé, déplié, marqué « Prédiction ». Au dos, une
 * grille de morpion remplie. Le même système que Pile ou face :
 *   toucher la moitié du haut   : le papier se retourne sur la grille du haut
 *   toucher la moitié du bas    : le papier se retourne sur la grille du bas
 *   (après le délai réglé ; 0 s par défaut, au toucher)
 *   deux touchers rapprochés, ou R : le papier revient sur « Prédiction » ; un toucher, où que ce
 *   soit, le retourne sur la même grille : la première choisie est gardée jusqu'au retour au menu
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène et l'état du papier (gestes et clavier : src/hooks/)
 *   components/  Papier (le papier froissé, la grille, le retournement), Reglages (l'écrou ⚙)
 *   content/     LES GRILLES : grilles.ts (les deux prédictions) et interface.ts (les textes)
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/morpion/)
 *     papier.ts      l'état du papier, et la grille selon la moitié touchée
 *     grilles.ts     lecture et vérification des grilles, ligne gagnante
 *     dessin.ts      les tracés : le papier froissé, l'écriture à la main
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 * Les styles sont dans src/styles/tours/morpion/.
 */

import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { JaugeAppui } from '../../components/JaugeAppui.tsx';
import { useClavier } from '../../hooks/useClavier.ts';
import { useGestesDoubleToucher } from '../../hooks/useGestesDoubleToucher.ts';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { useSansAnimation } from '../../hooks/useSansAnimation.ts';
import { usePont } from '../pont.tsx';
import { annonce, Papier } from './components/Papier.tsx';
import { Reglages } from './components/Reglages.tsx';
import { keyAction } from './logic/keys.ts';
import { apresGeste, CACHE, cacher, coteDuPoint, montrer, type Cote, type Etat } from './logic/papier.ts';
import { sanitizeSettings } from './logic/settings.ts';

/**
 * Les réglages, gardés sur l'appareil. L'état du papier, lui, n'est enregistré nulle part : chaque
 * ouverture repart du côté « Prédiction ».
 */
const CLE_REGLAGES = 'morpion:settings:v1';

export default function Morpion() {
	const { langue, enReglages } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, sanitizeSettings);

	/* ---------- L'état du papier ---------- */

	const [etat, setEtat] = useState<Etat>(CACHE);
	/** La grille écrite au verso. */
	const [coteEcrit, setCoteEcrit] = useState<Cote | null>(null);
	// Lus par les gestes et les minuteries, qui doivent toujours voir la dernière valeur.
	const etatRef = useRef(etat);
	const reglagesRef = useRef(reglages);
	reglagesRef.current = reglages;
	/** Minuterie du délai entre le toucher et le retournement. */
	const delaiTimer = useRef(0);

	const changer = useCallback(function changer(suivant: Etat): void {
		const avant = etatRef.current;
		if (suivant === avant) return;
		let nouveau = suivant;
		if (nouveau.phase === 'arme' && avant.phase === 'cache') {
			// La grille est écrite tout de suite, recto visible : prête quand le papier se retourne.
			setCoteEcrit(nouveau.cote);
			clearTimeout(delaiTimer.current);
			const ms = reglagesRef.current.delai * 1000;
			if (ms === 0) nouveau = montrer(nouveau);
			else delaiTimer.current = window.setTimeout(() => changer(montrer(etatRef.current)), ms);
		}
		if (nouveau.phase === 'cache') clearTimeout(delaiTimer.current);
		etatRef.current = nouveau;
		setEtat(nouveau);
	}, []);

	useEffect(() => () => clearTimeout(delaiTimer.current), []);

	/* ---------- Gestes sur la scène, clavier ---------- */

	/** État du papier avant le dernier tap : un double toucher ne compte que sur un papier déjà armé. */
	const avantDernierTap = useRef<Etat>(CACHE);

	/**
	 * Ce qu'un geste de la scène déclenche, à la hauteur `y` (repère de l'app) :
	 *   un tap        arme le papier, sur la grille du haut en haut de l'écran et sur celle du bas en bas ;
	 *   un double     remet le papier sur « Prédiction », s'il était déjà armé au premier toucher ;
	 *                 le toucher suivant le retourne sur la même grille, où qu'il soit.
	 */
	const { scene, jauge } = useGestesDoubleToucher(reglages.showHoldRing, (geste, { y }) => {
		// La hauteur de l'app, et non de la fenêtre : l'app peut être pivotée (kit/web/orientation.ts).
		const cote = coteDuPoint(y, document.getElementById('app')?.clientHeight ?? window.innerHeight);
		if (!cote) return;
		const avant = etatRef.current;
		changer(apresGeste(avant, geste, cote, geste === 'double' ? avantDernierTap.current : avant));
		if (geste === 'tap') avantDernierTap.current = avant;
	});

	// ↑ la grille du haut, ↓ celle du bas, R le papier sur « Prédiction » ; Échap ou M : retour au menu.
	useClavier(keyAction, (action) => {
		if (action === 'cacher') changer(cacher(etatRef.current));
		else changer(apresGeste(etatRef.current, 'tap', action, etatRef.current));
	});

	/* ---------- Affichage ---------- */

	// Sans transition à l'ouverture : le papier apparaît directement à sa place.
	const sansAnimation = useSansAnimation();

	return (
		<>
			{/* La scène reçoit tous les touchers. */}
			<main id="stage" {...scene}>
				<div id="table" className={sansAnimation ? 'no-anim' : undefined}>
					<Papier etat={etat} coteEcrit={coteEcrit} langue={langue} />
				</div>
			</main>

			{/* Ce qui est à l'écran, pour les lecteurs d'écran seulement. */}
			<p id="annonce" className="sr-only" aria-live="polite">{annonce(etat, langue)}</p>
			<JaugeAppui jauge={jauge} />

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{enReglages && <Reglages reglages={reglages} langue={langue} enregistrer={enregistrer} />}
		</>
	);
}
