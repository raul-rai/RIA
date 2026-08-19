import { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { config } from '../config';
import { buildBookingUrl } from '../lib/booking';
import { whatsappWithMessage } from '../constants/links';
import { track } from '../lib/analytics';

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
 */
export default function BookingEmbed({ name, email, notes, fallbackMessage }: BookingEmbedProps) {
  const [failed, setFailed] = useState(false);
  const url = buildBookingUrl(config.bookingUrl, { name, email, notes });

  if (!url || failed) {
    return (
      <div className="mt-3 p-4 bg-white rounded-xl border border-accent/30 shadow-md text-left">
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 bg-white rounded-xl border border-accent/30 shadow-md overflow-hidden text-left"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
        <CalendarCheck size={14} className="text-accent" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600">
          Escolha o horário — 30 minutos
        </span>
      </div>
      <iframe
        src={url}
        title="Agenda da sessão estratégica de 30 minutos"
        onError={() => setFailed(true)}
        className="w-full h-[420px] border-0"
      />
    </motion.div>
  );
}
