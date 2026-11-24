// Spirit Immersion — movimento de oração em línguas, 1 hora por dia (página /spirit-immersion.html).
// Edição 2027: 100 dias, de 1º de janeiro a 10 de abril de 2027 (horário de Brasília).
//   /api/conta/spirit...        área do participante (já com o leitor logado; chamado por apiLeitores)
//   /api/publico/spirit         número de inscritos (para a página pública)
//   /api/spirit...              painel da equipe (editor e acima)
//   /arquivos/spirit/...        PDFs dos devocionais: só participantes inscritos e a equipe logada
// Registro de oração e testemunhos são dados sobre a fé (sensíveis, LGPD art. 11): exigem aceite destacado
// e cada testemunho tem a própria autorização (só equipe / publicar sem identificar / publicar com o nome).
import { json, erro, aleatorio } from './seguranca.js';
import { emailConfigurado, enviarEmail, moldura } from './emails.js';
import { esc } from './paginas.js';

export const EDICAO = { id: '2027', inicio: '2027-01-01', dias: 100, inscricoes_desde: '2026-11-24' };
const DOM = 'https://thepropheticvoices.com.br';
const MAX_TESTEMUNHO = 4000;
const AUT = ['equipe', 'anonimo', 'nome'];
const LOTE = 150, PARALELO = 6, MAX_TENTATIVAS = 3;

async function corpo(req) { try { return await req.json(); } catch (e) { return {}; } }

// data de hoje em Brasília (UTC-3, sem horário de verão)
export const hojeBrasilia = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const diaDe = (data, ed = EDICAO) => Math.floor((Date.parse(data + 'T00:00:00Z') - Date.parse(ed.inicio + 'T00:00:00Z')) / 86400e3) + 1;
const dataDoDia = (n, ed = EDICAO) => new Date(Date.parse(ed.inicio + 'T00:00:00Z') + (n - 1) * 86400e3).toISOString().slice(0, 10);
export function situacao(ed = EDICAO) {
  const hoje = diaDe(hojeBrasilia(), ed);
  return { ...ed, fim: dataDoDia(ed.dias, ed), hoje: hojeBrasilia(), dia_atual: hoje, // <1: ainda não começou; >dias: terminou
    fase: hoje < 1 ? 'antes' : hoje > ed.dias ? 'depois' : 'durante' };
}
// último dia que o participante já pode marcar
const ultimoMarcavel = (s) => Math.min(Math.max(s.dia_atual, 0), s.dias);

const participante = (env, leitorId, ed = EDICAO.id) =>
  env.DB.prepare('SELECT * FROM si_participantes WHERE leitor_id = ? AND edicao = ?').bind(leitorId, ed).first();

