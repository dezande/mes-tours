/*
 * LES RÉGLAGES GÉNÉRAUX (#/reglages-generaux), ouverts depuis le panneau des réglages du menu : ce
 * qui vaut pour toute l'app, une fenêtre par réglage.
 *
 *   la langue        FR / EN, pour le menu et tous les tours (langue/LangueContext.tsx) ;
 *   l'apparence      automatique (comme le téléphone), claire ou sombre (apparence/) ;
 *   l'ordre          des tuiles du menu : par date de publication ou alphabétique (logic/rangement.ts) ;
 *   les favoris      en tête du menu, touchés ici pour les ajouter ou les retirer ;
 *   la version       et le journal des versions (pages/Journal.tsx).
 *
 * La croix, Échap ou M ramènent à la page d'avant, comme le geste retour (useFermerPage). Comme le
 * menu, la page suit l'orientation de l'écran.
 */

import { useApparence } from '../apparence/ApparenceContext.tsx';
import type { Apparence } from '../apparence/apparence.ts';
import { useOrientationLibre } from '../appareil/Orientation.tsx';
import { BoutonTactile } from '../components/BoutonTactile.tsx';
import { PixelArt } from '../components/PixelArt.tsx';
import { ICONES } from '../content/pixels.ts';
import { TEXTES } from '../content/textes.ts';
import { TOURS } from '../content/tours.ts';
import { useFermerPage } from '../hooks/useFermerPage.ts';
import { usePreferencesMenu } from '../hooks/usePreferencesMenu.ts';
import { useLangue } from '../langue/LangueContext.tsx';
import { ADRESSE_DU_JOURNAL } from '../logic/adresses.ts';
import { LANGS } from '../logic/i18n.ts';
import { trier, type Tri } from '../logic/rangement.ts';
import { naviguer } from '../routeur.ts';
import { APP_VERSION, BUILD } from '../version.ts';

/** Le build et le commit, inscrits au build (outils/stamp-build.ts) ; en développement (npm run dev), rien d'inscrit. */
const DETAIL_DU_BUILD = BUILD.version.startsWith('__') ? 'développement' : `build ${BUILD.version} (${BUILD.commit})`;

const NOMS_DES_APPARENCES = { auto: TEXTES.apparenceAuto, clair: TEXTES.apparenceClair, sombre: TEXTES.apparenceSombre } as const satisfies Record<Apparence, unknown>;

const NOMS_DES_TRIS = { publication: TEXTES.triPublication, alphabetique: TEXTES.triAlphabetique } as const satisfies Record<Tri, unknown>;

export function ReglagesGeneraux({ depuisLApp }: { depuisLApp: boolean }) {
	const { langue, setLangue } = useLangue();
	const { apparence, setApparence } = useApparence();
	const { favoris, basculerFavori, tri, setTri } = usePreferencesMenu();
	const fermer = useFermerPage(depuisLApp);
	useOrientationLibre();

	return (
		<main id="page-reglages-generaux">
			<header>
				<h1>{TEXTES.reglagesGeneraux[langue]}</h1>
				<BoutonTactile id="reglages-generaux-fermer" aria-label={TEXTES.fermer[langue]} onAction={fermer}>×</BoutonTactile>
			</header>

			<section className="reglage" aria-labelledby="titre-langue">
				<h2 id="titre-langue">{TEXTES.langue[langue]}</h2>
				<div id="langues" className="choix" role="radiogroup" aria-labelledby="titre-langue">
					{LANGS.map((choix) => (
						<BoutonTactile key={choix} role="radio" data-langue={choix} aria-checked={choix === langue} onAction={() => setLangue(choix)}>
							{choix.toUpperCase()}
						</BoutonTactile>
					))}
				</div>
			</section>

			<section className="reglage" aria-labelledby="titre-apparence">
				<h2 id="titre-apparence">{TEXTES.apparence[langue]}</h2>
				<p className="aide">{TEXTES.apparenceAide[langue]}</p>
				<div id="apparence" className="choix" role="radiogroup" aria-labelledby="titre-apparence">
					{(Object.keys(NOMS_DES_APPARENCES) as Apparence[]).map((choix) => (
						<BoutonTactile key={choix} role="radio" data-apparence={choix} aria-checked={choix === apparence} onAction={() => setApparence(choix)}>
							{NOMS_DES_APPARENCES[choix][langue]}
						</BoutonTactile>
					))}
				</div>
			</section>

			<section className="reglage" aria-labelledby="titre-ordre">
				<h2 id="titre-ordre">{TEXTES.ordre[langue]}</h2>
				<div id="tri" className="choix" role="radiogroup" aria-labelledby="titre-ordre">
					{(Object.keys(NOMS_DES_TRIS) as Tri[]).map((choix) => (
						<BoutonTactile key={choix} role="radio" data-tri={choix} aria-checked={choix === tri} onAction={() => setTri(choix)}>
							{NOMS_DES_TRIS[choix][langue]}
						</BoutonTactile>
					))}
				</div>
			</section>

			<section className="reglage" aria-labelledby="titre-favoris">
				<h2 id="titre-favoris">{TEXTES.favoris[langue]}</h2>
				<p className="aide">{TEXTES.favorisAide[langue]}</p>
				{/* Les tours dans l'ordre choisi : une étoile d'or pour chaque favori. */}
				<ul id="favoris">
					{trier(TOURS, tri, langue).map((tour) => (
						<li key={tour.dossier}>
							<BoutonTactile role="switch" data-dossier={tour.dossier} aria-checked={favoris.includes(tour.dossier)} onAction={() => basculerFavori(tour.dossier)}>
								<PixelArt grille={ICONES[tour.dossier]!} className="tour-icone" />
								<span className="tour-nom">{tour.nom[langue]}</span>
								<span className="etoile" aria-hidden="true">★</span>
							</BoutonTactile>
						</li>
					))}
				</ul>
			</section>

			<section className="reglage" aria-labelledby="titre-version">
				<h2 id="titre-version">{TEXTES.version[langue]}</h2>
				<p id="version">{`${TEXTES.version[langue]} ${APP_VERSION} — ${DETAIL_DU_BUILD}`}</p>
				{/* Ce que chaque version a changé (pages/Journal.tsx). */}
				<BoutonTactile id="journal-btn" onAction={() => naviguer(ADRESSE_DU_JOURNAL)}>{TEXTES.journal[langue]}</BoutonTactile>
			</section>
		</main>
	);
}
