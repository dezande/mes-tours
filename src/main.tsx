/*
 * Mes tours : point d'entrée de l'app.
 *
 * Tous les accessoires de scène dans une seule app Preact (l'API de React, en 4 ko), publiée sur https://dezande.github.io/mes-tours/.
 * Le menu principal lance chaque tour en plein écran ; l'écrou ⚙ de sa tuile ouvre ses réglages ;
 * l'appui de 3 s pendant un tour ramène au menu.
 *
 * Organisation de src/ :
 *   main.tsx     ce fichier : démarrage, écran allumé, mises à jour automatiques
 *   App.tsx      les pages : le menu (#/) et chaque tour (#/tours/<dossier>)
 *   routeur.ts   le routeur maison : suit l'adresse, navigue dans l'historique
 *   pages/       le menu principal, et la page qui accueille un tour
 *   components/  composants partagés : boutons tactiles, panneau de réglages, jauge, dos de cartes…
 *   hooks/       hooks partagés (toucher au lever du doigt)
 *   langue/      la langue de l'app (FR / EN), pour le menu et tous les tours
 *   content/     LA LISTE DES TOURS (tours.ts), le texte du menu, les dessins en pixels
 *   tours/       les tours, un dossier chacun : index.tsx (le tour), components/, logic/ (logique
 *                pure, testée sous Node), content/ (textes) ; registre.ts les relie au menu
 *   styles/      TOUTES les feuilles de style Sass (main.scss), un dossier par tour
 *   assets/      polices, images et icône de l'app
 *   appareil/    ce qui touche au téléphone : orientation, écran allumé, stockage, mises à jour
 *   version.ts   numéro de version de l'app (semver), affiché en bas du menu
 *   sw/          le service worker (sw.ts), compilé à part en dist/sw.js
 */

// Rotation calculée avant tout le reste : l'app reste en portrait, et #app doit déjà exister.
import './appareil/orientation.ts';
import { render } from 'preact';
import { App } from './App.tsx';
import { requestPersistentStorage } from './appareil/stockage.ts';
import { setupUpdates } from './appareil/mises-a-jour.ts';
import { keepScreenAwake } from './appareil/ecran-allume.ts';
import { estDansUnTour } from './tours/registre.ts';
import './styles/main.scss';

void keepScreenAwake();
// Les réglages des tours et le cache hors-ligne ne doivent jamais être effacés par le navigateur.
void requestPersistentStorage();

// Une nouvelle version s'installe depuis le menu, jamais en pleine routine : pendant un tour, elle
// attend l'ouverture suivante. Le service worker n'existe qu'après le build : pas en développement.
if (import.meta.env.PROD) setupUpdates({ canReload: () => !estDansUnTour() });

render(<App />, document.getElementById('app')!);
