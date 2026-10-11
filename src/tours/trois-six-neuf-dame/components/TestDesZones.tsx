/*
 * LE TEST DES ZONES, comme celui des cinq cartes, ouvert depuis les réglages (aides à la
 * répétition) : la colonne de chaque carte est dessinée sur la scène, coupée en quatre coins par le
 * milieu de la carte, jusqu'aux bords de l'écran, chaque coin avec la carte qu'il donne (A♠, D♥…).
 * La zone touchée s'allume (`eclair`), et la barre dit quelle carte elle donne ; « Réglages » y
 * revient, « Quitter » ramène au menu. Les touchers n'y retournent aucune carte.
 *
 * Les zones sont celles des touchers (cinq-cartes/logic/table.ts), mesurées par le tour (`mesurer`)
 * dans le repère de #app, et remesurées à chaque rotation ou changement de taille.
 *
 * Ids et classes : ceux des cinq cartes (#zones-cinq, .zone-colonne, .zone-coin, .hit, .tag,
 * #test-cinq, #test-etat, #test-reglages, #test-quitter), dont les styles sont repris.
 */

import { useLayoutEffect, useState } from 'preact/hooks';
import { useBoutonsTactiles } from '../../../hooks/useBoutonsTactiles.ts';
import type { Lang } from '../../../logic/i18n.ts';
import { index } from '../../cinq-cartes/logic/faces.ts';
import { coinsDeLaColonne, type Boite } from '../../cinq-cartes/logic/table.ts';
import { nomDeLaCarte, ui } from '../content/interface.ts';
import { carteDuToucher, COULEURS, type Couleur } from '../logic/routine.ts';

/** La zone touchée : le coin `couleur` de la colonne de la carte de rang `rang`. */
export interface Zone {
	readonly rang: number;
	readonly couleur: Couleur;
}

/** La dernière zone touchée ; `n` change à chaque toucher, pour relancer le clignotement. */
export interface Eclair {
	zone: Zone;
	n: number;
}

const SYMBOLE: Readonly<Record<Couleur, string>> = { pique: '♠', coeur: '♥', trefle: '♣', carreau: '♦' };

interface Props {
	langue: Lang;
	/** Les colonnes et les cartes, dans l'ordre de la table, le rang de chaque place, et la hauteur de l'écran. */
	mesurer: () => { colonnes: Boite[]; cartes: Boite[]; rangs: number[]; hauteur: number } | null;
	eclair: Eclair | null;
	surReglages: () => void;
	surQuitter: () => void;
}

const px = (b: Boite) => ({ left: `${b.x}px`, top: `${b.y}px`, width: `${b.largeur}px`, height: `${b.hauteur}px` });

export function TestDesZones({ langue, mesurer, eclair, surReglages, surQuitter }: Props) {
	const barre = useBoutonsTactiles<HTMLDivElement>();
	const [boites, setBoites] = useState(mesurer);
	useLayoutEffect(() => {
		const remesurer = (): void => setBoites(mesurer());
		remesurer();
		// Rotation de l'écran, passage en paysage : les zones suivent les cartes.
		window.addEventListener('resize', remesurer);
		return () => window.removeEventListener('resize', remesurer);
	}, [mesurer]);

	const allumee = (zone: Zone): boolean => !!eclair && eclair.zone.rang === zone.rang && eclair.zone.couleur === zone.couleur;
	// Une nouvelle clé à chaque toucher relance l'animation, même sur des touchers rapprochés.
	const cle = (zone: Zone): string => `${zone.rang}-${zone.couleur}-${allumee(zone) ? eclair!.n : 0}`;

	return (
		<>
			<div id="zones-cinq">
				{boites?.colonnes.map((colonne, place) => {
					const rang = boites.rangs[place]!;
					const coins = coinsDeLaColonne(colonne, boites.cartes[place]!, boites.hauteur);
					return (
						<div key={`colonne-${place}`} className="zone-colonne couleur" style={{ left: `${colonne.x}px`, width: `${colonne.largeur}px` }}>
							{COULEURS.map((couleur, i) => {
								const zone = { rang, couleur };
								const coin = { ...coins[i]!, x: coins[i]!.x - colonne.x };
								return (
									<div key={cle(zone)} className={`zone-coin${allumee(zone) ? ' hit' : ''}`} data-rang={rang} data-couleur={couleur} style={px(coin)}>
										<span className="tag">{index(carteDuToucher(rang, couleur).valeur, langue)}{SYMBOLE[couleur]}</span>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>

			<div id="test-cinq" className="barre-aide" ref={barre}>
				<span id="test-etat" className="etat">{eclair ? nomDeLaCarte(carteDuToucher(eclair.zone.rang, eclair.zone.couleur), langue) : ui('zones.invite', langue)}</span>
				<button type="button" id="test-reglages" onClick={surReglages}>{ui('aide.reglages', langue)}</button>
				<button type="button" id="test-quitter" onClick={surQuitter}>{ui('aide.quitter', langue)}</button>
			</div>
		</>
	);
}
