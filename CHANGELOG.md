# Journal des versions

Toutes les versions de Mes tours, de la plus récente à la plus ancienne.

Les numéros suivent [semver](https://semver.org/lang/fr/) : `MAJEUR.MINEUR.CORRECTIF`. Chaque version correspond à un tag git et à une [Release GitHub](https://github.com/dezande/mes-tours/releases).

**Chaque changement s'écrit ici**, sous « Non publié », dans le même commit que le changement lui-même : la vérification du kit (`npm run check:changelog`) contrôle la forme du journal et refuse un changement qui ne s'explique pas, en pull request comme sur `main`. Publier une version, c'est renommer « Non publié » en numéro de version et poser le tag.

À ne pas confondre avec le **numéro de build** affiché en bas du menu : le nombre de commits, calculé au build. Le tableau ci-dessous donne la correspondance.

| Version | Commits | Date | En une phrase |
| --- | --- | --- | --- |
| [1.4.0] | 46 | 2026-10-08 | Les cinq cartes : le mode entraînement demande la carte à coder |
| [1.3.1] | 44 | 2026-10-08 | Un fond à chaque tour de cartes : guilloché, velours damassé, cuir |
| [1.3.0] | 42 | 2026-10-08 | Les cinq cartes, nouveau tour à l'allure de Balatro ; huit tuiles au menu |
| [1.2.0] | 40 | 2026-10-08 | Princesse, nouveau tour ; le kit repris dans l'app ; orientation et écran allumé en composants |
| [1.1.0] | 34 | 2026-10-07 | Morpion, nouveau tour ; la première prédiction gardée jusqu'au menu ; le menu aux fonds des tours |
| [1.0.1] | 30 | 2026-10-04 | Analyseur Q : l'appui de 3 s ramène au menu, même le doigt sur une image |
| [1.0.0] | 27 | 2026-10-03 | L'app réécrite en composants (Preact), styles et images regroupés, tests avec Jest |
| [0.10.0] | 22 | 2026-10-03 | La carte de visite, nouveau tour en largeur ; dans le navigateur, le menu dit que c'est une app |
| [0.9.0] | 20 | 2026-10-03 | À la fin de la routine, on reste dans le tour ; l'appui de 3 s ramène au menu |
| [0.8.2] | 19 | 2026-10-03 | Le dessin des dos, la même marge en haut et en bas |
| [0.8.1] | 18 | 2026-10-03 | Les dos de cartes symétriques, de haut en bas et de gauche à droite |
| [0.8.0] | 17 | 2026-10-03 | L'app allégée : code regroupé, icônes nettes, fiche d'installation |
| [0.7.0] | 16 | 2026-10-03 | Chaque tour dans sa propre page : plus de toucher perdu, rien sous la caméra |
| [0.6.5] | 15 | 2026-10-03 | Dans les réglages des tours, un appui long agit aussi |
| [0.6.4] | 14 | 2026-10-03 | De retour d'un tour, les tuiles répondent, appui bref ou long |
| [0.6.3] | 13 | 2026-10-03 | Un appui long sur un bouton du menu agit aussi |
| [0.6.2] | 12 | 2026-10-03 | De retour au menu, les tuiles répondent tout de suite |
| [0.6.1] | 11 | 2026-10-03 | Le « 5 » et le « î » redessinés dans la police du menu |
| [0.6.0] | 10 | 2026-10-03 | Le menu principal façon console 16 bits, icônes redessinées |
| [0.5.0] | 9 | 2026-10-03 | Les réglages des tours : une même structure, le nom du tour, une croix pour fermer |
| [0.4.0] | 8 | 2026-10-03 | Un bouton FR / EN dans le menu, pour le menu et tous les tours |
| [0.3.0] | 7 | 2026-10-03 | Le menu principal en pixel art, façon console 8 bits |
| [0.2.0] | 6 | 2026-10-03 | Tous les tours dans une seule application, un écrou ⚙ par tour, à sa nouvelle adresse |
| [0.1.0] | 2 | 2026-10-02 | Première version : le menu de tous les tours, installé une seule fois |

---

## [Non publié]

- **Les dos des cartes : chaque tour a le sien, seule la couleur se règle.** Plus de choix du dessin dans les réglages.
  - **Pile ou face : le dos est un papier marqué « Prédiction »** (« Prediction » en anglais), écrit à la main en travers de toute la largeur de la carte et souligné, sur le même papier crème que l'avant. Le réglage de couleur devient celui de l'encre — noir, bleu ou rouge —, pour le mot du dos comme pour la prédiction de l'avant ; le blanc disparaît.
  - **Princesse : le dos est la photo d'un vrai dos Rider de Bicycle** (`src/assets/images/princesse/dos.jpg`, empaquetée avec l'app et gardée hors-ligne), à la place du dos dessiné façon Bicycle. En bleu, la photo telle quelle ; en rouge ou en noir, elle est passée en niveaux de gris puis teinte de la couleur choisie. Le blanc disparaît.
  - **Les cinq cartes : toujours le dos « Arcade »**, fait pour le tour, dans sa couleur (rouge par défaut, bleu, noir ou blanc). Correction : la couleur choisie dans les réglages ne s'appliquait qu'aux vignettes, jamais aux cartes sur la table, qui restaient rouges ; elle est maintenant posée sur chaque dos (test ajouté).
  - **Les six prédictions : un dessin par carte, des couleurs tirées au sort.** Le paquet montre les six dessins (Art déco, Art nouveau, pixel art, minimaliste, pop art, futuriste), toujours dans le même ordre ; leurs couleurs sont tirées au sort à chaque ouverture et à chaque remise du paquet, deux cartes voisines n'ayant jamais la même. Les réglages n'ont plus de dos ni de couleur.
  - Le dos et la couleur enregistrés par une version précédente sont oubliés sans rien casser (la couleur est gardée quand elle existe encore). Tests des réglages des quatre tours et du tirage des couleurs.
- **README : la correction automatique (Auto-fix) est obligatoire sur toutes les pull requests**, activée dès la création de la PR et signalée par un commentaire ; la fusion reste manuelle.

