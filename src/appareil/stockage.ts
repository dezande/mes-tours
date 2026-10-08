/* Stockage de l'app : lecture et écriture sûres, et demande de stockage persistant. */

/**
 * Valeur JSON enregistrée sous `key`, sinon sous l'une des `legacyKeys` (anciens noms de l'app),
 * sinon null. Ne lève jamais d'erreur (stockage indisponible, données abîmées).
 */
export function readStored(key: string, ...legacyKeys: string[]): unknown {
	try {
		for (const k of [key, ...legacyKeys]) {
			const raw = localStorage.getItem(k);
			if (raw !== null) return JSON.parse(raw);
		}
	} catch {
		// Données abîmées ou stockage indisponible.
	}
	return null;
}

/** Enregistre `value` en JSON. Stockage indisponible : gardé pour la session seulement, sans erreur. */
export function writeStored(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Mode privé, stockage plein…
	}
}

/**
 * Demande au navigateur de ne jamais effacer de lui-même les données de l'app (réglages, cache
 * hors-ligne), même en manque de place.
 */
export async function requestPersistentStorage(): Promise<void> {
	try {
		if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
	} catch {
		// Refusé ou indisponible : le navigateur décide seul.
	}
}
