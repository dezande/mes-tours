/*
 * L'ORIENTATION DE L'APP, en un seul endroit : <Orientation>, posé une fois dans App, pivote #app
 * et donne sa taille (--app-w, --app-h), que les styles appliquent (styles/_app.scss) ; les marges
 * de sécurité (--safe-*) suivent la rotation par ces mêmes styles. Calculs : logic/orientation.ts.
 *
 * - Verrou portrait, par défaut : l'app installée sur Android le demande au système (manifest.json :
 *   "orientation": "portrait") ; sur iPhone, une page web ne peut pas verrouiller l'orientation :
 *   quand le téléphone passe en paysage, #app pivote pour rester dans l'axe du téléphone.
 * - Orientation libre, demandée par le menu principal : useOrientationLibre(). Rien ne pivote, le
 *   menu suit l'écran et se range en largeur quand le téléphone est tenu en paysage. Sur Android,
 *   l'app installée lève le verrou portrait du système le temps du menu (screen.orientation.lock),
 *   et le reprend dès qu'un tour s'ouvre ; sur iPhone, l'écran tourne déjà de lui-même.
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
	/** Demande un mode : le verrou paysage, l'orientation libre, ou le verrou portrait. */
	demander: (mode: Mode) => void;
}

/** Ce que demande la page affichée : portrait par défaut. */
type Mode = 'portrait' | 'paysage' | 'libre';

/** Le verrou du système, sur Android (app installée en plein écran) ; ailleurs, refusé sans bruit. */
function verrouSysteme(libre: boolean): void {
	const orientation = screen.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined;
	try {
		if (libre) void orientation?.lock?.('any').catch(() => undefined);
		else orientation?.unlock?.();
	} catch {
		// Pas de verrou possible ici (navigateur, ordinateur) : l'app pivote elle-même.
	}
}

/** Hors de <Orientation> (un composant testé seul) : rien ne pivote. */
const Contexte = createContext<ContexteOrientation>({
	appPoint: (x, y) => ({ x, y }),
	demander: () => undefined,
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
	const mode = useRef<Mode>('portrait');
	const rotation = useRef<Rotation>(0);
	/** Rotation et taille déjà appliquées à #app : un « resize » n'est relancé que si elles changent. */
	const appliquee = useRef('');

	const valeur = useMemo(() => {
		const grossier = pointeurGrossier();

		/** Recalcule la rotation et l'applique à #app. */
		const appliquer = (): void => {
			const v = fenetre(grossier);
			rotation.current = mode.current === 'paysage' ? landscapeRotation(v.width, v.height)
				: mode.current === 'libre' ? 0
					: portraitRotation(v);
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
				demander: (demande: Mode) => {
					if (mode.current === demande) return;
					if ((mode.current === 'libre') !== (demande === 'libre')) verrouSysteme(demande === 'libre');
					mode.current = demande;
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
	const { demander } = useContext(Contexte);
	useLayoutEffect(() => {
		demander(actif ? 'paysage' : 'portrait');
	}, [actif, demander]);
	useLayoutEffect(() => () => demander('portrait'), [demander]);
}

/** Le menu suit l'orientation de l'écran ; le composant parti, l'app revient au verrou portrait. */
export function useOrientationLibre(): void {
	const { demander } = useContext(Contexte);
	useLayoutEffect(() => {
		demander('libre');
		return () => demander('portrait');
	}, [demander]);
}
