import { useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { config } from '../config';
import { buildBookingUrl } from '../lib/booking';
import { whatsappWithMessage } from '../constants/links';
import { track } from '../lib/analytics';
import { SESSION_MINUTES } from '../content/offer';

/** Prazo para o iframe carregar antes de considerarmos a agenda como falha. */
const LOAD_TIMEOUT_MS = 6000;

interface BookingEmbedProps {
  name: string;
  email: string;
  /** Contexto que o Raul le antes da chamada. */
  notes?: string;
  /** Mensagem do WhatsApp se a agenda nao abrir. Carrega os cinco campos. */
  fallbackMessage: string;
}

/**
 * A agenda, embutida.
 *
 * Este componente nao conhece a qualificacao: recebe nome, email e um texto de
 * contexto. Se a URL nao estiver configurada ou o iframe falhar, o visitante
 * nao pode ficar sem destino — cai no WhatsApp levando tudo que respondeu.
 *
 * Deteccao de falha: para um embed cross-origin, o evento onError do iframe
 * nao dispara nos casos reais de falha (provedor bloqueia via
 * X-Frame-Options/CSP frame-ancestors, a URL cai num 404 do proprio
 * provedor, ou o host esta fora do ar) — em todos esses casos um documento
 * carrega normalmente dentro do frame. Por isso o sinal principal de falha
 * e a AUSENCIA de onLoad dentro de um prazo, e nao a presenca de um erro.
 * Limite honesto: um frame que carrega a pagina de erro do proprio provedor
 * (um 404 dele, por exemplo) dispara onLoad normalmente — esse caso
 * especifico o timeout nao pega. O que ele cobre e o caso mais comum e
 * alcancavel: tela em branco por bloqueio ou host fora do ar.
 */
export default function BookingEmbed({ name, email, notes, fallbackMessage }: BookingEmbedProps) {
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = buildBookingUrl(config.bookingUrl, { name, email, notes });

  useEffect(() => {
    if (!url) return;

    timeoutRef.current = setTimeout(() => {
      setFailed(true);
    }, LOAD_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [url]);

  const handleLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  if (!url || failed) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="glass-raised glass-accent mt-3 p-4 rounded-xl text-left"
      >
        <p className="text-sm text-slate-900 font-semibold leading-snug mb-3">
          Tenho tudo que preciso. Vamos fechar o horário direto comigo.
        </p>
        <a
          href={whatsappWithMessage(fallbackMessage)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_click', { location: 'booking_fallback' })}
          className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-colors"
        >
          <MessageCircle size={14} /> Marcar pelo WhatsApp
        </a>
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-raised glass-accent mt-3 rounded-xl overflow-hidden text-left"
    >
      <div className="glass-rail flex items-center gap-2 px-4 py-2.5 border-b border-slate-900/10">
        <CalendarCheck size={14} className="text-accent" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600">
          Escolha o horário — {SESSION_MINUTES} minutos
        </span>
      </div>
      <iframe
        src={url}
        title={`Agenda da sessão estratégica de ${SESSION_MINUTES} minutos`}
        onLoad={handleLoad}
        onError={() => setFailed(true)}
        className="w-full h-[420px] border-0"
      />
    </m.div>
  );
}
