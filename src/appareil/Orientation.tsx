/*
 * L'ORIENTATION DE L'APP, en un seul endroit : <Orientation>, posé une fois dans App, pivote #app
 * et donne sa taille (--app-w, --app-h), que les styles appliquent (styles/_app.scss) ; les marges
 * de sécurité (--safe-*) suivent la rotation par ces mêmes styles. Calculs : logic/orientation.ts.
 *
 * - Verrou portrait, par défaut : l'app installée sur Android le demande au système (manifest.json :
 *   "orientation": "portrait") ; sur iPhone, une page web ne peut pas verrouiller l'orientation :
 *   quand le téléphone passe en paysage, #app pivote pour rester dans l'axe du téléphone.
 * - Verrou paysage, demandé par un tour joué téléphone tenu en largeur (la carte de visite) le temps
 *   de sa scène et du test des zones : useVerrouPaysage(actif). Ses réglages, ouverts depuis le
 *   menu, téléphone tenu droit, restent en portrait.
 *
 * Chaque changement de rotation ou de taille relance un « resize » : ceux qui mesurent l'app
 * (useReajustement, le test des zones) se remettent à jour, même quand la fenêtre n'a pas changé
 * (passage en paysage, téléphone retourné d'un côté à l'autre), et même s'ils ont mesuré avant que
 * la rotation ne soit appliquée (les enfants s'installent avant <Orientation>).
 *
 * Les composants mesurent leurs zones avec la taille de leurs éléments (clientWidth…), jamais celle
 * de la fenêtre, et convertissent les touchers avec appPoint() (useOrientation()).
 */

import { createContext, type ComponentChildren } from 'preact';
import { useContext, useLayoutEffect, useMemo, useRef } from 'preact/hooks';
import { appSize, landscapeRotation, portraitRotation, toAppPoint, type Rotation, type Viewport } from '../logic/orientation.ts';

interface ContexteOrientation {
	/** Point de l'écran (clientX, clientY) dans le repère de #app, pivotée ou non. */
	appPoint: (clientX: number, clientY: number) => { x: number; y: number };
	/** Demande le verrou paysage (vrai) ou rend le verrou portrait (faux). */
	demanderPaysage: (paysage: boolean) => void;
}

/** Hors de <Orientation> (un composant testé seul) : rien ne pivote. */
const Contexte = createContext<ContexteOrientation>({
	appPoint: (x, y) => ({ x, y }),
	demanderPaysage: () => undefined,
});

/** Écran tactile (pointeur grossier) : sur ordinateur, le verrou portrait ne pivote jamais. */
const pointeurGrossier = (): MediaQueryList | null => (typeof matchMedia === 'function' ? matchMedia('(pointer: coarse)') : null);

function fenetre(grossier: MediaQueryList | null): Viewport {
	const ancienAngle = (window as { orientation?: number }).orientation;
	return {
		width: window.innerWidth,
		height: window.innerHeight,
		angle: screen.orientation?.angle ?? ancienAngle ?? 0,
		touch: grossier?.matches ?? false,
	};
}

export function Orientation({ children }: { children: ComponentChildren }) {
	const paysage = useRef(false);
	const rotation = useRef<Rotation>(0);
	/** Rotation et taille déjà appliquées à #app : un « resize » n'est relancé que si elles changent. */
	const appliquee = useRef('');

	const valeur = useMemo(() => {
		const grossier = pointeurGrossier();

		/** Recalcule la rotation et l'applique à #app. */
		const appliquer = (): void => {
			const v = fenetre(grossier);
			rotation.current = paysage.current ? landscapeRotation(v.width, v.height) : portraitRotation(v);
			const app = document.getElementById('app');
			if (!app) return;
			const taille = appSize(v, rotation.current);
			app.dataset.rotation = String(rotation.current);
			app.style.setProperty('--app-w', `${taille.width}px`);
			app.style.setProperty('--app-h', `${taille.height}px`);
			const signature = `${rotation.current} ${taille.width}×${taille.height}`;
			if (signature === appliquee.current) return;
			appliquee.current = signature;
			// Relancé pendant notre propre écouteur « resize » : la signature ne change plus, ça s'arrête là.
			window.dispatchEvent(new Event('resize'));
		};

		return {
			grossier,
			appliquer,
			contexte: {
				appPoint: (clientX: number, clientY: number) => toAppPoint(clientX, clientY, fenetre(grossier), rotation.current),
				demanderPaysage: (oui: boolean) => {
					if (paysage.current === oui) return;
					paysage.current = oui;
					appliquer();
				},
			} satisfies ContexteOrientation,
		};
	}, []);

	useLayoutEffect(() => {
		const { grossier, appliquer } = valeur;
		window.addEventListener('resize', appliquer);
		// Certains navigateurs changent l'angle sans redimensionner la fenêtre.
		screen.orientation?.addEventListener('change', appliquer);
		// Souris branchée ou débranchée : le verrou portrait s'active ou non.
		grossier?.addEventListener('change', appliquer);
		appliquer();
		return () => {
			window.removeEventListener('resize', appliquer);
			screen.orientation?.removeEventListener('change', appliquer);
			grossier?.removeEventListener('change', appliquer);
		};
	}, [valeur]);

	return <Contexte.Provider value={valeur.contexte}>{children}</Contexte.Provider>;
}

/** appPoint() : un toucher dans le repère de #app, pivotée ou non. */
export const useOrientation = (): Pick<ContexteOrientation, 'appPoint'> => useContext(Contexte);

/**
 * Met l'app en paysage tant que `actif` (la scène, le test des zones), en portrait sinon ; le
 * composant parti, l'app revient en portrait pour le menu.
 */
export function useVerrouPaysage(actif: boolean): void {
	const { demanderPaysage } = useContext(Contexte);
	useLayoutEffect(() => {
		demanderPaysage(actif);
	}, [actif, demanderPaysage]);
	useLayoutEffect(() => () => demanderPaysage(false), [demanderPaysage]);
}
