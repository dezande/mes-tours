// Le journal des versions importé par la page du journal (CHANGELOG.md?raw) : sous Jest, le vrai fichier.
import { readFileSync } from 'node:fs';

export default readFileSync('CHANGELOG.md', 'utf8');
