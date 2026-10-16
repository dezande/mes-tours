// Le stockage de l'app (src/appareil/stockage.ts) : lecture et écriture qui ne lèvent jamais
// d'erreur, les anciens noms relus, et la demande de stockage persistant.
import { jest } from '@jest/globals';
import { readStored, requestPersistentStorage, writeStored } from '../../src/appareil/stockage.ts';

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	jest.restoreAllMocks();
	delete (navigator as { storage?: unknown }).storage;
});

test('readStored : la valeur JSON enregistrée, ou null', () => {
	expect(readStored('absent')).toBeNull();
	localStorage.setItem('reglages', JSON.stringify({ delai: 2, jauge: false }));
	expect(readStored('reglages')).toStrictEqual({ delai: 2, jauge: false });
	localStorage.setItem('langue', '"fr"');
	expect(readStored('langue')).toBe('fr');
	localStorage.setItem('zero', '0');
	expect(readStored('zero')).toBe(0);
});

test('readStored : les anciens noms sont relus, dans l’ordre, si le nouveau n’existe pas', () => {
	localStorage.setItem('rain-man:settings:v1', JSON.stringify({ transition: 'aucune' }));
	expect(readStored('analyseur-q:settings:v1', 'rain-man:settings:v1')).toStrictEqual({ transition: 'aucune' });
	// Le nouveau nom l'emporte dès qu'il existe.
	localStorage.setItem('analyseur-q:settings:v1', JSON.stringify({ transition: 'glisse' }));
	expect(readStored('analyseur-q:settings:v1', 'rain-man:settings:v1')).toStrictEqual({ transition: 'glisse' });
	// Plusieurs anciens noms : le premier trouvé.
	localStorage.setItem('tres-vieux', '1');
	localStorage.setItem('vieux', '2');
	expect(readStored('nouveau', 'vieux', 'tres-vieux')).toBe(2);
	expect(readStored('nouveau', 'inconnu', 'tres-vieux')).toBe(1);
});

test('readStored : des données abîmées ou un stockage indisponible donnent null, sans erreur', () => {
	localStorage.setItem('abime', '{pas du json');
	expect(readStored('abime')).toBeNull();
	// Une valeur abîmée sous le nouveau nom ne fait pas relire l'ancien : la lecture s'arrête là.
	localStorage.setItem('ancien', '"ok"');
	expect(readStored('abime', 'ancien')).toBeNull();
	jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
		throw new Error('SecurityError');
	});
	expect(readStored('ancien')).toBeNull();
});

test('writeStored : la valeur enregistrée en JSON, et relue telle quelle', () => {
	writeStored('reglages', { delai: 1.5, couleur: 'rouge' });
	expect(localStorage.getItem('reglages')).toBe('{"delai":1.5,"couleur":"rouge"}');
	expect(readStored('reglages')).toStrictEqual({ delai: 1.5, couleur: 'rouge' });
	writeStored('langue', 'en');
	expect(localStorage.getItem('langue')).toBe('"en"');
});

test('writeStored : stockage plein ou mode privé, rien ne casse', () => {
	jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
		throw new Error('QuotaExceededError');
	});
	expect(() => writeStored('reglages', { delai: 1 })).not.toThrow();
});

test('requestPersistentStorage : demandé quand il ne l’est pas encore, et une seule fois', async () => {
	const persist = jest.fn(() => Promise.resolve(true));
	const persisted = jest.fn(() => Promise.resolve(false));
	Object.defineProperty(navigator, 'storage', { value: { persist, persisted }, configurable: true });
	await requestPersistentStorage();
	expect(persisted).toHaveBeenCalledTimes(1);
	expect(persist).toHaveBeenCalledTimes(1);
	// Déjà persistant : pas de nouvelle demande.
	persisted.mockImplementation(() => Promise.resolve(true));
	await requestPersistentStorage();
	expect(persist).toHaveBeenCalledTimes(1);
});

test('requestPersistentStorage : sans l’API, ou refusé, rien ne casse', async () => {
	expect(navigator.storage).toBeUndefined();
	await expect(requestPersistentStorage()).resolves.toBeUndefined();
	Object.defineProperty(navigator, 'storage', {
		value: { persist: () => Promise.reject(new Error('refusé')), persisted: () => Promise.resolve(false) },
		configurable: true,
	});
	await expect(requestPersistentStorage()).resolves.toBeUndefined();
});
