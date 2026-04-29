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

export default function AIChatAgent({ webhookUrl = "https://libra-credito-n8n.usybav.easypanel.host/webhook/n8n", onComplete }: AIChatAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Olá. Sou o Agente de Inteligência da RIA. Como posso te ajudar hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const [sessionId] = useState(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7));

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const currentInput = input;
    const userMsg: Message = { role: 'user', content: currentInput };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Adicionando um AbortController para evitar que o chat fique carregando infinitamente
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos de limite

    try {
      console.log("Enviando mensagem para n8n:", currentInput);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify({
          sessionId,
          action: 'sendMessage',
          chatInput: currentInput,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log("Status da resposta n8n:", response.status);

      if (!response.ok) {
        throw new Error(`Erro na requisição ao n8n: Status ${response.status}`);
      }

      const textResponse = await response.text();
      console.log("Texto puro recebido do n8n:", textResponse);

      let responseData;
      try {
        responseData = JSON.parse(textResponse);
      } catch (e) {
        responseData = textResponse;
      }

      let botMessage = "A resposta chegou vazia ou em um formato não reconhecido.";
      let data = undefined;

      if (typeof responseData === 'object' && responseData !== null) {
        // Se for um array de objetos (n8n as vezes retorna um array de itens)
        if (Array.isArray(responseData)) {
          const firstItem = responseData[0];
          if (firstItem && typeof firstItem === 'object') {
             botMessage = firstItem.output || firstItem.response || firstItem.message || firstItem.text || JSON.stringify(firstItem);
          } else {
             botMessage = JSON.stringify(responseData);
          }
        } else {
          // Objeto normal
          botMessage = responseData.output || responseData.response || responseData.message || responseData.text || JSON.stringify(responseData);
          if (responseData.data) {
            data = responseData.data;
          }
        }
      } else if (typeof responseData === 'string' && responseData.trim() !== "") {
        botMessage = responseData;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: botMessage, data }]);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Erro detalhado no chat:", error);
      
      let errorMsg = "Erro na conexão com o núcleo neural. Por favor, tente novamente.";
      if (error.name === 'AbortError') {
        errorMsg = "Tempo limite esgotado. O agente demorou muito para responder.";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-full premium-glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl text-left">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-white/80 font-mono text-xs uppercase tracking-widest">RIA_AGENT_CONNECTED</span>
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
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
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
                        <span className="text-xs uppercase font-bold tracking-widest text-white/60">ROI Detetado</span>
                      </div>
                      <div className="text-2xl font-serif text-white mb-2">R$ {msg.data.roi.toLocaleString()} /ano</div>
                      <button 
                        onClick={() => onComplete(msg.data)}
                        className="w-full py-3 bg-accent text-black text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2"
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
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-base md:text-sm text-white focus:outline-none focus:border-accent/40 transition-all placeholder:text-white/40"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-3 p-2 bg-accent text-black rounded-lg hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] md:text-xs text-white/40 uppercase tracking-[0.2em]">Agente de Inteligência Conectado via n8n Protocol</p>
      </div>
    </div>
  );
}