## [1.4.0] — 2026-10-08

46 commits

- **Les cinq cartes, le mode entraînement demande la carte à coder** : une carte tirée au hasard parmi les 52 s'affiche dans la barre du haut (« À coder : Dame de cœur »), nouvelle à chaque ouverture, à chaque « Recommencer » et à chaque R au clavier. Le codage fini, la barre dit si c'est la bonne carte (en vert), ou laquelle a été codée (en rouge).

## [1.3.1] — 2026-10-08

44 commits

- **Un fond à chaque tour de cartes, au lieu du même tapis vert pour trois.** Pile ou face se joue sur un bleu nuit gravé comme une pièce de monnaie (deux rosaces d'anneaux fins qui se croisent en moiré, le guilloché des billets) ; Princesse, sur un velours pourpre de salle du trône, damassé de losanges dorés avec un fleuron dans chacun ; Les six prédictions, sur le sous-main de cuir bordeaux d'un bureau, marbré, cerné de deux filets dorés au fer. Les cinq cartes gardent leur tourbillon façon Balatro, et leur panneau de réglages passe du vert au bleu nuit. Les tuiles du menu prennent chacune le fond de leur tour. Tout reste immobile et assez sombre pour que les cartes s'en détachent. Le mixin `cartes.tapis` reçoit maintenant le fond du tour (`$fond`, dans son `_tokens.scss`).

## [1.3.0] — 2026-10-08

42 commits

- **Les cinq cartes, un nouveau tour**, joué en largeur sur le tapis : cinq cartes face cachée, côte à côte comme dans Princesse, chacune un peu de travers sans jamais toucher sa voisine. Chaque carte touchée se retourne dès le premier toucher. Le codage : les quatre premières cartes valent, depuis le bord réglé, 1, 2, 4 et 8 (toucher celles dont la somme fait la valeur, de l'As au Roi ; elles se retournent, blanches, et une carte touchée deux fois ne compte qu'une fois), puis toucher la cinquième dans un coin la retourne aussi et donne la couleur : en haut à gauche pique, en haut à droite cœur, en bas à gauche trèfle, en bas à droite carreau. Ensuite chaque toucher retourne la carte touchée : elles sont toutes blanches, sauf la dernière retournée, quelle qu'elle soit, qui est la carte du spectateur (dessinée en SVG : grands index en police pixel, V D R en français, J Q K en anglais ; le Valet, la Dame et le Roi ont leur personnage en pixels, tête-bêche, habillé de la couleur de l'enseigne). Une fois les cinq retournées, on ne peut plus que les retourner, dans un sens ou dans l'autre, chacune gardant sa face : aucun geste ne relance la routine (au clavier seulement, R remet les cinq dos), l'appui de 3 s ramène au menu. **L'allure du jeu vidéo Balatro**, sans aucune de ses images : un tourbillon de peinture qui tourne lentement derrière les cartes, les lignes d'un écran cathodique, des cartes qui flottent et rebondissent en se retournant, des enseignes vives, un nouveau dos « Arcade » en pixels (rouge par défaut), de gros boutons en police pixel ; immobile si le téléphone demande moins de mouvement. Le toucher se fait par colonne, sur toute la hauteur de l'écran, comme dans Princesse. Réglages : le bord d'où part le « 1 », à gauche (par défaut) ou à droite (tout le codage en miroir, la carte de la couleur au bord gauche, ses coins inchangés), dos et couleur des cartes, le rappel du codage, et deux aides à la répétition : le **mode entraînement** (la routine, avec « Recommencer » et « Retour aux réglages ») et le **test des zones**, comme pour la boule de cristal (les colonnes et leur valeur, les quatre coins de la carte de la couleur, la zone touchée qui s'allume ; « Réglages » et « Quitter »). Son icône en pixels ; les tuiles du menu resserrées (icônes de 56 px au lieu de 64) pour que huit tiennent. Tests de la routine, des touchers, des faces, des aides, des composants, et test dans Chrome de toute la routine en paysage.

## [1.2.0] — 2026-10-08

40 commits

- **Le kit commun n'est plus une dépendance** : le code de [kit-scene](https://github.com/dezande/kit-scene) (v1.3.1) est repris dans `src/kit/`, comme le reste de l'app, à la place du sous-module git. Plus de `git submodule update` après un clone, plus de second dépôt à pousser avant de déployer. Rien ne change pour l'artiste.
  - **Tous les tests avec Jest** : ceux du kit (vérification du build et du journal, numéro de version et cache, serveur local, rotation) passent de `node --test` à Jest, dans `tests/kit/`, et tournent avec `npm test`.
  - **Le kit allégé de ce qui ne servait qu'aux autres apps** : l'état du maintien de l'écran et ses textes (jamais affichés ici), l'état du stockage persistant, la liste des caches, les options inutilisées des mises à jour, les anciens préfixes de cache, le module `dom.ts`. Les réglages de l'app (nom, préfixe du cache, fichiers attendus dans `dist/`) quittent le champ `kit` de `package.json` pour une constante dans `src/kit/node/config.ts`.
  - **Deux fichiers de moins à charger** : le maintien de l'écran et les mises à jour rejoignent `app.js` ; seul le numéro de version garde son fichier (`kit/web/build.js`), que le déploiement relit sur le site.
- **Le dossier `src/kit/` réparti dans l'app**, là où chaque fichier a sa place : `src/appareil/` (orientation, écran allumé, stockage, mises à jour), le service worker dans `src/sw/`, les calculs d'orientation dans `src/logic/orientation.ts` (avec ceux du verrou paysage, autrefois dans `paysage.ts`), le numéro de build dans `src/version.ts` (publié en `dist/version.js`), les styles de `#app` dans `src/styles/`, les scripts du build et du déploiement dans `outils/` (leurs tests dans `tests/scripts/`).
  - La fonction `ui()` des textes, recopiée dans quatre tours, vient d'une seule fonction (`textesInterface`, `src/logic/i18n.ts`) ; `fail()` et `git()` des scripts, d'`outils/commun.ts`.
  - **Déploiement** : la vérification du site publié lisait le commit avec des guillemets simples, alors que le fichier minifié l'écrit entre accents graves : elle ne pouvait jamais aboutir. Elle accepte maintenant les trois formes (test ajouté).
- **L'écran allumé devient un composant Preact** (`<EcranAllume />`, posé une fois dans `App`) : la vidéo muette est rendue par Preact, et le verrou est redemandé à chaque toucher ou touche, n'importe où dans l'app, au lieu d'un appel dans chaque tour (cinq endroits). Un tour ne peut plus l'oublier, et le menu le réveille aussi. Tests du composant, et test dans Chrome : la vidéo joue au menu comme dans un tour, en un seul exemplaire.
- **L'orientation devient un composant Preact** (`<Orientation>`, posé une fois dans `App`) : le verrou portrait de toute l'app et le verrou paysage de la carte de visite, qui se disputaient `#app` par l'ordre de leurs écouteurs, n'en font plus qu'un. Un tour demande le paysage avec `useVerrouPaysage(actif)` et convertit ses touchers avec `useOrientation().appPoint` ; l'ancien `usePaysage` disparaît. Rien ne change pour l'artiste. Nouveau test dans Chrome : téléphone tourné, l'app pivote pour rester droite, une tuile touchée ouvre son tour, et le menu revient en portrait après la carte de visite.
- **Un bouton qu'on voit répond déjà** : les boutons du menu et des réglages branchaient leur toucher juste après l'affichage ; un toucher très rapide, à l'ouverture, pouvait tomber dans le vide. Ils le branchent maintenant avant l'affichage (le test du bandeau d'installation, qui touchait « EN » aussitôt, échouait parfois).
- **Princesse, un nouveau tour : la version de « The Princess Card Trick ».** Sur le tapis, téléphone tenu en largeur, cinq cartes à dos bleu façon Bicycle, côte à côte, un peu de travers comme posées à la main (sans jamais se toucher), faces en bas. Un toucher les retourne cinq secondes, dans un ordre tiré au sort (4♣, 8♥, 5♦, 10♦, valet de ♦) : le spectateur en pense une. Elles se remettent faces en bas et se mélangent sous ses yeux, éparpillées sur le tapis en largeur comme en hauteur, avant de reprendre leurs places. L'artiste touche une carte : elle disparaît. Chaque autre carte touchée se retourne, et se remet face en bas si on la touche encore ; la première retournée dit la carte pensée, qui ne sera jamais montrée, par sa place parmi les quatre restantes, comptées de gauche à droite ou de droite à gauche (au choix dans les réglages) — 1re le 4♣, 2e le 8♥, 3e le 5♦, 4e le 10♦ ; un double toucher sur n'importe quelle carte, à n'importe quel moment, le valet de ♦ (le valet n'est montré qu'en dernier, pour que le double toucher reste possible jusque-là ; une carte retournée garde toujours sa face). Après la disparition, aucun geste ne relance le tour sous les yeux du public : l'appui de 3 s ramène au menu. Au clavier : Espace pour montrer, 1 à 5 pour toucher une carte, V pour un double toucher (valet), R pour remettre les cartes. Les cartes sont dessinées en SVG (enseignes, index, valet). Dans les réglages : le sens dans lequel se comptent les cartes restantes ; le dos des cartes (façon Bicycle, ou l'un des six dos des autres tours de cartes) et sa couleur (bleu, rouge, noir, blanc), choisis en regardant ; le temps des cartes montrées (2 à 15 s). Sa tuile a son icône en pixels ; les tuiles du menu sont resserrées pour que les sept tiennent sur un écran de téléphone. Tests de la routine, du mélange, de la disposition (deux voisines ne se touchent jamais), des cartes et des réglages, et test dans Chrome de toute la routine, en paysage.

## [1.1.0] — 2026-10-07

34 commits

- **Morpion, un nouveau tour.** Sur un fond bleu ciel, un papier froissé, déplié, marqué « Prédiction » ; au dos, une grille de morpion remplie au stylo. Le même système que Pile ou face : toucher le haut ou le bas de l'écran retourne le papier sur l'une des deux grilles (après le délai réglé) : en haut, X barre la première ligne, une croix et un rond superposés dans le coin en haut à gauche ; en bas, X barre la troisième colonne, la croix et le rond superposés au bout de la deuxième ligne, le double toucher le remet sur « Prédiction », sur place, et l'appui de 3 s ramène au menu. Sa tuile a son icône en pixels ; les tuiles du menu sont un peu resserrées, pour que les six tiennent sur un écran de téléphone. Tests des grilles, du papier et des réglages, et test dans Chrome de toute la routine.
- **Pile ou face et Morpion : la première prédiction choisie est gardée jusqu'au retour au menu.** Le double toucher (ou R) cache toujours la carte ou le papier, et un toucher le retourne à nouveau, mais toujours sur la même prédiction, même en touchant l'autre moitié de l'écran. Le retour au menu (appui de 3 s, Échap ou M) la libère : le tour rouvre prêt pour un nouveau choix. Tests au clavier et dans Chrome.
- **Le menu : chaque tuile au fond de son tour, et son nom seul.** Le velours de la boule de cristal, le chêne de la carte de visite, le tapis vert des tours de cartes, le ciel du morpion, l'écran de l'analyseur ; l'écrou ⚙ prend le fond de sa tuile, et une tuile touchée s'éclaire. La ligne de description sous le nom disparaît (et de la liste des tours) ; le nom, plus grand, est cerné de sombre pour ressortir sur tous les fonds.

## [1.0.1] — 2026-10-04

30 commits

- **Analyseur Q : l'appui de 3 s ramène au menu, même le doigt posé sur une image.** Sur Android, Chrome faisait d'un toucher prolongé sur une image de slide (le logo, les cartes) un glisser ou son menu d'image, et annulait le geste avant les 3 s : on ne pouvait plus revenir au menu. Les images laissent maintenant passer le doigt à la slide. Test dans Chrome : l'appui de 3 s sur le logo, puis sur une autre slide, ramène au menu.
- `.claude/launch.json`, la configuration locale du serveur de développement de l'app Claude, sort du dépôt (il y était entré par erreur avec la 1.0.0, ouvert au réseau local par `--host`) et est ignoré par git. Rien ne change pour l'app publiée : ce fichier ne servait qu'à lancer `npm run dev`.

## [1.0.0] — 2026-10-03

27 commits

- **L'app est réécrite en composants, avec [Preact](https://preactjs.com/)** (l'API de React en 4 ko), construite par Vite, comme une app classique, avant d'y ajouter d'autres tours ; la carte de visite et le bandeau d'installation de la 0.10.0 compris. Pour l'artiste, rien ne change : les mêmes tours, les mêmes gestes, les mêmes réglages (gardés sur le téléphone).
  - Une seule page : le menu et chaque tour sont des pages (`#/`, `#/tours/<dossier>`), suivies par un routeur maison, un tour chargé à sa première ouverture. **Le code chargé à l'ouverture de l'app pèse 34 ko (13 ko compressé)** : avec React et React Router, il en pesait 276 (88 compressé). Le menu, le panneau de réglages, la jauge de l'appui long, les boutons qui agissent au lever du doigt et les dos de cartes sont des composants partagés.
  - **Tous les styles Sass sont réunis dans `src/styles/`**, un dossier par tour, rangés sous la classe du tour pour qu'ils ne se marchent pas dessus ; **les polices et les images dans `src/assets/`**.
  - La logique de chaque tour et ses tests sont repris tels quels ; le code qui ne servait qu'aux tours ouverts seuls (aide, version, choix de langue, état de l'écran) est retiré.
  - La Boule de cristal répond aussi au clavier : R efface le nombre, Échap ou M ramène au menu.
- **Les tests passent à Jest** : les tests unitaires, de nouveaux tests des composants (Preact Testing Library) et les tests dans Chrome.
- **Les doublons d'un tour à l'autre sont mis en commun**, et chaque brique est documentée pour les prochains tours (README, « Les briques communes ») :
  - la logique pure partagée dans `src/logic/` : langues, gestes à double toucher, gestes et découpage des tours à zones, verrou paysage, réglages des tours à zones, ajustement du texte — avec leurs tests, une seule fois chacun ;
  - des hooks pour ce que tous les tours refaisaient : l'appui de 3 s et sa jauge, le clavier, l'arrière-plan, l'ouverture sans transition, le réajustement du texte, les gestes à double toucher ;
  - les tours à zones (boule de cristal, carte de visite) reposent sur un seul composant, `TourAZones` : chacun ne garde que son décor et ses mots ;
  - le panneau de réglages porte lui-même les aides à la répétition et « Rétablir les réglages par défaut » ; le choix illustré des dos de cartes est commun aux deux tours à cartes ;
  - les styles des briques deviennent des mixins (`src/styles/components/`) : la feuille compilée est identique, règle pour règle ;
  - la vérification des types refuse désormais le code inutilisé.
- **Des adresses strictes.** Seule l'adresse exacte d'un tour publié l'ouvre (`#/tours/<dossier>`, avec `?reglages` pour ses réglages seuls) ; un nom inventé ou hérité de JavaScript (« constructor »), une majuscule, un « / » final ou un paramètre inconnu ramènent au menu. Le registre des tours et leur liste doivent nommer les mêmes tours : un tour en préparation n'est ni compilé ni publié.
- Test dans Chrome : la police du menu, qui arrive du cache hors-ligne de façon asynchrone, est attendue au lieu d'être vérifiée à l'instant (le test échouait parfois).
- Tests dans Chrome : le lancement de Chrome a jusqu'à 90 s, comme chaque test (le délai de 5 s de Jest ne suffisait pas sur les machines de la CI).

## [0.10.0] — 2026-10-03

22 commits

- **Les deux routines de la boule de cristal sont séparées.**
  - **Boule de cristal** : plus de choix de routine dans ses réglages, elle ne joue plus que les 3 boulettes (3 bandes : 6 en haut, 16 au milieu, 26 en bas), rappelées dans les réglages. Une routine Arcane Système enregistrée par une ancienne version est oubliée ; le délai, le fondu, la luminosité et la jauge sont gardés.
  - **Carte de visite**, un nouveau tour pour la routine Arcane Système, **joué téléphone tenu en largeur** (la scène et le test des zones pivotent en paysage, par un verrou propre au tour à la place du verrou portrait du kit ; les réglages restent en portrait) : sur une vieille table de trois planches de chêne dans la longueur (aboutements, clous, nœud, rayures), la carte de visite du **Théâtre Robert-Houdin**, le vrai théâtre de magie de Jean-Eugène Robert-Houdin, ouvert en 1845, repris par Georges Méliès en 1888, au 8, boulevard des Italiens, démoli en 1924 ; au recto, ses « Soirées fantastiques ». Les gestes de la boule : toucher un des 4 coins (17, 19, 21, 23 dans le sens de la lecture) ; après le délai, la carte se retourne et montre au dos le numéro seul, en grand, écrit à la plume ; le double toucher la remet sur son recto, prête pour un nouveau tour ; l'appui de 3 s ramène au menu. Réglages : délai, durée du retournement, luminosité, jauge et test des zones.
- Le menu a cinq tuiles ; l'icône en pixels de la carte de visite (la carte et une clef en laiton) est engendrée par `outils/icones-16-bits.py`. L'icône de l'app garde ses quatre icônes.
- Tests : réglages et verrou paysage de la carte de visite, et dans Chrome ses quatre coins jusqu'au retour au menu, et la boule sans choix de routine.
- **Ouverte dans le navigateur, l'app dit qu'elle est une app.** En bas du menu, un bandeau « Mes tours est une app » explique comment l'installer pour l'avoir en plein écran, même hors-ligne : Partager → *Sur l'écran d'accueil* sur iPhone, menu ⋮ → *Installer l'application* ailleurs. Quand Chrome propose lui-même l'installation, un bouton **Installer** l'ouvre directement. Installée, l'app n'affiche pas le bandeau.
- Test dans Chrome : le bandeau s'affiche dans le navigateur, en français comme en anglais, sous les tuiles, et disparaît une fois l'app installée.

## [0.9.0] — 2026-10-03

20 commits

- **À la fin de la routine, on reste dans le tour.** Le geste de fin remet le tour en place pour une nouvelle routine, comme dans les apps d'origine, au lieu de revenir au menu :
  - **Boule de cristal** : le double toucher efface le nombre, la boule se réarme ;
  - **Pile ou face** : le double toucher remet la carte face cachée ;
  - **Les six prédictions** : le double toucher sur la table vide remet le paquet, faces en bas ;
  - **Analyseur Q** : « suivante » sur la dernière slide ne fait plus rien.
  **Seul l'appui de 3 s ramène au menu** (ou Échap / M au clavier, et le geste retour d'Android). La touche R remet le tour en place. Les aides des réglages le disent.
