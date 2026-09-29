// A oferta.
//
// Antes este texto vivia hardcoded em OfferSection.tsx — e, pior, também no
// FAQPage JSON-LD do index.html, o que fazia o robô receber mais informação
// comercial que o comprador. Agora existe uma fonte só; a página e o schema
// leem daqui.
//
// MUDANÇA DE POSICIONAMENTO (set/2026): o produto de entrada era o Diagnóstico
// de Gargalo — trinta dias medindo rotinas internas da empresa. Ele saiu. A
// página faz uma coisa só: mede o SITE do visitante, ali, na primeira dobra, em
// duas notas independentes (Google Lighthouse e prontidão para agentes de IA,
// do Is Agentic) e depois oferece dois caminhos, site novo ou otimização. Ver
// docs/superpowers/specs/2026-09-28-foco-em-sites-duas-notas-design.md.
//
// REGRA QUE ATRAVESSA TUDO: as duas notas nunca se somam, promediam ou viram
// uma terceira, e nenhum número exibido é fabricado. O que é número de
// terceiro vem de content/evidence.ts, com fonte e ano.

/**
 * Preço do trabalho.
 *
 * DECISÃO PENDENTE DO RAUL. Enquanto for null, a página diz "o valor sai na
 * proposta" em vez de exibir um número — que é a única saída honesta enquanto
 * o número não existe. NÃO preencher com estimativa: este arquivo é lido pelo
 * JSON-LD, e preço errado em dado estruturado é o tipo de erro que o Google
 * indexa e mantém no cache por semanas. (Era DIAGNOSTIC_PRICE; o diagnóstico
 * saiu, o valor continua sendo uma decisão em aberto.)
 */
export const PRICE: string | null = null;

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
 * Faixa do trabalho.
 *
 * ATENÇÃO — a faixa está aqui porque já estava publicada, não porque foi
 * validada. Ela nasceu para a implementação de agentes e foi herdada pelo
 * trabalho em sites sem ser reestimada: a auditoria de ago/2026 apontou que o
 * piso de R$ 500/mês não cobre o custo real de um agente em produção, e que
 * essa âncora atrai o pior perfil de cliente. Falta o Raul confirmar que a
 * faixa vale para criar ou otimizar um site. Revisar antes da próxima campanha.
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
    value: 'Medindo o seu site, aqui, agora',
    detail:
      'Duas notas independentes: a do Google Lighthouse (desempenho, acessibilidade, práticas recomendadas e SEO) e a de prontidão para agentes de IA, do Is Agentic. Grátis e sem cadastro, na primeira dobra do site da RIA.',
  },
  {
    label: 'O produto',
    value: 'Site novo, ou otimização do que existe',
    detail:
      'Se não há site, ele é construído para ser rápido, encontrável e citável por IA. Se já há, o trabalho ataca exatamente os pontos que o laudo apontou — na ordem em que doem.',
  },
  {
    label: 'Investimento',
    value: PRICE ?? 'O valor sai na proposta',
    detail: `A medição e a conversa de ${SESSION_MINUTES} minutos não são cobradas. O trabalho costuma ficar ${IMPLEMENTATION_RANGE} para pequenas e médias empresas, conforme o escopo.`,
  },
  {
    label: 'O que não acontece',
    value: 'Sem contrato de fidelidade',
    detail:
      'O prazo e o indicador de sucesso entram por escrito na proposta, antes de começar. Não entrou no ar na data combinada, a etapa não é cobrada.',
  },
];

/**
 * Os dois instrumentos da medição.
 *
 * Fonte única para quem precisa DESCREVER a medição fora da tela — o
 * agent-context.json, o llms.txt e as variantes em Markdown. A página mostra o
 * resultado, e o resultado vem de dois serviços que não conversam entre si:
 * daí a nota, que acompanha toda menção às duas.
 */
export const MEASUREMENT = {
  instruments: [
    {
      name: 'Google Lighthouse (PageSpeed Insights)',
      measures: 'desempenho, acessibilidade, práticas recomendadas e SEO',
    },
    {
      name: 'Is Agentic (Vercel Labs)',
      measures:
        'descoberta, acesso e uso do site por agentes de IA como ChatGPT, Gemini, Perplexity e Claude',
    },
  ],
  note: 'As duas notas são independentes e nunca são combinadas numa terceira.',
};

