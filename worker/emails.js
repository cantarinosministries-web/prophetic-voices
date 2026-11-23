// E-mails automáticos: novos artigos e testemunhos para os inscritos.
//
// Envio pelo Cloudflare Email Service (API REST). Fica desligado até existirem no Cloudflare:
//   EMAIL_API_TOKEN (segredo: token com permissão de enviar e-mails) e CF_ACCOUNT_ID (ID da conta).
//   Opcional: EMAIL_REMETENTE (padrão novidades@thepropheticvoices.com.br).
// Passo a passo: docs/CONFIGURAR-EMAILS.md.
//
//   POST /api/newsletter            inscrição pelo rodapé (manda e-mail de confirmação)
//   GET  /email/confirmar?t=        confirma a inscrição do rodapé
//   POST /email/sair?t=             cancela (botão da página /newsletter.html e "cancelar" com um clique do Gmail/Apple Mail)
//   GET  /api/publico/testemunhos   testemunhos publicados
//   /api/testemunhos/*, /api/emails painel (editor e acima)
import { aleatorio, json, erro, cabecalhos } from './seguranca.js';
import { esc } from './paginas.js';

const DOM = 'https://thepropheticvoices.com.br';
const LOTE = 150;          // e-mails por rodada (o resto sai na rodada seguinte, a cada 10 minutos)
const PARALELO = 6;
const MAX_TENTATIVAS = 3;

export const emailConfigurado = (env) => !!(env.EMAIL_API_TOKEN && env.CF_ACCOUNT_ID);
const remetente = (env) => ({ address: env.EMAIL_REMETENTE || 'novidades@thepropheticvoices.com.br', name: 'The Prophetic Voices' });

export async function enviarEmail(env, { para, assunto, html, texto, cabecalhos: extra }) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.EMAIL_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: para, from: remetente(env), subject: assunto, html, text: texto, headers: extra || undefined }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.success === false) throw new Error(`envio recusado (${r.status}) ${JSON.stringify(d.errors || '').slice(0, 300)}`);
  return d.result || {};
}

// ---------------------------------------------------------------- modelo do e-mail (cores oficiais)
const linkSair = (i) => `${DOM}/newsletter.html?t=${i.token}`;

function moldura({ previa, eyebrow, titulo, corpo, botao, link, rodape }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title></head>
<body style="margin:0;padding:0;background:#F8E9B7;font-family:Georgia,'Times New Roman',serif;color:#000">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(previa || '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8E9B7"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden">
  <tr><td style="background:#000;padding:26px 32px"><a href="${DOM}"><img src="${DOM}/media/logo-creme.png" alt="The Prophetic Voices" height="40" style="height:40px;display:block;border:0;color:#F8E9B7;font-family:Arial,sans-serif;font-size:16px"></a></td></tr>
  <tr><td style="padding:34px 32px 8px">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#000;border-left:3px solid #BF8957;padding-left:10px">${esc(eyebrow)}</div>
    <h1 style="margin:18px 0 0;font-size:30px;line-height:1.2;font-weight:normal;color:#000">${esc(titulo)}</h1>
  </td></tr>
  <tr><td style="padding:14px 32px 6px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#000">${corpo}</td></tr>
  <tr><td style="padding:18px 32px 36px"><a href="${link}" style="display:inline-block;background:#000;color:#F8E9B7;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;padding:14px 26px;border-radius:999px">${esc(botao)}</a></td></tr>
  <tr><td style="background:#000;padding:22px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#CAB5A0">${rodape}<br><span style="color:#F8E9B7">Preparando uma geração para serem Vozes Proféticas no tempo do fim.</span></td></tr>
</table></td></tr></table></body></html>`;
}

const rodapeInscrito = (i) =>
  `Você recebe este e-mail porque se inscreveu para receber os novos artigos e testemunhos do The Prophetic Voices. ` +
  `<a href="${linkSair(i)}" style="color:#F8E9B7">Cancelar inscrição</a> · <a href="${DOM}/privacidade.html" style="color:#F8E9B7">Política de Privacidade</a>`;

const paragrafos = (t) => esc(t).split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`).join('');
const cortar = (t, n) => { t = String(t || '').trim(); return t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n) > n * 0.6 ? t.lastIndexOf(' ', n) : n).trim() + '…'; };