- Tests dans Chrome : pour chaque tour, le geste de fin remet le tour en place sans quitter sa page, et l'appui de 3 s ramène au menu.

## [0.8.2] — 2026-10-03

19 commits

- **Le dessin des dos a enfin la même marge en haut et en bas.** La 0.8.1 avait rendu les dessins eux-mêmes symétriques, mais le défaut visible venait de leur pose sur la carte : le dessin prenait sa hauteur de sa largeur et du rapport 100 × 140 d'une carte, alors que la place laissée à l'intérieur de la marge de papier n'a pas tout à fait ce rapport. Il s'arrêtait donc avant le bas de la carte — 4 px de marge en haut, 7 px en bas sur une vignette des réglages ; sur le pixel art, une bande sombre apparaissait en bas. Le dessin remplit maintenant exactement la place à l'intérieur de la marge, la même sur les quatre côtés, dans les réglages comme sur les cartes en scène (Pile ou face, Les six prédictions).
- Test dans Chrome : sur chaque vignette et chaque carte en scène, le dessin a la même marge en haut, en bas et sur les côtés. Il échoue avec la version 0.8.1.

## [0.8.1] — 2026-10-03

18 commits

- **Les dos de cartes sont symétriques**, de haut en bas comme de gauche à droite, autour du centre de la carte : une carte retournée tête-bêche montre le même dos. Mesurés pixel par pixel, quatre des six dessins ne l'étaient pas :
  - **Art déco** : la bande de chevrons du bas était plus près du bord que celle du haut, et le soleil, ses anneaux et le losange étaient centrés trop bas ;
  - **Art nouveau** : la fleur était au-dessus du milieu, et les tiges ne montaient que du bas. La fleur est maintenant au centre, et les tiges montent du bas et descendent du haut, en bouquet symétrique ;
  - **Pop art** : l'étoile d'explosion avait des pointes inégales tirées au hasard, et la trame de points une marge plus grande en haut qu'en bas. Les pointes alternent maintenant longue et courte, et la trame part du centre de la carte ;
  - **Futuriste** : les arcs du cadran étaient coupés à des endroits différents ; ils sont maintenant face à face.
  Pixel art et minimaliste l'étaient déjà. Les deux tours qui ont des dos de cartes (Pile ou face, Les six prédictions) partagent les mêmes dessins.
