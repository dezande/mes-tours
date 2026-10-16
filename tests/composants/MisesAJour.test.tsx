// Hors-ligne et mises à jour (src/appareil/mises-a-jour.ts) : l'enregistrement du service worker, la
// recherche d'une nouvelle version au retour au premier plan, et le rechargement seulement quand il ne gêne pas.
import { jest } from '@jest/globals';
import { setupUpdates } from '../../src/appareil/mises-a-jour.ts';

/** Un faux navigator.serviceWorker : ce que l'app en appelle, et de quoi lui envoyer ses événements. */
function fauxServiceWorker(avecControleur: boolean) {
	const registration = { update: jest.fn(() => Promise.resolve()) };
	const ecouteurs = new Map<string, () => void>();
	const serviceWorker = {
		controller: avecControleur ? {} : null,
		register: jest.fn(() => Promise.resolve()),
		getRegistration: jest.fn(() => Promise.resolve(registration)),
		addEventListener: (type: string, ecouteur: () => void) => ecouteurs.set(type, ecouteur),
	};
	Object.defineProperty(navigator, 'serviceWorker', { value: serviceWorker, configurable: true });
	return { serviceWorker, registration, emettre: (type: string) => ecouteurs.get(type)?.() };
}

/** Laisse les promesses en cours se résoudre. */
const attendre = () => new Promise<void>((fin) => setTimeout(fin, 0));

/** Les écouteurs posés par setupUpdates(), débranchés après chaque test : ils ne s'accumulent pas. */
const ecouteursPoses: [EventTarget, string, EventListenerOrEventListenerObject][] = [];
for (const cible of [document, window]) {
	const original = cible.addEventListener.bind(cible);
	jest.spyOn(cible, 'addEventListener').mockImplementation((type, ecouteur, options) => {
		if (ecouteur) ecouteursPoses.push([cible, type, ecouteur]);
		original(type, ecouteur, options);
	});
}

const proprietes: [object, string][] = [];
/** Remplace une propriété en lecture seule le temps du test. */
function remplacer(objet: object, nom: string, valeur: unknown): void {
	Object.defineProperty(objet, nom, { value: valeur, configurable: true });
	proprietes.push([objet, nom]);
}

afterEach(() => {
	for (const [cible, type, ecouteur] of ecouteursPoses) cible.removeEventListener(type, ecouteur);
	ecouteursPoses.length = 0;
	for (const [objet, nom] of proprietes) delete (objet as Record<string, unknown>)[nom];
	proprietes.length = 0;
	delete (navigator as { serviceWorker?: unknown }).serviceWorker;
});

test('sans service worker (vieux navigateur), rien ne se passe', () => {
	expect('serviceWorker' in navigator).toBe(false);
	expect(() => setupUpdates({ canReload: () => true })).not.toThrow();
});

test('page déjà chargée : le service worker est enregistré tout de suite, sous sw.js à côté de l’app', () => {
	const { serviceWorker } = fauxServiceWorker(false);
	expect(document.readyState).toBe('complete');
	setupUpdates({ canReload: () => true });
	expect(serviceWorker.register).toHaveBeenCalledTimes(1);
	expect(serviceWorker.register).toHaveBeenCalledWith('sw.js');
});

test('page en cours de chargement : l’enregistrement attend la fin du chargement', () => {
	const { serviceWorker } = fauxServiceWorker(false);
	remplacer(document, 'readyState', 'loading');
	setupUpdates({ canReload: () => true });
	expect(serviceWorker.register).not.toHaveBeenCalled();
	window.dispatchEvent(new Event('load'));
	expect(serviceWorker.register).toHaveBeenCalledTimes(1);
});

test('un enregistrement refusé ne casse rien', async () => {
	const { serviceWorker } = fauxServiceWorker(false);
	serviceWorker.register.mockImplementation(() => Promise.reject(new Error('refusé')));
	setupUpdates({ canReload: () => true });
	await attendre();
});

test('de retour au premier plan, une nouvelle version est cherchée ; en arrière-plan, ou en plein tour, non', async () => {
	const { registration } = fauxServiceWorker(false);
	let enTour = false;
	setupUpdates({ canReload: () => !enTour });
	remplacer(document, 'visibilityState', 'hidden');
	document.dispatchEvent(new Event('visibilitychange'));
	await attendre();
	expect(registration.update).not.toHaveBeenCalled();
	// En plein tour : une version installée maintenant retirerait du cache les fichiers des tours pas encore ouverts.
	enTour = true;
	remplacer(document, 'visibilityState', 'visible');
	document.dispatchEvent(new Event('visibilitychange'));
	await attendre();
	expect(registration.update).not.toHaveBeenCalled();
	enTour = false;
	document.dispatchEvent(new Event('visibilitychange'));
	await attendre();
	expect(registration.update).toHaveBeenCalled();
});

test('la première prise en main n’est pas une mise à jour : l’app ne se recharge pas', () => {
	const { emettre } = fauxServiceWorker(false);
	const canReload = jest.fn(() => true);
	setupUpdates({ canReload });
	emettre('controllerchange');
	expect(canReload).not.toHaveBeenCalled();
});

test('une nouvelle version installée : l’app demande si elle peut se recharger, et ne le fait pas en plein tour', () => {
	const { emettre } = fauxServiceWorker(true);
	const canReload = jest.fn(() => false);
	setupUpdates({ canReload });
	emettre('controllerchange');
	expect(canReload).toHaveBeenCalledTimes(1);
	// Une deuxième version pendant la même session : la question est posée de nouveau.
	emettre('controllerchange');
	expect(canReload).toHaveBeenCalledTimes(2);
});

test('une nouvelle version installée, personne ne joue : l’app se recharge', () => {
	const { emettre } = fauxServiceWorker(true);
	// jsdom ne sait pas recharger une page : il le dit sur la console d'erreurs, et c'est tout ce qu'on peut voir.
	const erreurs = jest.spyOn(console, 'error').mockImplementation(() => undefined);
	setupUpdates({ canReload: () => true });
	emettre('controllerchange');
	expect(erreurs).toHaveBeenCalled();
	expect(String(erreurs.mock.calls[0]?.[0])).toMatch(/navigation/);
	erreurs.mockRestore();
});

test('après la première prise en main, la suivante compte comme une mise à jour', () => {
	const { emettre } = fauxServiceWorker(false);
	const canReload = jest.fn(() => false);
	setupUpdates({ canReload });
	emettre('controllerchange');
	expect(canReload).not.toHaveBeenCalled();
	emettre('controllerchange');
	expect(canReload).toHaveBeenCalledTimes(1);
});
