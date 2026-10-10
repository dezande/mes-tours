// Tests de bout en bout : l'app compilée (dist/) dans un vrai Chrome sans interface, sur un écran
// de téléphone, avec de vrais événements tactiles. Lancer : npm run build && npm run test:e2e
//
// Chaque tour est joué en entier, depuis sa tuile jusqu'au retour au menu principal. Le détail de
// chaque tour (gestes fins, réglages, rotation…) est testé dans son dépôt d'origine ; ici, on teste
// ce que l'app ajoute : le menu, l'écrou ⚙, la fin de routine, la sortie de secours, le retour
// d'Android et le hors-ligne de l'ensemble.
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { Browser, SCREEN, type Page, type Point } from '../../outils/chrome.ts';
import { startStaticServer, type StaticServer } from '../../outils/static-server.ts';
import { TOURS } from '../../src/content/tours.ts';
import { APP_VERSION } from '../../src/version.ts';

/** Chaque test joue une routine entière dans Chrome : jusqu'à 90 s. */
const TIMEOUT = 90_000;
const PRET = `document.querySelectorAll('#tours .tour').length === ${TOURS.length}`;
/** Le menu principal est à l'écran : aucun tour ouvert (#/tours/…). */
const AU_MENU = `!location.hash.startsWith('#/tours/') && document.querySelectorAll('#tours .tour').length === ${TOURS.length}`;
const HAUT: Point = { x: SCREEN.width / 2, y: SCREEN.height * .2 };
const CENTRE: Point = { x: SCREEN.width / 2, y: SCREEN.height / 2 };

let server: StaticServer;
let browser: Browser;

// Lancer et fermer Chrome prend plus que les 5 s de Jest par défaut sur les machines de la CI.
beforeAll(async () => {
	if (!existsSync('dist/index.html')) throw new Error('dist/ absent : lancez « npm run build » avant les tests dans Chrome.');
	server = await startStaticServer('dist', 0);
	browser = await Browser.launch();
}, TIMEOUT);

afterAll(async () => {
	await browser?.close();
	await server?.close();
}, TIMEOUT);

/** Ouvre l'app à `url`, attend le menu, lance `run` et vérifie qu'aucune erreur JavaScript n'a eu lieu. */
async function withApp(run: (page: Page) => Promise<void>, url = server.url): Promise<void> {
	const page = await browser.newPage();
	try {
		// Téléphone en français : c'est la langue de départ de l'app (src/langue.ts).
		const agent = await page.evaluate<string>('navigator.userAgent');
		await page.send('Emulation.setUserAgentOverride', { userAgent: agent, acceptLanguage: 'fr-FR,fr' });
		await page.goto(url);
		await page.evaluate(`localStorage.clear(); sessionStorage.clear()`);
		await page.reload();
		await page.waitFor(PRET, 'menu construit');
		await run(page);
		expect(page.errors, 'erreurs JavaScript dans la page').toStrictEqual([]);
	} finally {
		await page.close();
	}
}

/** Expression évaluée dans la page du tour ouvert ; null tant qu'on n'y est pas. */
const dansLeTour = (expression: string): string =>
	`(() => { if (!location.hash.startsWith('#/tours/') || document.readyState !== 'complete') return null; return (${expression}); })()`;

/**
 * Attend qu'une expression devienne vraie, même pendant qu'une page en remplace une autre : la page
 * est alors un instant introuvable, ce qui n'est pas une erreur.
 */
async function attendre(page: Page, expression: string, quoi: string, timeoutMs = 5000): Promise<void> {
	const limite = Date.now() + timeoutMs;
	while (Date.now() < limite) {
		try {
			if (await page.evaluate<boolean>(`Boolean(${expression})`)) return;
		} catch {
			// Page en cours de remplacement.
		}
		await sleep(50);
	}
	throw new Error(`Attente dépassée (${timeoutMs} ms) : ${quoi}`);
}

/** Touche la tuile du tour (ou son écrou ⚙), puis attend que la page du tour soit prête. */
async function ouvrir(page: Page, dossier: string, pret: string, reglages = false): Promise<void> {
	const bouton = `#tours .tour[data-dossier="${dossier}"] ${reglages ? '.tour-reglages' : '.tour-lancer'}`;
	// Le menu défile : avec les marges d'une caméra frontale, la dernière tuile peut être sous le bord.
	const centre = await page.evaluate<Point>(`(() => { const b = document.querySelector('${bouton}'); b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
	await page.tap(centre);
	await attendre(page, dansLeTour(pret), `${dossier} prêt`, 10_000);
	expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/${dossier}')`), `${dossier} : ce n’est pas sa page qui s’est ouverte`).toBeTruthy();
	// Le temps que l'écran du tour se pose (premières transitions, police).
	await sleep(400);
}

async function attendreLeMenu(page: Page, timeoutMs = 5000): Promise<void> {
	await attendre(page, AU_MENU, 'retour au menu principal', timeoutMs);
}

async function appuiLong(page: Page, point: Point = CENTRE): Promise<void> {
	await page.touchStart(point);
	await sleep(3400);
	await page.touchEnd();
}

async function pressKey(page: Page, key: string): Promise<void> {
	await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key });
	await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key });
}

/* ================= Le menu principal ================= */

test('le menu 16 bits montre les onze tours, chacun avec son icône et son écrou ⚙', async () => {
	await withApp(async (page) => {
		const tuiles = await page.evaluate<{ nom: string; icone: boolean; ecrou: string | null }[]>(`[...document.querySelectorAll('#tours .tour')].map((t) => ({
			nom: t.querySelector('.tour-nom').textContent,
			icone: t.querySelectorAll('svg.tour-icone rect').length > 10,
			ecrou: t.querySelector('.tour-reglages svg.ecrou rect') ? t.querySelector('.tour-reglages').getAttribute('aria-label') : null,
		}))`);
		expect(tuiles.map((t) => t.nom)).toStrictEqual(TOURS.map((t) => t.nom.fr));
		expect(tuiles.every((t) => t.icone), 'une icône ne s’affiche pas').toBeTruthy();
		expect(tuiles.map((t) => t.ecrou)).toStrictEqual(TOURS.map((t) => `Réglages : ${t.nom.fr}`));
		expect(await page.evaluate<string>(`document.querySelector('#version').textContent`)).toMatch(new RegExp(APP_VERSION.replace(/\./g, '\\.')));
		// La police pixel, embarquée avec l'app, est bien chargée.
		await attendre(page, `document.fonts.check('16px "Pixelify Sans"')`, 'police pixel absente', 3000);
		// L'app a son propre identifiant, dans son dossier du site : pas celui de la racine.
		expect(await page.evaluate(`fetch('manifest.json').then((r) => r.json()).then((m) => [m.id, m.start_url, m.scope])`)).toStrictEqual(['/mes-tours/', './', './']);
		const bas = await page.evaluate<number>(`Math.round(document.querySelector('#tours').getBoundingClientRect().bottom)`);
		expect(bas <= SCREEN.height, `les tuiles descendent jusqu’à ${bas} px pour un écran de ${SCREEN.height}`).toBeTruthy();
	});
}, TIMEOUT);

test('l’écran reste allumé : la vidéo muette joue dès l’ouverture, au menu comme dans un tour', async () => {
	await withApp(async (page) => {
		const video = `(() => { const v = document.querySelector('video#keep-awake'); return v && v.muted && !v.paused ? 'joue' : null; })()`;
		await attendre(page, video, 'la vidéo muette ne joue pas au menu');
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#number'))`);
		await page.tap(HAUT);
		await attendre(page, video, 'la vidéo muette ne joue plus dans le tour');
		expect(await page.evaluate<number>(`document.querySelectorAll('video#keep-awake').length`), 'une seule vidéo, même après un changement de page').toBe(1);
	});
}, TIMEOUT);

