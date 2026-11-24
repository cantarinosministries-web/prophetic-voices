// Spirit Immersion — números da página pública (/spirit-immersion.html).
// Fonte: planilha "SPIRIT IMMERSION (respostas)" (formulário de encerramento), lida em 24/11/2026:
// 382 respostas — 249 da edição de janeiro de 2024 e 133 da edição de dezembro de 2025/janeiro de 2026.
// Números agregados e cinco trechos de relatos SEM identificação (escolhidos e liberados pelo Gabriel em 24/11/2026):
// editados só para clareza e tamanho, sem nomes de pessoas, igrejas, cidades ou detalhes que identifiquem alguém.
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
// estados (com o DF) e países citados na edição dez 2025 – jan 2026 (pergunta "Onde você mora?")
export const ufsParticipantes = ['AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP'];
export const paisesParticipantes = ['Brazil', 'Portugal', 'Japan'];
export const nomesPaises = { Brazil: { pt: 'Brasil', en: 'Brazil' }, Portugal: { pt: 'Portugal', en: 'Portugal' }, Japan: { pt: 'Japão', en: 'Japan' } };

export const ultimaEdicao = { n: 133, cemDias: 97, consagracao: 92, linguas: 87, idadeMin: 16, idadeMax: 69, idadeMediana: 31, estados: 22, paises: 3 }; // 22 estados + DF; Brasil, Portugal e Japão

// cinco relatos, sem identificação (trechos editados; sem nomes, lugares ou dados pessoais)
export const relatos = [
  {
    edicao: { pt: 'EDIÇÃO 2024', en: '2024 EDITION' }, tema: { pt: 'Das orações por mim às orações do Espírito', en: 'From my prayers to the Spirit’s prayers' },
    pt: 'No primeiro dia, o Espírito começou a revelar o estado do meu coração: muitas das minhas orações eram egocêntricas. Nos dias seguintes, Ele passou a me mostrar o coração de Jesus, e as orações já não eram por mim, mas pelas pessoas da minha igreja. Elas se tornaram menos palavras e mais lágrimas, gemidos de compaixão pelo próximo. Entendi que o quanto nos importamos com o coração de Jesus se revela no quanto nos importamos com a sua noiva.',
    en: 'On the first day, the Spirit began to reveal the state of my heart: many of my prayers were self-centred. In the following days He began to show me the heart of Jesus, and my prayers were no longer for me but for the people of my church. They became fewer words and more tears, groans of compassion for others. I understood that how much we care for the heart of Jesus is revealed by how much we care for His bride.',
  },
  {
    edicao: { pt: 'EDIÇÃO 2025–26', en: '2025–26 EDITION' }, tema: { pt: 'Presença sem impulso externo', en: 'Presence without outside help' },
    pt: 'A experiência mais marcante foi conseguir estar na presença de Deus orando em línguas sem precisar de música tocando ou de uma pregação antes. Eu sempre precisei disso para “acessar” a presença. Agora queria só silêncio: eu e Deus falando.',
    en: 'The most striking experience was being able to stay in God’s presence praying in tongues without needing music playing or a sermon first. I always needed that to “access” His presence. Now I wanted only silence: just God and me talking.',
  },
  {
    edicao: { pt: 'EDIÇÃO 2024', en: '2024 EDITION' }, tema: { pt: 'Não é mais bater o cartão', en: 'No longer clocking in' },
    pt: 'Muitos dias foram uma luta contra o corpo cansado, que relutava em ficar acordado. Mesmo assim, foi gracioso. Estar com Deus deixou de ser “bater o cartão”. Mesmo sem lágrimas todos os dias, a sensação é de estar sempre recebendo algo fresco do céu, como o pão quentinho da manhã.',
    en: 'Many days were a fight against a tired body that resisted staying awake. Even so, it was full of grace. Being with God stopped being “clocking in”. Even without tears every day, it feels like always receiving something fresh from heaven, like warm bread in the morning.',
  },
  {
    edicao: { pt: 'EDIÇÃO 2025–26', en: '2025–26 EDITION' }, tema: { pt: 'A casa em ordem', en: 'A house set in order' },
    pt: 'Foram dias mais leves, de mais paciência, de comunhão com o Espírito e com a minha esposa; dias de choro, alegria e convicção de pecado. O Senhor está nos levando a colocar a nossa casa em ordem. Fazia tempo que não orávamos juntos; hoje estamos num propósito de oração diário.',
    en: 'They were lighter days, with more patience, communion with the Spirit and with my wife; days of tears, joy and conviction of sin. The Lord is leading us to set our house in order. It had been a long time since we prayed together; today we are in a daily commitment of prayer.',
  },
  {
    edicao: { pt: 'EDIÇÃO 2024', en: '2024 EDITION' }, tema: { pt: 'Ousadia para anunciar', en: 'Boldness to proclaim' },
    pt: 'Vi um fluir nos dons e no chamado: mais ousadia para evangelizar na rua, e pela primeira vez vi pessoas se entregarem a Jesus através da minha vida. Um dia, andando na rua, Deus me mandou falar com um homem que passava; ele se converteu e foi batizado. Agora quero orar em línguas o dia inteiro: caminhando, lavando a louça…',
    en: 'I saw the gifts and the calling begin to flow: more boldness to evangelize on the street, and for the first time I saw people give their lives to Jesus through me. One day, walking down the street, God told me to talk to a man passing by; he was converted and baptized. Now I want to pray in tongues all day: walking, washing the dishes…',
  },
];
