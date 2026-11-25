// Spirit Immersion — movimento de oração em línguas, 1 hora por dia (página /spirit-immersion.html).
// Edição 2027: 100 dias, de 1º de janeiro a 10 de abril de 2027 (horário de Brasília).
//   /api/conta/spirit...        área do participante (já com o leitor logado; chamado por apiLeitores)
//   /api/publico/spirit         número de inscritos (para a página pública)
//   /api/spirit...              painel da equipe (editor e acima)
//   /arquivos/spirit/...        PDFs dos devocionais (quando houver): só participantes inscritos e a equipe logada
// Devocionais em texto (desde 25/11/2026): lidos na própria conta; a API só entrega os já liberados (hoje e anteriores).
// Registro de oração e testemunhos são dados sobre a fé (sensíveis, LGPD art. 11): exigem aceite destacado
// e cada testemunho tem a própria autorização (só equipe / publicar sem identificar / publicar com o nome).
import { json, erro, aleatorio } from './seguranca.js';
import { emailConfigurado, enviarEmail, moldura } from './emails.js';
import { esc } from './paginas.js';

// Ciclo 2027 (decisão do Gabriel, 24/11/2026): 31 dias de PREPARAÇÃO em dezembro, em quatro jornadas de tempo
// crescente (15 min, 30 min, 45 min, 1 h), e depois a JORNADA de 100 dias (1 h por dia), que a pessoa aceita ao fim
// da preparação. Cada etapa tem a sua "edicao" no banco (os dias marcados ficam separados); o diário é um só por ciclo.
export const EDICAO = {
  id: '2027', inicio: '2027-01-01', dias: 100, minutos: 60, inscricoes_desde: '2026-11-24',
  prep: { id: '2027-prep', inicio: '2026-12-01', dias: 31,
    blocos: [{ n: 1, de: 1, ate: 8, minutos: 15 }, { n: 2, de: 9, ate: 16, minutos: 30 }, { n: 3, de: 17, ate: 24, minutos: 45 }, { n: 4, de: 25, ate: 31, minutos: 60 }] },
};
export const EDICOES = [EDICAO.id, EDICAO.prep.id];
const ACEITE_A_PARTIR = 25; // o convite para os 100 dias aparece na 4ª jornada da preparação
const DOM = 'https://thepropheticvoices.com.br';
const MAX_TESTEMUNHO = 4000;
const AUT = ['equipe', 'anonimo', 'nome'];
const AUT_DIARIO = ['privado', 'equipe', 'anonimo', 'nome'];
const TIPOS = ['testemunho', 'profetica', 'ouvi', 'texto', 'oracao', 'outro'];
const MAX_DIARIO = 10000;
const LOTE = 150, PARALELO = 6, MAX_TENTATIVAS = 3;
const MAX_DEVOCIONAL = 30000;
// texto do devocional (lido na conta): marcações simples — '> ' epígrafe, '>> ' autor, '» ' versículo, '»» ' referência,
// '- ' item de lista, 'Oração: ' oração final; parágrafos separados por linha em branco
const textoDev = (v) => String(v || '').replace(/\r\n?/g, '\n').trim().slice(0, MAX_DEVOCIONAL) || null;

async function corpo(req) { try { return await req.json(); } catch (e) { return {}; } }