test('ouverte dans le navigateur, le menu dit que c’est une app ; installée, il ne le dit plus', async () => {
	await withApp(async (page) => {
		const bandeau = `(() => { const b = document.querySelector('#installation'); const r = b.getBoundingClientRect(); return { visible: !b.hidden && r.height > 0, titre: b.querySelector('.installation-titre').textContent, haut: r.top, basDesTuiles: document.querySelector('#tours').getBoundingClientRect().bottom }; })()`;
		const ouvert = await page.evaluate<{ visible: boolean; titre: string; haut: number; basDesTuiles: number }>(bandeau);
		expect(ouvert.visible, 'bandeau absent dans le navigateur').toBe(true);
		expect(ouvert.titre).toBe('Mes tours est une app');
		expect(ouvert.haut >= ouvert.basDesTuiles, 'le bandeau recouvre les tuiles').toBeTruthy();

		// En anglais aussi.
		await page.evaluate(`document.querySelector('#langues [data-langue="en"]').click()`);
		expect((await page.evaluate<{ titre: string }>(bandeau)).titre).toBe('Mes tours is an app');

		// Installée, comme sur l'écran d'accueil d'un iPhone (Chrome ne sait pas simuler le
		// « display-mode: standalone » d'Android).
		await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(navigator, 'standalone', { value: true })` });
		await page.reload();
		await page.waitFor(PRET, 'menu construit');
		expect(await page.evaluate<boolean>(`document.querySelector('#installation').hidden`), 'bandeau affiché dans l’app installée').toBe(true);
	});
}, TIMEOUT);

/* ================= Chaque routine, jusqu'au retour au menu ================= */

test('Pile ou face : le double toucher cache la carte, qui se retourne ensuite toujours sur la même prédiction ; l’appui de 3 s ramène au menu, qui la libère', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'retournée en haut', 3000);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#table .carte').dataset.cote`))).toBe('pile');
		await sleep(800);
		await page.doubleTap(CENTRE);
		await attendre(page, dansLeTour(`!document.querySelector('#table .carte').classList.contains('retournee')`), 'carte face cachée', 3000);
		await sleep(800);
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/pile-ou-face')`), 'le double toucher a quitté le tour').toBe(true);
		// Touchée en bas, elle se retourne encore, mais sur la même prédiction : gardée jusqu'au menu.
		await page.tap({ x: CENTRE.x, y: SCREEN.height * .8 });
		await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'retournée à nouveau', 3000);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#table .carte').dataset.cote`))).toBe('pile');
		await sleep(800);
		await appuiLong(page);
		await attendreLeMenu(page);
		// Passé par le menu, le tour repart à zéro : le bas donne l'autre prédiction.
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap({ x: CENTRE.x, y: SCREEN.height * .8 });
		await attendre(page, dansLeTour(`document.querySelector('#table .carte').dataset.cote === 'face' && document.querySelector('#table .carte').classList.contains('retournee')`), 'l’autre prédiction', 3000);
	});
}, TIMEOUT);

test('Morpion : le double toucher remet le papier sur « Prédiction », qui se retourne ensuite toujours sur la même grille ; l’appui de 3 s ramène au menu, qui la libère', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'morpion', `Boolean(document.querySelector('#table .papier .recto .mot'))`);
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#table .papier').classList.contains('retourne')`), 'retournée en haut', 3000);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#table .papier').dataset.cote`))).toBe('haut');
		expect(await page.evaluate(dansLeTour(`document.querySelectorAll('#table .grille .signe-x, #table .grille .signe-o').length`))).toBe(10);
		await sleep(800);
		await page.doubleTap(CENTRE);
		await attendre(page, dansLeTour(`!document.querySelector('#table .papier').classList.contains('retourne')`), 'papier sur « Prédiction »', 3000);
		await sleep(800);
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/morpion')`), 'le double toucher a quitté le tour').toBe(true);
		// Touchée en bas, elle se retourne encore, mais sur la même prédiction : gardée jusqu'au menu.
		await page.tap({ x: CENTRE.x, y: SCREEN.height * .8 });
		await attendre(page, dansLeTour(`document.querySelector('#table .papier').classList.contains('retourne')`), 'retournée à nouveau', 3000);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#table .papier').dataset.cote`))).toBe('haut');
		await sleep(800);
		await appuiLong(page);
		await attendreLeMenu(page);
		// Passé par le menu, le tour repart à zéro : le bas donne l'autre prédiction.
		await ouvrir(page, 'morpion', `Boolean(document.querySelector('#table .papier .recto .mot'))`);
		await page.tap({ x: CENTRE.x, y: SCREEN.height * .8 });
		await attendre(page, dansLeTour(`document.querySelector('#table .papier').dataset.cote === 'bas' && document.querySelector('#table .papier').classList.contains('retourne')`), 'l’autre prédiction', 3000);
	});
}, TIMEOUT);

test('Princesse : en paysage, une carte disparaît ; la première retournée cache sa carte, ou le valet au double toucher ; les cartes se retournent dans les deux sens, et rien ne relance le tour', async () => {
	// Joué en paysage, la scène pivote d'un quart de tour : les cinq places, de gauche à droite,
	// vont du haut au bas de l'écran.
	const carte = (place: number): Point => ({ x: CENTRE.x, y: SCREEN.height * [.12, .31, .5, .69, .88][place]! });
	const visibles = `[...document.querySelectorAll('#jeu .carte.retournee:not(.disparue)')].map((c) => c.dataset.carte).sort().join()`;
	const retournee = (place: number): string => `document.querySelector('#jeu .carte[data-place="${place}"]').classList.contains('retournee')`;
	/** Montre les cartes, attend le mélange, fait disparaître une carte, retourne la première (double : deux touchers), puis les autres. */
	async function routine(page: Page, disparait: number, premiere: number, double: boolean): Promise<string> {
		await page.tap(CENTRE);
		await attendre(page, dansLeTour(`document.querySelectorAll('#jeu .carte.retournee').length === 5`), 'cartes montrées', 3000);
		await attendre(page, dansLeTour(`document.querySelector('#jeu').dataset.phase === 'pret'`), 'cartes mélangées', 12_000);
		await page.tap(carte(disparait));
		await attendre(page, dansLeTour(`document.querySelector('#jeu .carte.disparue')?.dataset.place === '${disparait}'`), `carte ${disparait + 1} disparue`, 3000);
		await sleep(800);
		if (double) await page.doubleTap(carte(premiere));
		else await page.tap(carte(premiere));
		await attendre(page, dansLeTour(retournee(premiere)), 'première carte retournée', 3000);
		for (const autre of [0, 1, 2, 3, 4].filter((p) => p !== disparait && p !== premiere)) {
			await sleep(800);
			await page.tap(carte(autre));
		}
		await attendre(page, dansLeTour(`document.querySelectorAll('#jeu .carte.retournee:not(.disparue)').length === 4`), 'quatre cartes retournées', 3000);
		return page.evaluate<string>(dansLeTour(visibles));
	}
	await withApp(async (page) => {
		await ouvrir(page, 'princesse', `document.querySelectorAll('#jeu .carte').length === 5`);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#app').dataset.rotation`))).toBe('90');
		// La troisième disparaît ; la première retournée est la deuxième des restantes : pas de 8 de cœur.
		expect(await routine(page, 2, 1, false)).toBe('0,2,3,4');
		// Touchée encore, une carte se remet face en bas, puis se retourne.
		await sleep(800);
		await page.tap(carte(0));
		await attendre(page, dansLeTour(`!${retournee(0)}`), 'carte remise face en bas', 3000);
		await sleep(800);
		await page.tap(carte(0));
		await attendre(page, dansLeTour(retournee(0)), 'carte retournée à nouveau', 3000);
		// Un double toucher ne relance pas le tour : la carte disparue le reste.
		await sleep(800);
		await page.doubleTap(CENTRE);
		await sleep(1500);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#jeu').dataset.phase === 'revele' && Boolean(document.querySelector('#jeu .carte.disparue'))`)), 'le tour a été relancé').toBe(true);
		// Seul l'appui de 3 s ramène au menu ; rouvert, le tour repart à zéro.
		await appuiLong(page);
		await attendreLeMenu(page);
		expect(await page.evaluate(`document.querySelector('#app').dataset.rotation ?? '0'`)).toBe('0');
		await ouvrir(page, 'princesse', `document.querySelectorAll('#jeu .carte').length === 5 && !document.querySelector('#jeu .carte.disparue')`);
		// Un double toucher sur la première retournée : c'est le valet de carreau qui n'est jamais montré.
		expect(await routine(page, 0, 3, true)).toBe('0,1,2,3');
	});
}, TIMEOUT);

