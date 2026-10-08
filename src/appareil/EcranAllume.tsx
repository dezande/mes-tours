/*
 * ÉCRAN TOUJOURS ALLUMÉ pendant le spectacle, par deux moyens actifs en même temps :
 * - Screen Wake Lock API ;
 * - une vidéo muette invisible jouée en boucle (les navigateurs ne mettent pas l'écran en veille
 *   pendant une lecture vidéo).
 * La vidéo n'est pas qu'un repli : sur iPhone avant iOS 18.4, dans l'app installée sur l'écran
 * d'accueil, l'API accepte la demande mais ne garde pas l'écran allumé (bug WebKit 254545).
 *
 * Posé une fois dans App : le système relâche le verrou quand l'app passe en arrière-plan, et
 * certains navigateurs n'accordent le verrou ou la lecture qu'après un geste. Le composant le
 * redemande donc à chaque toucher et chaque touche, n'importe où dans l'app (écouteurs en phase de
 * capture, avant ceux des tours), et à chaque retour au premier plan. Les tours n'ont rien à faire.
 * La page doit autoriser les médias data: (Content-Security-Policy : media-src 'self' data:).
 */

import { useEffect, useRef } from 'preact/hooks';

/* ---------- Vidéo muette (1 s, noire, 1 px) ---------- */

const WEBM = 'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAKCEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHWTbuMU6uEElTDZ1OsggEnTbuMU6uEHFO7a1OsggJs7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsCrXsYMPQkBNgIxMYXZmNjEuNy4xMDBXQYxMYXZmNjEuNy4xMDBEiYhAn0AAAAAAABZUrmvMrgEAAAAAAABD14EBc8WIbmYwf2A4k16cgQAitZyDdW5kiIEAhoVWX1ZQOIOBASPjg4Q7msoA4JSwgQG6gQGagQJTwIEBVbCEVbmBARJUw2dAj3Nzn2PAgGfImUWjh0VOQ09ERVJEh4xMYXZmNjEuNy4xMDBzc+pjwItjxYhuZjB/YDiTXmfIkUWjikFMUEhBX01PREVEh4ExZ8ihRaOHRU5DT0RFUkSHlExhdmM2MS4xOS4xMDAgbGlidnB4Z8ihRaOIRFVSQVRJT05Eh5MwMDowMDowMi4wMDAwMDAwMDAAH0O2dUCq54EAoNuhooEAAAAQAgCdASoBAAEAC8cIhYWImYSIP4IADA1gAP7mtQB1obSmsu6BAaWtcAIAnQEqAQABAAvHCIWFiJmEiD+CAnWqAgy9zgD+6NcfjebzWtb/G83mtWIAoMihmIED6ACxAQAvEfwAGAAwP/QMAAAA/ua1AHWhp6al7oEBpaCxAQAvEfwAGAAwP/QMAMIA/ujXH43m81rW/xvN5rViAPuC/BgcU7trkbuPs4EAt4r3gQHxggG88IED';
const MP4 = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAMrbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAB9AAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAlZ0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAB9AAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAABAAAAAQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAfQAAAAAAABAAAAAAHObWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABAAAAAgABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABeW1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAATlzdGJsAAAAuXN0c2QAAAAAAAAAAQAAAKlhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAABAAEABIAAAASAAAAAAAAAABFUxhdmM2MS4xOS4xMDAgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAAL2F2Y0MBQsAe/+EAFmdCwB7ZHsBEAAADAAQAAAMACDxYuSABAAZoy4BlEyAAAAAQcGFzcAAAAAEAAAABAAAAFGJ0cnQAAAAAAAAKRAAAAGwAAAAYc3R0cwAAAAAAAAABAAAAAgAAQAAAAAAUc3RzcwAAAAAAAAABAAAAAQAAABxzdHNjAAAAAAAAAAEAAAABAAAAAgAAAAEAAAAcc3RzegAAAAAAAAAAAAAAAgAAABAAAAALAAAAFHN0Y28AAAAAAAAAAQAAA1sAAABhdWR0YQAAAFltZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAACxpbHN0AAAAJKl0b28AAAAcZGF0YQAAAAEAAAAATGF2ZjYxLjcuMTAwAAAACGZyZWUAAAAjbWRhdAAAAAxliIQGc5yYoAAh54AAAAAHQZo4DGc6gA==';

/** Gestes de l'artiste qui réactivent le maintien de l'écran. */
const GESTES = ['pointerdown', 'pointerup', 'keydown'] as const;
/** Retours au premier plan : le verrou a pu être relâché. */
const RETOURS = ['pageshow', 'focus'] as const;

// Invisible mais « affichée » : certains navigateurs ne lisent pas une vidéo masquée.
const STYLE = { position: 'fixed', top: 0, left: 0, width: '1px', height: '1px', opacity: 0.01, pointerEvents: 'none' } as const;

export function EcranAllume() {
	const video = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		let verrou: WakeLockSentinel | null = null;
		/** Une demande de verrou est en cours : évite les demandes en double. */
		let demande = false;

		/** Active le maintien de l'écran s'il ne l'est pas déjà. Sans effet si l'app n'est pas visible. */
		const garderAllume = async (): Promise<void> => {
			if (document.visibilityState !== 'visible' || demande) return;
			if (video.current?.paused) video.current.play().catch(() => {});
			if ((verrou && !verrou.released) || !navigator.wakeLock) return;
			demande = true;
			try {
				const nouveau = await navigator.wakeLock.request('screen');
				verrou = nouveau;
				nouveau.addEventListener('release', () => {
					// Ignore la libération d'un ancien verrou déjà remplacé.
					if (verrou === nouveau) verrou = null;
				});
			} catch {
				// Refusé (pas de geste utilisateur, économie d'énergie…) : la vidéo reste seule.
			} finally {
				demande = false;
			}
		};
		const surEvenement = (): void => void garderAllume();

		for (const type of GESTES) document.addEventListener(type, surEvenement, true);
		document.addEventListener('visibilitychange', surEvenement);
		for (const type of RETOURS) window.addEventListener(type, surEvenement);
		surEvenement();
		return () => {
			for (const type of GESTES) document.removeEventListener(type, surEvenement, true);
			document.removeEventListener('visibilitychange', surEvenement);
			for (const type of RETOURS) window.removeEventListener(type, surEvenement);
			void verrou?.release().catch(() => {});
		};
	}, []);

	// Certains navigateurs ignorent « loop » sur les médias très courts.
	const reboucler = (): void => {
		const v = video.current;
		if (v?.duration && v.currentTime > v.duration - 0.4) v.currentTime = 0;
	};

	return (
		<video
			ref={video}
			id="keep-awake"
			muted
			loop
			playsInline
			webkit-playsinline=""
			preload="auto"
			disablePictureInPicture
			disableremoteplayback
			aria-hidden="true"
			tabIndex={-1}
			style={STYLE}
			onTimeUpdate={reboucler}
		>
			<source type="video/webm" src={WEBM} />
			<source type="video/mp4" src={MP4} />
		</video>
	);
}
