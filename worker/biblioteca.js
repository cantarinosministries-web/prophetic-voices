// Biblioteca do leitor (aba principal de /conta.html): artigos salvos, coleções, citações guardadas,
// comentários enviados, "continuar lendo" (histórico opcional) e interesse em escrever para a revista.
// Rotas em /api/conta/... (chamadas por apiLeitores, já com o leitor logado).
import { json, erro } from './seguranca.js';
import { referencias, chamada } from './citacao.js';

const MAX_COLECOES = 50, MAX_CITACOES = 2000, MAX_TRECHO = 3000, MAX_NOTA = 1000;
const TRILHOS = ['academico', 'ensaio', 'ambos'];

async function corpo(req) { try { return await req.json(); } catch (e) { return {}; } }
const artigoPorSlug = (env, slug) => env.DB.prepare("SELECT * FROM artigos WHERE slug = ? AND status = 'publicado'").bind(String(slug || '')).first();
const curto = (a) => ({ slug: a.slug, titulo: a.titulo, autor: a.autor, ano: a.ano, area: a.area, capa: a.capa_url || '/media/symbol-creme.png', acesso: a.acesso, pdf_paginas: a.pdf_paginas });

export const ROTAS_BIBLIOTECA = ['biblioteca', 'artigo', 'salvos', 'colecoes', 'citacoes', 'progresso', 'historico', 'interesse'];