/**
 * FAQ.
 *
 * Fonte única: alimenta o FAQPage JSON-LD (via scripts/prerender.js) E o bloco
 * visível da página. A regra que isto existe para impedir: nunca mais o
 * crawler saber algo que o comprador não vê na tela.
 *
 * Formato pensado para GEO — pergunta na forma que a pessoa realmente digita,
 * resposta autossuficiente no primeiro parágrafo.
 *
 * Todo percentual citado aqui tem de existir em content/evidence.ts, com fonte
 * e ano (tests/evidence.test.ts trava isso). Nenhum número novo entra por este
 * arquivo.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ: FaqItem[] = [
  {
    question: 'Meu site aparece no ChatGPT?',
    answer:
      'Só dá para saber medindo, e a medição tem duas notas que não se misturam: a do Google Lighthouse, que avalia desempenho, acessibilidade, práticas recomendadas e SEO, e a de prontidão para agentes de IA, do Is Agentic (Vercel Labs), que avalia se ChatGPT, Gemini, Perplexity e Claude conseguem descobrir, acessar e usar o site. A RIA mede as duas na primeira dobra do site da RIA, de graça e sem cadastro. Nota alta abre o caminho, mas nenhuma ferramenta garante que uma IA vai citar o seu site. O contexto: a McKinsey (2025) encontrou 88% das organizações usando IA em ao menos uma função, e o Cetic.br (2025) mediu 17% das empresas brasileiras, só 15% entre as pequenas.',
  },
  {
    question: 'O que faz um site ser legível por IA?',
    answer:
      'Um agente de IA precisa fazer três coisas com o site: descobri-lo, acessá-lo e usá-lo. Na prática, isso pede conteúdo presente no HTML e não só montado por JavaScript depois, um robots.txt que não bloqueie os crawlers de IA, um mapa do site, dados estruturados (schema.org) que declarem o que a empresa oferece e páginas de confiança — sobre, contato, privacidade — que digam quem responde por ela. É esse tipo de sinal que a nota de prontidão para agentes mede, e é o que esta própria página cumpre: é prerenderizada e publica llms.txt, JSON-LD e uma versão em Markdown de cada rota.',
  },
  {
    question: 'Quanto custa fazer um site em 2026?',
    answer: `Depende do escopo, e por isso a RIA não publica preço de tabela: o valor sai na proposta, depois que a medição mostra o que o site precisa. A medição e a conversa de ${SESSION_MINUTES} minutos são gratuitas. O trabalho costuma ficar ${IMPLEMENTATION_RANGE} para pequenas e médias empresas, conforme o escopo. Não há contrato de fidelidade: o prazo e o indicador de sucesso entram por escrito na proposta, e se a etapa não entrar no ar na data combinada, ela não é cobrada.`,
  },
  {
    question: 'Vale mais a pena refazer o site ou otimizar o atual?',
    answer:
      'Depende do que o laudo mostrar, e a página deixa você olhar antes de decidir. Se o site não existe, ou se as notas estão baixas por causa da base — plataforma lenta, conteúdo montado só por JavaScript, nenhuma estrutura para agentes —, refazer costuma sair mais direto. Se o site já é sólido e as notas caem por pontos específicos, como imagens pesadas, falta de dados estruturados ou um robots.txt que bloqueia crawlers, otimizar ataca só isso. A RIA não decide antes de medir: os dois caminhos, site novo e otimização, saem do laudo.',
  },
  {
    question: 'O que é prontidão para agentes (agent readiness)?',
    answer:
      'É o quanto um site está preparado para ser descoberto, acessado e usado por agentes de IA como ChatGPT, Gemini, Perplexity e Claude. É uma nota de 0 a 100, medida pelo Is Agentic, serviço da Vercel Labs, e é independente da nota do Google: um site pode ir bem no Lighthouse e mal em prontidão para agentes, ou o contrário. A RIA mostra as duas notas separadas e nunca as soma, nem tira média.',
  },
  {
    question: 'Quem é o responsável técnico pela RIA?',
    answer:
      'Raul Vieira, engenheiro de produção formado pela Universidade Federal de São Carlos (UFSCar). A formação é o método: medir o processo, achar o ponto que trava e atacar o de maior custo por hora é engenharia de produção clássica. A IA mudou a ferramenta, não o ofício.',
  },
];
