// Casos reais.
//
// REGRA: nada aqui e inventado. O que o cliente informou entra como informado;
// o que falta fica explicitamente vazio em vez de ser preenchido por estimativa.
// (spec D-03 / D-06: "Nenhum numero exibido no site e fabricado.")
//
// PENDENTE — cada caso precisa de uma linha de `measurement` para o bloco
// cumprir o que promete. Sem ela o cartao nao imprime nenhuma apuracao, o que e
// honesto mas deixa a afirmacao sem lastro verificavel.
//
// PENDENTE — confirmar autorizacao de cada cliente para uso do nome.

export type CaseKind =
  /** Resultado de negocio medido no sistema do cliente. */
  | 'resultado'
  /** Entrega construida em parceria; o valor esta no produto, nao numa metrica. */
  | 'entrega';

export interface CaseStudy {
  kind: CaseKind;
  /** Nome do cliente + contexto curto. */
  segment: string;
  /** A afirmacao principal do cartao. */
  headline: string;
  /** O ponto de partida. */
  before: string;
  /** O que a RIA implantou. */
  intervention: string;
  /** Quanto tempo levou. */
  timeframe: string;
  /**
   * Como o numero foi apurado. Opcional no tipo, obrigatorio na pratica:
   * sem isso o cartao nao imprime linha de apuracao.
   */
  measurement?: string;
}

export const CASES: CaseStudy[] = [
  {
    kind: 'resultado',
    segment: 'Nexa Interiores',
    headline: 'Da inauguração a R$ 200 mil/mês',
    before: 'Operação recém-inaugurada, sem presença digital e sem canal de atendimento estruturado.',
    intervention: 'Criação do site, automação do atendimento e gestão de mídias.',
    timeframe: 'Menos de 6 meses',
    // measurement: preencher — ex.: "Faturamento mensal informado pelo cliente,
    // comparando o mes de inauguracao com o sexto mes."
  },
  {
    kind: 'resultado',
    segment: 'Libra Crédito',
    headline: 'Recorde de qualificação no primeiro mês',
    before: 'Qualificação de leads dependente de abordagem manual pelo time comercial.',
    intervention: 'Agente SDR autônomo para prospecção e qualificação.',
    timeframe: 'Primeiro mês em produção',
    // measurement: preencher — ex.: "Taxa mensal de qualificacao no CRM da
    // Libra; o mes do agente superou o melhor mes do historico."
  },
  {
    kind: 'entrega',
    segment: 'DecorColorir',
    headline: 'Do protótipo ao produto final',
    before: 'Ideia de produto sem validação técnica nem caminho de implementação.',
    intervention: 'Desenvolvimento conjunto, da prototipagem à versão final entregue.',
    timeframe: 'Construído em parceria',
  },
];