export async function apiBiblioteca(req, env, url, seg, l) {
  const m = req.method;
  const [, rota, a1, a2] = seg; // seg[0] === 'conta'

  // tudo o que a Biblioteca mostra, numa chamada só
  if (rota === 'biblioteca' && m === 'GET') {
    const q = (sql, ...b) => env.DB.prepare(sql).bind(...b).all().then((r) => r.results);
    const [salvos, colecoes, itens, citacoes, comentarios, progresso, recentes, todos] = await Promise.all([
      q("SELECT a.*, s.criado_em AS salvo_em FROM leitor_salvos s JOIN artigos a ON a.id = s.artigo_id WHERE s.leitor_id = ? AND a.status = 'publicado' ORDER BY s.criado_em DESC", l.id),
      q('SELECT id, nome, criado_em FROM leitor_colecoes WHERE leitor_id = ? ORDER BY nome COLLATE NOCASE', l.id),
      q("SELECT i.colecao_id, a.slug FROM leitor_colecao_itens i JOIN leitor_colecoes c ON c.id = i.colecao_id JOIN artigos a ON a.id = i.artigo_id WHERE c.leitor_id = ? AND a.status = 'publicado'", l.id),
      q("SELECT c.id, c.trecho, c.pagina, c.nota, c.criado_em, a.* FROM leitor_citacoes c JOIN artigos a ON a.id = c.artigo_id WHERE c.leitor_id = ? AND a.status = 'publicado' ORDER BY c.criado_em DESC", l.id),
      q("SELECT c.texto, c.status, c.criado_em, a.slug, a.titulo FROM comentarios_leitores c JOIN artigos a ON a.id = c.artigo_id WHERE c.leitor_id = ? AND a.status = 'publicado' ORDER BY c.criado_em DESC", l.id),
      l.historico === 1 ? q("SELECT a.*, p.pagina, p.total, p.atualizado_em FROM leitor_progresso p JOIN artigos a ON a.id = p.artigo_id WHERE p.leitor_id = ? AND a.status = 'publicado' ORDER BY p.atualizado_em DESC LIMIT 12", l.id) : [],
      q("SELECT * FROM artigos WHERE status = 'publicado' ORDER BY publicado_em DESC LIMIT 6"),
      q("SELECT slug, titulo, autor FROM artigos WHERE status = 'publicado' ORDER BY titulo"),
    ]);
    return json({
      historico: l.historico, interesse_autor: l.interesse_autor || null,
      continuar: progresso.map((a) => ({ ...curto(a), pagina: a.pagina, total: a.total, atualizado_em: a.atualizado_em })),
      salvos: salvos.map((a) => ({ ...curto(a), salvo_em: a.salvo_em, colecoes: itens.filter((i) => i.slug === a.slug).map((i) => i.colecao_id) })),
      colecoes: colecoes.map((c) => ({ ...c, itens: itens.filter((i) => i.colecao_id === c.id).map((i) => i.slug) })),
      citacoes: citacoes.map((c) => ({ id: c.id, trecho: c.trecho, pagina: c.pagina, nota: c.nota, criado_em: c.criado_em, slug: c.slug, titulo: c.titulo, autor: c.autor,
        chamada: chamada(c, c.pagina), referencia: referencias(c).abnt })),
      comentarios,
      recentes: recentes.map(curto),
      artigos: todos,
    });
  }

  // estado do leitor num artigo (página do artigo): salvo? onde parou?
  if (rota === 'artigo' && a1 && m === 'GET') {
    const a = await artigoPorSlug(env, a1);
    if (!a) return erro('Artigo não encontrado.', 404);
    const salvo = await env.DB.prepare('SELECT 1 FROM leitor_salvos WHERE leitor_id = ? AND artigo_id = ?').bind(l.id, a.id).first();
    const p = l.historico === 1 ? await env.DB.prepare('SELECT pagina, total FROM leitor_progresso WHERE leitor_id = ? AND artigo_id = ?').bind(l.id, a.id).first() : null;
    return json({ salvo: !!salvo, historico: l.historico, progresso: p || null });
  }

  if (rota === 'salvos' && a1 && m === 'POST') {
    const a = await artigoPorSlug(env, a1);
    if (!a) return erro('Artigo não encontrado.', 404);
    if ((await corpo(req)).salvar === false) {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM leitor_salvos WHERE leitor_id = ? AND artigo_id = ?').bind(l.id, a.id),
        env.DB.prepare('DELETE FROM leitor_colecao_itens WHERE artigo_id = ? AND colecao_id IN (SELECT id FROM leitor_colecoes WHERE leitor_id = ?)').bind(a.id, l.id),
      ]);
      return json({ salvo: false });
    }
    await env.DB.prepare('INSERT OR IGNORE INTO leitor_salvos (leitor_id, artigo_id) VALUES (?,?)').bind(l.id, a.id).run();
    return json({ salvo: true });
  }

  if (rota === 'colecoes') {
    const nomeOk = (n) => { const s = String(n || '').replace(/\s+/g, ' ').trim(); return s.length >= 1 && s.length <= 60 ? s : null; };
    if (!a1 && m === 'POST') {
      const nome = nomeOk((await corpo(req)).nome);
      if (!nome) return erro('Dê um nome de até 60 caracteres à coleção.');
      const n = (await env.DB.prepare('SELECT COUNT(*) n FROM leitor_colecoes WHERE leitor_id = ?').bind(l.id).first()).n;
      if (n >= MAX_COLECOES) return erro(`Você pode ter até ${MAX_COLECOES} coleções.`);
      const c = await env.DB.prepare('INSERT INTO leitor_colecoes (leitor_id, nome) VALUES (?,?) RETURNING id').bind(l.id, nome).first();
      return json({ id: c.id }, 201);
    }
    const c = a1 && await env.DB.prepare('SELECT * FROM leitor_colecoes WHERE id = ? AND leitor_id = ?').bind(parseInt(a1, 10) || 0, l.id).first();
    if (!c) return erro('Coleção não encontrada.', 404);
    if (!a2 && m === 'DELETE') {
      await env.DB.prepare('DELETE FROM leitor_colecoes WHERE id = ?').bind(c.id).run();
      return json({ ok: true });
    }
    if (!a2 && m === 'POST') {
      const nome = nomeOk((await corpo(req)).nome);
      if (!nome) return erro('Dê um nome de até 60 caracteres à coleção.');
      await env.DB.prepare('UPDATE leitor_colecoes SET nome = ? WHERE id = ?').bind(nome, c.id).run();
      return json({ ok: true });
    }
    if (a2 === 'itens' && m === 'POST') {
      const b = await corpo(req);
      const a = await artigoPorSlug(env, b.slug);
      if (!a) return erro('Artigo não encontrado.', 404);
      if (b.incluir === false) {
        await env.DB.prepare('DELETE FROM leitor_colecao_itens WHERE colecao_id = ? AND artigo_id = ?').bind(c.id, a.id).run();
      } else {
        await env.DB.batch([
          env.DB.prepare('INSERT OR IGNORE INTO leitor_salvos (leitor_id, artigo_id) VALUES (?,?)').bind(l.id, a.id),
          env.DB.prepare('INSERT OR IGNORE INTO leitor_colecao_itens (colecao_id, artigo_id) VALUES (?,?)').bind(c.id, a.id),
        ]);
      }
      return json({ ok: true });
    }
  }

  if (rota === 'citacoes') {
    if (!a1 && m === 'POST') {
      const b = await corpo(req);
      const a = await artigoPorSlug(env, b.slug);
      if (!a) return erro('Escolha o artigo da citação.', 404);
      const trecho = String(b.trecho || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (trecho.length < 2) return erro('Cole ou selecione o trecho que você quer guardar.');
      if (trecho.length > MAX_TRECHO) return erro(`O trecho pode ter até ${MAX_TRECHO} caracteres.`);
      const pagina = parseInt(b.pagina, 10);
      const nota = String(b.nota || '').trim().slice(0, MAX_NOTA) || null;
      const n = (await env.DB.prepare('SELECT COUNT(*) n FROM leitor_citacoes WHERE leitor_id = ?').bind(l.id).first()).n;
      if (n >= MAX_CITACOES) return erro(`Você chegou ao limite de ${MAX_CITACOES} citações. Apague algumas para guardar novas.`);
      const c = await env.DB.prepare('INSERT INTO leitor_citacoes (leitor_id, artigo_id, trecho, pagina, nota) VALUES (?,?,?,?,?) RETURNING id')
        .bind(l.id, a.id, trecho, pagina > 0 && pagina < 10000 ? pagina : null, nota).first();
      return json({ id: c.id, chamada: chamada(a, pagina > 0 ? pagina : null) }, 201);
    }
    if (a1 && m === 'DELETE') {
      await env.DB.prepare('DELETE FROM leitor_citacoes WHERE id = ? AND leitor_id = ?').bind(parseInt(a1, 10) || 0, l.id).run();
      return json({ ok: true });
    }
  }

  // "Continuar lendo": só grava com o histórico ligado pelo próprio leitor
  if (rota === 'progresso' && a1 && m === 'POST') {
    if (l.historico !== 1) return json({ gravado: false });
    const a = await artigoPorSlug(env, a1);
    if (!a) return erro('Artigo não encontrado.', 404);
    const b = await corpo(req);
    const total = parseInt(b.total, 10) > 0 ? Math.min(parseInt(b.total, 10), 9999) : null;
    const pagina = Math.max(1, Math.min(parseInt(b.pagina, 10) || 1, total || 9999));
    await env.DB.prepare(`INSERT INTO leitor_progresso (leitor_id, artigo_id, pagina, total) VALUES (?,?,?,?)
      ON CONFLICT(leitor_id, artigo_id) DO UPDATE SET pagina = excluded.pagina, total = excluded.total, atualizado_em = datetime('now')`).bind(l.id, a.id, pagina, total).run();
    return json({ gravado: true });
  }

  if (rota === 'historico' && m === 'POST') {
    const ligar = !!(await corpo(req)).ligar;
    const ops = [env.DB.prepare('UPDATE leitores SET historico = ? WHERE id = ?').bind(ligar ? 1 : 0, l.id)];
    if (!ligar) ops.push(env.DB.prepare('DELETE FROM leitor_progresso WHERE leitor_id = ?').bind(l.id)); // desligar apaga o que havia
    await env.DB.batch(ops);
    return json({ historico: ligar ? 1 : 0 });
  }
  if (rota === 'historico' && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM leitor_progresso WHERE leitor_id = ?').bind(l.id).run();
    return json({ ok: true });
  }

  if (rota === 'interesse' && m === 'POST') {
    const t = (await corpo(req)).trilho;
    const trilho = TRILHOS.includes(t) ? t : null;
    await env.DB.prepare("UPDATE leitores SET interesse_autor = ?, interesse_autor_em = CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END WHERE id = ?").bind(trilho, trilho, l.id).run();
    return json({ interesse_autor: trilho });
  }

  return erro('Rota não encontrada.', 404);
}
