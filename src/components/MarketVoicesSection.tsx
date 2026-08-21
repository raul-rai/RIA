import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Play, Clock } from 'lucide-react';
import VideoModal from './VideoModal';
import {
  AUTHORITIES,
  AUTHORITIES_DISCLAIMER,
  embedUrl,
  thumbnailUrl,
  type Authority,
} from '../content/authorities';
import { track } from '../lib/analytics';

/**
 * Capítulo 2 — as vozes.
 *
 * Vem DEPOIS da evidência de propósito. Os quatro estudos estabelecem o
 * argumento com dado auditável; as três vozes brasileiras dão cara e tom a
 * ele. Dado convence o cético, voz convence o resto — e nessa ordem a voz
 * chega como ilustração de algo já provado, não como substituto de prova.
 *
 * Substitui o trio SocialProofSection + AuthorityCard + AuthorityAccordion por
 * um componente só. O acordeão do mobile existia porque cada cartão carregava
 * bio longa e checkbox; sem o checkbox e com a bio atrás de um disclosure, os
 * três cartões cabem empilhados sem empurrar o rodapé para fora da tela.
 */

/** "22:58" a partir de segundos — o recorte é a curadoria, então ele aparece. */
function timecode(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function VoiceCard({ authority, onPlay }: { authority: Authority; onPlay: () => void }) {
  const [showBio, setShowBio] = useState(false);
  const Icon = authority.icon;
  const hasClip = authority.startTime !== undefined && authority.endTime !== undefined;

  return (
    <article className="glass-card glass-hover rounded-2xl overflow-hidden flex flex-col text-left">
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Assistir ao trecho de ${authority.name}`}
        className="relative block w-full aspect-video overflow-hidden group"
      >
        <img
          src={thumbnailUrl(authority)}
          alt=""
          loading="lazy"
          /* object-cover + scale: a hqdefault do YouTube vem em 4:3 com tarjas
             pretas em cima e embaixo. Sem o corte, o cartão exibe as tarjas. */
          className="w-full h-full object-cover scale-[1.35] transition-transform duration-500 group-hover:scale-[1.42]"
        />
        <span className="absolute inset-0 bg-slate-950/25 group-hover:bg-slate-950/10 transition-colors" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play size={18} className="text-slate-900 ml-0.5" fill="currentColor" />
          </span>
        </span>
        {hasClip && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950/75 text-white text-[10px] font-mono font-bold">
            <Clock size={10} />
            {timecode(authority.startTime!)}–{timecode(authority.endTime!)}
          </span>
        )}
      </button>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-accent shrink-0" />
          <h3 className="text-sm font-bold text-slate-900 leading-tight">{authority.name}</h3>
        </div>
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 -mt-1">
          {authority.title}
        </p>

        {/* Descrição do argumento, não transcrição. Ver a nota em
            content/authorities.ts sobre por que não há aspas aqui. */}
        <p className="text-[12px] md:text-[13px] text-slate-700 leading-snug">{authority.argument}</p>

        <button
          type="button"
          onClick={() => setShowBio((v) => !v)}
          aria-expanded={showBio}
          className="self-start mt-auto pt-2 min-h-11 text-[11px] font-bold text-accent hover:text-accent-dark underline underline-offset-2"
        >
          {showBio ? 'Ocultar' : 'Quem é'}
        </button>
        {showBio && (
          <p className="text-[11px] text-slate-600 leading-snug border-t border-slate-900/10 pt-2">
            {authority.bio}
          </p>
        )}
      </div>
    </article>
  );
}

export default function MarketVoicesSection() {
  const [selected, setSelected] = useState<Authority | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-0 pointer-events-auto flex flex-col justify-center">
      <div className="mb-6 md:mb-8 text-center">
        <div className="glass-chip glass-amber inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3">
          <ShieldAlert size={14} className="text-amber-600" />
          <span className="text-amber-800 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            Vozes do mercado
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 mb-2 leading-tight">
          Não é só a <span className="italic font-normal text-slate-500">minha leitura.</span>
        </h2>
        <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light leading-relaxed">
          Três das vozes mais ouvidas do mercado brasileiro, no trecho em que tratam do mesmo ponto.
          Recortado para ir direto ao assunto.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
        {AUTHORITIES.map((authority) => (
          <VoiceCard
            key={authority.name}
            authority={authority}
            onPlay={() => {
              track('cta_click', { location: 'authority_video' });
              setSelected(authority);
            }}
          />
        ))}
      </div>

      {/*
        O aviso que o commit 4b24851 removeu, de volta.

        Não é rodapé decorativo: sem ele, a arquitetura da seção — foto, nome,
        cargo, sob um H2 que diz "não é só a minha leitura" — faz o leitor sair
        com a impressão de que estas três pessoas endossam a RIA. Nenhuma
        endossa. tests/authorities.test.ts falha se este texto sumir de novo.
      */}
      <p className="max-w-3xl mx-auto mt-6 text-center text-[11px] text-slate-500 leading-relaxed border-t border-slate-900/10 pt-4">
        {AUTHORITIES_DISCLAIMER}
      </p>

      <VideoModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        videoUrl={selected ? embedUrl(selected) : ''}
        title={selected?.name || ''}
        bio={selected?.bio}
        startTime={selected?.startTime}
        endTime={selected?.endTime}
      />
    </div>
  );
}
