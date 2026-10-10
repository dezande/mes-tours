/*
 * Les réglages des trois questions, ouverts par l'écrou ⚙ du menu principal : la routine en bref, la
 * carte du spectateur qu'on retourne ou non,
 * l'ordre du paquet (pour un chapelet mémorisé), la couleur du dos (choisie en regardant, comme dans
 * les autres tours de cartes), la vibration du code écarté, la jauge de l'appui long, les réglages
 * par défaut.
 *
 * L'ordre s'écrit en abrégé (logic/paquet.ts : lireOrdre). Il n'est enregistré que complet et juste :
 * tant qu'il ne l'est pas, les fautes sont dites sous le champ, et l'ordre d'avant reste celui du tour.
 * Le champ vide, le paquet est mélangé à chaque nouvelle routine (par défaut).
 */

import { useEffect, useState } from 'preact/hooks';
import { ChoixIllustre } from '../../../components/cartes/ChoixIllustre.tsx';
import { Interrupteur, PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { Dos } from '../../princesse/components/DessinsDeCarte.tsx';
import { texteDeLaFaute, ui } from '../content/interface.ts';
import { ecrireOrdre, lireOrdre } from '../logic/paquet.ts';
import { COULEURS, type Couleur, type Settings } from '../logic/settings.ts';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
}

/** Une petite carte face en bas, dans la couleur demandée. */
function Vignette({ couleur }: { couleur: Couleur }) {
	return (
		<span className="vignette" data-couleur={couleur}>
			<Dos />
		</span>
	);
}

/**
 * L'ordre du paquet, écrit en abrégé : enregistré dès qu'il est complet et juste. Vide, le paquet est
 * mélangé à chaque nouvelle routine.
 */
function OrdreDuPaquet({ ordre, langue, changer }: { ordre: readonly string[] | null; langue: Lang; changer: (ordre: string[] | null) => void }) {
	const ecrit = (o: readonly string[] | null): string => (o ? ecrireOrdre(o, langue) : '');
	const [texte, setTexte] = useState(() => ecrit(ordre));
	// Un autre ordre enregistré (réglages par défaut, langue changée) : le champ le reprend.
	useEffect(() => {
		const lu = texte.trim() === '' ? null : lireOrdre(texte, langue).ordre;
		if (lu?.join() !== ordre?.join()) setTexte(ecrit(ordre));
		// Seulement quand l'ordre enregistré ou la langue changent, pas à chaque lettre tapée.
	}, [ordre, langue]);

	const vide = texte.trim() === '';
	const { ordre: lu, fautes } = lireOrdre(texte, langue);
	const ecrire = (suivant: string): void => {
		setTexte(suivant);
		if (suivant.trim() === '') {
			if (ordre) changer(null);
			return;
		}
		const { ordre: valide } = lireOrdre(suivant, langue);
		if (valide && valide.join() !== ordre?.join()) changer(valide);
	};

	return (
		<>
			<textarea
				id="ordre-paquet"
				rows={6}
				spellcheck={false}
				autocapitalize="characters"
				autocomplete="off"
				aria-label={ui('menu.ordre', langue)}
				aria-invalid={!vide && !lu}
				placeholder={ui('menu.ordreVide', langue)}
				value={texte}
				onInput={(event) => ecrire(event.currentTarget.value)}
			/>
			<div id="ordre-etat" className={`hint${vide || lu ? '' : ' fautes'}`} aria-live="polite">
				{vide
					? <p>{ui('menu.ordreMelange', langue)}</p>
					: lu
						? <p>{ui('menu.ordreBon', langue)}</p>
						: <>{fautes.map((faute, i) => <p key={i}>{texteDeLaFaute(faute, langue)}</p>)}<p>{ui('faute.attente', langue)}</p></>}
			</div>
			<button type="button" id="ordre-melange" hidden={vide} onClick={() => ecrire('')}>{ui('menu.ordreEffacer', langue)}</button>
		</>
	);
}

export function Reglages({ reglages, langue, enregistrer }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });

	return (
		<PanneauReglages
			aide={ui('menu.aides', langue)}
			jauge={{ libelle: ui('menu.jauge', langue), visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			defauts={{ libelle: ui('menu.defauts', langue), retablir: () => enregistrer(null) }}
			// Le signal du code écarté est pour l'artiste seul : il rejoint les aides.
			autresAides={<>
				<Interrupteur id="vibration" libelle={ui('menu.vibration', langue)} coche={reglages.vibration} changer={(vibration) => changer({ vibration })} />
				<p className="hint" id="vibration-aide">{ui('menu.vibrationAide', langue)}</p>
			</>}
		>
			<div className="card" id="trucage">
				<div className="row-label">{ui('menu.routine', langue)}</div>
				<p className="hint">{ui('menu.routineQuestions', langue)}</p>
				<p className="hint">{ui('menu.routineRevelation', langue)}</p>
			</div>

			<div className="card" id="revelation">
				<div className="row-label">{ui('menu.revelation', langue)}</div>
				<Interrupteur id="carte-retournable" libelle={ui('menu.retournable', langue)} coche={reglages.retournable} changer={(retournable) => changer({ retournable })} />
				<p className="hint" id="retournable-aide">{ui('menu.retournableAide', langue)}</p>
			</div>

			<div className="card" id="ordre">
				<div className="row-label">{ui('menu.ordre', langue)}</div>
				<p className="hint">{ui('menu.ordreAide', langue)}</p>
				<OrdreDuPaquet ordre={reglages.ordre} langue={langue} changer={(ordre) => changer({ ordre })} />
			</div>

			{/* Le dos est une photo : seule sa couleur se choisit, en regardant la carte telle qu'elle sera. */}
			<div className="card">
				<div className="row-label">{ui('menu.couleur', langue)}</div>
				<ChoixIllustre
					id="couleur-choix"
					etiquette={ui('menu.couleur', langue)}
					couleurs
					valeurs={COULEURS}
					choisie={reglages.couleur}
					nom={(couleur) => ui(`couleur.${couleur}`, langue)}
					apercu={(couleur) => <Vignette couleur={couleur} />}
					choisir={(couleur) => changer({ couleur })}
				/>
			</div>

		</PanneauReglages>
	);
}
