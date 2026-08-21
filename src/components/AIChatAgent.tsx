import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, TrendingUp, ArrowRight, MessageCircle, CalendarCheck } from 'lucide-react';
import { config } from '../config';
import { useVulnerability } from '../context/VulnerabilityContext';
import { whatsappWithMessage } from '../constants/links';
import { track } from '../lib/analytics';
import QualificationFlow from './QualificationFlow';
import BookingEmbed from './BookingEmbed';
import { buildQualificationPayload, labelFor, type Qualification } from '../lib/qualification';
import { FRONTS } from '../content/fronts';
import {
  INTENTS,
  readCampaignRef,
  GREETING,
  NO_WEBSITE_GREETING,
  type IntentContext,
  type IntentId,
} from '../content/intents';
import { useAgentIntent } from '../context/AgentIntentContext';
import { shouldInject } from '../lib/agent-intent';
import { missingFronts } from '../lib/fronts';

interface RoiData {
  roi: number;
  name?: string;
  revenue?: number;
  efficiency?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  /** Cartao de ROI — so preenchido quando o payload do n8n tem forma valida. */
  data?: RoiData;
  /** Quando o agente nao pode responder, o lead ainda precisa de um destino. */
  handoff?: boolean;
}

interface AIChatAgentProps {
  webhookUrl?: string;
}

const SUGGESTIONS = [
  'Onde a IA me daria mais retorno hoje?',
  'Quanto custa começar?',
  'Quero falar sobre o meu diagnóstico',
];

/** Quem chega aqui declarando que nao tem site nao quer falar de ROI ainda:
 *  quer saber quanto custa existir. As sugestoes acompanham. */
const NO_WEBSITE_SUGGESTIONS = [
  'Quanto custa um site pronto para IA?',
  'Em quanto tempo ele fica no ar?',
  'Como a IA vai passar a me indicar?',
];

/**
 * O n8n pode devolver qualquer coisa. Um payload sem `roi` numerico nao pode
 * chegar ao render — `toLocaleString()` num undefined derruba a tela inteira.
 */
function parseRoiData(raw: unknown): RoiData | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const candidate = raw as Record<string, unknown>;
  const roi = Number(candidate.roi);
  if (!Number.isFinite(roi)) return undefined;
  return {
    roi,
    name: typeof candidate.name === 'string' ? candidate.name : undefined,
    revenue: Number.isFinite(Number(candidate.revenue)) ? Number(candidate.revenue) : undefined,
    efficiency: Number.isFinite(Number(candidate.efficiency)) ? Number(candidate.efficiency) : undefined,
  };
}

