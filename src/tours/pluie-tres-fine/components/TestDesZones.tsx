/*
 * LE TEST DES ZONES, comme celui des cinq cartes, ouvert depuis les réglages (aides à la
 * répétition) : l'écran coupé en quatre par le milieu de la carte, chaque coin marqué de son
 * enseigne (♠ ♥ ♣ ♦). Le coin touché s'allume (`eclair`) et la barre dit sa famille ; « Réglages »
 * y revient, « Quitter » ramène au menu. Les touchers n'y retournent pas la carte.
 *
 * Les coins sont ceux des touchers (logic/routine.ts : coinsDeLEcran), mesurés par le tour
 * (`mesurer`) dans le repère de #app, et remesurés à chaque rotation ou changement de taille.
 *
 * Ids et classes : #zones-pluie, .zone-coin, .hit, .tag, #test-pluie, #test-etat, #test-reglages,
 * #test-quitter ; styles : styles/tours/pluie-tres-fine/_aides.scss.
 */

import { useLayoutEffect, useState } from 'preact/hooks';
import { useBoutonsTactiles } from '../../../hooks/useBoutonsTactiles.ts';
import type { Lang } from '../../../logic/i18n.ts';
import { nomDeLaDame, ui } from '../content/interface.ts';
import { COULEURS, coinsDeLEcran, type Boite, type Couleur } from '../logic/routine.ts';

/** Le dernier coin touché ; `n` change à chaque toucher, pour relancer le clignotement. */
export interface Eclair {
	couleur: Couleur;
	n: number;
}

export const SYMBOLE: Readonly<Record<Couleur, string>> = { pique: '♠', coeur: '♥', trefle: '♣', carreau: '♦' };

interface Props {
	langue: Lang;
	/** La carte, et la taille de l'écran, dans le repère de #app. */
	mesurer: () => { carte: Boite; largeur: number; hauteur: number } | null;
	eclair: Eclair | null;
	surReglages: () => void;
	surQuitter: () => void;
}

const px = (b: Boite) => ({ left: `${b.x}px`, top: `${b.y}px`, width: `${b.largeur}px`, height: `${b.hauteur}px` });

export function TestDesZones({ langue, mesurer, eclair, surReglages, surQuitter }: Props) {
	const barre = useBoutonsTactiles<HTMLDivElement>();
	const [mesure, setMesure] = useState(mesurer);
	useLayoutEffect(() => {
		const remesurer = (): void => setMesure(mesurer());
		remesurer();
		// Rotation de l'écran : les coins suivent la carte.
		window.addEventListener('resize', remesurer);
		return () => window.removeEventListener('resize', remesurer);
	}, [mesurer]);

	const coins = mesure ? coinsDeLEcran(mesure.carte, mesure.largeur, mesure.hauteur) : [];

	return (
		<>
			<div id="zones-pluie">
				{coins.map((coin, i) => {
					const couleur = COULEURS[i]!;
					const allume = eclair?.couleur === couleur;
					// Une nouvelle clé à chaque toucher relance l'animation, même sur des touchers rapprochés.
					return (
						<div key={`${couleur}-${allume ? eclair!.n : 0}`} className={`zone-coin${allume ? ' hit' : ''}`} data-couleur={couleur} style={px(coin)}>
							<span className="tag">{SYMBOLE[couleur]}</span>
						</div>
					);
				})}
			</div>

			<div id="test-pluie" className="barre-aide" ref={barre}>
				<span id="test-etat" className="etat">{eclair ? `${SYMBOLE[eclair.couleur]} ${nomDeLaDame(eclair.couleur, langue)}` : ui('zones.invite', langue)}</span>
				<button type="button" id="test-reglages" onClick={surReglages}>{ui('aide.reglages', langue)}</button>
				<button type="button" id="test-quitter" onClick={surQuitter}>{ui('aide.quitter', langue)}</button>
			</div>
		</>
	);
}