test('Les six prédictions : le double toucher sur la table vide remet le paquet, on reste dans le tour', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		for (let i = 0; i < 12; i++) {
			await page.tap(CENTRE);
			await sleep(750);
		}
		await attendre(page, dansLeTour(`document.querySelector('#paquet').classList.contains('vide')`), 'paquet vide', 3000);
		await page.doubleTap(CENTRE);
		await attendre(page, dansLeTour(`!document.querySelector('#paquet').classList.contains('vide') && document.querySelectorAll('#paquet .carte.sortie').length === 0`), 'paquet remis', 3000);
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/six-predictions')`), 'le double toucher a quitté le tour').toBeTruthy();
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Les cinq cartes : chaque carte touchée se retourne dès le premier toucher, la dernière retournée est la Dame de cœur ; ensuite on ne peut que les retourner', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'cinq-cartes', `document.querySelectorAll('#rangee .carte').length === 5`);
		// Le tour se joue téléphone tenu en largeur : la scène est pivotée d'un quart de tour, son haut à
		// droite de l'écran.
		expect(await page.evaluate(dansLeTour(`document.querySelector('#app').dataset.rotation`)), 'les cartes ne sont pas en paysage').toBe('90');
		/*
		 * Le point de l'écran où se trouve, sur la carte `i`, le point à `gauche` et `haut` (en
		 * fractions de la carte, dans le repère de la scène) : un repère posé sur la carte, mesuré par
		 * le navigateur, suit la rotation de l'app.
		 */
		const point = (i: number, gauche = .5, haut = .5): Promise<Point> => page.evaluate<Point>(dansLeTour(`(() => {
			const repere = document.createElement('i');
			repere.style.cssText = 'position:absolute;width:0;height:0;left:${gauche * 100}%;top:${haut * 100}%';
			document.querySelectorAll('#rangee .carte')[${i}].appendChild(repere);
			const r = repere.getBoundingClientRect();
			repere.remove();
			return { x: r.x, y: r.y };
		})()`));
		const retournees = `[...document.querySelectorAll('#rangee .carte')].flatMap((c, i) => c.classList.contains('retournee') ? [i] : [])`;
		const toucher = async (p: Point): Promise<void> => {
			await page.tap(p);
			// Deux touchers rapprochés sur des cartes voisines ne sont pas un double toucher.
			await sleep(500);
		};
		// 4 + 8 = 12, la Dame : dès le premier toucher, la carte touchée se retourne, blanche.
		await toucher(await point(2));
		expect(await page.evaluate(dansLeTour(retournees)), 'le premier toucher n’a pas retourné la carte').toStrictEqual([2]);
		await toucher(await point(3));
		// La cinquième, touchée en haut à droite (cœur), se retourne aussi.
		await toucher(await point(4, .8, .2));
		expect(await page.evaluate(dansLeTour(retournees))).toStrictEqual([2, 3, 4]);
		await toucher(await point(0));
		expect(await page.evaluate(dansLeTour(`document.querySelectorAll('#rangee .retournee .face-carte').length`)), 'une carte retournée n’est pas blanche').toBe(0);
		await toucher(await point(1));
		await attendre(page, dansLeTour(`${retournees}.length === 5`), 'cinq cartes retournées', 3000);
		expect(await page.evaluate(dansLeTour(`(() => { const f = document.querySelectorAll('#rangee .carte')[1].querySelector('.face-carte'); return f && [f.dataset.valeur, f.dataset.couleur]; })()`))).toStrictEqual(['12', 'coeur']);
		await sleep(800);
		// La routine finie, on ne peut que les retourner : un double toucher retourne la carte puis la remet.
		await toucher(await point(1));
		await attendre(page, dansLeTour(`${retournees}.join() === '0,2,3,4'`), 'la Dame remise face cachée', 3000);
		await page.doubleTap(await point(0));
		await sleep(800);
		expect(await page.evaluate(dansLeTour(retournees)), 'le double toucher a relancé la routine').toStrictEqual([0, 2, 3, 4]);
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/cinq-cartes')`), 'le double toucher a quitté le tour').toBe(true);
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Les trois paquets : on balaie d’un panneau à l’autre (deux mélanges, puis 1, 2, 2, 2, 3) ; les paquets touchés ôtent la valeur pensée de la fin, la carte face en bas disparaît au toucher, et le tour est figé', async () => {
	/**
	 * Un balayage de vrai doigt, du milieu de l'écran vers la gauche de la scène (ou sa droite). La
	 * scène est pivotée d'un quart de tour, son haut à droite de l'écran : sa gauche est en haut.
	 */
	async function balayer(page: Page, versLaGauche = true): Promise<void> {
		const dy = versLaGauche ? -1 : 1;
		await page.touchStart(CENTRE);
		for (let pas = 1; pas <= 5; pas++) {
			await page.touchMove({ x: CENTRE.x - pas * 3, y: CENTRE.y + dy * pas * 40 });
			await sleep(30);
		}
		await page.touchEnd();
		await sleep(600);
	}
	const panneau = `document.querySelector('#panneaux').dataset.panneau`;
	await withApp(async (page) => {
		await ouvrir(page, 'trois-paquets', `document.querySelectorAll('.salade .carte[data-carte="D-pique"]').length === 2`);
		// En largeur, comme la Princesse : la scène est pivotée d'un quart de tour.
		expect(await page.evaluate(dansLeTour(`document.querySelector('#app').dataset.rotation`))).toBe('90');
		// Les deux mélanges, la salade, puis les paquets.
		for (const attendu of ['1', '2', '3']) {
			await balayer(page);
			expect(await page.evaluate(dansLeTour(panneau))).toBe(attendu);
		}
		// Rien de la salade ne déborde sur les paquets : partout sur l'écran, sous chaque point (le
		// panneau 2 couvre tout l'écran, ses voisins passeraient dessous), aucune carte d'un autre panneau.
		const intrus = await page.evaluate<string[]>(dansLeTour(`(() => {
			const vus = new Set();
			for (let x = 2; x < innerWidth; x += 12) for (let y = 2; y < innerHeight; y += 12) {
				for (const e of document.elementsFromPoint(x, y)) {
					const p = e.closest('.carte')?.closest('.panneau');
					if (p && !p.classList.contains('paquets')) vus.add(p.className);
				}
			}
			return [...vus];
		})()`));
		expect(intrus, 'des cartes d’un autre panneau débordent sur les paquets').toStrictEqual([]);
		// Le deuxième paquet : le 8, le 10 noir, la dame (2, 6, 7) ; touché seul, il dit le 8 de cœur.
		const milieu = await page.evaluate<Point>(dansLeTour(`(() => { const r = document.querySelectorAll('.panneau.paquets[data-copie="1"] .paquet')[1].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`));
		await page.tap(milieu);
		await sleep(500);
		// Les paquets encore, deux fois (1, 2, 2, 2, 3), puis la fin.
		for (const attendu of ['4', '5', '6']) {
			await balayer(page);
			expect(await page.evaluate(dansLeTour(panneau))).toBe(attendu);
		}
		const fin = await page.evaluate<string[]>(dansLeTour(`[...document.querySelectorAll('.fin .carte.retournee')].map((c) => c.dataset.carte)`));
		expect(fin.some((carte) => carte.startsWith('8-')), 'un 8 dans la fin').toBe(false);
		expect(fin.some((carte) => ['2-trefle', '4-trefle', '10-carreau', 'V-carreau', '10-pique', 'D-pique', '5-carreau'].includes(carte)), 'une carte à forcer dans la fin').toBe(false);
		await page.tap(CENTRE);
		await attendre(page, dansLeTour(`document.querySelector('#derniere').classList.contains('disparue')`), 'la carte face en bas n’a pas disparu', 3000);
		// La carte disparue, le tour est figé : aucun balayage ne fait plus rien, dans un sens ni dans l'autre.
		await balayer(page);
		await balayer(page, false);
		expect(await page.evaluate(dansLeTour(panneau)), 'un balayage a bougé le tour figé').toBe('6');
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/trois-paquets')`), 'le balayage a quitté le tour').toBe(true);
		// Seul l'appui de 3 s ramène au menu ; rouvert, le tour repart neuf, au premier mélange.
		await appuiLong(page);
		await attendreLeMenu(page);
		await ouvrir(page, 'trois-paquets', `document.querySelector('#panneaux').dataset.panneau === '0' && !document.querySelector('#derniere').classList.contains('disparue')`);
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Pluie très fine : le coin touché donne la famille de la Dame ; retournée, ni un toucher ni un double toucher ne la changent, seul le menu la libère', async () => {
	const carte = `document.querySelector('#table .carte')`;
	const famille = `document.querySelector('#table .face-dame')?.dataset.couleur`;
	await withApp(async (page) => {
		await ouvrir(page, 'pluie-tres-fine', `Boolean(document.querySelector('#table .carte .dos-ancien'))`);
		// En haut à droite de l'écran, loin de la carte : cœur.
		await page.tap({ x: SCREEN.width - 20, y: 30 });
		await attendre(page, dansLeTour(`${carte}.classList.contains('retournee')`), 'carte retournée', 3000);
		expect(await page.evaluate(dansLeTour(famille))).toBe('coeur');
		await sleep(800);
		// Un autre coin ne la change plus.
		await page.tap({ x: 20, y: SCREEN.height - 30 });
		await sleep(800);
		expect(await page.evaluate(dansLeTour(famille)), 'un toucher a changé la Dame').toBe('coeur');
		// Le double toucher non plus : la Dame reste révélée, on reste dans le tour.
		await page.doubleTap(CENTRE);
		await sleep(800);
		expect(await page.evaluate<boolean>(dansLeTour(`${carte}.classList.contains('retournee')`)), 'le double toucher a caché la Dame').toBe(true);
		expect(await page.evaluate(dansLeTour(famille)), 'le double toucher a changé la Dame').toBe('coeur');
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/pluie-tres-fine')`), 'le double toucher a quitté le tour').toBe(true);
		// Seul le menu la libère : rouvert, le tour repart face cachée, pour une nouvelle routine.
		await appuiLong(page);
		await attendreLeMenu(page);
		await ouvrir(page, 'pluie-tres-fine', `Boolean(document.querySelector('#table .carte .dos-ancien'))`);
		expect(await page.evaluate<boolean>(dansLeTour(`${carte}.classList.contains('retournee')`)), 'le tour rouvert est déjà retourné').toBe(false);
		await page.tap({ x: 20, y: SCREEN.height - 30 });
		await attendre(page, dansLeTour(`${carte}.classList.contains('retournee')`), 'carte retournée à nouveau', 3000);
		expect(await page.evaluate(dansLeTour(famille))).toBe('trefle');
		await sleep(800);
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Boule de cristal : le double toucher efface le nombre, la boule se réarme sur place', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#number'))`);
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nombre affiché', 8000);
		await sleep(500);
		await page.doubleTap(CENTRE);
		await attendre(page, dansLeTour(`!document.querySelector('#number').classList.contains('shown')`), 'nombre effacé', 3000);
		// Le fondu fini, on est toujours dans la boule, prête pour un nouveau tour.
		await sleep(2500);
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/boule-de-cristal')`), 'le double toucher a quitté la boule').toBeTruthy();
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nouveau nombre', 8000);
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Boule de cristal : plus de choix de routine, les 3 bandes donnent 6, 16 et 26', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#settings')) && !document.querySelector('#settings').hidden`, true);
		expect(await page.evaluate(dansLeTour(`document.querySelectorAll('#settings [data-routine], #routines').length`)), 'un choix de routine reste dans les réglages').toBe(0);
		expect(await page.evaluate(dansLeTour(`[...document.querySelectorAll('#routine-values b')].map((b) => b.textContent)`))).toStrictEqual(['6', '16', '26']);
		await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
		await attendreLeMenu(page);
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#number'))`);
		await page.tap({ x: SCREEN.width * .85, y: SCREEN.height * .85 });
		await attendre(page, dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nombre affiché', 8000);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#number-text').textContent`))).toBe('26');
	});
}, TIMEOUT);

test('Carte de visite : un coin la retourne sur son numéro, le double toucher la remet sur son recto, sur place', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'carte-de-visite', `Boolean(document.querySelector('#carte .verso #number')) && document.querySelectorAll('#table rect').length === 3`);
		// Le tour se joue téléphone tenu en largeur : sur l'écran en portrait, la scène est pivotée d'un
		// quart de tour, son haut à droite de l'écran. Le coin haut gauche de la scène est donc en haut à
		// droite de l'écran.
		expect(await page.evaluate(dansLeTour(`document.querySelector('#app').dataset.rotation`)), 'la carte n’est pas en paysage').toBe('90');
		const scene = await page.evaluate<{ w: number; h: number }>(dansLeTour(`({ w: document.querySelector('#stage').clientWidth, h: document.querySelector('#stage').clientHeight })`));
		expect(scene.w > scene.h, `scène de ${scene.w} × ${scene.h} : pas en paysage`).toBeTruthy();
		const coins: [Point, string][] = [
			[{ x: SCREEN.width * .85, y: SCREEN.height * .15 }, '17'],
			[{ x: SCREEN.width * .85, y: SCREEN.height * .85 }, '19'],
			[{ x: SCREEN.width * .15, y: SCREEN.height * .15 }, '21'],
			[{ x: SCREEN.width * .15, y: SCREEN.height * .85 }, '23'],
		];
		for (const [coin, numero] of coins) {
			await page.tap(coin);
			await attendre(page, dansLeTour(`document.querySelector('#carte').classList.contains('retournee')`), `carte retournée sur ${numero}`, 8000);
			expect(await page.evaluate(dansLeTour(`document.querySelector('#number-text').textContent`))).toBe(numero);
			await sleep(500);
			await page.doubleTap(CENTRE);
			await attendre(page, dansLeTour(`!document.querySelector('#carte').classList.contains('retournee')`), 'carte sur son recto', 3000);
			// Le retournement fini, on est toujours sur la carte, prête pour un nouveau tour.
			await sleep(2500);
			expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/carte-de-visite')`), 'le double toucher a quitté la carte').toBeTruthy();
		}
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Verrou portrait : téléphone tourné, l’app pivote pour rester droite ; la carte de visite quittée, le menu revient en portrait', async () => {
	await withApp(async (page) => {
		const etat = `(() => { const app = document.querySelector('#app'); return { rotation: app.dataset.rotation, largeur: app.style.getPropertyValue('--app-w'), hauteur: app.style.getPropertyValue('--app-h') }; })()`;
		expect(await page.evaluate(etat), 'menu au démarrage').toStrictEqual({ rotation: '0', largeur: `${SCREEN.width}px`, hauteur: `${SCREEN.height}px` });

		// Téléphone tourné vers la gauche : l'écran passe en paysage, l'app pivote de -90° et garde sa taille portrait.
		await page.send('Emulation.setDeviceMetricsOverride', { width: SCREEN.height, height: SCREEN.width, deviceScaleFactor: 3, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
		await attendre(page, `document.querySelector('#app').dataset.rotation === '-90'`, 'l’app n’a pas pivoté');
		expect(await page.evaluate(etat), 'menu, téléphone tourné').toStrictEqual({ rotation: '-90', largeur: `${SCREEN.width}px`, hauteur: `${SCREEN.height}px` });
		// Une tuile touchée à l'écran, là où elle s'affiche une fois pivotée, ouvre bien son tour.
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#number'))`);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#app').dataset.rotation`)), 'le tour ne reste pas droit').toBe('-90');
		await page.send('Emulation.setDeviceMetricsOverride', { ...SCREEN, deviceScaleFactor: 3, mobile: true, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
		await attendre(page, `document.querySelector('#app').dataset.rotation === '0'`, 'l’app n’est pas revenue droite');
		await appuiLong(page);
		await attendreLeMenu(page);

		// La carte de visite se joue en largeur ; quittée, le menu revient en portrait.
		await ouvrir(page, 'carte-de-visite', `Boolean(document.querySelector('#carte .verso #number'))`);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#app').dataset.rotation`)), 'la carte n’est pas en paysage').toBe('90');
		await appuiLong(page);
		await attendreLeMenu(page);
		expect(await page.evaluate(etat), 'menu après la carte de visite').toStrictEqual({ rotation: '0', largeur: `${SCREEN.width}px`, hauteur: `${SCREEN.height}px` });
	});
}, TIMEOUT);

test('Analyseur Q : « suivante » sur la dernière slide ne quitte pas le tour', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		await pressKey(page, 'End');
		const derniere = `String(document.querySelectorAll('.slide').length - 1)`;
		await attendre(page, dansLeTour(`document.querySelector('.slide.current')?.dataset.index === ${derniere}`), 'dernière slide', 3000);
		await sleep(600);
		await pressKey(page, 'ArrowRight');
		await sleep(800);
		expect(await page.evaluate(dansLeTour(`document.querySelector('.slide.current')?.dataset.index === ${derniere}`)), 'on n’est plus sur la dernière slide').toBe(true);
		// Échap (ou M) d'une télécommande quitte le tour, comme l'appui de 3 s.
		await pressKey(page, 'Escape');
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Analyseur Q : l’appui de 3 s ramène au menu, même le doigt posé sur une image', async () => {
	await withApp(async (page) => {
		// La première slide montre le logo : le doigt est posé en plein dessus.
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current .image')?.complete`);
		const image = await page.evaluate<Point>(dansLeTour(`(() => { const r = document.querySelector('.slide.current .image').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`));
		await appuiLong(page, image);
		await attendreLeMenu(page);
		// Et ailleurs sur une autre slide, après avoir avancé.
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		await pressKey(page, 'ArrowRight');
		await sleep(600);
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('rouvrir un tour commence une nouvelle routine', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		await pressKey(page, 'End');
		await sleep(600);
		await pressKey(page, 'Escape');
		await attendreLeMenu(page);
		await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		expect(await page.evaluate(dansLeTour(`document.querySelector('.slide.current').dataset.index`)), 'l’analyseur reprend à la première slide').toBe('0');
	});
}, TIMEOUT);

/* ================= Sortir d'un tour ================= */

test('appui de 3 s pendant un tour : sortie de secours, retour au menu', async () => {
	// Le doigt se relève au centre, sur la tuile des six prédictions : il ne doit pas la relancer
	// (src/scene.ts, la garde après la fermeture d'un tour).
	await withApp(async (page) => {
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		await page.tap(CENTRE);
		await sleep(750);
		await appuiLong(page);
		await attendreLeMenu(page);
		await sleep(800);
		expect(await page.evaluate<boolean>(AU_MENU), 'le doigt relevé a relancé un tour').toBe(true);
	});
}, TIMEOUT);

test('de retour au menu, une tuile répond au premier toucher, tout de suite', async () => {
	// Le bogue : de retour au menu, les tuiles ne répondaient pas tout de suite. On touche une autre
	// tuile dès le retour, sans attendre, après chaque façon de revenir.
	await withApp(async (page) => {
		const tuile = async (dossier: string) => page.evaluate<Point>(`(() => { const r = document.querySelector('#tours .tour[data-dossier="${dossier}"] .tour-lancer').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
		const autreTuileOuvre = async (comment: string) => {
			await attendreLeMenu(page);
			await page.tap(await tuile('six-predictions'));
			await attendre(page, `location.hash.startsWith('#/tours/six-predictions')`, `tuile ouverte au premier toucher après ${comment}`, 2000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		};

		// La croix des réglages.
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
		const croix = await page.evaluate<Point>(dansLeTour(`(() => { const r = document.querySelector('#close-btn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`));
		await page.tap(croix);
		await autreTuileOuvre('la croix');

		// L'appui de 3 s, au cours d'une routine.
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap(HAUT);
		await sleep(900);
		await appuiLong(page);
		await autreTuileOuvre('l’appui de 3 s');
	});
}, TIMEOUT);

test('un appui long sur une tuile ou un écrou ⚙ agit aussi, au lever du doigt', async () => {
	// Sur Android, un doigt qui reste posé ne produit pas de clic : le bouton s'enfonçait sans agir.
	// Chrome sur ordinateur, lui, envoie le clic quand même : on le supprime pour faire comme Android
	// (les clics du clavier, sans doigt, passent toujours).
	await withApp(async (page) => {
		await page.evaluate(`document.addEventListener('click', (e) => { if (e.detail > 0) e.stopImmediatePropagation(); }, true)`);
		const centre = async (selecteur: string) => page.evaluate<Point>(`(() => { const r = document.querySelector('${selecteur}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
		for (const selecteur of ['#tours .tour[data-dossier="six-predictions"] .tour-lancer', '#tours .tour[data-dossier="pile-ou-face"] .tour-reglages']) {
			await page.touchStart(await centre(selecteur));
			await sleep(1500);
			await page.touchEnd();
			await attendre(page, `location.hash.startsWith('#/tours/')`, `appui long sur ${selecteur}`, 2000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		}
		// Le choix de la langue aussi.
		await page.touchStart(await centre('#langues button[data-langue="en"]'));
		await sleep(1500);
		await page.touchEnd();
		await page.waitFor(`document.documentElement.lang === 'en'`, 'appui long sur EN', 2000);
	});
}, TIMEOUT);

test('sans événements « pointer », comme sur Android au retour d’un tour, les tuiles répondent', async () => {
	// Observé sur le téléphone : de retour d'un tour, le menu ne reçoit plus de pointerdown ni de
	// pointerup pour le doigt, seulement les événements tactiles — et pas de clic après un appui long.
	await withApp(async (page) => {
		await page.evaluate(`for (const t of ['pointerdown', 'pointerup', 'pointermove']) window.addEventListener(t, (e) => { if (e.pointerType === 'touch') e.stopImmediatePropagation(); }, true);
			document.addEventListener('click', (e) => { if (e.detail > 0 && performance.now() - (window.__debut ?? 0) > 400) e.stopImmediatePropagation(); }, true);
			window.addEventListener('touchstart', () => { window.__debut = performance.now(); }, true);`);
		const centre = async (selecteur: string) => page.evaluate<Point>(`(() => { const r = document.querySelector('${selecteur}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
		// Un toucher bref.
		await page.tap(await centre('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer'));
		await attendre(page, `location.hash.startsWith('#/tours/')`, 'toucher bref sans pointer', 2000);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
		// Un appui long.
		await page.touchStart(await centre('#tours .tour[data-dossier="six-predictions"] .tour-lancer'));
		await sleep(1500);
		await page.touchEnd();
		await attendre(page, `location.hash.startsWith('#/tours/')`, 'appui long sans pointer ni clic', 2000);
	});
}, TIMEOUT);

test('un doigt qui glisse hors du bouton ne déclenche rien', async () => {
	await withApp(async (page) => {
		const r = await page.evaluate<{ x: number; y: number; bas: number }>(`(() => { const r = document.querySelector('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, bas: r.bottom }; })()`);
		await page.touchStart({ x: r.x, y: r.y });
		await sleep(300);
		await page.touchMove({ x: r.x, y: r.bas + 60 });
		await sleep(200);
		await page.touchEnd();
		await sleep(600);
		expect(await page.evaluate<boolean>(AU_MENU), 'le doigt glissé hors de la tuile a ouvert le tour').toBe(true);
	});
}, TIMEOUT);

test('l’historique ne grandit pas d’un tour à l’autre', async () => {
	await withApp(async (page) => {
		const depart = await page.evaluate<number>(`history.length`);
		for (let i = 0; i < 3; i++) {
			await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
			// Une touche lève la garde, comme un toucher.
			await pressKey(page, 'Shift');
		}
		expect(await page.evaluate<number>(`history.length`) <= depart + 1, 'trois tours ouverts et refermés ont allongé l’historique').toBeTruthy();
		// Le geste retour referme encore un tour ouvert ensuite.
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte'))`);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('geste retour d’Android pendant un tour : retour au menu', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte'))`);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

/* ================= L'écrou ⚙ ================= */

/** Touche le bouton de langue du menu principal. */
async function choisirLangue(page: Page, lang: 'fr' | 'en'): Promise<void> {
	const centre = await page.evaluate<Point>(`(() => { const r = document.querySelector('#langues button[data-langue="${lang}"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
	await page.tap(centre);
	await page.waitFor(`document.documentElement.lang === '${lang}'`, `menu en ${lang}`);
}

test('Trois questions : une colonne touchée, le double toucher pour « aucune », la carte du spectateur à la révélation', async () => {
	const photo = `document.querySelector('#galerie').dataset.photo`;
	/** Un défilement du doigt vers la gauche (la photo suivante), comme dans une appli de photos. */
	async function defiler(page: Page): Promise<void> {
		const y = SCREEN.height / 2;
		await page.touchStart({ x: SCREEN.width - 40, y });
		for (let pas = 1; pas <= 6; pas++) {
			await page.touchMove({ x: SCREEN.width - 40 - pas * 45, y: y + pas });
			await sleep(16);
		}
		await page.touchEnd();
		await sleep(600);
	}
	/** Le milieu de la colonne `n` (1 à 3) de la photo montrée. */
	const colonne = (n: number): string => `(() => { const r = document.querySelector('#galerie .diapo[data-place="0"] .colonne[data-colonne="${n}"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`;
	await withApp(async (page) => {
		await ouvrir(page, 'trois-questions', `Boolean(document.querySelector('#galerie .colonne .carte'))`);
		expect(await page.evaluate(dansLeTour(photo))).toBe('question-0');
		// Question 1 : colonne 3.
		await page.tap(await page.evaluate<Point>(dansLeTour(colonne(3))));
		await attendre(page, dansLeTour(`${photo} === 'question-1'`), 'photo de la question 2', 3000);
		await sleep(600);
		// Question 2 : un défilement ne note rien (la rafale), le double toucher note « aucune ».
		await defiler(page);
		expect(await page.evaluate(dansLeTour(photo))).toBe('question-1-rafale');
		await page.doubleTap(await page.evaluate<Point>(dansLeTour(colonne(2))));
		await attendre(page, dansLeTour(`${photo} === 'question-2'`), 'photo de la question 3', 3000);
		await sleep(600);
		// Question 3 : colonne 1. Le code 301 est écarté : rien ne bouge.
		await page.tap(await page.evaluate<Point>(dansLeTour(colonne(1))));
		await sleep(600);
		expect(await page.evaluate(dansLeTour(photo)), 'un code écarté a bougé la galerie').toBe('question-2');
		// Colonne 2 : le code 302, la révélation.
		await page.tap(await page.evaluate<Point>(dansLeTour(colonne(2))));
		await attendre(page, dansLeTour(`${photo} === 'revelation'`), 'révélation', 3000);
		await sleep(600);
		// La photo de la révélation est bien à sa place, à l'écran : trois colonnes, la carte du spectateur
		// face en bas au milieu de celle du milieu. On la touche sur sa bande visible, en haut.
		const centre = await page.evaluate<Point & { gauche: number }>(dansLeTour(`(() => { const r = document.querySelector('#spectateur').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * .12, gauche: r.x }; })()`));
		expect(centre.gauche > 0 && centre.x < SCREEN.width, 'la révélation n’est pas à l’écran').toBe(true);
		expect(await page.evaluate<number>(dansLeTour(`document.querySelectorAll('#galerie .diapo[data-place="0"] .carte.retournee').length`))).toBe(38);
		await page.tap(centre);
		await attendre(page, dansLeTour(`document.querySelector('#spectateur').classList.contains('retournee')`), 'carte du spectateur retournée', 3000);
		await sleep(800);
		// Le double toucher : une nouvelle routine, on reste dans le tour.
		await page.doubleTap(centre);
		await attendre(page, dansLeTour(`${photo} === 'question-0'`), 'nouvelle routine', 3000);
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/trois-questions')`), 'le double toucher a quitté le tour').toBe(true);
		await sleep(600);
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('écrou ⚙ : les réglages du tour s’ouvrent seuls, « Fermer » ramène au menu', async () => {
	await withApp(async (page) => {
		for (const [dossier, panneau] of [
			['boule-de-cristal', '#settings'],
			['carte-de-visite', '#settings'],
			['pile-ou-face', '#menu'],
			['morpion', '#menu'],
			['princesse', '#menu'],
			['six-predictions', '#menu'],
			['cinq-cartes', '#menu'],
			['trois-paquets', '#menu'],
			['pluie-tres-fine', '#menu'],
			['trois-questions', '#menu'],
			['analyseur-q', '#menu'],
		] as const) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('${panneau}')) && !document.querySelector('${panneau}').hidden`, true);
			// Rien du déroulé du tour dans ses réglages : ni « aller à », ni « remettre ».
			expect(await page.evaluate(dansLeTour(`[...document.querySelectorAll('${panneau} button')].some((b) => !b.closest('[hidden]') && b.id === 'reset-btn')`)), `${dossier} : bouton de remise visible`).toBe(false);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
		}
	});
}, TIMEOUT);

test('écrou ⚙ : un réglage changé vaut pour la routine suivante', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#couleur-choix button'))`, true);
		await page.evaluate(dansLeTour(`document.querySelector('#couleur-choix button[data-valeur="rouge"]').click()`));
		await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
		await attendreLeMenu(page);
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte'))`);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#table .carte').dataset.couleur`))).toBe('rouge');
	});
}, TIMEOUT);

test('écrou ⚙ : une croix en haut à droite ferme les réglages, plus de bouton « Fermer »', async () => {
	await withApp(async (page) => {
		for (const [dossier, panneau] of [
			['boule-de-cristal', '#settings'],
			['carte-de-visite', '#settings'],
			['pile-ou-face', '#menu'],
			['morpion', '#menu'],
			['princesse', '#menu'],
			['six-predictions', '#menu'],
			['cinq-cartes', '#menu'],
			['trois-paquets', '#menu'],
			['pluie-tres-fine', '#menu'],
			['trois-questions', '#menu'],
			['analyseur-q', '#menu'],
		] as const) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('${panneau}')) && !document.querySelector('${panneau}').hidden`, true);
			const croix = await page.evaluate<{ x: number; y: number; haut: number; droite: number; texte: string; etiquette: string | null } | null>(dansLeTour(`(() => {
				const b = document.querySelector('#close-btn');
				const r = b.getBoundingClientRect();
				return { x: r.x + r.width / 2, y: r.y + r.height / 2, haut: r.top, droite: window.innerWidth - r.right, texte: b.textContent.trim(), etiquette: b.getAttribute('aria-label') };
			})()`));
			if (!croix) throw new Error(`${dossier} : pas de croix`);
			expect(croix.haut < 80 && croix.droite < 40, `${dossier} : la croix n’est pas en haut à droite (haut ${croix.haut}, droite ${croix.droite})`).toBeTruthy();
			expect(croix.texte, `${dossier} : la croix porte du texte`).toBe('');
			expect(croix.etiquette, `${dossier} : la croix n’est pas annoncée « Fermer »`).toBe('Fermer');
			// Aucun autre bouton visible ne s'appelle « Fermer ».
			expect(await page.evaluate(dansLeTour(`[...document.querySelectorAll('${panneau} button')].filter((b) => !b.closest('[hidden]') && b.textContent.trim() === 'Fermer').length`)), `${dossier} : un bouton « Fermer » reste`).toBe(0);
			// La croix reste dans son coin quand les réglages défilent.
			await page.evaluate(dansLeTour(`document.querySelector('${panneau} .sheet').scrollTop = 400`));
			expect(Math.round(await page.evaluate<number>(dansLeTour(`document.querySelector('#close-btn').getBoundingClientRect().top`))), `${dossier} : la croix défile avec les réglages`).toBe(Math.round(croix.haut));
			// Un vrai toucher sur la croix ramène au menu.
			await page.tap({ x: croix.x, y: croix.y });
			await attendreLeMenu(page);
		}
	});
}, TIMEOUT);

test('écrou ⚙ : tous les réglages ont la même structure, le nom du tour en tête, sans version', async () => {
	await withApp(async (page) => {
		const structures: string[][] = [];
		for (const [dossier, panneau] of [
			['boule-de-cristal', '#settings'],
			['carte-de-visite', '#settings'],
			['pile-ou-face', '#menu'],
			['morpion', '#menu'],
			['princesse', '#menu'],
			['six-predictions', '#menu'],
			['cinq-cartes', '#menu'],
			['trois-paquets', '#menu'],
			['pluie-tres-fine', '#menu'],
			['trois-questions', '#menu'],
			['analyseur-q', '#menu'],
		] as const) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('${panneau}')) && !document.querySelector('${panneau}').hidden`, true);
			const lu = await page.evaluate<{ titre: string; nom: string; blocs: string[]; version: boolean }>(dansLeTour(`({
				titre: document.querySelector('.titre-reglages').textContent,
				nom: document.querySelector('.nom-du-tour').textContent,
				// Les blocs visibles de la feuille, dans l'ordre : leur rôle, d'après leur classe.
				blocs: [...document.querySelector('${panneau} .sheet').children]
					.filter((e) => !e.hidden && getComputedStyle(e).display !== 'none')
					.map((e) => e.classList.contains('menu-head') ? 'en-tête' : e.classList.contains('options') ? 'aides' : e.classList.contains('status') ? 'écran' : e.classList.contains('help') ? 'gestes' : e.id === 'defaults-btn' ? 'défauts' : e.classList.contains('about') ? 'version' : 'réglage'),
				version: [...document.querySelectorAll('${panneau} *')].some((e) => !e.closest('[hidden]') && e.getClientRects().length > 0 && (e.id === 'menu-version' || e.classList.contains('about'))),
			})`));
			expect(lu.titre, `${dossier} : titre`).toBe('Réglages');
			expect(lu.nom, `${dossier} : nom du tour sous le titre`).toBe(TOURS.find((t) => t.dossier === dossier)!.nom.fr);
			expect(lu.version, `${dossier} : une version est encore affichée`).toBe(false);
			structures.push([dossier, ...lu.blocs.filter((b, i, liste) => b !== 'réglage' || liste[i - 1] !== 'réglage')]);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
		}
		// Le même ordre partout : l'en-tête, les réglages propres au tour, puis les blocs communs.
		// Ni l'état de l'écran allumé (il reste allumé sans qu'on ait à le voir), ni l'aide des gestes.
		// Les six prédictions n'ont aucun réglage à elles : leurs dos ne se règlent pas.
		for (const [dossier, ...structure] of structures) {
			const attendue = dossier === 'six-predictions' ? ['en-tête', 'aides', 'défauts'] : ['en-tête', 'réglage', 'aides', 'défauts'];
			expect(structure, dossier).toStrictEqual(attendue);
		}
	});
}, TIMEOUT);

test('écrou ⚙ : dans les réglages, un appui long agit aussi, une seule fois', async () => {
	// Comme sur Android : pas de clic du doigt après un appui long (on supprime ceux de Chrome).
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#couleur-choix button'))`, true);
		await page.evaluate(dansLeTour(`document.addEventListener('click', (e) => { if (e.detail > 0) e.stopImmediatePropagation(); }, true)`));
		const centre = async (selecteur: string) => page.evaluate<Point>(dansLeTour(`(() => { const e = document.querySelector('${selecteur}'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`));
		const appuiLongSur = async (selecteur: string) => {
			await page.touchStart(await centre(selecteur));
			await sleep(1200);
			await page.touchEnd();
			await sleep(300);
		};
		// Un dos de couleur : choisi.
		await appuiLongSur('#couleur-choix button[data-valeur="bleu"]');
		expect(await page.evaluate(dansLeTour(`JSON.parse(localStorage.getItem('pile-ou-face:settings:v1')).couleur`))).toBe('bleu');
		// Une case à cocher : basculée une seule fois.
		const avant = await page.evaluate<boolean>(dansLeTour(`document.querySelector('#show-hold-ring').checked`));
		await appuiLongSur('label[for="show-hold-ring"]');
		expect(await page.evaluate<boolean>(dansLeTour(`document.querySelector('#show-hold-ring').checked`)), 'la case n’a pas basculé, ou deux fois').toBe(!avant);
		// Un toucher bref aussi, une seule fois.
		const centreCase = await centre('label[for="show-hold-ring"]');
		await page.tap(centreCase);
		await sleep(300);
		expect(await page.evaluate<boolean>(dansLeTour(`document.querySelector('#show-hold-ring').checked`)), 'un toucher bref n’a pas basculé la case une seule fois').toBe(avant);
		// La croix.
		await appuiLongSur('#close-btn');
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('écrou ⚙ : en anglais, « Settings » et le nom anglais du tour', async () => {
	await withApp(async (page) => {
		await choisirLangue(page, 'en');
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
		expect(await page.evaluate(dansLeTour(`document.querySelector('.titre-reglages').textContent`))).toBe('Settings');
		expect(await page.evaluate(dansLeTour(`document.querySelector('.nom-du-tour').textContent`))).toBe('Heads or tails');
		expect(await page.evaluate(dansLeTour(`document.querySelector('#close-btn').getAttribute('aria-label')`))).toBe('Close');
	});
}, TIMEOUT);

test('les six dos de cartes sont symétriques, de haut en bas et de gauche à droite', async () => {
	// Chaque dos dessiné en grand, comparé à sa copie retournée : les pixels qui ne se recouvrent pas
	// sont comptés (en part des pixels dessinés) : ceux des six prédictions, un par carte.
	const ecarts = (selecteur: string) => dansLeTour(`(async () => {
		const L = 200, H = 280, resultats = [];
		for (const [rang, dessin] of [...document.querySelectorAll('${selecteur}')].entries()) {
			const svg = dessin.cloneNode(true);
			svg.setAttribute('width', L); svg.setAttribute('height', H); svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('color', '#000');
			const image = new Image(); image.src = 'data:image/svg+xml,' + encodeURIComponent(svg.outerHTML); await image.decode();
			const pixels = (sx, sy) => { const c = document.createElement('canvas'); c.width = L; c.height = H; const g = c.getContext('2d'); g.translate(sx < 0 ? L : 0, sy < 0 ? H : 0); g.scale(sx, sy); g.drawImage(image, 0, 0); return g.getImageData(0, 0, L, H).data; };
			const [a, v, m] = [pixels(1, 1), pixels(1, -1), pixels(-1, 1)];
			let encre = 0, dv = 0, dm = 0;
			for (let k = 3; k < a.length; k += 4) { const A = a[k] > 100; if (A) encre++; if (A !== (v[k] > 100)) dv++; if (A !== (m[k] > 100)) dm++; }
			resultats.push({ nom: '${selecteur} ' + rang, hautBas: dv / encre, gaucheDroite: dm / encre });
		}
		return resultats;
	})()`);
	await withApp(async (page) => {
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .dos svg.dos-motif').length === 6`);
		const six = await page.evaluate<{ nom: string; hautBas: number; gaucheDroite: number }[]>(ecarts('#paquet .dos svg.dos-motif'));
		expect(six.length).toBe(6);
		for (const { nom, hautBas, gaucheDroite } of six) {
			expect(hautBas < .01, `${nom} : ${(hautBas * 100).toFixed(1)} % du dessin ne se retrouve pas de haut en bas`).toBeTruthy();
			expect(gaucheDroite < .01, `${nom} : ${(gaucheDroite * 100).toFixed(1)} % du dessin ne se retrouve pas de gauche à droite`).toBeTruthy();
		}
	});
}, TIMEOUT);

test('le dessin des dos a la même marge en haut, en bas et sur les côtés', async () => {
	// Le dessin prenait sa hauteur de sa largeur : il s'arrêtait avant le bas de la carte (4 px de
	// marge en haut, 7 en bas sur une vignette). Les dessins ne restent plus qu'aux six prédictions.
	const marges = `[...document.querySelectorAll('.carte .dos')].map((carte) => {
		const c = carte.getBoundingClientRect(); const d = carte.querySelector('svg.dos-motif').getBoundingClientRect();
		return [d.top - c.top, c.bottom - d.bottom, d.left - c.left, c.right - d.right].map((v) => Math.round(v * 10) / 10);
	}).filter((m) => m.some((v) => Math.abs(v - m[0]) > .6))`;
	await withApp(async (page) => {
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		expect(await page.evaluate(dansLeTour(marges)), 'des cartes ont des marges inégales').toStrictEqual([]);
	});
}, TIMEOUT);

/* ================= Le bouton FR / EN ================= */

test('FR / EN : le menu change de langue, et s’en souvient', async () => {
	await withApp(async (page) => {
		expect(await page.evaluate(`document.documentElement.lang`), 'téléphone en français : menu en français').toBe('fr');
		expect(await page.evaluate(`document.querySelector('#langues button[data-langue="fr"]').getAttribute('aria-checked')`)).toBe('true');
		await choisirLangue(page, 'en');
		const noms = await page.evaluate<string[]>(`[...document.querySelectorAll('#tours .tour-nom')].map((n) => n.textContent)`);
		expect(noms).toStrictEqual(TOURS.map((t) => t.nom.en));
		expect(await page.evaluate(`document.querySelector('.invite').textContent`)).toBe('Pick a trick');
		expect(await page.evaluate(`document.querySelector('.tour-reglages').getAttribute('aria-label')`)).toBe(`Settings: ${TOURS[0]!.nom.en}`);
		await page.reload();
		await page.waitFor(PRET, 'menu rechargé');
		expect(await page.evaluate(`document.documentElement.lang`), 'la langue choisie est gardée').toBe('en');
	});
}, TIMEOUT);

test('FR / EN : la langue du menu vaut pour les tours', async () => {
	await withApp(async (page) => {
		await choisirLangue(page, 'en');
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'carte retournée', 3000);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#table .prediction').innerText.replace(/\\n+/g, ' ')`))).toBe('0.20 euro tails');
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);

		await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		expect(await page.evaluate(dansLeTour(`document.documentElement.lang`)), 'l’analyseur est en anglais').toBe('en');
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);

		// Retour au français : les tours suivent.
		await choisirLangue(page, 'fr');
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		expect(await page.evaluate(dansLeTour(`document.documentElement.lang`)), 'les six prédictions sont en français').toBe('fr');
	});
}, TIMEOUT);

test('FR / EN : plus aucun choix de langue dans les tours', async () => {
	await withApp(async (page) => {
		for (const dossier of ['pile-ou-face', 'six-predictions']) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
			expect(await page.evaluate(dansLeTour(`!document.querySelector('#langue-seg')`)), `${dossier} : choix de langue dans les réglages`).toBe(true);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
		}
		// L'analyseur choisissait sa langue sur sa première slide : plus de boutons FR / EN.
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		expect(await page.evaluate(dansLeTour(`document.querySelectorAll('.langues').length`)), 'boutons FR / EN sur la première slide').toBe(0);
	});
}, TIMEOUT);

/* ================= Marges de l'écran (caméra frontale) ================= */

test('chaque tour reçoit les marges de l’écran : rien sous la caméra frontale', async () => {
	// Dans l'ancien cadre, les marges valaient 0 et le tour passait sous la caméra. Sa page, elle,
	// reçoit les vraies marges de l'écran.
	await withApp(async (page) => {
		await page.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 40, topMax: 40, bottom: 20, bottomMax: 20 } });
		// Le haut et le bas de l'écran ; pour les tours pivotés en paysage (leur
		// haut à droite de l'écran), ce sont la gauche et la droite de la scène.
		const marge = (haut: string, bas: string): string => `(() => { const s = document.createElement('div'); s.style.paddingTop = 'var(${haut})'; s.style.paddingBottom = 'var(${bas})'; document.querySelector('#app').appendChild(s); const c = getComputedStyle(s); const r = [c.paddingTop, c.paddingBottom]; s.remove(); return r; })()`;
		for (const [dossier, pret] of [
			['boule-de-cristal', `Boolean(document.querySelector('#number'))`],
			['carte-de-visite', `Boolean(document.querySelector('#number'))`],
			['pile-ou-face', `Boolean(document.querySelector('#table .carte'))`],
			['morpion', `Boolean(document.querySelector('#table .papier'))`],
			['princesse', `document.querySelectorAll('#jeu .carte').length === 5`],
			['six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`],
			['cinq-cartes', `document.querySelectorAll('#rangee .carte').length === 5`],
			['trois-paquets', `document.querySelectorAll('.salade .carte[data-carte="D-pique"]').length === 2`],
			['pluie-tres-fine', `Boolean(document.querySelector('#table .carte .dos-ancien'))`],
			['trois-questions', `Boolean(document.querySelector('#galerie .colonne .carte'))`],
			['analyseur-q', `Boolean(document.querySelector('.slide.current'))`],
		] as const) {
			await ouvrir(page, dossier, pret);
			const [haut, bas] = dossier === 'carte-de-visite' || dossier === 'princesse' || dossier === 'cinq-cartes' || dossier === 'trois-paquets' ? ['--safe-l', '--safe-r'] : ['--safe-t', '--safe-b'];
			expect(await page.evaluate(dansLeTour(marge(haut, bas))), `${dossier} : marges de l’écran`).toStrictEqual(['40px', '20px']);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		}
		await page.send('Emulation.setSafeAreaInsetsOverride', { insets: {} });
	});
}, TIMEOUT);

/* ================= Service worker et hors-ligne ================= */

test('le service worker ne renvoie le menu que pour l’adresse de l’app, jamais pour une autre page du site', async () => {
	await withApp(async (page) => {
		await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
		await page.goto(`${server.url}boule-de-cristal/`);
		expect(await page.evaluate<boolean>(`Boolean(document.querySelector('#tours'))`), 'une autre page du site a reçu la page du menu').toBe(false);
	});
}, TIMEOUT);

test('hors-ligne : le menu et les tours s’ouvrent serveur arrêté', async () => {
	const offlineServer = await startStaticServer('dist', 0);
	let closed = false;
	try {
		await withApp(async (page) => {
			await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
			await offlineServer.close();
			closed = true;
			await page.reload();
			await page.waitFor(PRET, 'menu rechargé hors-ligne', 10_000);
			// La police vient du cache, de façon asynchrone : on lui laisse le temps d'arriver.
			await attendre(page, `document.fonts.check('16px "Pixelify Sans"')`, 'police pixel absente hors-ligne', 3000);
			await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
			await page.tap(HAUT);
			await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'routine jouée hors-ligne', 3000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
			await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		}, offlineServer.url);
	} finally {
		if (!closed) await offlineServer.close();
	}
}, TIMEOUT);
