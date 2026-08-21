import { EMAIL, WHATSAPP_URL } from '../constants/links';

/**
 * Política de Privacidade — conteúdo.
 *
 * ESCRITA A PARTIR DO CÓDIGO, não de template. Cada fluxo declarado abaixo
 * corresponde a uma chamada real que existe no repositório:
 *
 *   - qualificação  -> POST config.chatWebhook  (action: 'qualification')
 *   - chat          -> POST config.chatWebhook  (action: 'sendMessage')
 *   - diagnóstico   -> GET  googleapis.com/pagespeedonline + POST diagnosticWebhook
 *   - agenda        -> iframe config.bookingUrl (Cal.com) com nome e e-mail na query
 *   - analytics     -> gtag.js, só quando VITE_GA_MEASUREMENT_ID existe E há consentimento
 *   - WhatsApp      -> wa.me com a mensagem pré-preenchida que o visitante lê antes de enviar
 *
 * REGRA: se um desses fluxos mudar no código, esta página muda junto. Política
 * que descreve um tratamento que não acontece (ou omite um que acontece) é pior
 * que política nenhuma — vira prova documental contra o controlador.
 *
 * ⚠️ ESTE TEXTO NÃO É PARECER JURÍDICO. Ele é tecnicamente fiel ao que o
 * sistema faz, o que é a parte que um advogado não consegue levantar sozinho.
 * Antes de publicar, peça revisão de alguém habilitado — especialmente nos
 * campos marcados como PENDENTE abaixo.
 */

/** PENDENTE — razão social e CNPJ do controlador. Sem isso a política não
 *  identifica o responsável, que é requisito do art. 9º, I da LGPD. */
export const CONTROLLER = {
  name: 'Raul Vieira (RIA — Revolução da Inteligência Artificial)',
  /** PENDENTE: preencher com o CNPJ quando a PJ existir. */
  document: null as string | null,
  email: EMAIL,
  whatsapp: WHATSAPP_URL,
};

export const LAST_UPDATED = '20 de agosto de 2026';

export interface PrivacySection {
  title: string;
  paragraphs: string[];
  /** Itens de lista, quando a seção enumera. */
  bullets?: string[];
}

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: 'Quem trata os seus dados',
    paragraphs: [
      `O controlador dos dados coletados neste site é ${CONTROLLER.name}. Qualquer pedido relacionado aos seus dados pode ser feito pelos canais listados no fim desta página, e é respondido pela mesma pessoa que presta o serviço — não há intermediário.`,
    ],
  },
  {
    title: 'O que este site coleta, e só quando você digita',
    paragraphs: [
      'Este site não pede cadastro para ser lido. Você percorre a página inteira, roda o diagnóstico e conversa com o agente sem informar nenhum dado pessoal. A coleta acontece em dois momentos, ambos iniciados por você:',
    ],
    bullets: [
      'Ao agendar a sessão: nome da empresa, e-mail, telefone, faixa de faturamento mensal e faixa de orçamento destinado a IA. Os três primeiros identificam você; os dois últimos servem para eu preparar a conversa e saber se faço sentido para o seu caso.',
      'Ao conversar com o agente: o conteúdo das mensagens que você escreve. Se você digitar dados pessoais no chat, eles serão tratados como parte da conversa — por isso, não escreva ali documentos, senhas ou dados de terceiros.',
      'Ao rodar o diagnóstico: apenas o endereço do site analisado. Um domínio não é dado pessoal na maior parte dos casos, mas ele é enviado a terceiros (veja a seção seguinte).',
    ],
  },
  {
    title: 'Para onde esses dados vão',
    paragraphs: [
      'Não há venda, aluguel nem compartilhamento de dados para fins publicitários. Os dados transitam apenas pelos serviços necessários para o site funcionar:',
    ],
    bullets: [
      'n8n (automação): recebe os dados de agendamento e as mensagens do chat. É onde a conversa fica registrada para eu ler antes da nossa call.',
      'Modelo de linguagem: as mensagens do chat são processadas por um modelo de IA para gerar as respostas do agente.',
      'Google PageSpeed Insights: recebe apenas o endereço do site que você pediu para analisar. Nenhum dado seu vai junto.',
      'Cal.com (agenda): recebe seu nome e e-mail para criar o evento, porque é ele que envia a confirmação e o convite.',
      'Google Analytics: recebe dados de navegação anônimos, e só se você consentir. Veja a seção sobre medição.',
      'WhatsApp: só quando você clica para conversar. A mensagem já vem preenchida e fica visível na tela antes de você decidir enviá-la — nada é enviado sem o seu toque.',
    ],
  },
  {
    title: 'Com que base legal, e por quanto tempo',
    paragraphs: [
      'Os dados de agendamento são tratados com base no seu consentimento e para as tratativas preliminares de um eventual contrato (art. 7º, I e V da LGPD). Os dados de navegação medidos pelo Analytics dependem exclusivamente do seu consentimento, que você pode recusar sem perder nada do site.',
      'Os dados de contato são mantidos enquanto durar a conversa comercial e por até 2 anos após o último contato, prazo em que ainda faz sentido retomar um assunto. Depois disso, são apagados. Se você pedir a exclusão antes, ela é feita — veja a seção de direitos.',
    ],
  },
  {
    title: 'Medição de navegação',
    paragraphs: [
      'Este site pode usar o Google Analytics para entender quais trechos da página são lidos e onde as pessoas desistem. Nenhum script de medição é carregado antes de você decidir: enquanto não houver consentimento, o Analytics simplesmente não existe nesta página.',
      'Recusar não muda nada no que você vê ou consegue fazer aqui. Você pode mudar de ideia depois — a escolha fica guardada no seu navegador e pode ser revista pelo aviso no rodapé desta página.',
    ],
  },
  {
    title: 'Os seus direitos',
    paragraphs: [
      'A LGPD garante que você peça, a qualquer momento e sem justificar: confirmação de que trato dados seus; acesso a eles; correção do que estiver errado; anonimização ou eliminação; portabilidade; informação sobre com quem compartilhei; e revogação do consentimento.',
      'O pedido pode chegar por qualquer um dos canais abaixo, e o prazo de resposta é de até 15 dias. Não é preciso formulário nem linguagem jurídica — uma mensagem dizendo o que você quer basta.',
    ],
  },
  {
    title: 'Segurança, e o que eu não prometo',
    paragraphs: [
      'O site trafega inteiramente sobre HTTPS e os dados de agendamento seguem direto para os serviços citados, sem banco de dados intermediário próprio. Ainda assim, nenhum sistema conectado à internet é imune: se houver incidente de segurança que possa gerar risco relevante a você, eu comunico você e a ANPD, como manda o art. 48.',
    ],
  },
];
