// API do painel: /api/...
import { aleatorio, sha256, hashSenha, iguais, senhaValida, lerCookie, cookieSessao, COOKIE, json, erro } from './seguranca.js';
import { PAPEIS, PAPEIS_LOJA, pode, podeAtribuir, permissoesDe } from './permissoes.js';
import { apiLoja } from './loja.js';
import { relatorio } from './estatisticas.js';
import { apiModeracao } from './leitores.js';
import { enfileirar, processarFila, apiTestemunhosPainel, apiEmailsPainel } from './emails.js';

const DIAS_SESSAO = 14;
const AREAS = ['Antigo Testamento', 'Novo Testamento', 'Teologia bíblica', 'História'];
const STATUS = ['rascunho', 'revisao', 'publicado', 'arquivado'];
const CAMPOS = ['tipo', 'titulo', 'titulo_original', 'autor', 'autor_citacao', 'afiliacao', 'tradutor', 'periodico', 'volume', 'numero', 'ano', 'mes',
  'paginas_original', 'editora_original', 'url_original', 'area', 'tema', 'tema_en', 'resumo', 'resumo_en', 'resumo_editorial', 'palavras_chave', 'direitos',
  'acesso', 'pdf_url', 'pdf_paginas', 'capa_url'];

// ---------------------------------------------------------------- utilidades
const agora = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const daqui = (h) => new Date(Date.now() + h * 3600e3).toISOString().replace('T', ' ').slice(0, 19);
const publicoUsuario = (u) => u && { id: u.id, email: u.email, nome: u.nome, papel: u.papel, revista: u.revista !== 0, papel_loja: u.papel_loja || 'nenhum',
  ativo: !!u.ativo, criado_em: u.criado_em, ultimo_acesso: u.ultimo_acesso };
const lojaValida = (x) => (PAPEIS_LOJA[x] ? x : 'nenhum');
const descreverAcesso = (papel, revista, loja) =>
  `revista: ${revista === 0 || revista === false ? 'sem acesso' : PAPEIS[papel].nome} · loja: ${PAPEIS_LOJA[lojaValida(loja)].nome}`;

async function corpo(req) {
  try { return await req.json(); } catch (e) { return {}; }
}

async function registrar(env, u, acao, alvo, detalhe) {
  await env.DB.prepare('INSERT INTO historico (usuario_id, acao, alvo, detalhe) VALUES (?,?,?,?)')
    .bind(u ? u.id : null, acao, alvo || null, detalhe ? String(detalhe).slice(0, 500) : null).run();
}

