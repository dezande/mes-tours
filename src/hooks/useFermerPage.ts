/*
 * La sortie d'une page de l'app ouverte depuis le menu (le journal, les réglages généraux) : la
 * croix, Échap ou M ramènent à la page d'avant, comme le geste retour ; une page ouverte par son
 * adresse ramène au menu. Une seule sortie, même sur deux touchers rapides.
 */

import { useCallback, useEffect, useRef } from 'preact/hooks';
import { naviguer } from '../routeur.ts';

export function useFermerPage(depuisLApp: boolean): () => void {
	const parti = useRef(false);
	const fermer = useCallback(() => {
		if (parti.current) return;
		parti.current = true;
		if (depuisLApp) history.back();
		else naviguer('/', { remplacer: true });
	}, [depuisLApp]);

	useEffect(() => {
		const surTouche = (event: KeyboardEvent): void => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			if (event.key === 'Escape' || event.key === 'm' || event.key === 'M') {
				event.preventDefault();
				fermer();
			}
		};
		document.addEventListener('keydown', surTouche);
		return () => document.removeEventListener('keydown', surTouche);
	}, [fermer]);

	return fermer;
}
