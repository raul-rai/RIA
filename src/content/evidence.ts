import { Globe2, TrendingDown, MapPin, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Evidência de mercado — dois consumidores hoje.
 *
 * Este arquivo já desenhou uma dobra ("O que os dados dizem", quatro cartões de
 * estatística no capítulo 1). A dobra saiu: empilhava quatro cartões de número
 * antes de "Vozes do mercado", e o visitante atravessava dois blocos de prova
 * de terceiros antes de chegar ao que a RIA faz.
 *
 * O DADO ficou, e agora alimenta dois lugares:
 *   - o agente, via scripts/build-agent-context.ts, que lê número, fonte e ano
 *     para responder quando alguém pergunta;
 *   - a faixa de fontes do rodapé (components/SiteFooter), que republica cada
 *     citação COM LINK no HTML publicado. Era isso que tornava a página
 *     citável por motor generativo, e a dobra levava junto ao sair; o rodapé
 *     devolve a citação sem devolver o desenho que competia com a conversão.
 *
 * Os dois leem o MESMO array. Mexer num número aqui muda o que o agente cita e
 * o que o rodapé publica de uma vez — não existe versão divergente.
 *
 * REGRA DE INTEGRIDADE (a mesma de cases.ts): todo número aqui vem de um estudo
 * público, nomeado, datado e linkado. Nenhum é estimado, arredondado para soar
 * melhor, nem reescrito para caber na narrativa. Se um dado não tiver fonte
 * verificável, ele não entra — não existe versão "quase certa" deste arquivo.
 *
 * REGRA DE NARRATIVA: a ordem é um argumento, não uma lista. Adoção virou
 * commodity (1) -> mas quase ninguém extrai retorno (2) -> e o Brasil está
 * atrás, o que ainda deixa janela (3) -> e aqui está um lugar onde o dinheiro
 * comprovadamente vaza hoje (4). É esse encadeamento que justifica vender
 * diagnóstico antes de ferramenta. Mexer na ordem desmonta o argumento.
 *
 * BÔNUS DE GEO: dado + fonte + ano é exatamente o formato que motores
 * generativos citam. Este arquivo é, ao mesmo tempo, o conteúdo mais honesto e
 * o mais citável da página.
 */
export interface Evidence {
  /** O número, como ele aparece grande no cartão. */
  value: string;
  /** O que o número mede, em uma linha. */
  claim: string;
  /** Por que isso importa para quem está lendo — a ponte para a oferta. */
  takeaway: string;
  /** Instituição responsável pelo estudo. Nunca um veículo que apenas noticiou. */
  source: string;
  /** Ano de publicação do estudo. Dado velho declarado é honesto; dado velho escondido, não. */
  year: number;
  /** Amostra ou método, quando o estudo declara. É o que separa dado de alegação. */
  method: string;
  url: string;
  icon: LucideIcon;
}

export const EVIDENCE: Evidence[] = [
  {
    value: '88%',
    claim: 'das organizações já usam IA em ao menos uma função.',
    takeaway: 'Adotar IA deixou de ser vantagem competitiva. Virou linha de base.',
    source: 'McKinsey — The State of AI',
    year: 2025,
    method: 'Pesquisa global com cerca de 2.000 respondentes',
    url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai',
    icon: Globe2,
  },
  {
    value: '95%',
    claim: 'dos pilotos corporativos de IA generativa não produzem retorno mensurável.',
    takeaway:
      'O problema quase nunca é a ferramenta. É ter escolhido o processo errado para automatizar.',
    source: 'MIT Project NANDA — The GenAI Divide',
    year: 2025,
    method: '52 entrevistas com executivos, 153 líderes pesquisados e 300 implantações públicas',
    url: 'https://www.forbes.com/sites/jasonsnyder/2025/08/26/mit-finds-95-of-genai-pilots-fail-because-companies-avoid-friction/',
    icon: TrendingDown,
  },
  {
    value: '17%',
    claim: 'das empresas brasileiras usam IA — e só 15% das pequenas.',
    takeaway:
      'A janela no Brasil ainda está aberta. Nas grandes empresas ela já fechou: lá são 50%.',
    source: 'Cetic.br / CGI.br — TIC Empresas',
    year: 2025,
    method: '4.174 empresas entrevistadas entre fevereiro de 2025 e janeiro de 2026',
    url: 'https://www.cgi.br/noticia/releases/uso-de-inteligencia-artificial-por-empresas-brasileiras-avanca-e-atinge-17-aponta-pesquisa-do-cetic-br/',
    icon: MapPin,
  },
  {
    value: '7×',
    claim:
      'mais chance de qualificar um lead quando o contato acontece na primeira hora, em vez de na segunda.',
    takeaway:
      'Este é o vazamento mais barato de tapar em quase toda operação — e o mais fácil de medir depois.',
    source: 'Harvard Business Review — The Short Life of Online Sales Leads',
    year: 2011,
    method: 'Auditoria de 2,24 milhões de leads (Oldroyd, McElheran e Elkington)',
    url: 'https://hbr.org/2011/03/the-short-life-of-online-sales-leads',
    icon: Timer,
  },
];
