/*
 * Le menu principal, en pixel art façon console 16 bits : une tuile en largeur par tour
 * (content/tours.ts), au fond de son tour, avec son icône en pixels (content/pixels.ts) et son nom,
 * et la main des jeux de rôle qui montre la tuile touchée. Deux panneaux, chacun à son adresse :
 *
 *   les tours (#/)              toucher une tuile lance le tour ;
 *   les réglages (#/reglages)   une ligne pour les réglages généraux (pages/ReglagesGeneraux.tsx),
 *                               puis les mêmes tuiles, qui ouvrent chacune les réglages de son tour.
 *
 * Les tuiles : les favoris d'abord (une étoile ★ dans leur coin), puis les autres tours, dans l'ordre
 * choisi dans les réglages généraux (logic/rangement.ts). Elles sont rangées dans LA MALLETTE de
 * l'icône de l'app, posée à plat et vue de dessus, ouverte comme une vraie valise : la caisse en
 * haut, la poignée et les fermoirs sur son bord, le couvercle rabattu à plat en dessous, sur sa
 * charnière ; chaque moitié range la moitié des tours sur son fond de velours, entre ses parois de
 * cuir et ses coins de laiton. La mallette entière tient à l'écran. À l'ouverture de l'app, elle est
 * fermée, le couvercle sur la caisse : les fermoirs sautent et le couvercle bascule (styles/menu/
 * _menu.scss). De retour d'un tour, elle est déjà ouverte, et les tuiles répondent tout de suite.
 *
 * Le menu suit l'orientation de l'écran (useOrientationLibre) : en paysage, les tuiles se rangent
 * en largeur. Les tours, eux, gardent leur verrou.
 *
 * L'écrou ⚙ en haut à droite passe d'un panneau à l'autre ; Échap, M ou le geste retour referment
 * les réglages. Les boutons agissent au lever du doigt, appui bref ou long (BoutonTactile).
 */

import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useOrientationLibre } from '../appareil/Orientation.tsx';
import { BoutonTactile } from '../components/BoutonTactile.tsx';
import { PixelArt } from '../components/PixelArt.tsx';
import { ECROU, ICONES, MAIN, VALISE_COIN, VALISE_ETINCELLE, VALISE_ETINCELLE_PETITE, VALISE_ETOILE, VALISE_FERMOIR, VALISE_POIGNEE } from '../content/pixels.ts';
import { TEXTES } from '../content/textes.ts';
import { TOURS, type Tour } from '../content/tours.ts';
import { usePreferencesMenu } from '../hooks/usePreferencesMenu.ts';
import { useLangue } from '../langue/LangueContext.tsx';
import { ADRESSE_DES_REGLAGES, ADRESSE_DES_REGLAGES_GENERAUX, adresseDuTour } from '../logic/adresses.ts';
import type { Lang } from '../logic/i18n.ts';
import { ranger } from '../logic/rangement.ts';
import { naviguer } from '../routeur.ts';

/** La mallette ne s'ouvre qu'une fois par lancement de l'app : de retour d'un tour, elle est déjà ouverte. */
let malletteOuverte = false;

/** Le temps de l'ouverture (styles/menu/_menu.scss) : les fermoirs, puis le couvercle qui bascule. */
const DUREE_OUVERTURE = 2200;

/** Les quatre coins de laiton d'une face de la mallette. */
const Coins = () => (
	<>
		{(['hg', 'hd', 'bg', 'bd'] as const).map((coin) => <PixelArt key={coin} grille={VALISE_COIN} className={`valise-coin valise-coin-${coin}`} />)}
	</>
);

interface Props {
	/** Le panneau affiché : les tours à lancer, ou les réglages. */
	panneau: 'tours' | 'reglages';
	/** La page a été ouverte par l'app : fermer les réglages revient en arrière dans l'historique. */
	depuisLApp: boolean;
}

