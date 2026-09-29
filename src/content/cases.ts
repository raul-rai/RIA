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

export type CaseKind =
  /** Resultado de negócio medido no sistema do cliente. */
  | 'resultado'
  /** Entrega construída em parceria; o valor está no produto, não numa métrica. */
  | 'entrega';

export interface CaseStudy {
  kind: CaseKind;
  /**
   * O campo `front` saiu com as três frentes (set/2026). Não foi substituído
   * por um `path`: um caso é prova do que foi feito, e forçá-lo a apontar para
   * um dos dois caminhos comerciais seria a mesma fabricação de etiqueta que
   * este arquivo proíbe para números.
   */
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

// A ORDEM É UM ARGUMENTO. O primeiro caso é o de site — o que a página vende
// hoje. Os outros dois ficam porque são resultado medido e auditável, e prova
// real não sai da página por conveniência de posicionamento.
export const CASES: CaseStudy[] = [
  {
    kind: 'resultado',
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
    // Este caso provava a antiga frente 4 (Sistema sob medida), que saiu do
    // site no reposicionamento de ago/2026. Continua sendo prova de capacidade
    // de execução, e o cartão não finge que prova mais do que isso.
    kind: 'entrega',
    segment: 'Produto digital de decoração',
    headline: 'Do protótipo ao produto final',
    before: 'Ideia de produto sem validação técnica nem caminho de implementação.',
    intervention: 'Desenvolvimento conjunto, da prototipagem à versão final entregue.',
    timeframe: 'Construído em parceria',
  },
];
