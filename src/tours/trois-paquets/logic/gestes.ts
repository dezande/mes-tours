/*
 * Décision de chaque geste sur la scène des trois paquets, sans DOM : testée sous Node
 * (tests/tours/trois-paquets/gestes.test.ts).
 *
 *   balayer vers la gauche     → panneau suivant
 *   balayer vers la droite     → panneau précédent
 *   tap                        → noter un paquet (panneau 2), faire disparaître la carte (panneau 3)
 *   appui de 3 s n'importe où  → menu
 *
 * Réglé pour un vrai doigt, pas pour un robot : un tap peut durer, trembler de quelques dizaines
 * de pixels ; un balayage peut être lent. Un appui relâché entre le tap et les 3 s ne fait rien, ce
 * qui permet d'abandonner un appui long sans rien déclencher.
 */

export const GESTURE = {
	/** Mouvement toléré pendant un tap ou un appui long, en pixels. */
	slopPx: 40,
	/** Au-delà de cette durée, un appui relâché n'est plus un tap (et ne fait rien). */
	tapMaxMs: 800,
	/** Durée de l'appui qui ouvre le menu. */
	holdMs: 3000,
	/** Distance horizontale minimale d'un balayage, en pixels. */
	swipeMinPx: 50,
} as const;

export type Geste = 'suivant' | 'precedent' | 'tap' | 'none';

interface Contact {
	id: number;
	x: number;
	y: number;
	at: number;
	/** Le doigt s'est trop déplacé : plus un tap ni un appui long. */
	moved: boolean;
	/** Un second doigt s'est posé : le geste est abandonné. */
	cancelled: boolean;
	/** L'appui long a ouvert le menu : le relâcher ne fait rien. */
	held: boolean;
}

/** Suit un seul doigt à la fois ; un second doigt annule le geste en cours. */
export class GestureTracker {
	#contact: Contact | null = null;

	/** Doigt posé. Renvoie true si ce contact peut devenir un appui long (lancer la minuterie). */
	press(id: number, x: number, y: number, now: number): boolean {
		if (this.#contact) {
			this.#contact.cancelled = true;
			return false;
		}
		this.#contact = { id, x, y, at: now, moved: false, cancelled: false, held: false };
		return true;
	}

	/** Doigt déplacé. Renvoie true si le mouvement vient d'annuler l'appui long. */
	move(id: number, x: number, y: number): boolean {
		const c = this.#contact;
		if (!c || c.id !== id || c.moved) return false;
		if (Math.hypot(x - c.x, y - c.y) > GESTURE.slopPx) {
			c.moved = true;
			return true;
		}
		return false;
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

		const dx = x - c.x;
		const dy = y - c.y;
		if (Math.abs(dx) >= GESTURE.swipeMinPx && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'suivant' : 'precedent';
		if (c.moved || Math.hypot(dx, dy) > GESTURE.slopPx) return 'none';
		if (now - c.at > GESTURE.tapMaxMs) return 'none';
		return 'tap';
	}

	/** Contact interrompu par le système (appel, notification…) : rien ne se déclenche. */
	cancel(id: number): void {
		if (this.#contact?.id === id) this.#contact = null;
	}

	/** Oublie tout (menu ouvert, app en arrière-plan). */
	reset(): void {
		this.#contact = null;
	}
}