- Test dans Chrome : chaque dos dessiné en grand est comparé à sa copie retournée, de haut en bas et de gauche à droite ; moins de 1 % du dessin peut ne pas se recouvrir. Il échoue avec les anciens dessins.

## [0.8.0] — 2026-10-03

17 commits

L'app allégée : moitié moins lourde, des pages qui s'ouvrent plus vite, une fiche d'installation complète.

- **Le code de chaque page regroupé et compressé** : le menu et chaque tour chargent un seul fichier JavaScript minifié, au lieu d'une vingtaine chargés l'un après l'autre. JavaScript 306 → 126 ko, styles 84 → 59 ko (compressés), code transmis 120 → 74 ko ; l'app entière en cache hors-ligne passe de 804 à environ 450 ko et de 109 à 36 fichiers. Fait au build par `outils/regrouper.ts` (esbuild, outil de build seulement).
- **Des icônes nettes et légères** : l'icône de 192 était réduite en lissant les pixels — floue, 6 455 couleurs, 31 ko. Les deux icônes sont maintenant agrandies un nombre entier de fois depuis le dessin, pixel pour pixel, en palette exacte : 2 ko et 3 ko, les 67 couleurs du dessin sans aucune perte (`outils/icones-png.py`).
- **Une fiche d'installation complète** : trois captures d'écran (le menu, Pile ou face, des réglages), une description et des catégories dans le manifeste ; Android les montre au moment d'installer.
- **CI plus sûre** : l'étape des tests dans Chrome est limitée à 6 minutes et le processus de test se termine de force une fois les tests finis — une CI bloquée 20 minutes ne se reproduira plus ; un nouveau push sur une pull request annule la vérification devenue inutile de la précédente.