export function slugify(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʾʿ'’`]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

// ---------------------------------------------------------------- sessão
export async function usuarioDaSessao(env, req) {
  const tok = lerCookie(req, COOKIE);
  if (!tok || !/^[0-9a-f]{64}$/.test(tok)) return null;
  const h = await sha256(tok);
  const r = await env.DB.prepare(
    `SELECT u.* FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ? AND s.expira_em > datetime('now') AND u.ativo = 1`,
  ).bind(h).first();
  return r || null;
}

async function criarSessao(env, u) {
  const tok = aleatorio(32);
  await env.DB.prepare('INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (?,?,?)').bind(await sha256(tok), u.id, daqui(24 * DIAS_SESSAO)).run();
  await env.DB.prepare("UPDATE usuarios SET ultimo_acesso = datetime('now') WHERE id = ?").bind(u.id).run();
  return cookieSessao(tok, DIAS_SESSAO * 86400);
}

async function limiteExcedido(env, chave) {
  await env.DB.prepare("DELETE FROM tentativas_login WHERE em < datetime('now','-1 day')").run();
  const r = await env.DB.prepare("SELECT COUNT(*) n FROM tentativas_login WHERE chave = ? AND em > datetime('now','-15 minutes')").bind(chave).first();
  return r.n >= 8;
}

// ---------------------------------------------------------------- artigos
function limpar(dados, atual = {}) {
  const o = {};
  for (const k of CAMPOS) if (k in dados) o[k] = dados[k];
  for (const k of Object.keys(o)) {
    if (typeof o[k] === 'string') o[k] = o[k].trim().slice(0, k.startsWith('resumo') ? 6000 : 600);
    if (o[k] === '') o[k] = null;
  }
  if ('palavras_chave' in o) {
    let kw = o.palavras_chave;
    if (typeof kw === 'string') kw = kw.split(/[,;\n]/);
    o.palavras_chave = JSON.stringify((Array.isArray(kw) ? kw : []).map((x) => String(x).trim()).filter(Boolean).slice(0, 20));
  }
  if ('resumo_editorial' in o) o.resumo_editorial = o.resumo_editorial ? 1 : 0;
  if ('pdf_paginas' in o) o.pdf_paginas = o.pdf_paginas ? parseInt(o.pdf_paginas, 10) || null : null;
  if ('tipo' in o && !['traducao', 'original'].includes(o.tipo)) o.tipo = 'traducao';
  if ('acesso' in o && !['livre', 'cadastro'].includes(o.acesso)) o.acesso = atual.acesso || 'cadastro';
  if ('area' in o && !AREAS.includes(o.area)) o.area = atual.area || AREAS[0];
  for (const k of ['pdf_url', 'capa_url']) if (o[k] && !/^\/artigos\/[\w-]+\.(?:pdf|jpe?g|png|webp)$/i.test(o[k])) delete o[k];
  if (o.url_original && !/^https?:\/\//.test(o.url_original)) o.url_original = null;
  return o;
}

async function slugLivre(env, base, id) {
  let s = base || 'artigo', i = 2;
  while (await env.DB.prepare('SELECT 1 FROM artigos WHERE slug = ?1 AND id <> ?2 UNION ALL SELECT 1 FROM artigos_enderecos WHERE slug = ?1 AND artigo_id <> ?2').bind(s, id || 0).first()) s = `${base}-${i++}`;
  return s;
}

async function lerArtigo(env, id) {
  return env.DB.prepare(
    `SELECT a.*, c.nome AS criado_por_nome, m.nome AS atualizado_por_nome,
      (SELECT COUNT(*) FROM comentarios WHERE artigo_id = a.id) AS n_comentarios
     FROM artigos a LEFT JOIN usuarios c ON c.id = a.criado_por LEFT JOIN usuarios m ON m.id = a.atualizado_por WHERE a.id = ?`,
  ).bind(id).first();
}

function comPermissoes(u, a) {
  return {
    ...a,
    pode: {
      editar: pode(u, 'editar_artigo', a), comentar: pode(u, 'comentar', a), enviar_revisao: pode(u, 'enviar_revisao', a),
      voltar_rascunho: pode(u, 'voltar_rascunho', a), publicar: pode(u, 'publicar', a), arquivar: pode(u, 'arquivar', a), excluir: pode(u, 'excluir_artigo', a),
    },
  };
}

// ---------------------------------------------------------------- roteador
export async function api(req, env, url, ctx) {
  // publicado pela primeira vez: avisa os inscritos por e-mail (fila; o resto sai a cada 10 minutos)
  const aoPublicar = async (tipo, id, titulo) => {
    try {
      if ((await enfileirar(env, tipo, id, titulo)) && ctx) ctx.waitUntil(processarFila(env).catch((e) => console.error('fila de e-mails', e)));
    } catch (e) { console.error('enfileirar', e); }
  };
  const m = req.method;
  const p = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
  const seg = p.split('/').filter(Boolean);

  // ---- abertas
  if (p === '/sessao' && m === 'GET') {
    const u = await usuarioDaSessao(env, req);
    const n = (await env.DB.prepare('SELECT COUNT(*) n FROM usuarios').first()).n;
    return json({ usuario: publicoUsuario(u), permissoes: u ? permissoesDe(u) : null, papeis: PAPEIS, papeis_loja: PAPEIS_LOJA, configurar: n === 0, chave_configurada: !!env.CHAVE_CONFIGURACAO });
  }

  if (p === '/configurar' && m === 'POST') {
    const n = (await env.DB.prepare('SELECT COUNT(*) n FROM usuarios').first()).n;
    if (n > 0) return erro('A plataforma já foi configurada.', 409);
    const d = await corpo(req);
    if (!env.CHAVE_CONFIGURACAO) return erro('Defina a variável secreta CHAVE_CONFIGURACAO no Cloudflare antes de configurar.', 503);
    if (!iguais(await sha256(String(d.chave || '')), await sha256(env.CHAVE_CONFIGURACAO))) return erro('Chave de configuração incorreta.', 403);
    if (!d.nome || !/^\S+@\S+\.\S+$/.test(d.email || '')) return erro('Informe nome e e-mail válidos.');
    if (!senhaValida(d.senha)) return erro('A senha precisa ter pelo menos 10 caracteres.');
    const { hash, sal } = await hashSenha(d.senha);
    const r = await env.DB.prepare("INSERT INTO usuarios (email, nome, papel, papel_loja, senha_hash, senha_sal) VALUES (?,?,'proprietario','gerente',?,?) RETURNING *")
      .bind(d.email.trim(), d.nome.trim(), hash, sal).first();
    await registrar(env, r, 'configurou a plataforma', r.email);
    return json({ ok: true }, 200, { 'Set-Cookie': await criarSessao(env, r) });
  }

  if (p === '/entrar' && m === 'POST') {
    const d = await corpo(req);
    const email = String(d.email || '').trim().toLowerCase();
    const ip = req.headers.get('CF-Connecting-IP') || 'local';
    if ((await limiteExcedido(env, 'e:' + email)) || (await limiteExcedido(env, 'i:' + ip))) return erro('Muitas tentativas. Aguarde 15 minutos.', 429);
    const u = await env.DB.prepare('SELECT * FROM usuarios WHERE email = ?').bind(email).first();
    const { hash } = await hashSenha(String(d.senha || ''), u ? u.senha_sal : 'x'.repeat(32));
    if (!u || !u.ativo || !iguais(hash, u.senha_hash)) {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO tentativas_login (chave) VALUES (?)').bind('e:' + email),
        env.DB.prepare('INSERT INTO tentativas_login (chave) VALUES (?)').bind('i:' + ip),
      ]);
      return erro('E-mail ou senha incorretos.', 401);
    }
    await registrar(env, u, 'entrou');
    return json({ ok: true }, 200, { 'Set-Cookie': await criarSessao(env, u) });
  }

  if (p === '/sair' && m === 'POST') {
    const tok = lerCookie(req, COOKIE);
    if (tok) await env.DB.prepare('DELETE FROM sessoes WHERE token_hash = ?').bind(await sha256(tok)).run();
    return json({ ok: true }, 200, { 'Set-Cookie': cookieSessao('', 0) });
  }

  if (p === '/convite' && m === 'GET') {
    const tok = url.searchParams.get('token') || '';
    const c = await env.DB.prepare("SELECT tipo, email, nome, papel, revista, papel_loja FROM convites WHERE token_hash = ? AND usado_em IS NULL AND expira_em > datetime('now')")
      .bind(await sha256(tok)).first();
    return c ? json({ convite: { ...c, papel_nome: c.papel ? descreverAcesso(c.papel, c.revista, c.papel_loja) : null } }) : erro('Link inválido ou expirado.', 404);
  }

  if (p === '/convite' && m === 'POST') {
    const d = await corpo(req);
    const th = await sha256(String(d.token || ''));
    const c = await env.DB.prepare("SELECT * FROM convites WHERE token_hash = ? AND usado_em IS NULL AND expira_em > datetime('now')").bind(th).first();
    if (!c) return erro('Link inválido ou expirado.', 404);
    if (!senhaValida(d.senha)) return erro('A senha precisa ter pelo menos 10 caracteres.');
    const { hash, sal } = await hashSenha(d.senha);
    let u;
    if (c.tipo === 'convite') {
      if (await env.DB.prepare('SELECT 1 FROM usuarios WHERE email = ?').bind(c.email).first()) return erro('Já existe um usuário com este e-mail.', 409);
      u = await env.DB.prepare('INSERT INTO usuarios (email, nome, papel, revista, papel_loja, senha_hash, senha_sal) VALUES (?,?,?,?,?,?,?) RETURNING *')
        .bind(c.email, String(d.nome || c.nome || c.email).trim().slice(0, 120), c.papel, c.revista === 0 ? 0 : 1, lojaValida(c.papel_loja), hash, sal).first();
      await registrar(env, u, 'aceitou o convite', u.email, descreverAcesso(u.papel, u.revista, u.papel_loja));
    } else {
      await env.DB.prepare('UPDATE usuarios SET senha_hash = ?, senha_sal = ? WHERE id = ?').bind(hash, sal, c.usuario_id).run();
      await env.DB.prepare('DELETE FROM sessoes WHERE usuario_id = ?').bind(c.usuario_id).run();
      u = await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(c.usuario_id).first();
      await registrar(env, u, 'redefiniu a senha', u.email);
    }
    await env.DB.prepare("UPDATE convites SET usado_em = datetime('now') WHERE token_hash = ?").bind(th).run();
    if (!u.ativo) return erro('Usuário desativado.', 403);
    return json({ ok: true }, 200, { 'Set-Cookie': await criarSessao(env, u) });
  }

  // ---- daqui para baixo, só com sessão
  const u = await usuarioDaSessao(env, req);
  if (!u) return erro('Faça login para continuar.', 401);

  if (p === '/minha-senha' && m === 'POST') {
    const d = await corpo(req);
    const { hash } = await hashSenha(String(d.atual || ''), u.senha_sal);
    if (!iguais(hash, u.senha_hash)) return erro('Senha atual incorreta.', 403);
    if (!senhaValida(d.nova)) return erro('A nova senha precisa ter pelo menos 10 caracteres.');
    const n = await hashSenha(d.nova);
    await env.DB.prepare('UPDATE usuarios SET senha_hash = ?, senha_sal = ? WHERE id = ?').bind(n.hash, n.sal, u.id).run();
    const tok = lerCookie(req, COOKIE);
    await env.DB.prepare('DELETE FROM sessoes WHERE usuario_id = ? AND token_hash <> ?').bind(u.id, await sha256(tok)).run();
    await registrar(env, u, 'trocou a própria senha');
    return json({ ok: true });
  }

  if (p === '/meu-nome' && m === 'POST') {
    const d = await corpo(req);
    const nome = String(d.nome || '').trim().slice(0, 120);
    if (!nome) return erro('Informe um nome.');
    await env.DB.prepare('UPDATE usuarios SET nome = ? WHERE id = ?').bind(nome, u.id).run();
    return json({ ok: true });
  }

  // ---------------- artigos
  if (seg[0] === 'loja') return apiLoja(req, env, url, seg.slice(1), u, { corpo, registrar });

  if (seg[0] === 'artigos') {
    if (!pode(u, 'ver_rascunhos')) return erro('Você não tem acesso à revista.', 403);
    if (seg.length === 1 && m === 'GET') {
      const r = await env.DB.prepare(
        `SELECT a.id, a.slug, a.status, a.tipo, a.titulo, a.autor, a.tradutor, a.periodico, a.ano, a.area, a.capa_url, a.criado_por, a.atualizado_em, a.publicado_em,
          c.nome AS criado_por_nome, (SELECT COUNT(*) FROM comentarios WHERE artigo_id = a.id) AS n_comentarios
         FROM artigos a LEFT JOIN usuarios c ON c.id = a.criado_por ORDER BY a.atualizado_em DESC`,
      ).all();
      return json({ artigos: r.results.map((a) => comPermissoes(u, a)) });
    }
    if (seg.length === 1 && m === 'POST') {
      if (!pode(u, 'criar_artigo')) return erro('Seu papel não permite criar artigos.', 403);
      const d = limpar(await corpo(req));
      if (!d.titulo || !d.autor) return erro('Título e autor são obrigatórios.');
      const slug = await slugLivre(env, slugify((await corpo2(d)).base), 0);
      const cols = Object.keys(d);
      const r = await env.DB.prepare(
        `INSERT INTO artigos (slug, ${cols.join(',')}, criado_por, atualizado_por) VALUES (?, ${cols.map(() => '?').join(',')}, ?, ?) RETURNING id`,
      ).bind(slug, ...cols.map((k) => d[k]), u.id, u.id).first();
      await registrar(env, u, 'criou o artigo', d.titulo);
      return json({ artigo: comPermissoes(u, await lerArtigo(env, r.id)) }, 201);
    }
    const id = parseInt(seg[1], 10);
    const a = id ? await lerArtigo(env, id) : null;
    if (!a) return erro('Artigo não encontrado.', 404);

    if (seg.length === 2 && m === 'GET') return json({ artigo: comPermissoes(u, a) });

    if (seg.length === 2 && m === 'PUT') {
      if (!pode(u, 'editar_artigo', a)) return erro('Seu papel não permite editar este artigo.', 403);
      const dados = await corpo(req);
      const d = limpar(dados, a);
      if ('titulo' in d && !d.titulo) return erro('O título é obrigatório.');
      if ('autor' in d && !d.autor) return erro('O autor é obrigatório.');
      if (dados.slug && dados.slug !== a.slug) {
        const s = slugify(dados.slug);
        if (!s) return erro('Endereço inválido.');
        if (await env.DB.prepare('SELECT 1 FROM artigos WHERE slug = ?1 AND id <> ?2 UNION ALL SELECT 1 FROM artigos_enderecos WHERE slug = ?1 AND artigo_id <> ?2').bind(s, a.id).first()) return erro('Já existe um artigo com esse endereço.', 409);
        d.slug = s;
      }
      const cols = Object.keys(d);
      if (cols.length) {
        await env.DB.prepare(`UPDATE artigos SET ${cols.map((k) => k + ' = ?').join(', ')}, atualizado_por = ?, atualizado_em = datetime('now') WHERE id = ?`)
          .bind(...cols.map((k) => d[k]), u.id, a.id).run();
        await registrar(env, u, 'editou o artigo', a.titulo, cols.join(', '));
      }
      return json({ artigo: comPermissoes(u, await lerArtigo(env, a.id)) });
    }

    if (seg.length === 2 && m === 'DELETE') {
      if (!pode(u, 'excluir_artigo', a)) return erro('Seu papel não permite excluir este artigo.', 403);
      for (const k of [a.pdf_url, a.capa_url]) if (k && k.startsWith('/arquivos/')) await env.ARQUIVOS.delete(k.slice('/arquivos/'.length));
      await env.DB.prepare('DELETE FROM artigos WHERE id = ?').bind(a.id).run();
      await registrar(env, u, 'excluiu o artigo', a.titulo);
      return json({ ok: true });
    }

    if (seg[2] === 'status' && m === 'POST') {
      const { status } = await corpo(req);
      if (!STATUS.includes(status)) return erro('Situação inválida.');
      const regra = { revisao: a.status === 'rascunho' ? 'enviar_revisao' : 'publicar', rascunho: a.status === 'revisao' ? 'voltar_rascunho' : 'publicar', publicado: 'publicar', arquivado: 'arquivar' }[status];
      if (!pode(u, regra, a)) return erro('Seu papel não permite essa mudança.', 403);
      if (status === 'publicado') {
        if (!a.pdf_url) return erro('Envie o PDF antes de publicar.');
        if (!a.resumo) return erro('Escreva o resumo antes de publicar.');
      }
      await env.DB.prepare(
        `UPDATE artigos SET status = ?, atualizado_por = ?, atualizado_em = datetime('now')${status === 'publicado' && !a.publicado_em ? ", publicado_em = datetime('now')" : ''} WHERE id = ?`,
      ).bind(status, u.id, a.id).run();
      const nomes = { rascunho: 'voltou para rascunho', revisao: 'enviou para revisão', publicado: 'publicou', arquivado: 'arquivou' };
      await registrar(env, u, nomes[status], a.titulo);
      if (status === 'publicado' && !a.publicado_em) await aoPublicar('artigo', a.id, a.titulo);
      return json({ artigo: comPermissoes(u, await lerArtigo(env, a.id)) });
    }

    if (seg[2] === 'arquivo' && m === 'POST') {
      if (!pode(u, 'editar_artigo', a)) return erro('Seu papel não permite editar este artigo.', 403);
      const tipo = url.searchParams.get('tipo');
      const ct = (req.headers.get('Content-Type') || '').split(';')[0];
      const ok = tipo === 'pdf' ? ct === 'application/pdf' : tipo === 'capa' && ['image/jpeg', 'image/png', 'image/webp'].includes(ct);
      if (!ok) return erro('Tipo de arquivo não aceito.');
      const buf = await req.arrayBuffer();
      const max = tipo === 'pdf' ? 40 * 1024 * 1024 : 5 * 1024 * 1024;
      if (!buf.byteLength || buf.byteLength > max) return erro(`Arquivo vazio ou maior que ${max / 1024 / 1024} MB.`);
      if (tipo === 'pdf' && new TextDecoder().decode(new Uint8Array(buf.slice(0, 5))) !== '%PDF-') return erro('O arquivo não parece ser um PDF.');
      const ext = tipo === 'pdf' ? 'pdf' : ct === 'image/png' ? 'png' : ct === 'image/webp' ? 'webp' : 'jpg';
      const chave = `artigos/${a.slug}-${aleatorio(4)}${tipo === 'capa' ? '-capa' : ''}.${ext}`;
      await env.ARQUIVOS.put(chave, buf, { httpMetadata: { contentType: ct } });
      const antigo = tipo === 'pdf' ? a.pdf_url : a.capa_url;
      const col = tipo === 'pdf' ? 'pdf_url' : 'capa_url';
      const pags = tipo === 'pdf' ? parseInt(url.searchParams.get('paginas') || '', 10) || null : null;
      const troca = await env.DB.prepare(`UPDATE artigos SET ${col} = ?${tipo === 'pdf' ? ', pdf_paginas = ?' : ''}, atualizado_por = ?, atualizado_em = datetime('now') WHERE id = ? AND ${col} IS ? AND status = ?`)
        .bind(...(tipo === 'pdf' ? ['/arquivos/' + chave, pags] : ['/arquivos/' + chave]), u.id, a.id, antigo, a.status).run();
      if (!troca.meta.changes) {
        await env.ARQUIVOS.delete(chave);
        return erro('O artigo mudou. Atualize antes de enviar novamente.', 409);
      }
      // O objeto anterior fica inacessível sem referência no banco e pode ser limpo depois.
      await registrar(env, u, tipo === 'pdf' ? 'enviou o PDF' : 'enviou a capa', a.titulo);
      return json({ artigo: comPermissoes(u, await lerArtigo(env, a.id)) });
    }

    if (seg[2] === 'comentarios') {
      if (m === 'GET') {
        const r = await env.DB.prepare('SELECT c.id, c.texto, c.criado_em, c.usuario_id, u.nome, u.papel FROM comentarios c LEFT JOIN usuarios u ON u.id = c.usuario_id WHERE artigo_id = ? ORDER BY c.criado_em')
          .bind(a.id).all();
        return json({ comentarios: r.results });
      }
      if (m === 'POST') {
        if (!pode(u, 'comentar', a)) return erro('Seu papel não permite comentar este artigo.', 403);
        const { texto } = await corpo(req);
        const t = String(texto || '').trim().slice(0, 4000);
        if (!t) return erro('Escreva o comentário.');
        await env.DB.prepare('INSERT INTO comentarios (artigo_id, usuario_id, texto) VALUES (?,?,?)').bind(a.id, u.id, t).run();
        await registrar(env, u, 'comentou', a.titulo);
        return json({ ok: true }, 201);
      }
      if (m === 'DELETE' && seg[3]) {
        const c = await env.DB.prepare('SELECT * FROM comentarios WHERE id = ? AND artigo_id = ?').bind(parseInt(seg[3], 10), a.id).first();
        if (!c) return erro('Comentário não encontrado.', 404);
        if (c.usuario_id !== u.id && !pode(u, 'gerir_usuarios')) return erro('Você só pode apagar os próprios comentários.', 403);
        await env.DB.prepare('DELETE FROM comentarios WHERE id = ?').bind(c.id).run();
        return json({ ok: true });
      }
    }
    return erro('Rota não encontrada.', 404);
  }

  // ---------------- usuários
  if (seg[0] === 'usuarios' || seg[0] === 'convites') {
    if (!pode(u, 'gerir_usuarios')) return erro('Apenas administradores gerenciam usuários.', 403);
    const base = new URL('/admin.html', url).toString();

    if (seg[0] === 'usuarios' && seg.length === 1 && m === 'GET') {
      const r = await env.DB.prepare('SELECT * FROM usuarios ORDER BY ativo DESC, nome').all();
      const c = await env.DB.prepare("SELECT rowid AS id, tipo, email, nome, papel, revista, papel_loja, criado_em, expira_em FROM convites WHERE usado_em IS NULL AND expira_em > datetime('now') ORDER BY criado_em DESC").all();
      return json({
        usuarios: r.results.map((x) => ({ ...publicoUsuario(x), editavel: x.id !== u.id && podeAtribuir(u, x.papel, x) })),
        convites: c.results,
      });
    }
    if (seg[0] === 'usuarios' && seg[1] === 'convite' && m === 'POST') {
      const d = await corpo(req);
      const email = String(d.email || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return erro('E-mail inválido.');
      if (!podeAtribuir(u, d.papel, null)) return erro('Você não pode atribuir esse papel.', 403);
      if (await env.DB.prepare('SELECT 1 FROM usuarios WHERE email = ?').bind(email).first()) return erro('Já existe um usuário com este e-mail.', 409);
      const tok = aleatorio(32);
      const revista = d.revista === false ? 0 : 1, loja = lojaValida(d.papel_loja);
      await env.DB.prepare("INSERT INTO convites (token_hash, tipo, email, nome, papel, revista, papel_loja, criado_por, expira_em) VALUES (?, 'convite', ?, ?, ?, ?, ?, ?, ?)")
        .bind(await sha256(tok), email, String(d.nome || '').trim().slice(0, 120) || null, d.papel, revista, loja, u.id, daqui(24 * 7)).run();
      await registrar(env, u, 'convidou', email, descreverAcesso(d.papel, revista, loja));
      return json({ link: `${base}#convite=${tok}`, expira: '7 dias' }, 201);
    }
    if (seg[0] === 'convites' && seg[1] && m === 'DELETE') {
      await env.DB.prepare('DELETE FROM convites WHERE rowid = ? AND usado_em IS NULL').bind(parseInt(seg[1], 10)).run();
      await registrar(env, u, 'cancelou um convite');
      return json({ ok: true });
    }
    if (seg[0] === 'usuarios' && seg[1]) {
      const alvo = await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(parseInt(seg[1], 10)).first();
      if (!alvo) return erro('Usuário não encontrado.', 404);
      if (alvo.id === u.id) return erro('Use "Minha conta" para alterar o seu próprio cadastro.', 400);
      if (!podeAtribuir(u, alvo.papel, alvo)) return erro('Você não pode alterar este usuário.', 403);

      if (seg.length === 2 && m === 'PUT') {
        const d = await corpo(req);
        if (d.papel && d.papel !== alvo.papel) {
          if (!podeAtribuir(u, d.papel, alvo)) return erro('Você não pode atribuir esse papel.', 403);
          await env.DB.prepare('UPDATE usuarios SET papel = ? WHERE id = ?').bind(d.papel, alvo.id).run();
          await registrar(env, u, 'mudou o papel de', alvo.email, `${PAPEIS[alvo.papel].nome} → ${PAPEIS[d.papel].nome}`);
        }
        if (typeof d.revista === 'boolean' && d.revista !== (alvo.revista !== 0)) {
          await env.DB.prepare('UPDATE usuarios SET revista = ? WHERE id = ?').bind(d.revista ? 1 : 0, alvo.id).run();
          await registrar(env, u, d.revista ? 'deu acesso à revista para' : 'tirou o acesso à revista de', alvo.email);
        }
        if (d.papel_loja && PAPEIS_LOJA[d.papel_loja] && d.papel_loja !== alvo.papel_loja) {
          await env.DB.prepare('UPDATE usuarios SET papel_loja = ? WHERE id = ?').bind(d.papel_loja, alvo.id).run();
          await registrar(env, u, 'mudou o acesso à loja de', alvo.email, `${PAPEIS_LOJA[lojaValida(alvo.papel_loja)].nome} → ${PAPEIS_LOJA[d.papel_loja].nome}`);
        }
        if (typeof d.ativo === 'boolean' && d.ativo !== !!alvo.ativo) {
          await env.DB.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?').bind(d.ativo ? 1 : 0, alvo.id).run();
          if (!d.ativo) await env.DB.prepare('DELETE FROM sessoes WHERE usuario_id = ?').bind(alvo.id).run();
          await registrar(env, u, d.ativo ? 'reativou' : 'desativou', alvo.email);
        }
        return json({ ok: true });
      }
      if (seg[2] === 'redefinicao' && m === 'POST') {
        const tok = aleatorio(32);
        await env.DB.prepare("INSERT INTO convites (token_hash, tipo, email, usuario_id, criado_por, expira_em) VALUES (?, 'redefinicao', ?, ?, ?, ?)")
          .bind(await sha256(tok), alvo.email, alvo.id, u.id, daqui(48)).run();
        await registrar(env, u, 'gerou redefinição de senha para', alvo.email);
        return json({ link: `${base}#redefinir=${tok}`, expira: '48 horas' }, 201);
      }
    }
    return erro('Rota não encontrada.', 404);
  }

  if (seg[0] === 'testemunhos') {
    if (!pode(u, 'publicar')) return erro('Apenas editores e acima publicam testemunhos.', 403);
    return apiTestemunhosPainel(req, env, url, seg.slice(1), u, { registrar, aoPublicar });
  }

  if (p === '/emails' && m === 'GET') {
    if (!pode(u, 'publicar')) return erro('Apenas editores e acima veem os e-mails.', 403);
    return apiEmailsPainel(env);
  }

  if (seg[0] === 'moderacao') {
    if (!pode(u, 'moderar_comentarios')) return erro('Apenas editores e acima moderam os comentários.', 403);
    return apiModeracao(req, env, url, seg.slice(1), u, { registrar });
  }

  if (p === '/estatisticas' && m === 'GET') {
    if (!pode(u, 'ver_estatisticas')) return erro('Apenas editores e acima veem as estatísticas.', 403);
    return relatorio(env, url);
  }

  if (p === '/historico' && m === 'GET') {
    if (!pode(u, 'ver_historico')) return erro('Apenas administradores veem o histórico.', 403);
    const r = await env.DB.prepare('SELECT h.*, u.nome FROM historico h LEFT JOIN usuarios u ON u.id = h.usuario_id ORDER BY h.id DESC LIMIT 300').all();
    return json({ historico: r.results });
  }

  return erro('Rota não encontrada.', 404);
}

// base do endereço do artigo: sobrenome do autor + palavras do título
async function corpo2(d) {
  const sobrenome = String(d.autor || '').replace(/,?\s*(jr|sr)\.?$/i, '').trim().split(/\s+/).pop() || '';
  const palavras = String(d.titulo || '').split(/\s+/).filter((w) => w.length > 2).slice(0, 5).join(' ');
  return { base: slugify(`${sobrenome} ${palavras}`) };
}
