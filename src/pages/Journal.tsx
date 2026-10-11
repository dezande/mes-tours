/*
 * LE JOURNAL DES VERSIONS, ouvert par le bouton du menu (#/journal) : ce que chaque version a
 * changé, de la plus récente à la plus ancienne, lu dans CHANGELOG.md (logic/journal.ts). Le
 * journal n'est chargé qu'à l'ouverture de la page (un fichier à part, gardé hors-ligne comme le
 * reste de l'app). Il est écrit en français : en anglais, la page le dit.
 *
 * La croix, Échap ou M ramènent à la page d'avant, comme le geste retour (useFermerPage).
 */

import { useEffect, useState } from 'preact/hooks';
import { BoutonTactile } from '../components/BoutonTactile.tsx';
import { TEXTES } from '../content/textes.ts';
import { useFermerPage } from '../hooks/useFermerPage.ts';
import { useLangue } from '../langue/LangueContext.tsx';
import { lireJournal, segments, type Version } from '../logic/journal.ts';

/** Du texte, avec son gras et son code. */
function Texte({ texte }: { texte: string }) {
	return <>{segments(texte).map((s, i) => (s.gras ? <strong key={i}>{s.texte}</strong> : s.code ? <code key={i}>{s.texte}</code> : s.texte))}</>;
}

export function Journal({ depuisLApp }: { depuisLApp: boolean }) {
	const { langue } = useLangue();
	const [versions, setVersions] = useState<Version[] | null>(null);

	useEffect(() => {
		let actif = true;
		void import('../../CHANGELOG.md?raw').then(({ default: md }) => {
			if (actif) setVersions(lireJournal(md));
		});
		return () => {
			actif = false;
		};
	}, []);

	const fermer = useFermerPage(depuisLApp);

	return (
		<main id="journal">
			<header>
				<h1>{TEXTES.journal[langue]}</h1>
				<BoutonTactile id="journal-fermer" aria-label={TEXTES.fermer[langue]} onAction={fermer}>×</BoutonTactile>
			</header>
			{langue !== 'fr' && <p className="journal-langue">{TEXTES.journalEnFrancais[langue]}</p>}
			{versions?.map((version) => (
				<section key={version.numero} className="version" data-version={version.numero}>
					<h2>
						{version.date ? version.numero : TEXTES.prochaineVersion[langue]}
						{version.date && <span className="date">{version.date}</span>}
					</h2>
					{version.blocs.map((bloc, b) => (bloc.type === 'paragraphe'
						? <p key={b} className="detail"><Texte texte={bloc.texte} /></p>
						: (
							<ul key={b}>
								{bloc.points.map((point, p) => (
									<li key={p}>
										<Texte texte={point.texte} />
										{point.sous.length > 0 && <ul>{point.sous.map((sous, s) => <li key={s}><Texte texte={sous} /></li>)}</ul>}
									</li>
								))}
							</ul>
						)))}
				</section>
			))}
		</main>
	);
}