// ---------------------------------------------------------------- área do participante
export async function apiSpiritLeitor(req, env, url, seg, l) {
  const m = req.method;
  const acao = seg[2]; // seg = ['conta', 'spirit', acao?]
  const s = situacao();
  const p = await participante(env, l.id);

  if (!acao && m === 'GET') {
    if (!p) return json({ edicao: s, inscrito: false });
    const [dias, devs] = await Promise.all([
      env.DB.prepare('SELECT dia, orou, testemunho, autorizacao, atualizado_em FROM si_dias WHERE leitor_id = ? AND edicao = ? ORDER BY dia').bind(l.id, s.id).all(),
      env.DB.prepare("SELECT id, titulo, resumo, liberar_em, pdf_url FROM si_devocionais WHERE edicao = ? AND status = 'publicado' AND pdf_url IS NOT NULL AND liberar_em <= ? ORDER BY liberar_em DESC, id DESC").bind(s.id, s.hoje).all(),
    ]);
    return json({ edicao: s, inscrito: true, inscrito_em: p.inscrito_em, devocionais_email: !!p.devocionais_email, email: l.email || null,
      email_servico: emailConfigurado(env), dias: dias.results, devocionais: devs.results });
  }

  if (acao === 'inscrever' && m === 'POST') {
    const b = await corpo(req);
    if (!b.consentimento) return erro('Para participar, marque que concorda com o registro da sua jornada de oração.');
    if (s.fase === 'depois') return erro('Esta edição do Spirit Immersion já terminou.');
    if (!p) {
      await env.DB.prepare("INSERT INTO si_participantes (leitor_id, edicao, devocionais_email, consentimento_em) VALUES (?,?,?,datetime('now'))")
        .bind(l.id, s.id, b.devocionais === false ? 0 : 1).run();
    }
    return json({ ok: true, ja: !!p }, p ? 200 : 201);
  }

  if (!p) return erro('Você ainda não está inscrito no Spirit Immersion.', 403);

  if (acao === 'devocionais' && m === 'POST') {
    await env.DB.prepare('UPDATE si_participantes SET devocionais_email = ? WHERE leitor_id = ? AND edicao = ?').bind((await corpo(req)).receber ? 1 : 0, l.id, s.id).run();
    return json({ ok: true });
  }

  if (acao === 'dia' && m === 'POST') {
    const b = await corpo(req);
    const dia = parseInt(b.dia, 10);
    if (!(dia >= 1 && dia <= s.dias)) return erro('Dia inválido.');
    if (dia > ultimoMarcavel(s)) return erro(s.fase === 'antes' ? 'A jornada ainda não começou.' : 'Este dia ainda não chegou.');
    const testemunho = String(b.testemunho || '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (testemunho.length > MAX_TESTEMUNHO) return erro(`O testemunho pode ter até ${MAX_TESTEMUNHO} caracteres.`);
    const aut = AUT.includes(b.autorizacao) ? b.autorizacao : 'equipe';
    const orou = b.orou ? 1 : 0;
    if (!orou && !testemunho) await env.DB.prepare('DELETE FROM si_dias WHERE leitor_id = ? AND edicao = ? AND dia = ?').bind(l.id, s.id, dia).run();
    else await env.DB.prepare(
      `INSERT INTO si_dias (leitor_id, edicao, dia, orou, testemunho, autorizacao) VALUES (?,?,?,?,?,?)
       ON CONFLICT (leitor_id, edicao, dia) DO UPDATE SET orou = excluded.orou, testemunho = excluded.testemunho, autorizacao = excluded.autorizacao, atualizado_em = datetime('now')`,
    ).bind(l.id, s.id, dia, orou, testemunho || null, aut).run();
    return json({ ok: true });
  }

  if (acao === 'sair' && m === 'POST') {
    // sair do movimento apaga a inscrição e todo o registro desta edição (dias e testemunhos)
    await env.DB.batch([
      env.DB.prepare('DELETE FROM si_dias WHERE leitor_id = ? AND edicao = ?').bind(l.id, s.id),
      env.DB.prepare('DELETE FROM si_envios WHERE leitor_id = ?').bind(l.id),
      env.DB.prepare('DELETE FROM si_participantes WHERE leitor_id = ? AND edicao = ?').bind(l.id, s.id),
    ]);
    return json({ ok: true });
  }
  return erro('Rota não encontrada.', 404);
}

export async function spiritPublico(env) {
  const n = (await env.DB.prepare('SELECT COUNT(*) n FROM si_participantes WHERE edicao = ?').bind(EDICAO.id).first()).n;
  return json({ edicao: situacao(), inscritos: n }, 200, { 'Cache-Control': 'public, max-age=120' });
}

export async function participanteAtivo(env, leitorId) { return !!(await participante(env, leitorId)); }

// ---------------------------------------------------------------- painel
export async function apiSpiritPainel(req, env, url, seg, u, { registrar }) {
  const m = req.method;
  const s = situacao();
  const q = (sql, ...b) => env.DB.prepare(sql).bind(...b).all().then((r) => r.results);

  if (!seg.length && m === 'GET') {
    const [part, porDia, devs, tes, fila] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) n, SUM(devocionais_email) dev FROM si_participantes WHERE edicao = ?').bind(s.id).first(),
      q('SELECT dia, SUM(orou) orou, SUM(testemunho IS NOT NULL) tes FROM si_dias WHERE edicao = ? GROUP BY dia ORDER BY dia', s.id),
      q(`SELECT d.*, (SELECT COUNT(*) FROM si_envios e WHERE e.devocional_id = d.id AND e.status = 'enviado') enviados,
                (SELECT COUNT(*) FROM si_envios e WHERE e.devocional_id = d.id) total_envio
         FROM si_devocionais d WHERE edicao = ? ORDER BY liberar_em, id`, s.id),
      q(`SELECT d.dia, d.testemunho, d.autorizacao, d.atualizado_em, l.nome, l.email FROM si_dias d JOIN leitores l ON l.id = d.leitor_id
         WHERE d.edicao = ? AND d.testemunho IS NOT NULL ORDER BY d.atualizado_em DESC LIMIT 500`, s.id),
      env.DB.prepare("SELECT COUNT(*) n FROM si_envios WHERE status = 'fila'").first(),
    ]);
    const dias = (await env.DB.prepare('SELECT leitor_id, SUM(orou) n FROM si_dias WHERE edicao = ? GROUP BY leitor_id').bind(s.id).all()).results;
    return json({ edicao: s, participantes: part.n, com_email: part.dev || 0, por_dia: porDia, devocionais: devs, testemunhos: tes,
      dias_orados_total: dias.reduce((t, x) => t + x.n, 0), na_fila: fila.n, email_servico: emailConfigurado(env) });
  }

  if (seg[0] === 'devocionais') {
    const id = parseInt(seg[1], 10);
    if (!seg[1] && m === 'POST') {
      const b = await corpo(req);
      const titulo = String(b.titulo || '').trim();
      if (!titulo) return erro('Dê um título ao devocional.');
      const data = /^\d{4}-\d{2}-\d{2}$/.test(b.liberar_em || '') ? b.liberar_em : s.hoje;
      const r = await env.DB.prepare('INSERT INTO si_devocionais (edicao, titulo, resumo, liberar_em, criado_por) VALUES (?,?,?,?,?) RETURNING id')
        .bind(s.id, titulo.slice(0, 200), String(b.resumo || '').trim().slice(0, 1000) || null, data, u.id).first();
      await registrar(env, u, 'criou o devocional', titulo, 'Spirit Immersion');
      return json({ id: r.id }, 201);
    }
    const d = id && (await env.DB.prepare('SELECT * FROM si_devocionais WHERE id = ?').bind(id).first());
    if (!d) return erro('Devocional não encontrado.', 404);
    if (!seg[2] && m === 'PUT') {
      const b = await corpo(req);
      const titulo = String(b.titulo || '').trim() || d.titulo;
      const data = /^\d{4}-\d{2}-\d{2}$/.test(b.liberar_em || '') ? b.liberar_em : d.liberar_em;
      await env.DB.prepare("UPDATE si_devocionais SET titulo = ?, resumo = ?, liberar_em = ?, atualizado_em = datetime('now') WHERE id = ?")
        .bind(titulo.slice(0, 200), String(b.resumo ?? d.resumo ?? '').trim().slice(0, 1000) || null, data, id).run();
      return json({ ok: true });
    }
    if (seg[2] === 'status' && m === 'POST') {
      const st = (await corpo(req)).status === 'publicado' ? 'publicado' : 'rascunho';
      if (st === 'publicado' && !d.pdf_url) return erro('Envie o PDF antes de publicar.');
      await env.DB.prepare("UPDATE si_devocionais SET status = ?, atualizado_em = datetime('now') WHERE id = ?").bind(st, id).run();
      await registrar(env, u, st === 'publicado' ? 'publicou o devocional' : 'tirou do ar o devocional', d.titulo, 'Spirit Immersion');
      if (st === 'publicado') await enfileirarDevocionais(env);
      return json({ ok: true });
    }
    if (seg[2] === 'pdf' && m === 'POST') {
      if ((req.headers.get('Content-Type') || '').split(';')[0] !== 'application/pdf') return erro('Envie um arquivo PDF.');
      const buf = await req.arrayBuffer();
      if (!buf.byteLength || buf.byteLength > 40 * 1024 * 1024) return erro('Arquivo vazio ou maior que 40 MB.');
      if (new TextDecoder().decode(new Uint8Array(buf.slice(0, 5))) !== '%PDF-') return erro('O arquivo não parece ser um PDF.');
      const chave = `spirit/devocional-${d.id}-${aleatorio(6)}.pdf`;
      await env.ARQUIVOS.put(chave, buf, { httpMetadata: { contentType: 'application/pdf' } });
      if (d.pdf_url && d.pdf_url.startsWith('/arquivos/')) await env.ARQUIVOS.delete(d.pdf_url.slice('/arquivos/'.length));
      await env.DB.prepare("UPDATE si_devocionais SET pdf_url = ?, atualizado_em = datetime('now') WHERE id = ?").bind('/arquivos/' + chave, id).run();
      await registrar(env, u, 'enviou o PDF do devocional', d.titulo, 'Spirit Immersion');
      return json({ ok: true });
    }
    if (!seg[2] && m === 'DELETE') {
      if (d.pdf_url && d.pdf_url.startsWith('/arquivos/')) await env.ARQUIVOS.delete(d.pdf_url.slice('/arquivos/'.length));
      await env.DB.prepare('DELETE FROM si_devocionais WHERE id = ?').bind(id).run();
      await registrar(env, u, 'apagou o devocional', d.titulo, 'Spirit Immersion');
      return json({ ok: true });
    }
  }
  return erro('Rota não encontrada.', 404);
}

