"""
L'icône de l'app (src/assets/icons/icon.svg) : une mallette de magicien en pixel art, façon console
16 bits comme le menu, sur la nuit.

Le dessin fait 80 × 80 pixels d'art. La mallette tient au centre : les coins sont perdus par les
masques d'icône d'Android (purpose « maskable »). Les PNG de public/icons/ en sont ensuite rendus par
outils/icones-png.py.

Le script imprime aussi les morceaux de la mallette qui garnissent le menu (src/content/pixels.ts,
VALISE_*) : la poignée, un coin de laiton, un fermoir, l'étoile et deux étincelles, en grilles de
lettres de la palette du menu. Pour les changer, modifier le dessin ici et recopier la sortie.

Usage : python3 outils/icone-app.py && python3 outils/icones-png.py
"""
import math

N = 80
NUIT = '#0b0b2b'
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
CONTOUR = '#12061a'
# Le cuir rouge sombre de la mallette, de l'ombre à la lumière.
CUIR = ['#2a0a14', '#4a1222', '#6e1a30', '#8f2540', '#b13e53']
# Le laiton des coins, des fermoirs, de la poignée et de l'étoile.
OR = ['#5a3410', '#8f5a1c', '#c98c2e', '#f2c55c', '#fff0b0']

t = [[NUIT] * N for _ in range(N)]


def ramp(v, couleurs, x, y):
	"""v dans [0,1] -> une couleur de la rampe, avec tramage ordonné entre deux teintes."""
	v = max(0, min(0.9999, v)) * (len(couleurs) - 1)
	i = int(v)
	f = v - i
	seuil = (BAYER[y % 4][x % 4] + 0.5) / 16
	return couleurs[min(i + 1, len(couleurs) - 1)] if f > seuil else couleurs[i]