## [0.7.0] — 2026-10-03

16 commits

- **Chaque tour s'ouvre maintenant dans sa propre page**, à la place du menu, au lieu d'un cadre posé par-dessus. C'est toujours une seule app installée, en plein écran et hors-ligne ; la fin de la routine, l'appui de 3 s, la croix des réglages et le geste retour d'Android ramènent au menu, qui réapparaît tel qu'on l'a laissé.
- **Corrige les tours qui ne répondaient plus quand on en recommençait un.** Le cadre était la vraie cause des problèmes de toucher : sur Android, le fermer privait ensuite le menu — puis le tour rouvert — des événements « pointer » du doigt, dont les tours se servent pour leurs gestes. Une page ouverte normalement les reçoit toujours.
- **Corrige le tour qui passait sous la caméra frontale** quand l'app se mettait en plein écran (la barre d'état disparaît, la page monte) : dans un cadre, les marges de sécurité de l'écran valaient 0. La page du tour reçoit les vraies marges.
- Les corrections des versions 0.6.x restent : boutons du menu et des réglages qui agissent au lever du doigt, appui bref ou long.
- Tests dans Chrome adaptés : chaque routine jouée en entier, de sa tuile au retour au menu, dans la page du tour ; les marges de l'écran reçues par chaque tour.