export function emailArtigo(a, i) {
  const link = `${DOM}/artigos/${a.slug}.html`;
  const por = `por ${a.autor}${a.tipo === 'traducao' && a.tradutor ? ` · tradução de ${a.tradutor}` : ''}`;
  const resumo = cortar(a.resumo, 700);
  return {
    assunto: `Novo artigo: ${a.titulo}`,
    html: moldura({
      previa: resumo.slice(0, 140), eyebrow: `Novo artigo · ${a.area}`, titulo: a.titulo, link, botao: 'Ler o artigo',
      corpo: `<p style="margin:0 0 16px;font-family:Georgia,serif;font-style:italic;font-size:17px">${esc(por)}</p>${paragrafos(resumo)}`,
      rodape: rodapeInscrito(i),
    }),
    texto: `NOVO ARTIGO · ${a.area}\n\n${a.titulo}\n${por}\n\n${resumo}\n\nLer o artigo: ${link}\n\n--\nPara cancelar a inscrição: ${linkSair(i)}`,
  };
}

export function emailTestemunho(t, i) {
  const link = `${DOM}/testemunhos.html#t-${t.id}`;
  const trecho = cortar(t.texto, 900);
  return {
    assunto: `Novo testemunho: ${t.titulo}`,
    html: moldura({
      previa: trecho.slice(0, 140), eyebrow: 'Novo testemunho', titulo: t.titulo, link, botao: 'Ler o testemunho',
      corpo: `${paragrafos(trecho)}${t.assinatura ? `<p style="margin:0;font-family:Georgia,serif;font-style:italic">— ${esc(t.assinatura)}</p>` : ''}`,
      rodape: rodapeInscrito(i),
    }),
    texto: `NOVO TESTEMUNHO\n\n${t.titulo}\n\n${trecho}${t.assinatura ? `\n— ${t.assinatura}` : ''}\n\nLer o testemunho: ${link}\n\n--\nPara cancelar a inscrição: ${linkSair(i)}`,
  };
}

function emailConfirmacao(i) {
  const link = `${DOM}/email/confirmar?t=${i.token}`;
  return {
    assunto: 'Confirme sua inscrição — The Prophetic Voices',
    html: moldura({
      previa: 'Falta um clique para receber os novos artigos e testemunhos.', eyebrow: 'Inscrição', titulo: 'Falta um clique', link, botao: 'Confirmar inscrição',
      corpo: '<p style="margin:0 0 14px">Recebemos o pedido para enviar a este endereço os novos artigos e testemunhos do The Prophetic Voices. Para confirmar, use o botão abaixo.</p><p style="margin:0">Se não foi você, ignore este e-mail: sem a confirmação, não enviaremos nada.</p>',
      rodape: `Política de Privacidade: <a href="${DOM}/privacidade.html" style="color:#F8E9B7">${DOM.replace('https://', '')}/privacidade.html</a>`,
    }),
    texto: `Confirme sua inscrição para receber os novos artigos e testemunhos do The Prophetic Voices:\n${link}\n\nSe não foi você, ignore este e-mail.`,
  };
}

// ---------------------------------------------------------------- inscrição de leitores com conta
export async function inscricaoDoLeitor(env, leitorId) {
  return env.DB.prepare("SELECT * FROM inscritos WHERE leitor_id = ?").bind(leitorId).first();
}

