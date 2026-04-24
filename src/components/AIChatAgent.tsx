import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any; // For ROI or other structured data
}

interface AIChatAgentProps {
  webhookUrl?: string;
  onComplete: (data: any) => void;
}

export default function AIChatAgent({ webhookUrl = "https://n8n.seudominio.com/webhook/qualificacao", onComplete }: AIChatAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Olá. Sou o Agente de Alavancagem da RIA. Para desenharmos seu Plano de Defesa, preciso entender alguns pontos. Qual o seu nome e o setor de atuação da sua empresa?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const [step, setStep] = useState(0);
  const [leadData, setLeadData] = useState({ name: "", sector: "", revenue: 0 });

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      await new Promise(r => setTimeout(r, 1200)); // Simulate processing

      let response = "";
      let data = null;
      let nextStep = step + 1;

      switch (step) {
        case 0: // Just got Name and Sector
          setLeadData(prev => ({ ...prev, name: input })); // Simplification: assuming input contains name
          response = "Prazer em conhecer você. Para que eu possa calcular sua alavancagem com precisão: qual o faturamento mensal médio da sua empresa hoje?";
          break;

        case 1: // Just got Revenue
          const revenueVal = parseInt(input.replace(/[^0-9]/g, '')) || 0;
          setLeadData(prev => ({ ...prev, revenue: revenueVal }));

          if (revenueVal < 100000) {
            response = "Entendido. No momento, a consultoria RIA é focada em empresas que já superaram a barreira dos R$ 100k/mês e buscam escala agressiva. Recomendo que você acompanhe nossa newsletter de IA para preparar seu negócio para o próximo nível. Posso te enviar o link?";
            nextStep = 99; // Disqualified
          } else {
            response = "Faturamento expressivo. Com esse volume, a ineficiência humana está te custando caro. Com base nos seus dados, sua empresa tem um potencial de ROI massivo com agentes de IA. Deseja ver a projeção?";
          }
          break;

        case 2: // ROI Calculation
          const estimatedRoi = leadData.revenue * 0.4; // 40% efficiency gain simulated
          response = `Análise concluída. Com a implementação de Agentes de IA, seu potencial de recuperação de margem e ganho de escala é de aproximadamente R$ ${estimatedRoi.toLocaleString()} por ano. Isso faz sentido para o seu momento atual?`;
          data = { 
            roi: estimatedRoi, 
            efficiency: 40,
            name: leadData.name,
            sector: leadData.sector,
            revenue: leadData.revenue
          };
          break;

        case 99: // Post-disqualification
          response = "Link enviado. Continue escalando e nos procure quando atingir o marco dos R$ 100k. Estaremos prontos para o seu tsunami.";
          break;

        default:
          response = "Minha análise está pronta. Clique abaixo para garantir sua sessão estratégica e discutirmos esses números.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response, data }]);
      setStep(nextStep);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erro na conexão com o núcleo neural. Por favor, tente novamente." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[500px] premium-glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-white/60 font-mono text-[10px] uppercase tracking-widest">RIA_AGENT_CONNECTED</span>
        </div>
        <Sparkles size={14} className="text-accent/40" />
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.role === 'user' ? 'bg-white/10 border-white/20' : 'bg-accent/10 border-accent/30'
                }`}>
                  {msg.role === 'user' ? <User size={14} className="text-white/60" /> : <Bot size={14} className="text-accent" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-white/5 text-white/80' : 'bg-accent/5 text-accent/90 border border-accent/10'
                }`}>
                  {msg.content}
                  
                  {msg.data && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-4 bg-black/40 rounded-xl border border-accent/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-accent" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">ROI Detetado</span>
                      </div>
                      <div className="text-2xl font-serif text-white mb-2">R$ {msg.data.roi.toLocaleString()} /ano</div>
                      <button 
                        onClick={() => onComplete(msg.data)}
                        className="w-full py-2 bg-accent text-black text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2"
                      >
                        Ver Detalhes <ArrowRight size={12} />
                      </button>
                    </motion.div>
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
              <div className="p-4 rounded-2xl bg-accent/5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white/5 border-t border-white/5">
        <div className="relative flex items-center">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua resposta..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-accent/40 transition-all placeholder:text-white/20"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-3 p-2 bg-accent text-black rounded-lg hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-3 text-center text-[8px] text-white/20 uppercase tracking-[0.2em]">Agente de Inteligência Conectado via n8n Protocol</p>
      </div>
    </div>
  );
}
