---
name: tests-cibles
description: Vérifier une modification de mes-tours en ne lançant que les tests qui concernent les fichiers touchés (npm run test:cibles), jamais la suite entière ni les tests dans Chrome, que la CI GitHub Actions joue sur la pull request. À utiliser après chaque modification de code, avant de commiter.
---

# Tests ciblés

Dans ce dépôt, Claude ne lance que les tests qui concernent ce qu'il a touché. Le reste — la suite entière, le build, les tests dans Chrome (`npm run test:e2e`, quatre à cinq minutes) — est joué par la CI GitHub Actions sur la pull request (`.github/workflows/ci.yml`).

## Après une modification

1. Depuis la racine du dépôt :

   ```sh
   npm run test:cibles
   ```

   Le script (`outils/tests-cibles.ts`) relève les fichiers modifiés par rapport à `main` — commits de la branche, index, arbre de travail, nouveaux fichiers — et passe ceux de `src/`, `outils/` et `tests/` à Jest, qui ne lance que les tests qui en dépendent (`--findRelatedTests`). Il dit ce qu'il laisse à la CI (`tests/e2e/`) et ce qui n'a pas de tests ici (styles, images, journal, workflows).

2. Si du TypeScript a changé, les types aussi, c'est l'affaire de quelques secondes :

   ```sh
   npm run typecheck
   ```

3. Pour voir ce qui serait lancé sans rien lancer : `node outils/tests-cibles.ts --dry`. Pour comparer à une autre référence : `--base origin/main`.

## Ce que Claude ne fait pas

- `npm test` en entier, `npm run build`, `npm run test:e2e` : la CI s'en charge, en parallèle sur plusieurs machines, et la correction automatique de la PR ramène ici ce qui échoue.
- Exception : si la modification touche les tests dans Chrome eux-mêmes (`tests/e2e/`), les scripts du build (`outils/`) ou les workflows, le dire dans la PR plutôt que de les jouer ici.