export async function definirInscricaoLeitor(env, leitor, receber) {
  await env.DB.prepare("UPDATE leitores SET respondeu_email = datetime('now') WHERE id = ?").bind(leitor.id).run();
  const atual = await inscricaoDoLeitor(env, leitor.id);
  if (!receber) {
    if (atual && atual.status !== 'cancelado') await env.DB.prepare("UPDATE inscritos SET status = 'cancelado', cancelado_em = datetime('now') WHERE id = ?").bind(atual.id).run();
    return;
  }
  if (!leitor.email || !/^\S+@\S+\.\S+$/.test(leitor.email)) throw new Error('Sua conta não tem um e-mail para receber as novidades.');
  if (atual) {
    await env.DB.prepare("UPDATE inscritos SET status = 'ativo', confirmado_em = datetime('now'), cancelado_em = NULL, email = ?, nome = ? WHERE id = ?").bind(leitor.email, leitor.nome, atual.id).run();
    return;
  }
  const mesmo = await env.DB.prepare('SELECT * FROM inscritos WHERE email = ?').bind(leitor.email).first();
  if (mesmo) {
    await env.DB.prepare("UPDATE inscritos SET leitor_id = ?, nome = ?, status = 'ativo', confirmado_em = datetime('now'), cancelado_em = NULL WHERE id = ?").bind(leitor.id, leitor.nome, mesmo.id).run();
    return;
  }
  // o e-mail veio do Google/Apple/Facebook/Microsoft, já confirmado por eles: entra ativo
  await env.DB.prepare("INSERT INTO inscritos (email, nome, leitor_id, origem, status, token, confirmado_em) VALUES (?,?,?,'conta','ativo',?,datetime('now'))")
    .bind(leitor.email, leitor.nome, leitor.id, aleatorio(24)).run();
}

// ---------------------------------------------------------------- rodapé, confirmação e cancelamento
async function corpo(req) { try { return await req.json(); } catch (e) { return {}; } }

export async function apiNewsletter(req, env) {
  if (req.method === 'GET') return json({ disponivel: emailConfigurado(env) });
  if (req.method !== 'POST') return erro('Rota não encontrada.', 404);
  if (!emailConfigurado(env)) return erro('As inscrições por e-mail abrem em breve.', 503);
  const email = String((await corpo(req)).email || '').trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return erro('Informe um e-mail válido.');
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  const n = (await env.DB.prepare("SELECT COUNT(*) n FROM tentativas_login WHERE chave = ? AND em > datetime('now','-1 hour')").bind('n:' + ip).first()).n;
  if (n >= 5) return erro('Muitas inscrições seguidas. Tente mais tarde.', 429);
  await env.DB.prepare('INSERT INTO tentativas_login (chave) VALUES (?)').bind('n:' + ip).run();
  let i = await env.DB.prepare('SELECT * FROM inscritos WHERE email = ?').bind(email).first();
  if (i && i.status === 'ativo') return json({ ok: true, ja: true });
  if (!i) i = await env.DB.prepare("INSERT INTO inscritos (email, origem, status, token) VALUES (?, 'rodape', 'pendente', ?) RETURNING *").bind(email, aleatorio(24)).first();
  else await env.DB.prepare("UPDATE inscritos SET status = 'pendente' WHERE id = ?").bind(i.id).run();
  const m = emailConfirmacao(i);
  try { await enviarEmail(env, { para: email, assunto: m.assunto, html: m.html, texto: m.texto }); }
  catch (e) { console.error('confirmação', e && e.message); return erro('Não conseguimos enviar o e-mail de confirmação agora. Tente mais tarde.', 502); }
  return json({ ok: true });
}

function ir(destino) {
  return new Response(null, { status: 303, headers: cabecalhos(new Headers({ Location: destino, 'Cache-Control': 'no-store' })) });
}