## [0.6.5] — 2026-10-03

15 commits

- **Dans les réglages des tours aussi, un appui long sur un bouton agit.** Comme dans le menu principal, un doigt posé longtemps sur un bouton n'envoyait pas de clic sur Android : un dos de carte, une case à cocher ou la croix s'enfonçaient sans agir. Un même module pour les quatre tours (`src/tours/boutons-tactiles.ts`) suit le doigt sur tout le panneau de réglages et donne au bouton touché son clic quand le doigt se relève — un seul, appui bref ou long. Le code de chaque tour n'a pas changé. Les curseurs (délai, fondu…) ne sont pas concernés, et un doigt qui fait défiler les réglages n'appuie sur rien.
- Test dans Chrome : sans clic après un appui long, comme sur Android, un dos de couleur, une case à cocher (basculée une seule fois, comme au toucher bref) et la croix agissent. Il échoue sans la correction.

## [0.6.4] — 2026-10-03

14 commits

- **De retour d'un tour, les tuiles répondent enfin, appui bref ou long.** Observé sur le téléphone (Nothing Phone, Chrome, débogage sans fil) : après la fermeture d'un tour, le menu ne reçoit plus, pendant un moment, les événements « pointer » du doigt — seulement les événements tactiles et le clic, et pas de clic après un appui long. La version 0.6.3 s'appuyait justement sur les événements « pointer » et ignorait le clic : la tuile s'enfonçait sans rien ouvrir. Les boutons du menu suivent maintenant le doigt par les événements tactiles, qui arrivent toujours, et agissent quand il se relève ; le clic reste un secours, pour un appui commencé sur le bouton. La souris, le clavier et la télécommande fonctionnent comme avant.
- Le doigt de l'appui de 3 s qui quitte un tour ne relance toujours rien en se relevant sur le menu : il ne s'est pas posé sur le bouton.
- Test dans Chrome : sans aucun événement « pointer » et sans clic après un appui long, comme sur le téléphone, un toucher bref et un appui long ouvrent la tuile. Il échoue avec la version 0.6.3.

## [0.6.3] — 2026-10-03

13 commits

- **Un appui long sur un bouton du menu agit aussi.** Sur Android, un doigt qui reste posé sur un bouton devient un « appui long », et le navigateur n'envoie pas le clic attendu : la tuile, l'écrou ⚙ ou le bouton FR / EN s'enfonçaient sans que rien ne se passe. C'était la vraie cause des boutons qui « ne répondaient pas tout de suite » au retour d'un tour : en scène, on appuie posément. Les boutons du menu agissent maintenant quand le doigt se relève, appui bref ou long, pourvu qu'il se soit posé sur le bouton et n'en ait pas glissé. Le clavier et la télécommande passent toujours par le clic.
- Du même coup, la garde contre le doigt de l'appui de 3 s devient naturelle : un doigt qui ne s'est pas posé sur le menu — celui qui vient de quitter un tour — ne déclenche rien en se relevant. L'ancienne garde, et le signal « doigt posé » du tour, disparaissent.
- Tests dans Chrome : un appui long d'une seconde et demie sur une tuile, un écrou et le bouton EN agit, avec les clics supprimés comme sur Android ; un doigt qui glisse hors du bouton ne déclenche rien.

## [0.6.2] — 2026-10-03

12 commits

- **De retour au menu, les tuiles répondent tout de suite.** Sur le téléphone, après un tour, une tuile touchée aussitôt ne réagissait pas. Deux causes, corrigées :
  - le retour au menu passait par l'historique (un « retour » d'Android), qui prend du temps sur le téléphone : le menu revient maintenant aussitôt, sans attendre l'historique. Le geste retour d'Android referme toujours un tour, et l'historique ne grandit plus d'un tour à l'autre ;
  - la garde contre le doigt de l'appui de 3 s (qui empêche ce doigt, en se relevant, de relancer la tuile placée dessous) s'armait à chaque retour, même sans doigt posé. Le tour dit maintenant si un doigt est encore sur l'écran : la garde ne s'arme que dans ce cas.
- Tests dans Chrome : une autre tuile touchée dès le retour s'ouvre au premier toucher, après la croix comme après la fin d'une routine ; l'historique ne grandit pas.

## [0.6.1] — 2026-10-03

11 commits

- **Le « 5 » ne ressemble plus à un « S »**, et **l'accent du « î » se voit** : dans la police Pixelify Sans, le 5 est dessiné presque comme un S (« AQ‑52 » se lisait « AQ‑S2 »), et le chevron de « î » n'est qu'un demi-pixel collé à la lettre (« apparaît » se lisait « apparait »). Les deux glyphes sont redessinés sur la grille de pixels de la police : un 5 classique, barre du haut droite et ventre en bas, et un chevron de trois pixels au-dessus de la lettre.
- La police retouchée s'appelle `pixelify-sans-mes-tours.woff2` ; elle est produite par `outils/pixelify-mes-tours.py` à partir de l'originale, rangée dans `outils/`. Pixelify Sans est sous licence SIL OFL 1.1, sans nom réservé : la retoucher est permis, et sa version le signale.

## [0.6.0] — 2026-10-03

10 commits

Le menu principal passe de la console 8 bits à la console 16 bits, dans l'esprit des menus de jeux de rôle. Les tours eux-mêmes ne changent pas.

