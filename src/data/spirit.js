// Spirit Immersion — números da página pública (/spirit-immersion.html).
// Fonte: planilha "SPIRIT IMMERSION (respostas)" (formulário de encerramento), lida em 24/11/2026:
// 382 respostas — 249 da edição de janeiro de 2024 e 133 da edição de dezembro de 2025/janeiro de 2026.
// Só números agregados: nenhuma resposta individual é publicada (relatos recebidos sem a pergunta de
// autorização contam como "só para a equipe", conforme a Política de Privacidade).
// Para atualizar depois de uma nova edição, recalcule a partir da planilha e troque os valores abaixo.

export const fonte = {
  respostas: 382,
  edicoes: [{ nome: 'Jan 2024', n: 249 }, { nome: 'Dez 2025 – Jan 2026', n: 133 }],
};

// contadores do topo
export const destaques = [
  { valor: 382, sufixo: '', pt: 'participantes responderam ao formulário de encerramento', en: 'participants answered the closing survey' },
  { valor: 7908, sufixo: 'h', pt: 'de oração registradas (dias marcados × 1 hora)', en: 'of prayer recorded (days marked × 1 hour)' },
  { valor: 93, sufixo: '%', pt: 'sentiram o chamado para uma vida de oração diária', en: 'felt called to a daily life of prayer' },
  { valor: 60, sufixo: '%', pt: 'oraram mais de uma hora em algum dos dias', en: 'prayed more than one hour on some days' },
];

// "Quais efeitos você percebeu em você?" (múltipla escolha) — % das 382 respostas
export const frutos = [
  { n: 287, pt: 'Mais fome por Deus', en: 'Greater hunger for God' },
  { n: 269, pt: 'Mais intimidade com Deus', en: 'Deeper intimacy with God' },
  { n: 247, pt: 'Mais sensibilidade espiritual', en: 'Greater spiritual sensitivity' },
  { n: 210, pt: 'Mais amor pelas Escrituras', en: 'Greater love for the Scriptures' },
  { n: 209, pt: 'Consistência na oração', en: 'Consistency in prayer' },
  { n: 187, pt: 'Crescimento em maturidade', en: 'Growth in maturity' },
  { n: 184, pt: 'Mais resistência contra o pecado', en: 'Greater resistance to sin' },
  { n: 181, pt: 'Sensibilidade à voz de Deus', en: 'Sensitivity to God’s voice' },
  { n: 181, pt: 'Mais estabilidade emocional', en: 'Greater emotional stability' },
  { n: 176, pt: 'Mais amor pela Igreja', en: 'Greater love for the Church' },
  { n: 148, pt: 'Dons espirituais mais aguçados', en: 'Sharper spiritual gifts' },
  { n: 132, pt: 'Sonhos e visões com mais frequência', en: 'More frequent dreams and visions' },
  { n: 91, pt: 'Cura emocional', en: 'Emotional healing' },
  { n: 79, pt: 'Libertação de pecados', en: 'Freedom from sin' },
];

// constância (edição de 31 dias)
export const constancia = { mediana: 24, de: 31, vinteOuMais: 63, completos: 32 };

// edição dez 2025 – jan 2026 (133 respostas)
export const ultimaEdicao = { n: 133, cemDias: 97, consagracao: 92, linguas: 87, idadeMin: 16, idadeMax: 69, idadeMediana: 31, estados: 22, paises: 3 }; // 22 estados + DF; Brasil, Portugal e Japão
