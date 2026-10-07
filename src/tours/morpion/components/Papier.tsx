/*
 * Le papier affiché : le mot « Prédiction » au recto, la grille de morpion remplie au verso, et le
 * retournement. L'état du papier est décidé par logic/papier.ts (testé sous Node) et tenu par le
 * tour (index.tsx) ; ce composant ne fait que le montrer.
 *
 *   .papier             le papier froissé, posé un peu de travers au centre du fond bleu ciel
 *     .papier-pivot     le retourne (rotateY), en conservant la perspective
 *       .papier-face.recto   « Prédiction », seul visible tant que le papier n'est pas retourné
 *       .papier-face.verso   la grille de morpion remplie
 *         .ombre             l'ombre portée, qui suit le bord froissé
 *           .feuille         la feuille elle-même, découpée selon son bord froissé
 *
 * La grille est écrite au moment où le papier est armé, recto visible : elle est déjà en place
 * quand il se retourne. Les tracés viennent de logic/dessin.ts.
 */

import type { ComponentChildren } from 'preact';
import type { Lang } from '../../../logic/i18n.ts';
import { GRILLES } from '../content/grilles.ts';
import { ui } from '../content/interface.ts';
import { aretes, contour, facettes, traces } from '../logic/dessin.ts';
import { lire } from '../logic/grilles.ts';
import type { Cote, Etat } from '../logic/papier.ts';

interface Props {
	etat: Etat;
	/** La grille écrite au verso (gardée quand le papier revient sur « Prédiction »). */
	coteEcrit: Cote | null;
	langue: Lang;
}

export function Papier({ etat, coteEcrit, langue }: Props) {
	const montre = etat.phase === 'montre';
	return (
		<article className={`papier${montre ? ' retourne' : ''}`} aria-roledescription="papier" data-cote={coteEcrit ?? undefined}>
			<div className="papier-pivot">
				<Face cote="recto">
					<p className="mot">{ui('papier.mot', langue)}</p>
				</Face>
				{/* Seul le papier retourné montre sa grille : armé, il ne dit encore rien. */}
				<Face cote="verso" cache={!montre}>
					<div className="ecrit">{coteEcrit && <GrilleEcrite cote={coteEcrit} />}</div>
				</Face>
			</div>
		</article>
	);
}

/**
 * Une face du papier : la feuille découpée selon son bord froissé, ses plis, et ce qui y est écrit.
 * L'ombre est portée par .ombre, la découpe par la feuille : une ombre découpée disparaîtrait. Et
 * pas par la face elle-même : sur l'élément qui tourne, un filtre empêche Chrome de cacher son dos.
 */
function Face({ cote, cache, children }: { cote: 'recto' | 'verso'; cache?: boolean; children: ComponentChildren }) {
	const verso = cote === 'verso';
	return (
		<div className={`papier-face ${cote}`} aria-hidden={cache}>
			<div className="ombre">
				<div className="feuille" style={{ clipPath: contour(verso) }}>
					<Froissure verso={verso} />
					{children}
				</div>
			</div>
		</div>
	);
}

/**
 * Les plis du papier : des facettes éclairées ou dans l'ombre, leurs arêtes (un fil sombre pour un
 * creux, un fil clair pour un relief), et le grain fin du papier, un bruit éclairé de biais.
 */
function Froissure({ verso }: { verso: boolean }) {
	const id = verso ? 'morpion-grain-verso' : 'morpion-grain-recto';
	const { creux, reliefs } = aretes(verso);
	return (
		<svg className="froissure" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
			<filter id={id} x="0" y="0" width="1" height="1">
				<feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves={2} seed={4} result="bruit" />
				<feDiffuseLighting in="bruit" lighting-color="#ffffff" surfaceScale={0.9}>
					<feDistantLight azimuth={225} elevation={60} />
				</feDiffuseLighting>
			</filter>
			{facettes(verso).map(({ points, claire, force }, n) => (
				<polygon key={n} points={points} className={claire ? 'facette claire' : 'facette ombre'} fill-opacity={(claire ? force * 0.55 : force * 0.16).toFixed(3)} />
			))}
			{creux.map((d, n) => <path key={`c${n}`} className="pli creux" d={d} />)}
			{reliefs.map((d, n) => <path key={`r${n}`} className="pli relief" d={d} />)}
			<rect className="grain" width="100" height="100" filter={`url(#${id})`} />
		</svg>
	);
}

/** La grille de morpion remplie, au stylo : ses quatre traits, les croix, les ronds, la ligne gagnante. */
function GrilleEcrite({ cote }: { cote: Cote }) {
	const { grille, marques, gagnante } = traces(lire(GRILLES[cote]));
	return (
		<svg className="grille" viewBox="-4 -4 108 108" aria-hidden="true">
			<path className="traits-grille" d={grille} />
			{marques.map(({ case: i, signe, d }) => <path key={`${i}${signe}`} className={signe === 'X' ? 'signe-x' : 'signe-o'} data-case={i} d={d} />)}
			{gagnante && <path className="gagnante" d={gagnante} />}
		</svg>
	);
}

/** Ce qui est à l'écran, pour les lecteurs d'écran seulement : le mot, ou la grille case par case. */
export function annonce(etat: Etat, langue: Lang): string {
	if (etat.phase !== 'montre') return ui('papier.mot', langue);
	const cases = lire(GRILLES[etat.cote]).map((c) => ui(c === 'XO' ? 'papier.lesDeux' : c === 'X' ? 'papier.croix' : c === 'O' ? 'papier.rond' : 'papier.vide', langue));
	return `${ui('papier.grille', langue)} : ${[0, 3, 6].map((i) => cases.slice(i, i + 3).join(', ')).join(' ; ')}`;
}