- **Des fenêtres bleues en dégradé, bordées de blanc**, aux coins arrondis, avec une ombre portée ; touchée, la fenêtre s'illumine et s'enfonce.
- **La main des jeux de rôle** apparaît à gauche de la tuile touchée.
- **Des icônes redessinées, quatre fois plus fines** (32 × 32 au lieu de 16 × 16), avec lumière, ombres tramées et reflets : la boule de cristal violette, sa brume et son reflet sur un pied doré ; une vraie pièce de 20 centimes en relief, avec « 20 » et ses encoches ; l'éventail de dos rouges et la carte écrite ; le pique blanc de l'analyseur dans son orbite orange. Elles sont engendrées par `outils/icones-16-bits.py`.
- **L'écrou ⚙ en relief doré**, toujours symétrique, son trou au centre exact.
- **La police Pixelify Sans**, plus fine et plus lisible que celle des 8 bits, embarquée avec l'app (12 ko, licence SIL OFL 1.1) ; Press Start 2P est retirée. Le titre est en lettres d'or sur un contour sombre.
- **Un ciel de nuit** qui s'éclaircit vers le bas, semé d'étoiles.
- **L'icône de l'app** reprend les quatre nouvelles icônes, chacune dans une fenêtre bleue.
- **Plus de bloc « Écran : verrou actif » ni « Gestes et touches »** dans les réglages des tours : ils ne gardent que leurs réglages, les aides à la répétition et « Rétablir les réglages par défaut ». L'écran reste allumé pendant les tours comme avant ; les gestes sont décrits dans le README.

## [0.5.0] — 2026-10-03

9 commits

Les réglages des tours (ouverts par l'écrou ⚙) se ressemblent tous, et se ferment par une croix.

- **Une croix en haut à droite** remplace le bouton « Fermer », dans les réglages des quatre tours. Elle est annoncée « Fermer » (ou « Close ») aux lecteurs d'écran.
- **Une barre d'en-tête qui reste en haut** quand on fait défiler les réglages, sur le fond du tour : la croix y est toujours visible, et le contenu passe dessous, jamais par-dessus.
- **Le nom du tour sous « Réglages »**, à la place du numéro de version, pour savoir d'un coup d'œil ce que l'on règle. Il suit la langue du menu : « Settings » et « Heads or tails » en anglais.
- **La même structure pour les quatre tours**, chacun dans ses couleurs : l'en-tête, les réglages propres au tour, les aides à la répétition, l'état de l'écran, les gestes et touches, puis « Rétablir les réglages par défaut ». Le « Test des zones » de la boule de cristal rejoint les aides à la répétition, et son état de l'écran passe après elles, comme ailleurs.
- **Plus de bloc « version »** (version, commit, cache hors-ligne, stockage, affichage) dans les réglages des tours : la version de l'app reste en bas du menu principal.
- Un rechargement de l'app ne laisse plus d'entrée d'historique d'un tour fermé, qui coûtait un « retour » pour rien.
- Tests dans Chrome : la croix (en haut à droite, toujours visible en faisant défiler, un vrai toucher ramène au menu), la même structure dans les quatre réglages, le nom du tour et l'absence de version, en français et en anglais.

## [0.4.0] — 2026-10-03

8 commits

- **Un bouton FR / EN dans le menu principal**, sous le titre, en pixel art comme le reste. Il change aussitôt la langue du menu — noms et descriptions des tours, « Choisis un tour » / « Pick a trick », étiquettes des écrous — et elle est gardée d'une ouverture à l'autre. À la toute première ouverture, l'app suit la langue du téléphone.
- **La langue du menu vaut pour tous les tours.** Chaque tour s'ouvre dans la langue choisie : Pile ou face écrit « 0.20 euro / tails » en anglais, les six prédictions et l'analyseur passent en anglais avec leurs menus.
- **Plus de choix de langue dans les tours** : il disparaît des réglages de Pile ou face et des six prédictions, et les petits boutons FR / EN de la première slide de l'analyseur aussi. On ne choisit la langue qu'à un endroit.
- La boule de cristal n'a qu'une interface en français ; ce qu'elle montre au public, un nombre, ne dépend pas de la langue.
- Tests dans Chrome : le menu qui change de langue et s'en souvient, les tours qui suivent (en anglais puis de retour en français), et l'absence de tout autre choix de langue.

## [0.3.0] — 2026-10-03

7 commits

Le menu principal passe en pixel art, façon console 8 bits. Les tours eux-mêmes ne changent pas : ce que voit le public reste identique.

- **Une palette réduite** de console (« Sweetie 16 ») sur un ciel de nuit à étoiles carrées, avec de légères lignes de balayage.
- **Une police pixel, Press Start 2P**, embarquée avec l'app comme Caveat : 5 ko, lettres accentuées comprises, sous licence SIL OFL 1.1 ; elle fonctionne hors-ligne.
- **Des cadres aux coins crénelés** et des ombres sans flou ; un bouton touché s'enfonce d'un pixel et passe en bleu et or.
- **« Choisis un tour » clignote** sous le titre, comme l'écran titre d'un jeu (immobile si le téléphone demande de réduire les animations).
- **Les icônes des tours redessinées en pixels** : la boule sur son pied doré, la carte et sa pièce de 20 centimes, l'éventail de cartes, le pique de l'analyseur dans son orbite. Chacune est une grille de 16 × 16 dans `src/content/pixels.ts` ; les copies PNG des icônes des tours disparaissent.
- **L'écrou ⚙ en pixels**, calculé et non dessiné à la main : symétrique dans tous les sens, son trou de 4 × 4 pixels au centre exact — les tests le vérifient.
- **L'icône de l'app** reprend les quatre icônes en pixels, chacune dans son cadre.

## [0.2.0] — 2026-10-03

6 commits

- **Tous les tours dans une seule application.** Mes tours ne se contente plus d'ouvrir les apps des tours : elle contient sa propre copie de chacun (Boule de cristal, Pile ou face, Les six prédictions, Analyseur Q), dans `src/tours/` et `public/tours/`, et les affiche en plein écran dans un cadre qui isole leurs styles et leurs gestes. Les dépôts d'origine ne sont pas touchés : leurs adresses continuent de fonctionner seules.
- **Un écrou ⚙ sur chaque tuile** ouvre les réglages du tour, et seulement eux (dos des cartes, délai, routine, langue…) ; « Fermer » ramène au menu. Le menu du tour ne s'ouvre plus pendant la routine.
- **La fin de la routine ramène au menu** : le double toucher après la révélation (boule de cristal, pile ou face), le double toucher sur la table vide (six prédictions), « suivante » après la dernière slide (analyseur). La touche R d'une télécommande fait de même.
- **L'appui de 3 s pendant un tour est une sortie de secours** : retour au menu, sans finir la routine. Le doigt qui se relève sur le menu ne relance pas la tuile placée dessous. Le geste retour d'Android referme aussi le tour.
- Chaque ouverture d'un tour commence une nouvelle routine (l'analyseur reprend à la première slide). Les réglages de chaque tour sont gardés d'une ouverture à l'autre.
- Un seul service worker met toute l'application en cache, tours compris : tout fonctionne hors-ligne dès la première ouverture avec du réseau. Une nouvelle version ne s'affiche jamais en plein tour.
- Tests : les tests unitaires des quatre tours sont repris (178 en tout), et 12 tests dans Chrome jouent chaque routine en entier jusqu'au retour au menu, l'écrou ⚙, la sortie de secours, le geste retour et le hors-ligne.
- **L'écrou ⚙ redessiné** : sa roue dentée, tracée à la main, n'était pas symétrique, et le trou ne tombait pas au milieu. Ses huit dents sont maintenant calculées autour du même centre que le trou.
- **Le dépôt s'appelle désormais `mes-tours`, et l'app a une nouvelle adresse : https://dezande.github.io/mes-tours/.** Elle était à la racine du site pour couvrir les dossiers des autres tours ; maintenant qu'elle contient sa propre copie de chacun, elle n'en a plus besoin. Son identifiant devient `/mes-tours/`, son périmètre son propre dossier. La racine `https://dezande.github.io/` ne montre plus rien : l'app installée depuis l'ancienne adresse est à désinstaller, puis à réinstaller depuis la nouvelle. Les réglages des tours sont gardés (même site).