// data de hoje em Brasília (UTC-3, sem horário de verão)
// SI_HOJE_TESTE (só no .dev.vars, nunca em produção) simula a data de hoje para testar as etapas
export const hojeBrasilia = () => globalThis.__SI_HOJE || new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const diaDe = (data, ed = EDICAO) => Math.floor((Date.parse(data + 'T00:00:00Z') - Date.parse(ed.inicio + 'T00:00:00Z')) / 86400e3) + 1;
const dataDoDia = (n, ed = EDICAO) => new Date(Date.parse(ed.inicio + 'T00:00:00Z') + (n - 1) * 86400e3).toISOString().slice(0, 10);
function ciclo(c) {
  const hoje = diaDe(hojeBrasilia(), c);
  const { prep, ...resto } = c;
  return { ...resto, fim: dataDoDia(c.dias, c), hoje: hojeBrasilia(), dia_atual: hoje, // <1: ainda não começou; >dias: terminou
    fase: hoje < 1 ? 'antes' : hoje > c.dias ? 'depois' : 'durante' };
}
// etapa do ciclo: antes (até 30/11) → preparacao (dezembro) → jornada (1º/01–10/04) → fim
export function situacao(ed = EDICAO) {
  const j = ciclo(ed), p = ciclo(ed.prep);
  const etapa = p.fase === 'antes' ? 'antes' : p.fase === 'durante' ? 'preparacao' : j.fase === 'depois' ? 'fim' : 'jornada';
  return { ...j, prep: p, etapa };
}
const cicloDe = (s, qual) => (qual === 'prep' ? s.prep : s);
// último dia que o participante já pode marcar
const ultimoMarcavel = (s) => Math.min(Math.max(s.dia_atual, 0), s.dias);

const participante = (env, leitorId, ed = EDICAO.id) =>
  env.DB.prepare('SELECT * FROM si_participantes WHERE leitor_id = ? AND edicao = ?').bind(leitorId, ed).first();
// inscrições do leitor no ciclo (preparação e/ou jornada), por edição
async function participacoes(env, leitorId) {
  const r = (await env.DB.prepare(`SELECT * FROM si_participantes WHERE leitor_id = ? AND edicao IN (${EDICOES.map(() => '?').join(',')})`).bind(leitorId, ...EDICOES).all()).results;
  const o = {}; r.forEach((x) => (o[x.edicao] = x)); return o;
}

