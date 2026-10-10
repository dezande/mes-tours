/*
 * LA GALERIE DES TROIS QUESTIONS : défilement, tap, double toucher, et appui de 3 s qui ramène au
 * menu, suivis au doigt (ou à la souris pour répéter sur ordinateur). Les décisions sont prises par
 * logic/gestes.ts (testé sous Node) ; ce hook relaie les événements « pointer » de la scène, dit de
 * combien la photo suit le doigt, gère la jauge de l'appui long et oublie tout geste commencé quand
 * l'app passe en arrière-plan.
 *
 *   const { scene, jauge } = useGestesGalerie(reglages.showHoldRing, (dx) => …, (geste, point, dx) => …);
 *   <main id="stage" {...scene}>…</main>
 *   <JaugeAppui jauge={jauge} />
 *
 * `surGlissement` reçoit le déplacement horizontal du doigt pendant qu'il glisse de côté ; `surGeste`
 * reçoit « suivant », « precedent », « tap » ou « double », le point du doigt levé dans le repère de
 * #app, et le dernier déplacement (d'où la photo repart).
 */

import type { TargetedMouseEvent, TargetedPointerEvent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { useOrientation } from '../../../appareil/Orientation.tsx';
import { useAppuiLong } from '../../../hooks/useAppuiLong.ts';
import { useQuandLAppSeCache } from '../../../hooks/useQuandLAppSeCache.ts';
import { usePont } from '../../pont.tsx';
import { GESTURE, GestureTracker, type Geste } from '../logic/gestes.ts';

export function useGestesGalerie(
	jaugeVisible: boolean,
	surGlissement: (dx: number) => void,
	surGeste: (geste: Geste, point: { x: number; y: number }, dx: number) => void,
) {
	const { quitter } = usePont();
	const { appPoint } = useOrientation();
	const [gestes] = useState(() => new GestureTracker());
	// La jauge n'apparaît qu'après la durée d'un tap : un toucher de la routine ne la montre jamais.
	const appui = useAppuiLong({ dureeMs: GESTURE.holdMs, delaiJaugeMs: GESTURE.tapMaxMs, jaugeVisible });
	const dernier = useRef({ surGlissement, surGeste });
	dernier.current = { surGlissement, surGeste };
	/** Le dernier déplacement suivi, remis à zéro à chaque doigt posé. */
	const glisse = useRef(0);

	// App en arrière-plan : le geste commencé est oublié, et la photo revient à sa place.
	useQuandLAppSeCache(() => {
		gestes.reset();
		if (glisse.current !== 0) dernier.current.surGeste('none', { x: 0, y: 0 }, glisse.current);
		glisse.current = 0;
	});

	const scene = {
		onPointerDown: (event: TargetedPointerEvent<HTMLElement>): void => {
			if (event.pointerType === 'mouse' && event.button !== 0) return;
			const { x, y } = appPoint(event.clientX, event.clientY);
			if (!gestes.press(event.pointerId, x, y, performance.now())) {
				appui.arreter();
				return;
			}
			glisse.current = 0;
			const id = event.pointerId;
			// La souris qui sort de la scène ne perd pas son relâchement.
			try {
				event.currentTarget.setPointerCapture(id);
			} catch {
				// Contact déjà terminé.
			}
			// Appui de 3 s : sortie de secours, retour au menu principal.
			appui.commencer(x, y, () => {
				if (gestes.holdCompleted(id)) quitter();
			});
		},
		onPointerMove: (event: TargetedPointerEvent<HTMLElement>): void => {
			const { x, y } = appPoint(event.clientX, event.clientY);
			if (gestes.move(event.pointerId, x, y)) appui.arreter();
			const dx = gestes.glissement(event.pointerId, x);
			if (dx !== glisse.current) {
				glisse.current = dx;
				dernier.current.surGlissement(dx);
			}
		},
		onPointerUp: (event: TargetedPointerEvent<HTMLElement>): void => {
			appui.arreter();
			const point = appPoint(event.clientX, event.clientY);
			const geste = gestes.release(event.pointerId, point.x, point.y, performance.now());
			// Même sans geste, une photo qui a suivi le doigt doit revenir à sa place.
			if (geste !== 'none' || glisse.current !== 0) dernier.current.surGeste(geste, point, glisse.current);
			glisse.current = 0;
		},
		onPointerCancel: (event: TargetedPointerEvent<HTMLElement>): void => {
			appui.arreter();
			gestes.cancel(event.pointerId);
			if (glisse.current !== 0) dernier.current.surGeste('none', { x: 0, y: 0 }, glisse.current);
			glisse.current = 0;
		},
		// Pas de menu contextuel ni de loupe sur appui long.
		onContextMenu: (event: TargetedMouseEvent<HTMLElement>): void => event.preventDefault(),
	};

	return { scene, jauge: appui.jauge };
}