// ---------------------------------------------------------------- PDFs dos devocionais
export async function pdfDevocional(env, req, chave, { leitor, equipe }) {
  const d = await env.DB.prepare('SELECT * FROM si_devocionais WHERE pdf_url = ?').bind('/arquivos/' + chave).first();
  if (!d) return null;
  const liberado = d.status === 'publicado' && d.liberar_em <= hojeBrasilia();
  if (!equipe && !(leitor && liberado && (await participante(env, leitor.id, d.edicao)))) return 'negado';
  return env.ARQUIVOS.get(chave);
}

// ---------------------------------------------------------------- e-mails dos devocionais
// Roda no cron (a cada 10 min) e ao publicar: devocional publicado e já liberado entra na fila uma única vez.
export async function enfileirarDevocionais(env) {
  if (!emailConfigurado(env)) return;
  const hoje = hojeBrasilia();
  const prontos = (await env.DB.prepare("SELECT * FROM si_devocionais WHERE status = 'publicado' AND pdf_url IS NOT NULL AND enfileirado_em IS NULL AND liberar_em <= ?").bind(hoje).all()).results;
  for (const d of prontos) {
    await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO si_envios (devocional_id, leitor_id) SELECT ?, p.leitor_id FROM si_participantes p JOIN leitores l ON l.id = p.leitor_id WHERE p.edicao = ? AND p.devocionais_email = 1 AND l.email IS NOT NULL AND l.bloqueado = 0").bind(d.id, d.edicao),
      env.DB.prepare("UPDATE si_devocionais SET enfileirado_em = datetime('now') WHERE id = ?").bind(d.id),
    ]);
  }
}