// ---------------------------------------------------------------- área do participante
export async function apiSpiritLeitor(req, env, url, seg, l) {
  const m = req.method;
  const acao = seg[2]; // seg = ['conta', 'spirit', acao?]
  const s = situacao();
  const ps = await participacoes(env, l.id);
  const p = ps[s.id] || ps[s.prep.id] || null;
  const naJornada = !!ps[s.id], naPrep = !!ps[s.prep.id];

  if (!acao && m === 'GET') {
    if (!p) return json({ edicao: s, inscrito: false });
    const [dias, diasPrep, devs, diario] = await Promise.all([
      env.DB.prepare('SELECT dia, orou, testemunho, autorizacao, atualizado_em FROM si_dias WHERE leitor_id = ? AND edicao = ? ORDER BY dia').bind(l.id, s.id).all(),
      env.DB.prepare('SELECT dia, orou, atualizado_em FROM si_dias WHERE leitor_id = ? AND edicao = ? ORDER BY dia').bind(l.id, s.prep.id).all(),
      // só os já liberados (hoje e dias anteriores): o texto dos próximos dias nunca sai do servidor
      env.DB.prepare("SELECT id, titulo, resumo, liberar_em, pdf_url, texto FROM si_devocionais WHERE edicao = ? AND status = 'publicado' AND (pdf_url IS NOT NULL OR texto IS NOT NULL) AND liberar_em <= ? ORDER BY liberar_em DESC, id DESC").bind(s.id, s.hoje).all(),
      env.DB.prepare('SELECT id, data, tipo, referencia, texto, autorizacao, criado_em, atualizado_em FROM si_diario WHERE leitor_id = ? AND edicao = ? ORDER BY data DESC, id DESC').bind(l.id, s.id).all(),
    ]);
    const podeAceitar = !naJornada && ((s.etapa === 'preparacao' && s.prep.dia_atual >= ACEITE_A_PARTIR) || s.etapa === 'jornada');
    return json({ edicao: s, inscrito: true, na_preparacao: naPrep, na_jornada: naJornada, pode_aceitar: podeAceitar,
      inscrito_em: p.inscrito_em, aceitou_jornada_em: naJornada ? ps[s.id].inscrito_em : null, devocionais_email: !!p.devocionais_email, email: l.email || null,
      email_servico: emailConfigurado(env), dias: dias.results, dias_prep: diasPrep.results, devocionais: devs.results, diario: diario.results });
  }

  if (acao === 'inscrever' && m === 'POST') {
    const b = await corpo(req);
    if (!b.consentimento) return erro('Para participar, marque que concorda com o registro da sua jornada de oração.');
    if (s.etapa === 'fim') return erro('Esta edição do Spirit Immersion já terminou.');
    // até 31/12 a inscrição começa pela preparação; depois disso, entra direto nos 100 dias
    const ed = s.etapa === 'jornada' ? s.id : s.prep.id;
    if (!p) {
      await env.DB.prepare("INSERT INTO si_participantes (leitor_id, edicao, devocionais_email, consentimento_em) VALUES (?,?,?,datetime('now'))")
        .bind(l.id, ed, b.devocionais === false ? 0 : 1).run();
    }
    return json({ ok: true, ja: !!p }, p ? 200 : 201);
  }

  if (!p) return erro('Você ainda não está inscrito no Spirit Immersion.', 403);

  // ao fim da preparação, a pessoa aceita fazer parte dos 100 dias
  if (acao === 'aceitar' && m === 'POST') {
    if (naJornada) return json({ ok: true, ja: true });
    if (s.etapa === 'fim') return erro('Esta edição do Spirit Immersion já terminou.');
    if (s.etapa !== 'jornada' && !(s.etapa === 'preparacao' && s.prep.dia_atual >= ACEITE_A_PARTIR)) return erro('O convite para os 100 dias abre na quarta jornada da preparação.');
    await env.DB.prepare("INSERT INTO si_participantes (leitor_id, edicao, devocionais_email, consentimento_em) VALUES (?,?,?,datetime('now'))")
      .bind(l.id, s.id, p.devocionais_email).run();
    return json({ ok: true }, 201);
  }

  if (acao === 'devocionais' && m === 'POST') {
    await env.DB.prepare(`UPDATE si_participantes SET devocionais_email = ? WHERE leitor_id = ? AND edicao IN (${EDICOES.map(() => '?').join(',')})`).bind((await corpo(req)).receber ? 1 : 0, l.id, ...EDICOES).run();
    return json({ ok: true });
  }

  if (acao === 'dia' && m === 'POST') {
    const b = await corpo(req);
    const c = cicloDe(s, b.ciclo);
    if (!ps[c.id]) return erro(b.ciclo === 'prep' ? 'Você não está na preparação.' : 'Aceite os 100 dias para marcar os dias da jornada.', 403);
    const dia = parseInt(b.dia, 10);
    if (!(dia >= 1 && dia <= c.dias)) return erro('Dia inválido.');
    if (dia > ultimoMarcavel(c)) return erro(c.fase === 'antes' ? (b.ciclo === 'prep' ? 'A preparação ainda não começou.' : 'A jornada ainda não começou.') : 'Este dia ainda não chegou.');
    const testemunho = String(b.testemunho || '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (testemunho.length > MAX_TESTEMUNHO) return erro(`O testemunho pode ter até ${MAX_TESTEMUNHO} caracteres.`);
    const aut = AUT.includes(b.autorizacao) ? b.autorizacao : 'equipe';
    const orou = b.orou ? 1 : 0;
    if (!orou && !testemunho) await env.DB.prepare('DELETE FROM si_dias WHERE leitor_id = ? AND edicao = ? AND dia = ?').bind(l.id, c.id, dia).run();
    else await env.DB.prepare(
      `INSERT INTO si_dias (leitor_id, edicao, dia, orou, testemunho, autorizacao) VALUES (?,?,?,?,?,?)
       ON CONFLICT (leitor_id, edicao, dia) DO UPDATE SET orou = excluded.orou, testemunho = excluded.testemunho, autorizacao = excluded.autorizacao, atualizado_em = datetime('now')`,
    ).bind(l.id, c.id, dia, orou, testemunho || null, aut).run();
    return json({ ok: true });
  }

  // diário: registros livres (testemunho, impressão profética, o que ouviu de Deus, texto lido, oração…)
  if (acao === 'diario') {
    const id = parseInt(seg[3], 10);
    if (m === 'POST') {
      const b = await corpo(req);
      const texto = String(b.texto || '').replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
      if (!texto) return erro('Escreva o registro.');
      if (texto.length > MAX_DIARIO) return erro(`O registro pode ter até ${MAX_DIARIO} caracteres.`);
      const data = /^\d{4}-\d{2}-\d{2}$/.test(b.data || '') ? b.data : s.hoje;
      if (data > s.hoje) return erro('Esta data ainda não chegou.');
      const tipo = TIPOS.includes(b.tipo) ? b.tipo : 'testemunho';
      // Diário de Oração é sempre privado; só o testemunho tem autorização (padrão: só a equipe).
      const aut = tipo === 'testemunho' ? (AUT_DIARIO.includes(b.autorizacao) && b.autorizacao !== 'privado' ? b.autorizacao : 'equipe') : 'privado';
      const ref = String(b.referencia || '').trim().slice(0, 200) || null;
      if (id) {
        const r = await env.DB.prepare("UPDATE si_diario SET data = ?, tipo = ?, referencia = ?, texto = ?, autorizacao = ?, atualizado_em = datetime('now') WHERE id = ? AND leitor_id = ?")
          .bind(data, tipo, ref, texto, aut, id, l.id).run();
        if (!r.meta.changes) return erro('Registro não encontrado.', 404);
        return json({ ok: true, id });
      }
      const n = (await env.DB.prepare("SELECT COUNT(*) n FROM si_diario WHERE leitor_id = ? AND criado_em > datetime('now','-1 day')").bind(l.id).first()).n;
      if (n >= 60) return erro('Muitos registros nas últimas 24 horas. Tente mais tarde.', 429);
      const r = await env.DB.prepare('INSERT INTO si_diario (leitor_id, edicao, data, tipo, referencia, texto, autorizacao) VALUES (?,?,?,?,?,?,?) RETURNING id')
        .bind(l.id, s.id, data, tipo, ref, texto, aut).first();
      return json({ ok: true, id: r.id }, 201);
    }
    if (id && m === 'DELETE') {
      await env.DB.prepare('DELETE FROM si_diario WHERE id = ? AND leitor_id = ?').bind(id, l.id).run();
      return json({ ok: true });
    }
  }

  if (acao === 'sair' && m === 'POST') {
    // sair do movimento apaga a inscrição e todo o registro desta edição (dias e testemunhos)
    await env.DB.batch([
      env.DB.prepare('DELETE FROM si_dias WHERE leitor_id = ? AND edicao IN (?,?)').bind(l.id, ...EDICOES),
      env.DB.prepare('DELETE FROM si_diario WHERE leitor_id = ? AND edicao = ?').bind(l.id, s.id),
      env.DB.prepare('DELETE FROM si_envios WHERE leitor_id = ?').bind(l.id),
      env.DB.prepare('DELETE FROM si_participantes WHERE leitor_id = ? AND edicao IN (?,?)').bind(l.id, ...EDICOES),
    ]);
    return json({ ok: true });
  }
  return erro('Rota não encontrada.', 404);
}

export async function spiritPublico(env) {
  const n = (await env.DB.prepare('SELECT COUNT(DISTINCT leitor_id) n FROM si_participantes WHERE edicao IN (?,?)').bind(...EDICOES).first()).n;
  return json({ edicao: situacao(), inscritos: n }, 200, { 'Cache-Control': 'public, max-age=120' });
}

export async function participanteAtivo(env, leitorId) { return Object.keys(await participacoes(env, leitorId)).length > 0; }

// ---------------------------------------------------------------- painel
export async function apiSpiritPainel(req, env, url, seg, u, { registrar }) {
  const m = req.method;
  const s = situacao();
  const q = (sql, ...b) => env.DB.prepare(sql).bind(...b).all().then((r) => r.results);

  if (!seg.length && m === 'GET') {
    const [part, porDia, devs, tes, fila, partPrep, porDiaPrep, total] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) n, SUM(devocionais_email) dev FROM si_participantes WHERE edicao = ?').bind(s.id).first(),
      q('SELECT dia, SUM(orou) orou, SUM(testemunho IS NOT NULL) tes FROM si_dias WHERE edicao = ? GROUP BY dia ORDER BY dia', s.id),
      q(`SELECT d.*, (SELECT COUNT(*) FROM si_envios e WHERE e.devocional_id = d.id AND e.status = 'enviado') enviados,
                (SELECT COUNT(*) FROM si_envios e WHERE e.devocional_id = d.id) total_envio
         FROM si_devocionais d WHERE edicao = ? ORDER BY liberar_em, id`, s.id),
      q(`SELECT x.* FROM (
           SELECT d.data, d.tipo, d.referencia, d.texto AS testemunho, d.autorizacao, d.atualizado_em, l.nome, l.email FROM si_diario d JOIN leitores l ON l.id = d.leitor_id
             WHERE d.edicao = ? AND d.tipo = 'testemunho' AND d.autorizacao <> 'privado'
           UNION ALL
           SELECT NULL, 'testemunho', NULL, d.testemunho, d.autorizacao, d.atualizado_em, l.nome, l.email FROM si_dias d JOIN leitores l ON l.id = d.leitor_id
             WHERE d.edicao = ? AND d.testemunho IS NOT NULL) x ORDER BY x.atualizado_em DESC LIMIT 500`, s.id, s.id),
      env.DB.prepare("SELECT COUNT(*) n FROM si_envios WHERE status = 'fila'").first(),
      env.DB.prepare('SELECT COUNT(*) n FROM si_participantes WHERE edicao = ?').bind(s.prep.id).first(),
      q('SELECT dia, SUM(orou) orou FROM si_dias WHERE edicao = ? GROUP BY dia ORDER BY dia', s.prep.id),
      env.DB.prepare('SELECT COUNT(DISTINCT leitor_id) n, SUM(devocionais_email) dev FROM si_participantes WHERE edicao IN (?,?)').bind(...EDICOES).first(),
    ]);
    const orados = (await env.DB.prepare('SELECT edicao, SUM(orou) n FROM si_dias WHERE edicao IN (?,?) GROUP BY edicao').bind(...EDICOES).all()).results;
    const so = (ed) => (orados.find((x) => x.edicao === ed) || { n: 0 }).n || 0;
    return json({ edicao: s, participantes: part.n, participantes_prep: partPrep.n, total_pessoas: total.n, com_email: part.dev || 0,
      por_dia: porDia, por_dia_prep: porDiaPrep, devocionais: devs, testemunhos: tes,
      dias_orados_total: so(s.id), dias_orados_prep: so(s.prep.id), na_fila: fila.n, email_servico: emailConfigurado(env) });
  }

  if (seg[0] === 'devocionais') {
    const id = parseInt(seg[1], 10);
    if (!seg[1] && m === 'POST') {
      const b = await corpo(req);
      const titulo = String(b.titulo || '').trim();
      if (!titulo) return erro('Dê um título ao devocional.');
      const data = /^\d{4}-\d{2}-\d{2}$/.test(b.liberar_em || '') ? b.liberar_em : s.hoje;
      const r = await env.DB.prepare('INSERT INTO si_devocionais (edicao, titulo, resumo, liberar_em, texto, criado_por) VALUES (?,?,?,?,?,?) RETURNING id')
        .bind(s.id, titulo.slice(0, 200), String(b.resumo || '').trim().slice(0, 1000) || null, data, textoDev(b.texto), u.id).first();
      await registrar(env, u, 'criou o devocional', titulo, 'Spirit Immersion');
      return json({ id: r.id }, 201);
    }
    const d = id && (await env.DB.prepare('SELECT * FROM si_devocionais WHERE id = ?').bind(id).first());
    if (!d) return erro('Devocional não encontrado.', 404);
    if (!seg[2] && m === 'PUT') {
      const b = await corpo(req);
      const titulo = String(b.titulo || '').trim() || d.titulo;
      const data = /^\d{4}-\d{2}-\d{2}$/.test(b.liberar_em || '') ? b.liberar_em : d.liberar_em;
      await env.DB.prepare("UPDATE si_devocionais SET titulo = ?, resumo = ?, liberar_em = ?, texto = ?, atualizado_em = datetime('now') WHERE id = ?")
        .bind(titulo.slice(0, 200), String(b.resumo ?? d.resumo ?? '').trim().slice(0, 1000) || null, data, b.texto === undefined ? d.texto : textoDev(b.texto), id).run();
      return json({ ok: true });
    }
    if (seg[2] === 'status' && m === 'POST') {
      const st = (await corpo(req)).status === 'publicado' ? 'publicado' : 'rascunho';
      if (st === 'publicado' && !d.pdf_url && !d.texto) return erro('Escreva o texto do devocional (ou envie um PDF) antes de publicar.');
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
  if (!equipe && !(leitor && liberado && (await participanteAtivo(env, leitor.id)))) return 'negado';
  return env.ARQUIVOS.get(chave);
}

// ---------------------------------------------------------------- e-mails dos devocionais
// Roda no cron (a cada 10 min) e ao publicar: devocional publicado e já liberado entra na fila uma única vez.
export async function enfileirarDevocionais(env) {
  if (!emailConfigurado(env)) return;
  const hoje = hojeBrasilia();
  const prontos = (await env.DB.prepare("SELECT * FROM si_devocionais WHERE status = 'publicado' AND (pdf_url IS NOT NULL OR texto IS NOT NULL) AND enfileirado_em IS NULL AND liberar_em <= ?").bind(hoje).all()).results;
  for (const d of prontos) {
    await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO si_envios (devocional_id, leitor_id) SELECT DISTINCT ?, p.leitor_id FROM si_participantes p JOIN leitores l ON l.id = p.leitor_id WHERE p.edicao IN (?,?) AND p.devocionais_email = 1 AND l.email IS NOT NULL AND l.bloqueado = 0").bind(d.id, ...EDICOES),
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
      previa: (d.resumo || 'Um novo devocional está disponível na sua jornada.').slice(0, 140), eyebrow: 'Spirit Immersion · Devocional', titulo: d.titulo, link, botao: d.texto ? 'Ler o devocional' : 'Abrir o devocional (PDF)',
      corpo: `<p style="margin:0 0 14px">Olá, ${esc(String(l.nome || '').split(' ')[0])}. Um novo devocional da sua jornada de oração está disponível.</p>${resumo}<p style="margin:0">${d.texto ? 'O devocional' : 'O PDF'} fica na sua conta, na aba Spirit Immersion, onde você também marca os dias de oração.</p>`,
      rodape: `Você recebe este e-mail porque se inscreveu no Spirit Immersion e pediu os devocionais por e-mail. <a href="${link}" style="color:#F8E9B7">Parar de receber</a> · <a href="${DOM}/privacidade.html" style="color:#F8E9B7">Política de Privacidade</a>`,
    }),
    texto: `SPIRIT IMMERSION · DEVOCIONAL\n\n${d.titulo}\n\n${d.resumo || ''}\n\nAbrir na sua conta: ${link}\n\n--\nPara parar de receber os devocionais por e-mail, desmarque a opção na aba Spirit Immersion da sua conta.`,
  };
}

export async function processarFilaSpirit(env, limite = LOTE) {
  if (!emailConfigurado(env)) return { enviados: 0 };
  await enfileirarDevocionais(env);
  const lista = (await env.DB.prepare(
    `SELECT e.devocional_id, e.leitor_id, e.tentativas, l.email, l.nome,
            (SELECT MAX(p.devocionais_email) FROM si_participantes p WHERE p.leitor_id = e.leitor_id AND p.edicao IN ('${EDICOES.join("','")}')) AS devocionais_email
     FROM si_envios e JOIN leitores l ON l.id = e.leitor_id JOIN si_devocionais d ON d.id = e.devocional_id
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
