/*
 * L'apparence de l'app (apparence.ts), choisie dans les réglages généraux : posée sur <html>
 * (data-theme, color-scheme) avant l'affichage, avec la couleur de la barre du téléphone. En
 * automatique, elle suit le téléphone, même quand il change de lui-même (le soir, par exemple).
 */

import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'preact/hooks';
import { readStored, writeStored } from '../appareil/stockage.ts';
import { estDansUnTour } from '../tours/registre.ts';
import { COULEURS_DU_MENU, estApparence, resoudreTheme, type Apparence, type Theme } from './apparence.ts';

const CLE = 'mes-tours:apparence';
const SOMBRE = '(prefers-color-scheme: dark)';

/** Le téléphone est en mode sombre ; sans réponse (navigateur ancien, tests), sombre, l'allure d'origine du menu. */
const telephoneSombre = (): boolean => (typeof matchMedia === 'function' ? matchMedia(SOMBRE).matches || !matchMedia('(prefers-color-scheme: light)').matches : true);

/** La couleur de la barre du téléphone sur le menu, dans le thème affiché. */
export const couleurDuMenu = (): string => COULEURS_DU_MENU[document.documentElement.dataset.theme === 'clair' ? 'clair' : 'sombre'];

interface ContexteApparence {
	apparence: Apparence;
	theme: Theme;
	setApparence: (apparence: Apparence) => void;
}

const Contexte = createContext<ContexteApparence | null>(null);

export function ApparenceProvider({ children }: { children: ComponentChildren }) {
	const [apparence, setApparenceEnCours] = useState<Apparence>(() => {
		const lue = readStored(CLE);
		return estApparence(lue) ? lue : 'auto';
	});
	const [sombre, setSombre] = useState(telephoneSombre);

	// Le téléphone change de mode : l'automatique suit.
	useEffect(() => {
		if (typeof matchMedia !== 'function') return undefined;
		const requete = matchMedia(SOMBRE);
		const suivre = (): void => setSombre(telephoneSombre());
		requete.addEventListener?.('change', suivre);
		return () => requete.removeEventListener?.('change', suivre);
	}, []);

	const theme = resoudreTheme(apparence, sombre);

	useLayoutEffect(() => {
		document.documentElement.dataset.theme = theme;
		document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme === 'clair' ? 'light' : 'dark');
		// Pendant un tour, la barre garde la couleur du tour (pages/PageTour.tsx).
		if (!estDansUnTour()) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COULEURS_DU_MENU[theme]);
	}, [theme]);

	const setApparence = useCallback((nouvelle: Apparence) => {
		writeStored(CLE, nouvelle);
		setApparenceEnCours(nouvelle);
	}, []);

	const valeur = useMemo(() => ({ apparence, theme, setApparence }), [apparence, theme, setApparence]);
	return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useApparence(): ContexteApparence {
	const contexte = useContext(Contexte);
	if (!contexte) throw new Error('useApparence() hors de <ApparenceProvider>');
	return contexte;
}
