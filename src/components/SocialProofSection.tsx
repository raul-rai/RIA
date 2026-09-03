import { ShieldAlert } from 'lucide-react';
import { AUTHORITIES_DISCLAIMER } from '../content/authorities';
import VideoWall3D from './VideoWall3D';

export default function SocialProofSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16 pointer-events-auto flex flex-col justify-center">
      <div className="mb-6 md:mb-10 text-center">
        <div className="glass-chip glass-amber inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3">
          <ShieldAlert size={14} className="text-amber-600" />
          <span className="text-amber-800 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            Vozes do mercado
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 mb-2 leading-tight">
          Porque utilizar IA no <span className="italic font-normal text-slate-500">meu negócio?</span>
        </h2>
        <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light leading-relaxed">
          Três das vozes mais ouvidas do mercado brasileiro, falando sobre a mesma coisa.
        </p>
      </div>

      <div className="max-w-5xl mx-auto w-full">
        <VideoWall3D />
      </div>

      <p className="mt-6 md:mt-8 mx-auto max-w-3xl text-center text-[10px] md:text-[11px] text-slate-500 leading-relaxed">
        {AUTHORITIES_DISCLAIMER}
      </p>
    </div>
  );
}
