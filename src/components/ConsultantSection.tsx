import { motion } from 'motion/react';
import { Award, Briefcase, GraduationCap, ArrowUpRight, Linkedin } from 'lucide-react';

export default function ConsultantSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-24 pointer-events-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Profile Image with Decorative Elements */}
        <div className="relative">
          <div className="absolute -inset-4 border border-accent/20 rounded-[3rem] -rotate-3" />
          <div className="absolute -inset-4 border border-white/10 rounded-[3rem] rotate-3" />
          
          <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] bg-bg-alt border border-white/10">
            <img 
              src="/raul.pedro.png" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
              alt="Raul Pedro - Consultor de IA"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base/80 via-transparent to-transparent z-10" />
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="absolute -right-8 bottom-12 p-6 premium-glass rounded-2xl border border-accent/20 max-w-[200px] z-20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Award size={14} className="text-accent" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Especialidade</span>
            </div>
            <div className="text-sm font-serif text-white">Engenheiro de Produção & IA Strategy</div>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 w-fit">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">Seu Consultor</span>
          </div>
          
          <h2 className="heading-section text-white mb-6">
            Raul Pedro <br />
            <span className="italic font-normal text-white/50">Liderando sua Transição.</span>
          </h2>

          <p className="text-white/60 text-base font-light leading-relaxed mb-10">
            Com background em Engenharia de Produção e experiência no mercado financeiro brasileiro, Raul Pedro une a precisão analítica à vanguarda da Inteligência Artificial. Sua missão é clara: garantir que sua empresa não apenas sobreviva, mas lidere o mercado na era da automação cognitiva.
          </p>

          <div className="grid grid-cols-1 gap-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <Briefcase size={18} className="text-accent" />
              </div>
              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-1">Experiência Real</h4>
                <p className="text-white/30 text-[11px] leading-relaxed">Agentes de IA já em produção qualificando leads e otimizando fluxos complexos.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <GraduationCap size={18} className="text-accent" />
              </div>
              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-1">Formação Estratégica</h4>
                <p className="text-white/30 text-[11px] leading-relaxed">Engenharia de Produção focada em eficiência operacional e escala sistêmica.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              className="px-8 py-4 bg-accent text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Iniciar Estratégia com Raul <ArrowUpRight size={14} />
            </button>
            <a 
              href="#" 
              className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Linkedin size={14} />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