export async function rotaEmail(req, env, url) {
  const t = url.searchParams.get('t') || '';
  const valido = /^[0-9a-f]{48}$/.test(t);
  const i = valido ? await env.DB.prepare('SELECT * FROM inscritos WHERE token = ?').bind(t).first() : null;
  if (url.pathname === '/email/confirmar') {
    if (!i) return ir('/newsletter.html?estado=invalido');
    if (i.status === 'cancelado') return ir('/newsletter.html?estado=invalido');
    if (i.status === 'pendente') await env.DB.prepare("UPDATE inscritos SET status = 'ativo', confirmado_em = datetime('now'), cancelado_em = NULL WHERE id = ? AND status = 'pendente'").bind(i.id).run();
    return ir('/newsletter.html?estado=confirmado');
  }
  if (url.pathname === '/email/sair' && req.method === 'POST') {
    if (!i) return json({ erro: 'Link inválido.' }, 404);
    if (i.status !== 'cancelado') {
      await env.DB.prepare("UPDATE inscritos SET status = 'cancelado', cancelado_em = datetime('now') WHERE id = ?").bind(i.id).run();
      await env.DB.prepare("UPDATE envio_destinos SET status = 'cancelado' WHERE inscrito_id = ? AND status = 'fila'").bind(i.id).run();
      if (i.leitor_id) await env.DB.prepare("UPDATE leitores SET respondeu_email = datetime('now') WHERE id = ?").bind(i.leitor_id).run();
    }
    return json({ ok: true });
  }
  return ir(valido ? `/newsletter.html?t=${t}` : '/newsletter.html');
}

// ---------------------------------------------------------------- fila de envio
// Chamado quando um artigo ou testemunho é publicado pela primeira vez. Nunca envia duas vezes o mesmo.
export async function enfileirar(env, tipo, refId, titulo) {
  if (!emailConfigurado(env)) {
    // sem serviço de e-mail: registra e não guarda fila (para não disparar coisa antiga quando o serviço for ligado)
    await env.DB.prepare("INSERT OR IGNORE INTO envios (tipo, ref_id, titulo, status) VALUES (?,?,?,'sem_servico')").bind(tipo, refId, titulo).run();
    return null;
  }
  const [novo] = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO envios (tipo, ref_id, titulo, total, status, concluido_em)
      SELECT ?, ?, ?, COUNT(*), CASE WHEN COUNT(*) = 0 THEN 'concluido' ELSE 'fila' END,
        CASE WHEN COUNT(*) = 0 THEN datetime('now') END FROM inscritos WHERE status = 'ativo' RETURNING id`).bind(tipo, refId, titulo),
    env.DB.prepare(`INSERT INTO envio_destinos (envio_id, inscrito_id)
      SELECT e.id, i.id FROM envios e CROSS JOIN inscritos i
      WHERE e.tipo = ? AND e.ref_id = ? AND i.status = 'ativo' AND changes() = 1`).bind(tipo, refId),
  ]);
  return novo.results[0]?.id || null;
}

export async function processarFila(env, limite = LOTE) {
  if (!emailConfigurado(env)) return { enviados: 0 };
  await env.DB.prepare("UPDATE envio_destinos SET status = 'falha', erro = 'Entrega incerta: conferir no provedor', reserva = NULL, reservado_em = NULL WHERE status = 'fila' AND reservado_em < datetime('now','-30 minutes')").run();
  const reserva = aleatorio(16);
  await env.DB.prepare(
    "UPDATE envio_destinos SET reserva = ?, reservado_em = datetime('now') WHERE (envio_id, inscrito_id) IN (SELECT envio_id, inscrito_id FROM envio_destinos WHERE status = 'fila' AND reserva IS NULL ORDER BY envio_id, inscrito_id LIMIT ?)",
  ).bind(reserva, limite).run();
  const lista = (await env.DB.prepare(
    `SELECT d.envio_id, d.inscrito_id, d.tentativas, e.tipo, e.ref_id, i.email, i.nome, i.token, i.status AS st_inscrito
     FROM envio_destinos d JOIN envios e ON e.id = d.envio_id JOIN inscritos i ON i.id = d.inscrito_id
      WHERE d.status = 'fila' AND d.reserva = ? ORDER BY d.envio_id, d.inscrito_id`,
  ).bind(reserva).all()).results;
  const cache = {};
  const item = async (tipo, id) => {
    const k = tipo + id;
    if (!(k in cache)) cache[k] = tipo === 'artigo'
      ? await env.DB.prepare("SELECT * FROM artigos WHERE id = ? AND status = 'publicado'").bind(id).first()
      : await env.DB.prepare("SELECT * FROM testemunhos WHERE id = ? AND status = 'publicado'").bind(id).first();
    return cache[k];
  };
  let enviados = 0;
  const um = async (d) => {
    const marcar = (st, err) => env.DB.prepare(`UPDATE envio_destinos SET status = ?, tentativas = tentativas + 1, erro = ?, reserva = NULL, reservado_em = NULL${st === 'enviado' ? ", enviado_em = datetime('now')" : ''} WHERE envio_id = ? AND inscrito_id = ? AND status = 'fila' AND reserva = ?`)
      .bind(st, err || null, d.envio_id, d.inscrito_id, reserva).run();
    const obj = await item(d.tipo, d.ref_id);
    const ativo = await env.DB.prepare("SELECT 1 FROM inscritos i JOIN envio_destinos d ON d.inscrito_id = i.id WHERE d.envio_id = ? AND i.id = ? AND i.status = 'ativo' AND d.status = 'fila' AND d.reserva = ?").bind(d.envio_id, d.inscrito_id, reserva).first();
    if (!ativo || !obj) return marcar('cancelado', obj ? 'inscrição cancelada' : 'conteúdo retirado do site');
    const m = d.tipo === 'artigo' ? emailArtigo(obj, d) : emailTestemunho(obj, d);
    try {
      await enviarEmail(env, {
        para: d.email, assunto: m.assunto, html: m.html, texto: m.texto,
        cabecalhos: { 'List-Unsubscribe': `<${DOM}/email/sair?t=${d.token}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click', 'List-Id': 'Novidades The Prophetic Voices <novidades.thepropheticvoices.com.br>' },
      });
      enviados++;
      return marcar('enviado');
    } catch (e) {
      const mensagem = String(e && e.message || e).slice(0, 300);
      const repetivel = /^envio recusado \(429\)/.test(mensagem);
      return marcar(repetivel && d.tentativas + 1 < MAX_TENTATIVAS ? 'fila' : 'falha', mensagem);
    }
  };
  for (let k = 0; k < lista.length; k += PARALELO) await Promise.all(lista.slice(k, k + PARALELO).map(um));
  await env.DB.prepare(
    "UPDATE envios SET status = 'concluido', concluido_em = datetime('now') WHERE status = 'fila' AND NOT EXISTS (SELECT 1 FROM envio_destinos d WHERE d.envio_id = envios.id AND d.status = 'fila')",
  ).run();
  return { enviados };
}

