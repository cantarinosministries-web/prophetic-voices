// Referências de um artigo da revista em ABNT (NBR 6023), SBL e APA (7ª ed.).
// Usado na página do artigo ("Como citar") e na Biblioteca do leitor (citações guardadas).
const DOM = 'https://thepropheticvoices.com.br';
const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

const cap = (s) => s.toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const iniciais = (nomes) => nomes.split(/\s+/).filter(Boolean).map((n) => (/^[A-Z]\.$/.test(n) ? n : n[0].toUpperCase() + '.')).join(' ');

// "WALKER, Dean A.; MATTERA, Joseph" -> [{ sobrenome: 'WALKER', nome: 'Dean A.' }, ...]; entidade sem vírgula -> { entidade }
function pessoas(a) {
  let base = String(a.autor_citacao || '').trim();
  if (/\p{Ll}\.$/u.test(base)) base = base.slice(0, -1); // "JASTROW JR., Morris." -> sem o ponto final; iniciais ("Dean A.") ficam
  if (!base) return [{ entidade: a.autor }];
  return base.split(';').map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf(',');
    if (i < 0) return { entidade: p };
    return { sobrenome: p.slice(0, i).trim(), nome: p.slice(i + 1).trim() };
  });
}

function autorABNT(a) {
  return pessoas(a).map((p) => (p.entidade ? p.entidade.toUpperCase() : `${p.sobrenome.toUpperCase()}, ${p.nome}`)).join('; ');
}
function autorAPA(a) {
  const ps = pessoas(a);
  if (ps.some((p) => p.entidade)) return a.autor;
  const f = ps.map((p) => `${cap(p.sobrenome)}, ${iniciais(p.nome)}`);
  return f.length === 1 ? f[0] : f.slice(0, -1).join(', ') + ', & ' + f[f.length - 1];
}
function autorSBL(a) {
  const ps = pessoas(a);
  if (ps.some((p) => p.entidade)) return a.autor;
  const f = ps.map((p, i) => (i === 0 ? `${cap(p.sobrenome)}, ${p.nome}` : `${p.nome} ${cap(p.sobrenome)}`));
  return f.length === 1 ? f[0] : f.slice(0, -1).join(', ') + ', and ' + f[f.length - 1];
}
// chamada no texto: (WALKER, 2026, p. 3)
export function chamada(a, pagina) {
  const ps = pessoas(a);
  const nomes = ps.map((p) => (p.entidade ? p.entidade.toUpperCase() : p.sobrenome.toUpperCase())).join('; ');
  return `(${nomes}, ${anoRevista(a)}${pagina ? `, p. ${pagina}` : ''})`;
}

const anoRevista = (a) => (a.publicado_em || '').slice(0, 4) || a.ano || String(new Date().getFullYear());
const ponto = (s) => (/[.?!]$/.test(s) ? s : s + '.');
const tradutorAPA = (t) => { const p = t.trim().split(/\s+/); return p.length > 1 ? `${iniciais(p.slice(0, -1).join(' '))} ${p[p.length - 1]}` : t; };

export function referencias(a, hoje = new Date()) {
  const url = `${DOM}/artigos/${a.slug}.html`;
  const trad = a.tipo === 'traducao' && a.tradutor;
  const ano = anoRevista(a);
  const d = new Date(hoje.getTime() - 3 * 3600e3);
  const acesso = `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const titulo = a.titulo;

  const origABNT = a.periodico
    ? ` Original: ${a.periodico}${a.volume ? `, v. ${a.volume}` : ''}${a.numero ? `, n. ${a.numero}` : ''}${a.paginas_original ? `, p. ${a.paginas_original}` : ''}, ${a.mes ? a.mes + ' ' : ''}${a.ano}.`
    : '';
  const abnt = `${ponto(autorABNT(a))} ${ponto(titulo)}${trad ? ` Tradução de ${a.tradutor}.` : ''} Revista The Prophetic Voices, ${ano}. Disponível em: ${url}. Acesso em: ${acesso}.${trad ? origABNT : ''}`;

  const apa = `${ponto(autorAPA(a))} (${ano}). ${titulo}${trad ? ` (${tradutorAPA(a.tradutor)}, Trad.)` : ''}. Revista The Prophetic Voices. ${url}${trad && a.ano ? ` (Obra original publicada em ${a.ano})` : ''}`;

  const volnum = a.volume ? ` ${a.volume}${a.numero ? '.' + a.numero : ''}` : '';
  const origSBL = a.periodico ? ` Publicado originalmente em ${a.periodico}${volnum} (${a.ano})${a.paginas_original ? `: ${a.paginas_original}` : ''}.` : '';
  const sbl = `${ponto(autorSBL(a))} “${ponto(titulo)}”${trad ? ` Traduzido por ${a.tradutor}.` : ''} Revista The Prophetic Voices (${ano}). ${url}.${trad ? origSBL : ''}`;

  return { abnt, sbl, apa };
}
