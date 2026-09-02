// A oferta.
//
// Antes este texto vivia hardcoded em OfferSection.tsx — e, pior, também no
// FAQPage JSON-LD do index.html, o que fazia o robô receber mais informação
// comercial que o comprador. Agora existe uma fonte só; a página e o schema
// leem daqui.
//
// MUDANÇA DE POSICIONAMENTO (ago/2026): o produto de entrada é o DIAGNÓSTICO DE
// GARGALO, não o cardápio de frentes. A razão é a evidência do capítulo 1: 95%
// dos pilotos de IA não dão retorno (MIT NANDA, 2025) porque atacam o processo
// errado. Achar o processo certo é engenharia de produção — é o que não
// comoditiza, e é o que se vende primeiro.

/**
 * Preço do diagnóstico.
 *
 * DECISÃO PENDENTE DO RAUL. Enquanto for null, a página diz "o valor sai na
 * proposta" em vez de exibir um número — que é a única saída honesta enquanto
 * o número não existe. NÃO preencher com estimativa: este arquivo é lido pelo
 * JSON-LD, e preço errado em dado estruturado é o tipo de erro que o Google
 * indexa e mantém no cache por semanas.
 */
export const DIAGNOSTIC_PRICE: string | null = null;

/**
 * Duração da conversa inicial, em minutos.
 *
 * FONTE ÚNICA. Este número aparecia escrito à mão em oito lugares — a oferta, o
 * FAQ (que alimenta o FAQPage JSON-LD), a chamada da dobra do agente, o
 * cabeçalho e o título do embed da agenda, duas mensagens de WhatsApp e o botão
 * do chat. Sete diziam 15; o botão do chat dizia 30.
 *
 * O botão errado era justamente o que mais converte: o visitante lia "sessão de
 * 30 min" e caía numa agenda que a página inteira vendeu como de 15. Divergir
 * numa promessa de tempo é barato de cometer e caro de explicar na chamada.
 *
 * ATENÇÃO — ISTO NÃO ALCANÇA O CAL.COM. O evento configurado em
 * VITE_BOOKING_URL tem o slug `/30min`. Alinhar o código não muda a duração do
 * evento no provedor: ou o evento passa a ser de 15 minutos, ou esta constante
 * vira 30 e a oferta muda junto. Enquanto os dois discordarem, o visitante
 * ainda vê uma coisa e agenda outra.
 */
export const SESSION_MINUTES = 15;

/**
 * Faixa de implementação.
 *
 * ATENÇÃO — o piso de R$ 500/mês está aqui porque já estava publicado, não
 * porque foi validado. A auditoria de ago/2026 apontou que R$ 500 não cobre o
 * custo real de um agente em produção (tokens + hospedagem + monitoramento +
 * tratamento de alucinação + suporte), e que essa âncora atrai o pior perfil
 * de cliente. Revisar antes da próxima campanha.
 */
export const IMPLEMENTATION_RANGE = 'entre R$ 500 e R$ 5.000/mês';

export interface OfferTerm {
  /** Rótulo curto da coluna. */
  label: string;
  /** A resposta em si — o que o comprador lê primeiro. */
  value: string;
  /** O detalhe que elimina a dúvida seguinte. */
  detail: string;
}

export const OFFER_TERMS: OfferTerm[] = [
  {
    label: 'Como começa',
    value: `Conversa de ${SESSION_MINUTES} minutos, gratuita`,
    detail:
      'Por vídeo ou WhatsApp, sobre a sua operação — não uma apresentação de slides. Serve para saber se faz sentido seguir.',
  },
  {
    label: 'O produto',
    value: 'Diagnóstico de Gargalo',
    detail:
      'Trinta dias medindo horas e volume das suas rotinas, no seu sistema. Sai com os três gargalos mais caros, em ordem de custo por hora, e o que atacar primeiro.',
  },
  {
    label: 'Investimento',
    value: DIAGNOSTIC_PRICE ?? 'O valor sai na proposta',
    detail: `A conversa inicial não é cobrada. A implementação que vem depois do diagnóstico costuma ficar ${IMPLEMENTATION_RANGE} para pequenas e médias empresas, conforme o escopo.`,
  },
  {
    label: 'O que não acontece',
    value: 'Sem contrato de fidelidade',
    detail:
      'O prazo e o indicador de sucesso entram por escrito na proposta, antes de começar. Não entrou em produção na data combinada, a etapa não é cobrada.',
  },
];

