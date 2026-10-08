// Serveur local (outils/static-server.ts) : fichiers servis, types, 404, et surtout aucun accès
// en dehors du dossier servi, même avec des adresses piégées.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStaticServer, type StaticServer } from '../../outils/static-server.ts';

let root: string;
let server: StaticServer;

beforeAll(async () => {
	root = mkdtempSync(join(tmpdir(), 'mes-tours-server-'));
	mkdirSync(join(root, 'dist', 'images'), { recursive: true });
	writeFileSync(join(root, 'dist', 'index.html'), '<!doctype html><title>app</title>');
	writeFileSync(join(root, 'dist', 'app.js'), 'console.log(1);');
	writeFileSync(join(root, 'dist', 'images', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
	// Fichier voisin du dossier servi : ne doit jamais être lisible.
	writeFileSync(join(root, 'secret.txt'), 'SECRET');
	server = await startStaticServer(join(root, 'dist'), 0);
});

afterAll(async () => {
	await server?.close();
	rmSync(root, { recursive: true, force: true });
});

/** Requête HTTP brute, sans normalisation de l'adresse par le client. */
function rawGet(path: string, method = 'GET'): Promise<{ status: number; body: string }> {
	const { port } = new URL(server.url);
	return new Promise((resolve, reject) => {
		const socket = connect(Number(port), 'localhost', () => {
			socket.write(`${method} ${path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`);
		});
		let data = '';
		socket.on('data', (chunk) => { data += chunk.toString(); });
		socket.on('end', () => {
			const status = Number(data.match(/^HTTP\/1\.1 (\d{3})/)?.[1] ?? 0);
			resolve({ status, body: data.split('\r\n\r\n').slice(1).join('\r\n\r\n') });
		});
		socket.on('error', reject);
	});
}

test('sert les fichiers avec le bon type, index.html pour un dossier, query string ignorée', async () => {
	const index = await fetch(server.url);
	expect(index.status).toBe(200);
	expect(index.headers.get('content-type') ?? '').toMatch(/^text\/html/);
	expect(index.headers.get('cache-control')).toBe('no-store');
	expect(await index.text()).toMatch(/<title>app<\/title>/);

	const js = await fetch(new URL('app.js?v=3', server.url));
	expect(js.headers.get('content-type') ?? '').toMatch(/^text\/javascript/);
	const svg = await fetch(new URL('images/logo.svg', server.url));
	expect(svg.headers.get('content-type')).toBe('image/svg+xml');
});

test('fichier absent : 404', async () => {
	expect((await fetch(new URL('absent.js', server.url))).status).toBe(404);
});

test('HEAD : en-têtes sans contenu', async () => {
	const response = await rawGet('/app.js', 'HEAD');
	expect(response.status).toBe(200);
	expect(response.body).toBe('');
});

test('adresses piégées : jamais de fichier hors du dossier servi', async () => {
	for (const path of ['/../secret.txt', '/images/../../secret.txt', '/%2e%2e/secret.txt', '/%2e%2e%2fsecret.txt', '/..%5csecret.txt', '//../secret.txt']) {
		const response = await rawGet(path);
		expect(response.status, `${path} ne doit pas être servi`).not.toBe(200);
		expect(response.body, `${path} ne doit pas révéler le fichier`).not.toMatch(/SECRET/);
	}
});

test('adresse mal encodée : 404, et le serveur continue de répondre', async () => {
	expect((await rawGet('/%E0%A4%A')).status).toBe(404);
	expect((await fetch(server.url)).status).toBe(200);
});
