/*
 * Le menu principal, en pixel art façon console 16 bits : une tuile carrée par tour
 * (content/tours.ts), au fond de son tour, avec son icône en pixels (content/pixels.ts) et son nom,
 * et la main des jeux de rôle qui montre la tuile touchée. Deux panneaux, chacun à son adresse :
 *
 *   les tours (#/)              toucher une tuile lance le tour ;
 *   les réglages (#/reglages)   une ligne pour les réglages généraux (pages/ReglagesGeneraux.tsx),
 *                               puis les mêmes tuiles, qui ouvrent chacune les réglages de son tour.
 *
 * Les tuiles : les favoris d'abord, puis les autres tours, dans l'ordre choisi dans les réglages
 * généraux (logic/rangement.ts).
 *
 * Le menu suit l'orientation de l'écran (useOrientationLibre) : en paysage, les tuiles se rangent
 * en largeur. Les tours, eux, gardent leur verrou.
 *
 * L'écrou ⚙ en haut à droite passe d'un panneau à l'autre ; Échap, M ou le geste retour referment
 * les réglages. Les boutons agissent au lever du doigt, appui bref ou long (BoutonTactile).
 */

import { useCallback, useEffect, useRef } from 'preact/hooks';
import { useOrientationLibre } from '../appareil/Orientation.tsx';
import { BoutonTactile } from '../components/BoutonTactile.tsx';
import { PixelArt } from '../components/PixelArt.tsx';
import { ECROU, ICONES, MAIN } from '../content/pixels.ts';
import { TEXTES } from '../content/textes.ts';
import { TOURS, type Tour } from '../content/tours.ts';
import { usePreferencesMenu } from '../hooks/usePreferencesMenu.ts';
import { useLangue } from '../langue/LangueContext.tsx';
import { ADRESSE_DES_REGLAGES, ADRESSE_DES_REGLAGES_GENERAUX, adresseDuTour } from '../logic/adresses.ts';
import type { Lang } from '../logic/i18n.ts';
import { ranger } from '../logic/rangement.ts';
import { naviguer } from '../routeur.ts';

interface Props {
	/** Le panneau affiché : les tours à lancer, ou les réglages. */
	panneau: 'tours' | 'reglages';
	/** La page a été ouverte par l'app : fermer les réglages revient en arrière dans l'historique. */
	depuisLApp: boolean;
}

/** Une tuile : elle lance son tour, ou (panneau des réglages) ouvre ses réglages. */
function Tuile({ tour, langue, enReglages }: { tour: Tour; langue: Lang; enReglages: boolean }) {
	const nom = tour.nom[langue];
	return (
		<div className="tour" data-dossier={tour.dossier}>
			<BoutonTactile
				className={enReglages ? 'tour-reglages' : 'tour-lancer'}
				aria-label={enReglages ? `${TEXTES.reglagesDe[langue]}${nom}` : undefined}
				onAction={() => naviguer(adresseDuTour(tour.dossier, enReglages))}
			>
				{/* La main qui montre la tuile, le temps du toucher ; puis l'icône du tour. */}
				<PixelArt grille={MAIN} className="main" />
				<PixelArt grille={ICONES[tour.dossier]!} className="tour-icone" />
				<span className="tour-nom">{nom}</span>
				{/* Un petit écrou dans le coin : la tuile ouvre les réglages du tour. */}
				{enReglages && <PixelArt grille={ECROU} className="ecrou" />}
			</BoutonTactile>
		</div>
	);
}

export function Menu({ panneau, depuisLApp }: Props) {
	const { langue } = useLangue();
	const { favoris, tri } = usePreferencesMenu();
	const enReglages = panneau === 'reglages';
	useOrientationLibre();

	// Le même menu d'un panneau à l'autre (sans tout reconstruire, ni relâcher l'orientation libre).
	// Une seule sortie par panneau, même sur deux touchers rapides ; remis à zéro à chaque changement
	// de panneau, quel qu'en soit le chemin (écrou, geste retour).
	const parti = useRef(false);
	const panneauVu = useRef(panneau);
	if (panneauVu.current !== panneau) {
		panneauVu.current = panneau;
		parti.current = false;
	}
	const basculer = useCallback(() => {
		if (parti.current) return;
		parti.current = true;
		if (!enReglages) naviguer(ADRESSE_DES_REGLAGES);
		else if (depuisLApp) history.back();
		else naviguer('/', { remplacer: true });
	}, [enReglages, depuisLApp]);

	useEffect(() => {
		if (!enReglages) return undefined;
		const surTouche = (event: KeyboardEvent): void => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			if (event.key === 'Escape' || event.key === 'm' || event.key === 'M') {
				event.preventDefault();
				basculer();
			}
		};
		document.addEventListener('keydown', surTouche);
		return () => document.removeEventListener('keydown', surTouche);
	}, [enReglages, basculer]);

	const rangees = ranger(TOURS, favoris, tri, langue);
	const tuiles = (tours: readonly Tour[]) => tours.map((tour) => <Tuile key={tour.dossier} tour={tour} langue={langue} enReglages={enReglages} />);

	return (
		<main id="menu-principal" data-panneau={panneau}>
			<header id="menu-entete">
				<h1>Mes tours</h1>
				{/* L'écrou ⚙ : d'un panneau à l'autre ; en or quand les réglages sont ouverts. */}
				<BoutonTactile id="menu-bascule" aria-label={TEXTES.reglages[langue]} aria-pressed={enReglages} onAction={basculer}>
					<PixelArt grille={ECROU} className="ecrou" />
				</BoutonTactile>
			</header>

			{enReglages
				? <h2 className="invite">{TEXTES.reglages[langue]}</h2>
				// Clignote comme l'écran titre d'un jeu ; masqué pour les lecteurs d'écran.
				: <p className="invite" aria-hidden="true">{TEXTES.invite[langue]}</p>}

			{/* La ligne des réglages généraux : leur page. */}
			{enReglages && (
				<BoutonTactile id="reglages-generaux-btn" onAction={() => naviguer(ADRESSE_DES_REGLAGES_GENERAUX)}>
					<PixelArt grille={ECROU} className="ecrou" />
					<span className="libelle">
						<span className="titre">{TEXTES.reglagesGeneraux[langue]}</span>
						<span className="detail">{TEXTES.reglagesGenerauxDetail[langue]}</span>
					</span>
					<span className="fleche" aria-hidden="true">›</span>
				</BoutonTactile>
			)}

			<nav id="tours" aria-label={TEXTES.tours[langue]}>
				{rangees.favoris.length > 0
					? (
						<>
							<h3 className="rangee-titre"><span aria-hidden="true">★ </span>{TEXTES.favoris[langue]}</h3>
							<div className="grille" data-rangee="favoris">{tuiles(rangees.favoris)}</div>
							{rangees.autres.length > 0 && (
								<>
									<h3 className="rangee-titre">{TEXTES.autresTours[langue]}</h3>
									<div className="grille" data-rangee="autres">{tuiles(rangees.autres)}</div>
								</>
							)}
						</>
					)
					: <div className="grille" data-rangee="autres">{tuiles(rangees.autres)}</div>}
			</nav>
		</main>
	);
}