/** Une tuile : elle lance son tour, ou (panneau des réglages) ouvre ses réglages. */
function Tuile({ tour, langue, enReglages, favori }: { tour: Tour; langue: Lang; enReglages: boolean; favori: boolean }) {
	const nom = tour.nom[langue];
	return (
		<div className="tour" data-dossier={tour.dossier} data-favori={favori ? '' : undefined}>
			<BoutonTactile
				className={enReglages ? 'tour-reglages' : 'tour-lancer'}
				aria-label={enReglages ? `${TEXTES.reglagesDe[langue]}${nom}` : undefined}
				onAction={() => naviguer(adresseDuTour(tour.dossier, enReglages))}
			>
				{/* La main qui montre la tuile, le temps du toucher ; puis l'icône du tour. */}
				<PixelArt grille={MAIN} className="main" />
				<PixelArt grille={ICONES[tour.dossier]!} className="tour-icone" />
				<span className="tour-nom">{nom}</span>
				{/* L'étoile d'or des favoris, dans le coin. */}
				{favori && <span className="favori" aria-hidden="true">★</span>}
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

	// La mallette : fermée au premier affichage du menu, elle s'ouvre (animation CSS, le temps de
	// l'ouverture, pendant lequel le couvercle ne reçoit pas les touchers) ; ensuite, ouverte.
	const [ouverture, setOuverture] = useState(() => !malletteOuverte);
	useEffect(() => {
		malletteOuverte = true;
		const fin = setTimeout(() => setOuverture(false), DUREE_OUVERTURE);
		return () => clearTimeout(fin);
	}, []);

	// Les favoris d'abord, puis les autres ; la caisse range la première moitié, le couvercle le reste.
	const rangees = ranger(TOURS, favoris, tri, langue);
	const tous = [...rangees.favoris, ...rangees.autres];
	const dansLaCaisse = Math.ceil(tous.length / 2);
	const tuiles = (tours: readonly Tour[]) => tours.map((tour) => (
		<Tuile key={tour.dossier} tour={tour} langue={langue} enReglages={enReglages} favori={rangees.favoris.includes(tour)} />
	));

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

			{/* La mallette, vue de dessus : la caisse (le cuir, ses coins, le velours où sont rangées les
			    premières tuiles ; la poignée et les fermoirs sur son bord), puis le couvercle, qui bascule sur
			    la charnière entre les deux : sa face de dehors (le cuir et l'étoile) et sa face de dedans
			    (le velours, les autres tuiles). Les étincelles de l'ouverture, autour. */}
			<nav id="tours" className="valise" data-ouverture={ouverture ? '' : undefined} aria-label={TEXTES.tours[langue]}>
				<div className="valise-caisse valise-moitie">
					<Coins />
					<div className="grille valise-fond" data-moitie="caisse">{tuiles(tous.slice(0, dansLaCaisse))}</div>
					<PixelArt grille={VALISE_FERMOIR} className="valise-fermoir valise-fermoir-g" />
					<PixelArt grille={VALISE_FERMOIR} className="valise-fermoir valise-fermoir-d" />
					<PixelArt grille={VALISE_POIGNEE} className="valise-poignee" />
				</div>
				<div className="valise-couvercle">
					<div className="valise-dehors" aria-hidden="true">
						<Coins />
						<PixelArt grille={VALISE_ETOILE} className="valise-etoile" />
					</div>
					<div className="valise-dedans valise-moitie">
						<Coins />
						<div className="grille valise-fond" data-moitie="couvercle">{tuiles(tous.slice(dansLaCaisse))}</div>
					</div>
				</div>
				{ouverture && (
					<>
						<PixelArt grille={VALISE_ETINCELLE} className="valise-etincelle valise-etincelle-1" />
						<PixelArt grille={VALISE_ETINCELLE_PETITE} className="valise-etincelle valise-etincelle-2" />
						<PixelArt grille={VALISE_ETINCELLE} className="valise-etincelle valise-etincelle-3" />
					</>
				)}
			</nav>
		</main>
	);
}