def dans_rectangle_arrondi(x, y, x0, y0, x1, y1, r):
	"""Le pixel (x, y) est-il dans le rectangle [x0, x1] × [y0, y1] aux coins arrondis de rayon r ?"""
	if not (x0 <= x <= x1 and y0 <= y <= y1):
		return False
	cx = min(max(x, x0 + r), x1 - r)
	cy = min(max(y, y0 + r), y1 - r)
	return (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.5


def remplir(forme, couleur):
	for y in range(N):
		for x in range(N):
			if forme(x, y):
				t[y][x] = couleur(x, y) if callable(couleur) else couleur


# ---------- Les étoiles de la nuit ----------
for x, y, c in ((9, 12, '#3a3a6e'), (70, 9, '#3a3a6e'), (6, 44, '#2a2a5a'), (74, 52, '#2a2a5a'),
                (12, 70, '#2a2a5a'), (67, 71, '#3a3a6e'), (28, 7, '#2a2a5a'), (52, 14, '#2a2a5a')):
	t[y][x] = c

# ---------- La poignée ----------
PX0, PX1, PY0, PY1 = 29, 50, 19, 31
remplir(lambda x, y: dans_rectangle_arrondi(x, y, PX0, PY0, PX1, PY1, 5), CONTOUR)
remplir(lambda x, y: dans_rectangle_arrondi(x, y, PX0 + 1, PY0 + 1, PX1 - 1, PY1 + 2, 4),
        lambda x, y: ramp(0.85 - (y - PY0) * 0.06 - (x - PX0) * 0.012, OR, x, y))
remplir(lambda x, y: dans_rectangle_arrondi(x, y, PX0 + 4, PY0 + 4, PX1 - 4, PY1 + 2, 2), CONTOUR)
remplir(lambda x, y: dans_rectangle_arrondi(x, y, PX0 + 5, PY0 + 5, PX1 - 5, PY1 + 2, 1), NUIT)

# ---------- Le corps de cuir ----------
X0, X1, Y0, Y1 = 13, 66, 29, 63
COUVERCLE = 39  # la ligne entre le couvercle et la caisse
remplir(lambda x, y: dans_rectangle_arrondi(x, y, X0, Y0, X1, Y1, 4), CONTOUR)


def cuir(x, y):
	u = (x - X0) / (X1 - X0)
	v = (y - Y0) / (Y1 - Y0)
	# La lumière vient d'en haut à gauche ; le couvercle bombé est un peu plus clair.
	lum = 0.78 - 0.45 * u - 0.35 * v + (0.12 if y < COUVERCLE else 0)
	return ramp(lum, CUIR, x, y)


remplir(lambda x, y: dans_rectangle_arrondi(x, y, X0 + 1, Y0 + 1, X1 - 1, Y1 - 1, 3), cuir)
# Le liseré clair du haut, le jour entre le couvercle et la caisse.
for x in range(X0 + 4, X1 - 3):
	t[Y0 + 1][x] = CUIR[4] if x < (X0 + X1) // 2 else CUIR[3]
	t[COUVERCLE][x] = CONTOUR
	t[COUVERCLE + 1][x] = CUIR[1]
t[COUVERCLE][X0 + 1] = t[COUVERCLE][X1 - 1] = CONTOUR

# ---------- Les coins de laiton ----------
def coin(cx, cy, sx, sy):
	for d in range(6):
		for e in range(6 - d):
			x, y = cx + sx * d, cy + sy * e
			if t[y][x] != NUIT and t[y][x] != CONTOUR:
				t[y][x] = ramp(0.95 - 0.1 * (d + e) - (0.25 if sy < 0 else 0), OR, x, y)
	# le clou du coin
	t[cy + sy * 2][cx + sx * 2] = OR[4] if sy > 0 and sx > 0 else OR[3]


coin(X0 + 1, Y0 + 1, 1, 1)
coin(X1 - 1, Y0 + 1, -1, 1)
coin(X0 + 1, Y1 - 1, 1, -1)
coin(X1 - 1, Y1 - 1, -1, -1)

# ---------- Les deux fermoirs ----------
for fx in (22, 52):
	for y in range(COUVERCLE - 3, COUVERCLE + 4):
		for x in range(fx, fx + 6):
			bord = x in (fx, fx + 5) or y in (COUVERCLE - 3, COUVERCLE + 3)
			t[y][x] = CONTOUR if bord else ramp(0.9 - 0.08 * (x - fx) - 0.06 * (y - COUVERCLE + 3), OR, x, y)
	t[COUVERCLE][fx + 2] = t[COUVERCLE][fx + 3] = OR[0]

# ---------- L'étoile d'or, sur la caisse ----------
EX, EY, ER = 39.5, 51.5, 9.0


SOMMETS = [(EX + (ER if i % 2 == 0 else 0.45 * ER) * math.sin(i * math.pi / 5),
            EY - (ER if i % 2 == 0 else 0.45 * ER) * math.cos(i * math.pi / 5)) for i in range(10)]


def dans_etoile(x, y):
	"""Une étoile à cinq branches, pointe en haut : le centre du pixel dans le polygone des sommets."""
	px, py = x + 0.5, y + 0.5
	dedans = False
	for (ax, ay), (bx, by) in zip(SOMMETS, SOMMETS[1:] + SOMMETS[:1]):
		if (ay > py) != (by > py) and px < ax + (py - ay) * (bx - ax) / (by - ay):
			dedans = not dedans
	return dedans


etoile = [[dans_etoile(x, y) for x in range(N)] for y in range(N)]
for y in range(N):
	for x in range(N):
		if not etoile[y][x] and any(0 <= y + dy < N and 0 <= x + dx < N and etoile[y + dy][x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
			t[y][x] = CONTOUR
for y in range(N):
	for x in range(N):
		if etoile[y][x]:
			t[y][x] = ramp(0.95 - 0.05 * (x - EX + 9) - 0.03 * (y - EY + 9), OR, x, y)

# ---------- Les étincelles de magie qui s'échappent ----------
def etincelle(x, y, n, coeur, branche):
	t[y][x] = coeur
	for i in range(1, n + 1):
		c = branche if i < n else OR[1] if branche == OR[3] else '#8a8ac8'
		for dx, dy in ((i, 0), (-i, 0), (0, i), (0, -i)):
			t[y + dy][x + dx] = c


etincelle(18, 17, 3, '#ffffff', OR[3])
etincelle(62, 20, 2, '#ffffff', '#d8e0ee')
etincelle(57, 11, 1, OR[4], OR[3])
etincelle(23, 9, 1, '#ffffff', '#d8e0ee')

# ---------- Le SVG : une ligne de pixels de même couleur par rectangle ----------
rects = [f'<rect x="0" y="0" width="{N}" height="{N}" fill="{NUIT}"/>']
for y in range(N):
	x = 0
	while x < N:
		c = t[y][x]
		l = 1
		while x + l < N and t[y][x + l] == c:
			l += 1
		if c != NUIT:
			rects.append(f'<rect x="{x}" y="{y}" width="{l}" height="1" fill="{c}"/>')
		x += l

ENTETE = '''<?xml version="1.0" encoding="utf-8"?>
<!--
	Icône de l'app, façon console 16 bits comme le menu : une mallette de magicien de cuir rouge,
	coins, fermoirs et étoile de laiton, d'où s'échappent des étincelles, sur la nuit.
	Engendrée par outils/icone-app.py ; public/icons/icon-192.png et icon-512.png en sont rendus (voir
	README, « Icônes »). Le dessin occupe le centre : les coins sont perdus par les masques d'icône
	d'Android (purpose « maskable »).
-->
'''
with open('src/assets/icons/icon.svg', 'w', encoding='utf-8') as f:
	f.write(ENTETE)
	f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N} {N}" width="512" height="512" shape-rendering="crispEdges">\n\t')
	f.write(''.join(rects))
	f.write('\n</svg>\n')
print(f'icon.svg : {len(rects)} rectangles')

# ---------- Les morceaux de la mallette, pour le menu (src/content/pixels.ts) ----------
# Les lettres de la palette de content/pixels.ts ; la mallette y ajoute « 4 » (son contour) et
# « 5 » (la pointe des étincelles blanches).
LETTRES = {CONTOUR: '4', '#8a8ac8': '5', OR[0]: 'm', OR[1]: 'l', OR[2]: 'k', OR[3]: 'j', OR[4]: 'i', '#ffffff': 'g', '#d8e0ee': 'F'}


def morceau(x0, y0, x1, y1, garder=lambda c: True):
	"""Le rectangle [x0, x1] × [y0, y1] du dessin, en lettres ; la nuit et ce qui n'est pas gardé, en « . »."""
	return [''.join('.' if t[y][x] == NUIT or not garder(t[y][x]) else LETTRES[t[y][x]] for x in range(x0, x1 + 1)) for y in range(y0, y1 + 1)]


# Un coin de laiton entier (celui de la mallette s'arrête au coin arrondi, que le menu dessine en CSS).
coin_plein = [['.'] * 6 for _ in range(6)]
for d in range(6):
	for e in range(6 - d):
		coin_plein[e][d] = LETTRES[ramp(0.95 - 0.1 * (d + e), OR, d, e)]
coin_plein[2][2] = LETTRES[OR[4]]

MORCEAUX = {
	'VALISE_POIGNEE': morceau(PX0, PY0, PX1, Y0 - 1),
	'VALISE_COIN': [''.join(ligne) for ligne in coin_plein],
	'VALISE_FERMOIR': morceau(22, COUVERCLE - 3, 27, COUVERCLE + 3),
	'VALISE_ETOILE': morceau(30, 42, 49, 59, lambda c: c in OR or c == CONTOUR),
	'VALISE_ETINCELLE': morceau(15, 14, 21, 20),
	'VALISE_ETINCELLE_PETITE': morceau(60, 18, 64, 22),
}
for nom, lignes in MORCEAUX.items():
	print(f'export const {nom}: readonly string[] = [')
	for ligne in lignes:
		print(f"\t'{ligne}',")
	print('];\n')