/**
 * FAQ.
 *
 * Fonte única: alimenta o FAQPage JSON-LD (via scripts/build-seo.js) E o bloco
 * visível da página. A regra que isto existe para impedir: nunca mais o
 * crawler saber algo que o comprador não vê na tela.
 *
 * Formato pensado para GEO — pergunta na forma que a pessoa realmente digita,
 * resposta autossuficiente no primeiro parágrafo.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ: FaqItem[] = [
  {
    question: 'Como implementar inteligência artificial na minha empresa?',
    answer:
      'Começa por medir, não por escolher ferramenta. Um estudo do MIT Project NANDA (2025) encontrou que 95% dos pilotos corporativos de IA generativa não geram retorno mensurável — quase sempre porque automatizaram o processo errado. O caminho é levantar horas e volume das rotinas atuais, ordenar por custo por hora e atacar o gargalo mais caro primeiro. É o que a RIA faz no Diagnóstico de Gargalo.',
  },
  {
    question: 'Quanto custa implementar IA em uma empresa?',
    answer: `A conversa inicial de ${SESSION_MINUTES} minutos é gratuita. O Diagnóstico de Gargalo é cobrado à parte e o valor sai na proposta, depois de entender o tamanho da operação. A implementação que vem depois costuma ficar ${IMPLEMENTATION_RANGE} para pequenas e médias empresas, conforme o escopo. Não há contrato de fidelidade: o prazo e o indicador de sucesso entram por escrito na proposta, e se a etapa não entrar em produção na data combinada, ela não é cobrada.`,
  },
  {
    question: 'Por que a maioria dos projetos de IA em empresas falha?',
    answer:
      'Porque a decisão sobre onde aplicar IA costuma ser tomada pela ferramenta disponível, não pelo gargalo real. A McKinsey (2025) encontrou 88% das organizações usando IA em alguma função, mas apenas 39% relatando qualquer impacto no EBIT. A diferença entre os dois números é quase toda escolha de processo: automatizar uma rotina que custa pouco não devolve nada, por melhor que seja o modelo.',
  },
  {
    question: 'O que são agentes de IA e como funcionam nos negócios?',
    answer:
      'Agentes de IA são sistemas que recebem um objetivo, consultam dados e executam tarefas sem alguém conduzindo passo a passo. Na prática comercial, o uso com retorno mais previsível é o atendimento de primeira resposta: uma auditoria de 2,24 milhões de leads publicada pela Harvard Business Review mostrou que contatar um lead na primeira hora torna a qualificação cerca de 7 vezes mais provável do que contatar na hora seguinte. Um agente que responde em segundos, 24 horas por dia, ataca exatamente essa perda.',
  },
  {
    question: 'IA faz sentido para pequenas e médias empresas?',
    answer:
      'É onde a diferença é maior hoje no Brasil. A pesquisa TIC Empresas do Cetic.br (2025) mediu 17% das empresas brasileiras usando IA, sendo 15% entre as pequenas — contra 50% nas grandes. Ou seja: nas grandes empresas a vantagem competitiva já virou linha de base, e nas pequenas ainda não. A janela existe, mas está fechando.',
  },
  {
    question: 'Quem é o responsável técnico pela RIA?',
    answer:
      'Raul Vieira, engenheiro de produção formado pela Universidade Federal de São Carlos (UFSCar). A formação é o método: medir o processo, achar o ponto que trava e atacar o de maior custo por hora é engenharia de produção clássica. A IA mudou a ferramenta, não o ofício.',
  },
];
