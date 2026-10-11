/*
 * Les préférences du menu, enregistrées sur l'appareil : les tours favoris, et l'ordre des tuiles
 * (logic/rangement.ts). Choisies dans les réglages généraux, relues par le menu à chaque affichage.
 */

import { useCallback, useState } from 'preact/hooks';
import { readStored, writeStored } from '../appareil/stockage.ts';
import { TOURS } from '../content/tours.ts';
import { TRIS, type Tri } from '../logic/rangement.ts';

const CLE_FAVORIS = 'mes-tours:favoris';
const CLE_TRI = 'mes-tours:tri';

/** Les favoris enregistrés : seulement des tours de la liste, chacun une fois. */
function lireFavoris(): string[] {
	const lus = readStored(CLE_FAVORIS);
	if (!Array.isArray(lus)) return [];
	return TOURS.map((tour) => tour.dossier).filter((dossier) => lus.includes(dossier));
}

function lireTri(): Tri {
	const lu = readStored(CLE_TRI);
	return TRIS.find((tri) => tri === lu) ?? 'publication';
}

export function usePreferencesMenu() {
	const [favoris, setFavoris] = useState(lireFavoris);
	const [tri, setTriEnCours] = useState(lireTri);

	/** Ajoute le tour aux favoris, ou l'en retire. */
	const basculerFavori = useCallback((dossier: string) => {
		setFavoris((avant) => {
			const apres = avant.includes(dossier) ? avant.filter((d) => d !== dossier) : [...avant, dossier];
			writeStored(CLE_FAVORIS, apres);
			return apres;
		});
	}, []);

	const setTri = useCallback((nouveau: Tri) => {
		writeStored(CLE_TRI, nouveau);
		setTriEnCours(nouveau);
	}, []);

	return { favoris, basculerFavori, tri, setTri };
}
