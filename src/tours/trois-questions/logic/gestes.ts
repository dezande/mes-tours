/*
 * Décision de chaque geste sur la galerie des trois questions, sans DOM : testée sous Node
 * (tests/tours/trois-questions/gestes.test.ts).
 *
 *   défiler vers la gauche      → « suivant » : la photo d'après
 *   défiler vers la droite      → « precedent » : la photo d'avant
 *   tap                         → toucher une colonne, ou la carte du spectateur à la révélation
 *   deux taps rapprochés        → « double » (annoncé au second ; le premier l'a été comme tap) :
 *                                 « aucune » sur une photo de colonnes, une nouvelle routine sur la révélation
 *   appui de 3 s n'importe où   → menu
 *
 * Comme dans une appli de photos, la photo suit le doigt pendant qu'il glisse (glissement()) ; un
 * défilement se décide au lever du doigt, assez loin ou assez vite. Réglé pour un vrai doigt, d'une
 * main : un tap peut durer et trembler de quelques dizaines de pixels, un défilement peut être court
 * s'il est vif. Un appui relâché entre le tap et les 3 s ne fait rien.
 */

export const GESTURE = {
	/** Mouvement toléré pendant un tap ou un appui long, en pixels. */
	slopPx: 24,
	/** Au-delà de cette durée, un appui relâché n'est plus un tap (et ne fait rien). */
	tapMaxMs: 800,
	/** Durée de l'appui qui ouvre le menu. */
	holdMs: 3000,
	/** Distance horizontale d'un défilement lent, en pixels ; un défilement vif peut être plus court. */
	swipeMinPx: 60,
	/** Un défilement vif : au moins cette distance… */
	flickMinPx: 24,
	/** … en moins de ce temps. */
	flickMaxMs: 250,
	/**
	 * Délai maximal entre deux taps pour qu'ils comptent comme un double toucher : c'est aussi
	 * l'attente d'un toucher de colonne, avant qu'il ne soit noté (index.tsx). Court, pour que la photo
	 * suive vite ; assez pour deux touchers d'un même doigt.
	 */
	doubleMaxMs: 350,
	/** Écart maximal entre les deux taps d'un double toucher, en pixels. */
	doubleSlopPx: 120,
} as const;

export type Geste = 'suivant' | 'precedent' | 'tap' | 'double' | 'none';

interface Contact {
	id: number;
	x: number;
	y: number;
	at: number;
	/** Le doigt s'est trop déplacé : plus un tap ni un appui long. */
	moved: boolean;
	/** Le doigt glisse de côté : la photo le suit. */
	horizontal: boolean;
	/** Un second doigt s'est posé : le geste est abandonné. */
	cancelled: boolean;
	/** L'appui long a ouvert le menu : le relâcher ne fait rien. */
	held: boolean;
}

/** Suit un seul doigt à la fois ; un second doigt annule le geste en cours. */
export class GestureTracker {
	#contact: Contact | null = null;
	/** Dernier tap produit, pour reconnaître le double toucher. */
	#lastTap: { x: number; y: number; at: number } | null = null;

	/** Doigt posé. Renvoie true si ce contact peut devenir un appui long (lancer la minuterie). */
	press(id: number, x: number, y: number, now: number): boolean {
		if (this.#contact) {
			this.#contact.cancelled = true;
			return false;
		}
		this.#contact = { id, x, y, at: now, moved: false, horizontal: false, cancelled: false, held: false };
		return true;
	}

	/** Doigt déplacé. Renvoie true si le mouvement vient d'annuler l'appui long. */
	move(id: number, x: number, y: number): boolean {
		const c = this.#contact;
		if (!c || c.id !== id || c.moved) return false;
		const [dx, dy] = [x - c.x, y - c.y];
		if (Math.hypot(dx, dy) > GESTURE.slopPx) {
			c.moved = true;
			c.horizontal = Math.abs(dx) > Math.abs(dy);
			return true;
		}
		return false;
	}

	/**
	 * De combien la photo suit le doigt au point (x, y) : le déplacement horizontal depuis le doigt
	 * posé, une fois le doigt parti de côté ; 0 sinon (tap, appui, glissement vers le haut ou le bas).
	 */
	glissement(id: number, x: number): number {
		const c = this.#contact;
		if (!c || c.id !== id || !c.horizontal || c.cancelled || c.held) return 0;
		return x - c.x;
	}

	/** La minuterie de l'appui long est arrivée à terme : true si le menu doit s'ouvrir. */
	holdCompleted(id: number): boolean {
		const c = this.#contact;
		if (!c || c.id !== id || c.moved || c.cancelled || c.held) return false;
		c.held = true;
		return true;
	}

	/** Doigt levé à la position (x, y). */
	release(id: number, x: number, y: number, now: number): Geste {
		const c = this.#contact;
		if (!c || c.id !== id) return 'none';
		this.#contact = null;
		if (c.cancelled || c.held) return 'none';

		const [dx, dy] = [x - c.x, y - c.y];
		const duree = now - c.at;
		const vif = Math.abs(dx) >= GESTURE.flickMinPx && duree <= GESTURE.flickMaxMs;
		if ((Math.abs(dx) >= GESTURE.swipeMinPx || vif) && Math.abs(dx) > Math.abs(dy)) {
			// Un défilement interrompt toute attente d'un double toucher.
			this.#lastTap = null;
			return dx < 0 ? 'suivant' : 'precedent';
		}
		if (c.moved || Math.hypot(dx, dy) > GESTURE.slopPx || duree > GESTURE.tapMaxMs) return 'none';

		const previous = this.#lastTap;
		this.#lastTap = { x, y, at: now };
		const double = previous !== null
			&& now - previous.at <= GESTURE.doubleMaxMs
			&& Math.hypot(x - previous.x, y - previous.y) <= GESTURE.doubleSlopPx;
		// Un double toucher se termine là : un troisième tap repart d'un simple tap.
		if (double) this.#lastTap = null;
		return double ? 'double' : 'tap';
	}

	/** Contact interrompu par le système (appel, notification…) : rien ne se déclenche. */
	cancel(id: number): void {
		if (this.#contact?.id === id) this.#contact = null;
	}

	/** Oublie tout (menu ouvert, app en arrière-plan) : y compris le tap qui attendait son double. */
	reset(): void {
		this.#contact = null;
		this.#lastTap = null;
	}
}
