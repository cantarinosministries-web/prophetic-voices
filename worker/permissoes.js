// Papéis e o que cada um pode fazer (modelo inspirado no Google Drive).

export const PAPEIS = {
  proprietario: { nivel: 6, nome: 'Proprietário', descricao: 'Controle total, inclusive sobre administradores e outros proprietários.' },
  administrador: { nivel: 5, nome: 'Administrador', descricao: 'Gerencia usuários (abaixo de administrador) e todo o conteúdo.' },
  editor: { nivel: 4, nome: 'Editor', descricao: 'Cria, edita, revisa e publica qualquer artigo.' },
  autor: { nivel: 3, nome: 'Autor', descricao: 'Cria artigos e edita os próprios; envia para revisão, mas não publica.' },
  revisor: { nivel: 2, nome: 'Revisor', descricao: 'Lê todos os artigos, inclusive rascunhos, e comenta.' },
  leitor: { nivel: 1, nome: 'Leitor', descricao: 'Lê todos os artigos, inclusive rascunhos, sem editar nem comentar.' },
};

const nivelBruto = (u) => (u && PAPEIS[u.papel] ? PAPEIS[u.papel].nivel : 0);
// nível na revista: quem não é admin e teve a revista desligada fica sem acesso
const nivel = (u) => { const n = nivelBruto(u); return n >= 5 || !u || u.revista !== 0 ? n : 0; };
const dono = (u, a) => a && u && a.criado_por === u.id;

export function pode(u, acao, artigo) {
  const n = nivel(u);
  if (!n) return false;
  switch (acao) {
    case 'ver_rascunhos':
      return n >= 1;
    case 'comentar':
      return n >= 4 || n === 2 || (n === 3 && dono(u, artigo));
    case 'criar_artigo':
      return n >= 3;
    case 'editar_artigo':
      if (n >= 4) return true;
      return n === 3 && dono(u, artigo) && ['rascunho', 'revisao'].includes(artigo.status);
    case 'enviar_revisao':
      return n >= 4 || (n === 3 && dono(u, artigo) && artigo.status === 'rascunho');
    case 'voltar_rascunho':
      return n >= 4 || (n === 3 && dono(u, artigo) && artigo.status === 'revisao');
    case 'publicar':
    case 'arquivar':
      return n >= 4;
    case 'excluir_artigo':
      return n >= 5 || (n === 3 && dono(u, artigo) && artigo.status === 'rascunho');
    case 'gerir_usuarios':
    case 'ver_historico':
      return n >= 5;
    default:
      return false;
  }
}

// quem pode atribuir qual papel a quem
export function podeAtribuir(u, papelNovo, alvo) {
  const n = nivel(u);
  if (n < 5 || !PAPEIS[papelNovo]) return false;
  if (n === 6) return true;
  // administrador: só mexe em quem está abaixo dele e só atribui papéis abaixo dele
  if (alvo && nivelBruto(alvo) >= 5) return false;
  return PAPEIS[papelNovo].nivel < 5;
}

// ---------------------------------------------------------------- loja
export const PAPEIS_LOJA = {
  gerente: { nivel: 3, nome: 'Gerente da loja', descricao: 'Cadastra produtos, fotos e preços, controla o estoque, os pedidos e as configurações da loja.' },
  expedicao: { nivel: 2, nome: 'Expedição', descricao: 'Vê produtos e pedidos, separa, gera etiquetas e marca como enviado.' },
  visualizador: { nivel: 1, nome: 'Visualizador da loja', descricao: 'Vê produtos, estoque e pedidos, sem alterar nada.' },
  nenhum: { nivel: 0, nome: 'Sem acesso à loja', descricao: 'Não vê a área da loja.' },
};

// proprietário e administrador têm acesso total à loja, qualquer que seja o papel_loja
export function nivelLoja(u) {
  if (!u) return 0;
  if (u.papel === 'proprietario' || u.papel === 'administrador') return 3;
  return PAPEIS_LOJA[u.papel_loja] ? PAPEIS_LOJA[u.papel_loja].nivel : 0;
}

export function podeLoja(u, acao) {
  const n = nivelLoja(u);
  switch (acao) {
    case 'ver': return n >= 1;
    case 'expedir': return n >= 2;          // mudar status de envio, gerar etiqueta
    case 'gerir': return n >= 3;            // produtos, preços, estoque, cancelar, configurações
    default: return false;
  }
}

export function permissoesDe(u) {
  return {
    ver_revista: pode(u, 'ver_rascunhos'),
    criar_artigo: pode(u, 'criar_artigo'),
    publicar: pode(u, 'publicar'),
    gerir_usuarios: pode(u, 'gerir_usuarios'),
    ver_historico: pode(u, 'ver_historico'),
    papeis_atribuiveis: Object.keys(PAPEIS).filter((p) => podeAtribuir(u, p, null)),
    loja_ver: podeLoja(u, 'ver'),
    loja_expedir: podeLoja(u, 'expedir'),
    loja_gerir: podeLoja(u, 'gerir'),
  };
}
