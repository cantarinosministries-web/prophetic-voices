# Gera src/data/mapas.js: contornos do Brasil (UFs) e do mundo, em SVG, para a página do Spirit Immersion.
# Fontes: npm "mapa-brasil" 1.0.6 (MIT, malha do IBGE) e "world-atlas" 2.0.2 (ISC, Natural Earth, domínio público).
import json, re, sys, math
base = sys.argv[1]; saida = sys.argv[2]
uf_json = json.load(open(f'{base}/x-mapa-brasil-1.0.6/package/data/json/federacao/br_unidades_da_federacao.json'))
svg = open(f'{base}/x-mapa-brasil-1.0.6/package/data/svg/low/federacao/br_unidades_da_federacao.svg').read()
paths = re.findall(r'<path d="([^"]+)"', svg)
assert len(paths) == len(uf_json) == 27, (len(paths), len(uf_json))
COD = {'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'}
def curto(d):
    d = re.sub(r'(\d+\.\d)\d+', r'\1', d)
    return re.sub(r'\s+', ' ', d).strip()
br = [{'uf': COD[u['CD_GEOCUF']], 'nome': u['NM_ESTADO'].title().replace(' Do ', ' do ').replace(' De ', ' de ').replace(' Da ', ' da '), 'd': curto(p)} for u, p in zip(uf_json, paths)]

topo = json.load(open(f'{base}/x-world-atlas-2.0.2/package/countries-110m.json'))
sc, tr = topo['transform']['scale'], topo['transform']['translate']
arcs = []
for a in topo['arcs']:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
    arcs.append(pts)
def arco(i):
    return arcs[i] if i >= 0 else arcs[~i][::-1]
def anel(r):
    pts = []
    for i in r:
        a = arco(i); pts.extend(a if not pts else a[1:])
    return pts
# projeção equirretangular levemente achatada, 1000 x 500, sem a Antártida
W, H = 1000, 470
def proj(lon, lat):
    return (lon + 180) / 360 * W, (83 - lat) / (83 + 58) * H
mundo = []
for g in topo['objects']['countries']['geometries']:
    nome = g['properties']['name']
    if nome == 'Antarctica' or not g.get('arcs'): continue
    polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
    d = []
    for poly in polys:
        for r in poly:
            ll = anel(r)
            lons = [q[0] for q in ll]
            if max(lons) - min(lons) > 180:  # anel que cruza o antimeridiano (Rússia, Fiji): leva o lado oeste para a direita
                ll = [(q[0] + 360 if q[0] < 0 else q[0], q[1]) for q in ll]
            pts = [proj(*p) for p in ll]
            if len(pts) < 3: continue
            d.append('M' + ' '.join(f'{x:.0f} {y:.0f}' for x, y in pts) + 'Z')
    mundo.append({'id': g.get('id'), 'nome': nome, 'd': ''.join(d)})
# pontos para países pequenos (lon, lat)
pontos = {'Brazil': proj(-47.9, -15.8), 'Portugal': proj(-9.14, 38.72), 'Japan': proj(138.0, 34.7)}
js = ('// Gerado por scripts/gerar_mapas.py (fora do site). Contornos: IBGE via npm "mapa-brasil" (MIT) e Natural Earth via npm "world-atlas" (ISC).\n'
      'export const brasil = ' + json.dumps(br, ensure_ascii=False) + ';\n'
      'export const BR_VIEW = "0 0 800 691";\n'
      'export const mundo = ' + json.dumps(mundo, ensure_ascii=False) + ';\n'
      f'export const MUNDO_VIEW = "0 0 {W} {H}";\n'
      'export const pontos = ' + json.dumps({k: [round(v[0], 1), round(v[1], 1)] for k, v in pontos.items()}) + ';\n')
open(saida, 'w').write(js)
print(len(br), len(mundo), round(len(js) / 1024), 'KB')