export default function AIChatAgent({ webhookUrl = config.chatWebhook }: AIChatAgentProps) {
  const { vulnerabilityIndex, assessed, hasNoWebsite, frontsChecked, websiteScore } = useVulnerability();
  /** O indice so significa algo depois que o visitante tocou em algo. Sem
   *  isso, quem pula direto para o agente reporta "100% vulneravel" quando
   *  na verdade e "nunca avaliado" — os dois nao podem chegar identicos. */
  const assessedVulnerabilityIndex = assessed ? vulnerabilityIndex : null;

  const { pending, consume } = useAgentIntent();

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: hasNoWebsite ? NO_WEBSITE_GREETING : GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Tres estagios. A transicao para 'qualifying' e sempre por clique do
   * visitante — deixar o modelo decidir quando pedir telefone e faturamento
   * transformaria o gatilho da conversao em algo que muda de humor a cada
   * resposta do LLM.
   */
  const [stage, setStage] = useState<'chat' | 'qualifying' | 'booking'>('chat');
  const [qualification, setQualification] = useState<Qualification | null>(null);

  /**
   * O agente e montado junto com a pagina, muito antes de o visitante declarar
   * que nao tem site. Quando ele declara, a saudacao e reescrita — mas so
   * enquanto a conversa nao comecou: trocar o texto por baixo de quem ja
   * respondeu apagaria o proprio historico.
   */
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== 'assistant') return prev;
      const greeting = hasNoWebsite ? NO_WEBSITE_GREETING : GREETING;
      return prev[0].content === greeting ? prev : [{ role: 'assistant', content: greeting }];
    });
  }, [hasNoWebsite]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, stage]);

  const [sessionId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(7)
  );

  /** Mensagem de WhatsApp que carrega tudo que o visitante ja respondeu. */
  const handoffUrl = useMemo(() => {
    const marcados = frontsChecked.filter(Boolean).length;
    const linhas = [
      'Olá Raul, tentei falar com o agente no site e quero continuar por aqui.',
      '',
      assessedVulnerabilityIndex === null
        ? 'Índice de Vulnerabilidade: não avaliado'
        : `Índice de Vulnerabilidade: ${assessedVulnerabilityIndex}%`,
      hasNoWebsite
        ? 'Site: ainda não tenho'
        : websiteScore !== null
          ? `Site auditado: ${websiteScore}/100`
          : 'Site: não auditado',
      `Frentes cobertas: ${marcados} de ${FRONTS.length}`,
    ];
    return whatsappWithMessage(linhas.join('\n'));
  }, [assessedVulnerabilityIndex, hasNoWebsite, websiteScore, frontsChecked]);

  /** As frentes que sobraram: a pauta que o Raul le antes da chamada. */
  const pauta = useMemo(
    () => FRONTS.filter((_, i) => !frontsChecked[i]).map((f) => f.tag).join(', '),
    [frontsChecked]
  );

  const bookingFallbackMessage = useMemo(() => {
    if (!qualification) return '';
    return [
      'Olá Raul, completei a qualificação no site e quero marcar a sessão de 15 minutos.',
      '',
      `Empresa: ${qualification.company}`,
      `E-mail: ${qualification.email}`,
      `Telefone: ${qualification.phone}`,
      `Faturamento: ${labelFor('revenue', qualification.revenue)}`,
      `Budget de IA: ${labelFor('aiBudget', qualification.aiBudget)}`,
      '',
      pauta ? `Frentes descobertas: ${pauta}` : 'Frentes descobertas: nenhuma',
    ].join('\n');
  }, [qualification, pauta]);

  /**
   * Registro da intencao no n8n. Nao e pergunta: a resposta ja esta na tela.
   * O workflow trata action: 'intent' gravando as duas falas na memoria da
   * sessao e devolvendo 200 sem gerar resposta do LLM — ver
   * docs/n8n-contrato-agente.md.
   */
  const postIntent = async (intentId: IntentId, chatInput: string, agentReply: string) => {
    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'intent',
          intentId,
          chatInput,
          agentReply,
          context: {
            vulnerabilityIndex: assessedVulnerabilityIndex,
            hasNoWebsite,
            websiteScore,
            frontsCovered: frontsChecked.filter(Boolean).length,
            frontsMissing: missingFronts(frontsChecked, FRONTS.map((f) => f.id)),
          },
        }),
      });
    } catch {
      // A conversa ja esta na tela e funcionando. Falhar o registro nao pode
      // custar nada ao lead — por isso a resposta de abertura e local.
    }
  };

  /**
   * Ja tratado: o efeito roda de novo quando `messages` muda, e sem esta trava
   * a mesma intencao seria injetada em loop.
   */
  const handledNonce = useRef(0);

  useEffect(() => {
    if (!pending || pending.nonce === handledNonce.current) return;
    handledNonce.current = pending.nonce;
    consume();

    const definition = INTENTS[pending.id];
    const ctx: IntentContext = {
      ref: readCampaignRef(typeof window === 'undefined' ? '' : window.location.search),
      websiteScore,
      hasNoWebsite,
      frontsChecked,
      front: pending.frontId ? FRONTS.find((f) => f.id === pending.frontId) : undefined,
    };

    const userMessage = definition.userMessage(ctx);
    if (!shouldInject({ stage, isTyping, messages, candidateUserMessage: userMessage })) return;

    const agentReply = definition.agentReply(ctx);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: agentReply },
    ]);
    void postIntent(pending.id, userMessage, agentReply);
    // postIntent e recriado a cada render e le o estado atual quando chamado.
    // Fora das deps de proposito: incluir a funcao faria o efeito rodar em
    // todo render, e a trava do handledNonce ja garante uma injecao por pedido.
  }, [pending, consume, stage, isTyping, messages, websiteScore, hasNoWebsite, frontsChecked]);

  const send = async (text: string) => {
    const currentInput = text.trim();
    if (!currentInput || isTyping) return;

    setMessages((prev) => [...prev, { role: 'user', content: currentInput }]);
    setInput('');
    setIsTyping(true);
    track('agent_message_sent', { vulnerability_index: vulnerabilityIndex });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const startedAt = performance.now();

    try {
      if (!webhookUrl) throw new Error('missing-webhook');

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
        },
        body: JSON.stringify({
          sessionId,
          action: 'sendMessage',
          chatInput: currentInput,
          context: {
            vulnerabilityIndex,
            hasNoWebsite,
            websiteScore,
            frontsCovered: frontsChecked.filter(Boolean).length,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`status-${response.status}`);

      const textResponse = await response.text();

      let responseData: unknown;
      try {
        responseData = JSON.parse(textResponse);
      } catch {
        responseData = textResponse;
      }

      let botMessage = '';
      let data: RoiData | undefined;

      if (Array.isArray(responseData)) {
        const first = responseData[0];
        if (first && typeof first === 'object') {
          const f = first as Record<string, unknown>;
          botMessage = String(f.output ?? f.response ?? f.message ?? f.text ?? '');
          data = parseRoiData(f.data);
        }
      } else if (responseData && typeof responseData === 'object') {
        const o = responseData as Record<string, unknown>;
        botMessage = String(o.output ?? o.response ?? o.message ?? o.text ?? '');
        data = parseRoiData(o.data);
      } else if (typeof responseData === 'string') {
        botMessage = responseData;
      }

      botMessage = botMessage.trim();

      // Resposta vazia ou ilegivel conta como falha, nao como fala do agente.
      if (!botMessage) throw new Error('empty-response');

      track('agent_replied', { latency_ms: Math.round(performance.now() - startedAt) });
      setMessages((prev) => [...prev, { role: 'assistant', content: botMessage, data }]);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      const reason = error instanceof Error ? error.message : 'unknown';
      track('agent_failed', { reason });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            reason === 'AbortError' || (error as Error)?.name === 'AbortError'
              ? 'A análise está demorando mais que o normal e prefiro não te deixar esperando. Me chame no WhatsApp que eu respondo pessoalmente — levo tudo que você já respondeu aqui.'
              : 'Não consegui completar a conexão agora. Isso é problema meu, não seu. Me chame no WhatsApp que eu respondo pessoalmente — levo tudo que você já respondeu aqui.',
          handoff: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQualified = async (data: Qualification) => {
    setQualification(data);
    setStage('booking');

    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildQualificationPayload({
            sessionId,
            qualification: data,
            vulnerabilityIndex: assessedVulnerabilityIndex,
            hasNoWebsite,
            websiteScore,
            frontsChecked,
          })
        ),
      });
    } catch {
      // A agenda ja esta na tela. Falhar o registro nao pode custar o
      // agendamento — o lead chega pelo proprio Cal.com de qualquer forma.
    }
  };

  const showSuggestions = messages.length === 1 && !isTyping;

  return (
    <div className="glass-panel w-full h-full flex flex-col rounded-3xl overflow-hidden text-left">
      {/* Cabecalho */}
      <div className="glass-rail p-4 md:p-6 border-b border-slate-900/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="glass-inset glass-accent p-2.5 rounded-xl">
            <Bot size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 leading-none mb-1">
              Agente de IA RIA
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Diagnóstico de Inteligência Empresarial</p>
          </div>
        </div>
        <div className="glass-inset glass-accent flex items-center gap-2 px-3 py-1 rounded-full">
          <Sparkles size={12} className="text-accent animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent-dark">Ativo</span>
        </div>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.role === 'user'
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-accent/10 border-accent/30 text-accent'
                  }`}
                >
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'glass-inset text-slate-800'
                  }`}
                >
                  {msg.content}

                  {msg.data && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-raised glass-accent mt-4 p-4 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-accent" />
                        <span className="text-xs uppercase font-bold tracking-widest text-slate-600">
                          ROI Detectado
                        </span>
                      </div>
                      <div className="text-2xl font-serif text-slate-900 mb-2">
                        R$ {msg.data.roi.toLocaleString('pt-BR')} /ano
                      </div>
                      <button
                        onClick={() => {
                          track('cta_click', { location: 'agent_roi_card' });
                          setStage('qualifying');
                          track('qualification_started', { source: 'roi_card' });
                        }}
                        className="w-full py-3 bg-slate-900 hover:bg-accent text-white text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
                      >
                        Agendar minha sessão <ArrowRight size={12} />
                      </button>
                    </motion.div>
                  )}

                  {msg.handoff && (
                    <a
                      href={handoffUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track('whatsapp_click', { location: 'agent_handoff' })}
                      className="mt-4 w-full py-3 px-4 bg-slate-900 hover:bg-accent text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
                    >
                      <MessageCircle size={14} />
                      Falar com o Raul no WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Bot size={14} className="text-accent" />
              </div>
              <div className="glass-inset p-4 rounded-2xl flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {stage === 'chat' && messages.length > 1 && !isTyping && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setStage('qualifying');
                track('qualification_started', { vulnerability_index: vulnerabilityIndex });
              }}
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-accent active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
            >
              <CalendarCheck size={14} /> Agendar minha sessão de 30 min
            </button>
          </div>
        )}

        {stage === 'qualifying' && (
          <QualificationFlow onComplete={handleQualified} onCancel={() => setStage('chat')} />
        )}

        {stage === 'booking' && qualification && (
          <BookingEmbed
            name={qualification.company}
            email={qualification.email}
            notes={pauta ? `Frentes descobertas: ${pauta}` : undefined}
            fallbackMessage={bookingFallbackMessage}
          />
        )}

        {/* Sugestoes de primeira mensagem — o vazio de 350px sai daqui */}
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 pl-11"
          >
            {(hasNoWebsite ? NO_WEBSITE_SUGGESTIONS : SUGGESTIONS).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="glass-raised glass-interactive px-4 py-2.5 min-h-11 rounded-full text-slate-700 text-xs font-semibold hover:text-accent"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Entrada */}
      {stage === 'chat' && (
        <div className="glass-rail p-4 border-t border-slate-900/10">
          <div className="relative flex items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              aria-label="Mensagem para o agente de IA"
              placeholder="Digite sua resposta..."
              className="glass-field w-full rounded-xl py-4 pl-4 pr-14 text-base md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-slate-400"
            />
            {/* 44x44: o botao tinha 32px de lado, o menor alvo da pagina — e o
                unico que envia a mensagem. */}
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isTyping}
              aria-label="Enviar mensagem"
              className="absolute right-2 w-11 h-11 flex items-center justify-center bg-slate-900 text-white rounded-lg md:hover:bg-accent md:hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-md"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] md:text-xs text-slate-500">
            Prefere falar direto?{' '}
            <a
              href={handoffUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { location: 'agent_footer' })}
              className="inline-block py-2 text-accent font-semibold underline underline-offset-2 hover:text-accent-dark"
            >
              Chame o Raul no WhatsApp
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