function emailDevocional(d, l) {
  const link = `${DOM}/conta.html#spirit`;
  const resumo = d.resumo ? esc(d.resumo).split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`).join('') : '';
  return {
    assunto: `Spirit Immersion · ${d.titulo}`,
    html: moldura({
      previa: (d.resumo || 'Um novo devocional está disponível na sua jornada.').slice(0, 140), eyebrow: 'Spirit Immersion · Devocional', titulo: d.titulo, link, botao: 'Abrir o devocional (PDF)',
      corpo: `<p style="margin:0 0 14px">Olá, ${esc(String(l.nome || '').split(' ')[0])}. Um novo devocional da sua jornada de oração está disponível.</p>${resumo}<p style="margin:0">O PDF fica na sua conta, na aba Spirit Immersion, onde você também marca os dias de oração.</p>`,
      rodape: `Você recebe este e-mail porque se inscreveu no Spirit Immersion e pediu os devocionais por e-mail. <a href="${link}" style="color:#F8E9B7">Parar de receber</a> · <a href="${DOM}/privacidade.html" style="color:#F8E9B7">Política de Privacidade</a>`,
    }),
    texto: `SPIRIT IMMERSION · DEVOCIONAL\n\n${d.titulo}\n\n${d.resumo || ''}\n\nAbrir na sua conta: ${link}\n\n--\nPara parar de receber os devocionais por e-mail, desmarque a opção na aba Spirit Immersion da sua conta.`,
  };
}

export async function processarFilaSpirit(env, limite = LOTE) {
  if (!emailConfigurado(env)) return { enviados: 0 };
  await enfileirarDevocionais(env);
  const lista = (await env.DB.prepare(
    `SELECT e.devocional_id, e.leitor_id, e.tentativas, l.email, l.nome, p.devocionais_email
     FROM si_envios e JOIN leitores l ON l.id = e.leitor_id JOIN si_devocionais d ON d.id = e.devocional_id
     LEFT JOIN si_participantes p ON p.leitor_id = e.leitor_id AND p.edicao = d.edicao
     WHERE e.status = 'fila' ORDER BY e.devocional_id, e.leitor_id LIMIT ?`,
  ).bind(limite).all()).results;
  const cache = {};
  let enviados = 0;
  const um = async (x) => {
    const marcar = (st, err) => env.DB.prepare(`UPDATE si_envios SET status = ?, tentativas = tentativas + 1, erro = ?${st === 'enviado' ? ", enviado_em = datetime('now')" : ''} WHERE devocional_id = ? AND leitor_id = ?`)
      .bind(st, err || null, x.devocional_id, x.leitor_id).run();
    if (!(x.devocional_id in cache)) cache[x.devocional_id] = await env.DB.prepare("SELECT * FROM si_devocionais WHERE id = ? AND status = 'publicado'").bind(x.devocional_id).first();
    const d = cache[x.devocional_id];
    if (!d || !x.devocionais_email || !x.email) return marcar('cancelado', !d ? 'devocional retirado' : 'participante não quer mais e-mails');
    const msg = emailDevocional(d, x);
    try {
      await enviarEmail(env, { para: x.email, assunto: msg.assunto, html: msg.html, texto: msg.texto });
      enviados++;
      return marcar('enviado');
    } catch (e) {
      return marcar(x.tentativas + 1 >= MAX_TENTATIVAS ? 'falha' : 'fila', String(e && e.message || e).slice(0, 300));
    }
  };
  for (let k = 0; k < lista.length; k += PARALELO) await Promise.all(lista.slice(k, k + PARALELO).map(um));
  return { enviados };
}
