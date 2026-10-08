/*
 * LE TEST DES ZONES, comme celui de la boule de cristal, ouvert depuis les réglages (aides à la
 * répétition) : chaque colonne touchable est dessinée sur la scène avec la valeur de sa carte (1,
 * 2, 4, 8), et la carte de la couleur avec ses quatre coins (♠ ♥ ♣ ♦). La zone touchée s'allume
 * (`eclair`), et la barre dit ce qu'elle vaut ; « Réglages » y revient, « Quitter » ramène au menu.
 * Les touchers n'y retournent aucune carte.
 *
 * Les zones sont celles des touchers (logic/table.ts : boitesDeLaRangee), mesurées par le tour
 * (`mesurer`) dans le repère de #app, et remesurées à chaque rotation ou changement de taille.
 *
 * Ids et classes : #zones-cinq, .zone-colonne, .zone-coin, .hit, .tag, #test-cinq, #test-etat,
 * #test-reglages, #test-quitter ; styles : styles/tours/cinq-cartes/_aides.scss.
 */

import { useLayoutEffect, useState } from 'preact/hooks';
import { useBoutonsTactiles } from '../../../hooks/useBoutonsTactiles.ts';
import type { Lang } from '../../../logic/i18n.ts';
import { ui } from '../content/interface.ts';
import { COULEURS, DERNIERE, poids, type Couleur } from '../logic/routine.ts';
import type { Boite } from '../logic/table.ts';

/** La zone touchée : une colonne (son rang du codage), ou un coin de la carte de la couleur. */
export type Zone = { readonly rang: number; readonly couleur?: Couleur };

/** La dernière zone touchée ; `n` change à chaque toucher, pour relancer le clignotement. */
export interface Eclair {
	zone: Zone;
	n: number;
}

const SYMBOLE: Readonly<Record<Couleur, string>> = { pique: '♠', coeur: '♥', trefle: '♣', carreau: '♦' };

interface Props {
	langue: Lang;
	/** Les colonnes et les cartes, dans l'ordre de la table, et le rang du codage de chaque place. */
	mesurer: () => { colonnes: Boite[]; cartes: Boite[]; rangs: number[] } | null;
	eclair: Eclair | null;
	surReglages: () => void;
	surQuitter: () => void;
}

/** Ce que vaut une zone, en clair : « Carte 3 : 4 », « Couleur : pique ». */
export function nomDeLaZone(zone: Zone, langue: Lang): string {
	// L'espace avant les deux-points est français.
	const deuxPoints = langue === 'fr' ? ' : ' : ': ';
	if (zone.couleur) return `${ui('zones.couleur', langue)}${deuxPoints}${ui(`couleur.${zone.couleur}`, langue)} ${SYMBOLE[zone.couleur]}`;
	return `${ui('zones.carte', langue)} ${zone.rang + 1}${deuxPoints}${poids(zone.rang)}`;
}

const px = (b: Boite) => ({ left: `${b.x}px`, top: `${b.y}px`, width: `${b.largeur}px`, height: `${b.hauteur}px` });

export function TestDesZones({ langue, mesurer, eclair, surReglages, surQuitter }: Props) {
	const barre = useBoutonsTactiles<HTMLDivElement>();
	const [boites, setBoites] = useState(mesurer);
	useLayoutEffect(() => {
		const remesurer = (): void => setBoites(mesurer());
		remesurer();
		// Rotation de l'écran, passage en paysage (appareil/Orientation.tsx relance un « resize ») : les
		// zones suivent les cartes.
		window.addEventListener('resize', remesurer);
		return () => window.removeEventListener('resize', remesurer);
	}, [mesurer]);

	const allumee = (zone: Zone): string => (eclair && eclair.zone.rang === zone.rang && eclair.zone.couleur === zone.couleur ? ' hit' : '');
	// Une nouvelle clé à chaque toucher relance l'animation, même sur des touchers rapprochés.
	const cle = (zone: Zone): string => `${zone.rang}-${zone.couleur ?? ''}-${allumee(zone) ? eclair!.n : 0}`;

	return (
		<>
			<div id="zones-cinq">
				{boites?.colonnes.map((colonne, place) => {
					const rang = boites.rangs[place]!;
					if (rang !== DERNIERE) {
						const zone = { rang };
						return (
							<div key={cle(zone)} className={`zone-colonne${allumee(zone)}`} style={{ left: `${colonne.x}px`, width: `${colonne.largeur}px` }}>
								<span className="tag">{poids(rang)}</span>
							</div>
						);
					}
					// La carte de la couleur : coupée en quatre par son milieu.
					const carte = boites.cartes[place]!;
					const demi = { largeur: carte.largeur / 2, hauteur: carte.hauteur / 2 };
					return (
						<div key={`couleur-${place}`} className="zone-colonne couleur" style={{ left: `${colonne.x}px`, width: `${colonne.largeur}px` }}>
							{COULEURS.map((couleur, i) => {
								const zone = { rang, couleur };
								const coin = { x: carte.x - colonne.x + (i % 2) * demi.largeur, y: carte.y + Math.floor(i / 2) * demi.hauteur, ...demi };
								return (
									<div key={cle(zone)} className={`zone-coin${allumee(zone)}`} data-couleur={couleur} style={px(coin)}>
										<span className="tag">{SYMBOLE[couleur]}</span>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>

			<div id="test-cinq" className="barre-aide" ref={barre}>
				<span id="test-etat" className="etat">{eclair ? nomDeLaZone(eclair.zone, langue) : ui('zones.invite', langue)}</span>
				<button type="button" id="test-reglages" onClick={surReglages}>{ui('aide.reglages', langue)}</button>
				<button type="button" id="test-quitter" onClick={surQuitter}>{ui('aide.quitter', langue)}</button>
			</div>
		</>
	);
}
