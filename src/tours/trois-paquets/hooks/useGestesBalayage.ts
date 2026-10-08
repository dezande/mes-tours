/*
 * LA SCÈNE DES TROIS PAQUETS : balayage, tap, et appui de 3 s qui ramène au menu, suivis au doigt
 * (ou à la souris pour répéter sur ordinateur). Les décisions sont prises par logic/gestes.ts (testé
 * sous Node) ; ce hook relaie les événements « pointer » de la scène, gère la jauge de l'appui long
 * et oublie tout geste commencé quand l'app passe en arrière-plan.
 *
 *   const { scene, jauge } = useGestesBalayage(reglages.showHoldRing, (geste, point) => …);
 *   <main id="stage" {...scene}>…</main>
 *   <JaugeAppui jauge={jauge} />
 *
 * `surGeste` reçoit « suivant », « precedent » ou « tap », et le point du doigt levé dans le repère
 * de #app.
 */

import type { TargetedMouseEvent, TargetedPointerEvent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { useOrientation } from '../../../appareil/Orientation.tsx';
import { useAppuiLong } from '../../../hooks/useAppuiLong.ts';
import { useQuandLAppSeCache } from '../../../hooks/useQuandLAppSeCache.ts';
import { usePont } from '../../pont.tsx';
import { GESTURE, GestureTracker, type Geste } from '../logic/gestes.ts';

export function useGestesBalayage(jaugeVisible: boolean, surGeste: (geste: Exclude<Geste, 'none'>, point: { x: number; y: number }) => void) {
	const { quitter } = usePont();
	const { appPoint } = useOrientation();
	const [gestes] = useState(() => new GestureTracker());
	// La jauge n'apparaît qu'après la durée d'un tap : un toucher de la routine ne la montre jamais.
	const appui = useAppuiLong({ dureeMs: GESTURE.holdMs, delaiJaugeMs: GESTURE.tapMaxMs, jaugeVisible });
	const dernier = useRef(surGeste);
	dernier.current = surGeste;

	// App en arrière-plan : le geste commencé est oublié.
	useQuandLAppSeCache(() => gestes.reset());

	const scene = {
		onPointerDown: (event: TargetedPointerEvent<HTMLElement>): void => {
			if (event.pointerType === 'mouse' && event.button !== 0) return;
			const { x, y } = appPoint(event.clientX, event.clientY);
			if (!gestes.press(event.pointerId, x, y, performance.now())) {
				appui.arreter();
				return;
			}
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
		},
		onPointerUp: (event: TargetedPointerEvent<HTMLElement>): void => {
			appui.arreter();
			const point = appPoint(event.clientX, event.clientY);
			const geste = gestes.release(event.pointerId, point.x, point.y, performance.now());
			if (geste !== 'none') dernier.current(geste, point);
		},
		onPointerCancel: (event: TargetedPointerEvent<HTMLElement>): void => {
			appui.arreter();
			gestes.cancel(event.pointerId);
		},
		// Pas de menu contextuel ni de loupe sur appui long.
		onContextMenu: (event: TargetedMouseEvent<HTMLElement>): void => event.preventDefault(),
	};

	return { scene, jauge: appui.jauge };
}
