// Casos reais.
//
// REGRA: nada aqui é inventado. O que o cliente informou entra como informado;
// o que falta fica explicitamente vazio em vez de ser preenchido por estimativa.
// (spec D-03 / D-06: "Nenhum número exibido no site é fabricado.")
//
// ANONIMIZAÇÃO (ago/2026): os nomes reais dos clientes saíram. O Raul confirmou
// que tem os números, mas NÃO tem autorização por escrito para usar os nomes —
// e nome de cliente em página comercial sem autorização é exposição dele e
// risco do Raul. Os segmentos abaixo descrevem a operação sem identificá-la.
// Quando a autorização chegar por escrito, o nome volta trocando `segment`.
//
// APURAÇÃO — cada caso precisa de uma linha de `measurement`, e ela é a única
// coisa que separa "resultado" de "alegação". Enquanto ela não existir, o cartão
// imprime um aviso visível de que o número não foi auditado, em vez de omitir a
// ausência em silêncio (que era o comportamento antigo, e o mais perigoso: dava
// ao leitor a impressão de rigor que a seção não tinha).

import type { FrontId } from './fronts';

export type CaseKind =
  /** Resultado de negócio medido no sistema do cliente. */
  | 'resultado'
  /** Entrega construída em parceria; o valor está no produto, não numa métrica. */
  | 'entrega';

export interface CaseStudy {
  kind: CaseKind;
  /**
   * Qual das frentes este caso prova. Opcional: casos do tipo 'entrega' podem
   * não mapear em nenhuma frente vendida hoje — e forçar um mapa falso só para
   * preencher a etiqueta é o mesmo pecado de fabricar número.
   */
  front?: FrontId;
  /** Segmento + contexto curto. Sem nome de cliente até haver autorização escrita. */
  segment: string;
  /** A afirmação principal do cartão. */
  headline: string;
  /** O ponto de partida. */
  before: string;
  /** O que a RIA implantou. */
  intervention: string;
  /** Quanto tempo levou. */
  timeframe: string;
  /**
   * Como o número foi apurado: indicador, fonte e janela de comparação.
   * Sem isso o cartão imprime aviso de "não auditado".
   */
  measurement?: string;
}

export const CASES: CaseStudy[] = [
  {
    kind: 'resultado',
    front: 1,
    segment: 'Design de interiores',
    headline: 'Da inauguração a R$ 200 mil/mês',
    before: 'Operação recém-inaugurada, sem presença digital e sem canal de atendimento estruturado.',
    intervention: 'Criação do site, automação do atendimento e gestão de mídias.',
    timeframe: 'Menos de 6 meses',
    // TODO (Raul): preencher com a apuração real. Formato esperado —
    // "Faturamento mensal informado pelo cliente, comparando o mês de
    // inauguração com o sexto mês." Trocar pelo que de fato foi medido.
  },
  {
    kind: 'resultado',
    front: 2,
    segment: 'Crédito',
    headline: 'Recorde de qualificação no primeiro mês',
    before: 'Qualificação de leads dependente de abordagem manual pelo time comercial.',
    intervention: 'Agente SDR autônomo para prospecção e qualificação.',
    timeframe: 'Primeiro mês em produção',
    // TODO (Raul): preencher com a apuração real. Formato esperado —
    // "Taxa mensal de qualificação no CRM do cliente; o mês do agente superou
    // o melhor mês do histórico anterior." Trocar pelo que de fato foi medido.
  },
  {
    // Sem `front`: este caso provava a antiga frente 4 (Sistema sob medida),
    // que saiu do site no reposicionamento de ago/2026. Continua sendo prova
    // de capacidade de execução, mas não prova nenhuma frente vendida hoje —
    // e o cartão diz isso, em vez de fingir que prova.
    kind: 'entrega',
    segment: 'Produto digital de decoração',
    headline: 'Do protótipo ao produto final',
    before: 'Ideia de produto sem validação técnica nem caminho de implementação.',
    intervention: 'Desenvolvimento conjunto, da prototipagem à versão final entregue.',
    timeframe: 'Construído em parceria',
  },
];