## [0.1.0] — 2026-10-02

2 commits

Première version : une seule app à installer pour tous les accessoires de scène.

- **Le menu principal de tous les tours** : Boule de cristal, Pile ou face, Les six prédictions et Analyseur Q, chacun avec son icône et une ligne de description. Toucher une tuile ouvre le tour.
- **Une seule app installée, à la racine de `dezande.github.io`.** Chrome sur Android ne gère bien qu'une app installée par site : quand un tour était installé, Chrome croyait les autres déjà installés et refusait de les installer (« Cette appli est déjà installée »), ou échouait à les ouvrir. Installée à la racine, Mes tours couvre tout le site : chaque tour s'ouvre dedans, en plein écran, sans barre de Chrome.
- Chaque tour reste une app à part, dans son propre dépôt ; le bouton « Mes tours » du menu de chaque tour ramène ici.
- PWA 100 % hors-ligne, toujours en portrait, avec le kit commun [kit-scene](https://github.com/dezande/kit-scene) v1.3.1 — la version dont le service worker ne renvoie sa page que pour l'adresse de l'app, et laisse se charger les dossiers des tours.
- Tests unitaires de la liste des tours, et tests dans Chrome : le menu, les liens, la navigation vers un tour, le service worker de la racine qui laisse passer les tours, le fonctionnement hors-ligne.

---

### Publier une nouvelle version

À chaque changement, décrivez-le sous **« Non publié »**, dans le commit qui le porte. Le déploiement est automatique : **chaque fusion sur `main` met l'app à jour**. Le tag et la Release sont un geste à part, quand le contenu de « Non publié » mérite d'être nommé.

```sh
git switch -c version-0.2.0
# dans CHANGELOG.md : renommer « ## [Non publié] » en « ## [0.2.0] — 2026-10-15 »,
# ajouter la ligne au tableau du haut (nombre de commits : git rev-list --count HEAD,
# le commit de version compris) et le lien « [0.2.0]: …/releases/tag/v0.2.0 » en bas
# du fichier, mettre src/version.ts au même numéro, puis :
git commit -am "Version 0.2.0"
git push -u origin version-0.2.0 && gh pr create --fill
gh pr merge --auto --rebase

git switch main && git pull
git tag -a v0.2.0 -m "Titre de la version" && git push origin v0.2.0
gh release create v0.2.0 --title "v0.2.0 — Titre" --notes-file notes.md
```



[1.4.0]: https://github.com/dezande/mes-tours/releases/tag/v1.4.0
[1.3.1]: https://github.com/dezande/mes-tours/releases/tag/v1.3.1
[1.3.0]: https://github.com/dezande/mes-tours/releases/tag/v1.3.0
[1.2.0]: https://github.com/dezande/mes-tours/releases/tag/v1.2.0
[1.1.0]: https://github.com/dezande/mes-tours/releases/tag/v1.1.0
[1.0.1]: https://github.com/dezande/mes-tours/releases/tag/v1.0.1
[1.0.0]: https://github.com/dezande/mes-tours/releases/tag/v1.0.0
[0.10.0]: https://github.com/dezande/mes-tours/releases/tag/v0.10.0
[0.9.0]: https://github.com/dezande/mes-tours/releases/tag/v0.9.0
[0.8.2]: https://github.com/dezande/mes-tours/releases/tag/v0.8.2
[0.8.1]: https://github.com/dezande/mes-tours/releases/tag/v0.8.1
[0.8.0]: https://github.com/dezande/mes-tours/releases/tag/v0.8.0
[0.7.0]: https://github.com/dezande/mes-tours/releases/tag/v0.7.0
[0.6.5]: https://github.com/dezande/mes-tours/releases/tag/v0.6.5
[0.6.4]: https://github.com/dezande/mes-tours/releases/tag/v0.6.4
[0.6.3]: https://github.com/dezande/mes-tours/releases/tag/v0.6.3
[0.6.2]: https://github.com/dezande/mes-tours/releases/tag/v0.6.2
[0.6.1]: https://github.com/dezande/mes-tours/releases/tag/v0.6.1
[0.6.0]: https://github.com/dezande/mes-tours/releases/tag/v0.6.0
[0.5.0]: https://github.com/dezande/mes-tours/releases/tag/v0.5.0
[0.4.0]: https://github.com/dezande/mes-tours/releases/tag/v0.4.0
[0.3.0]: https://github.com/dezande/mes-tours/releases/tag/v0.3.0
[0.2.0]: https://github.com/dezande/mes-tours/releases/tag/v0.2.0
[0.1.0]: https://github.com/dezande/mes-tours/releases/tag/v0.1.0