// ---------------------------------------------------------------- testemunhos (público e painel)
export async function testemunhosPublicos(env) {
  const r = (await env.DB.prepare("SELECT id, titulo, texto, assinatura, publicado_em FROM testemunhos WHERE status = 'publicado' ORDER BY publicado_em DESC").all()).results;
  return json({ testemunhos: r });
}

const limparT = (d) => ({
  titulo: String(d.titulo || '').trim().slice(0, 160),
  texto: String(d.texto || '').replace(/\r\n?/g, '\n').trim().slice(0, 12000),
  assinatura: String(d.assinatura || '').trim().slice(0, 160) || null,
  autorizacao: d.autorizacao === 'nome' ? 'nome' : 'anonimo',
});

export async function apiTestemunhosPainel(req, env, url, seg, u, { registrar, aoPublicar }) {
  const m = req.method;
  if (seg.length === 0 && m === 'GET') {
    const r = (await env.DB.prepare(
      `SELECT t.*, (SELECT status FROM envios e WHERE e.tipo = 'testemunho' AND e.ref_id = t.id) AS envio_status,
        (SELECT total FROM envios e WHERE e.tipo = 'testemunho' AND e.ref_id = t.id) AS envio_total
       FROM testemunhos t ORDER BY CASE t.status WHEN 'rascunho' THEN 0 WHEN 'publicado' THEN 1 ELSE 2 END, t.atualizado_em DESC`,
    ).all()).results;
    return json({ testemunhos: r, email: emailConfigurado(env) });
  }
  if (seg.length === 0 && m === 'POST') {
    const d = limparT(await corpo(req));
    if (!d.titulo || d.texto.length < 10) return erro('Informe título e texto do testemunho.');
    const r = await env.DB.prepare('INSERT INTO testemunhos (titulo, texto, assinatura, autorizacao, criado_por, atualizado_por) VALUES (?,?,?,?,?,?) RETURNING *')
      .bind(d.titulo, d.texto, d.assinatura, d.autorizacao, u.id, u.id).first();
    await registrar(env, u, 'criou o testemunho', d.titulo);
    return json({ testemunho: r }, 201);
  }
  const id = parseInt(seg[0], 10);
  const t = id ? await env.DB.prepare('SELECT * FROM testemunhos WHERE id = ?').bind(id).first() : null;
  if (!t) return erro('Testemunho não encontrado.', 404);
  if (seg.length === 1 && m === 'PUT') {
    const d = limparT(await corpo(req));
    if (!d.titulo || d.texto.length < 10) return erro('Informe título e texto do testemunho.');
    await env.DB.prepare("UPDATE testemunhos SET titulo = ?, texto = ?, assinatura = ?, autorizacao = ?, atualizado_por = ?, atualizado_em = datetime('now') WHERE id = ?")
      .bind(d.titulo, d.texto, d.assinatura, d.autorizacao, u.id, id).run();
    await registrar(env, u, 'editou o testemunho', d.titulo);
    return json({ ok: true });
  }
  if (seg.length === 1 && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM testemunhos WHERE id = ?').bind(id).run();
    await registrar(env, u, 'excluiu o testemunho', t.titulo);
    return json({ ok: true });
  }
  if (seg[1] === 'status' && m === 'POST') {
    const b = await corpo(req);
    const status = ['rascunho', 'publicado', 'arquivado'].includes(b.status) ? b.status : null;
    if (!status) return erro('Situação inválida.');
    if (status === 'publicado' && !b.autorizacao_conferida) return erro('Confirme que conferiu a autorização de quem enviou o testemunho.');
    const primeira = status === 'publicado' && !t.publicado_em;
    await env.DB.prepare(`UPDATE testemunhos SET status = ?, atualizado_por = ?, atualizado_em = datetime('now')${primeira ? ", publicado_em = datetime('now')" : ''} WHERE id = ?`).bind(status, u.id, id).run();
    await registrar(env, u, { publicado: 'publicou o testemunho', rascunho: 'voltou para rascunho o testemunho', arquivado: 'tirou do site o testemunho' }[status], t.titulo,
      status === 'publicado' ? `autorização: ${t.autorizacao === 'nome' ? 'com nome' : 'sem identificação'}` : null);
    if (primeira) await aoPublicar('testemunho', id, t.titulo);
    return json({ ok: true });
  }
  return erro('Rota não encontrada.', 404);
}

export async function apiEmailsPainel(env) {
  const cont = (await env.DB.prepare('SELECT status, origem, COUNT(*) n FROM inscritos GROUP BY status, origem').all()).results;
  const envios = (await env.DB.prepare(
    `SELECT e.*, (SELECT COUNT(*) FROM envio_destinos d WHERE d.envio_id = e.id AND d.status = 'enviado') enviados,
       (SELECT COUNT(*) FROM envio_destinos d WHERE d.envio_id = e.id AND d.status = 'falha') falhas,
       (SELECT COUNT(*) FROM envio_destinos d WHERE d.envio_id = e.id AND d.status = 'fila') na_fila
     FROM envios e ORDER BY e.id DESC LIMIT 50`,
  ).all()).results;
  // leitores que marcaram interesse em escrever para a revista (Biblioteca → "Escreva para a revista")
  const autores = (await env.DB.prepare('SELECT nome, email, interesse_autor, interesse_autor_em FROM leitores WHERE interesse_autor IS NOT NULL ORDER BY interesse_autor_em DESC LIMIT 500').all()).results;
  return json({ configurado: emailConfigurado(env), remetente: remetente(env).address, inscritos: cont, envios, autores });
}
