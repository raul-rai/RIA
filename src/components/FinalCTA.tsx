import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';
import { Mail, Linkedin, MessageCircle, ArrowRight } from 'lucide-react';
import { WHATSAPP_URL_CTA, WHATSAPP_URL, EMAIL, LINKEDIN_URL } from '../constants/links';

export default function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contato" className="relative min-h-screen flex items-center justify-center overflow-hidden py-32 bg-transparent border-t border-white/5">
      {/* Background Echo of Wave */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60 z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px] z-0" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter leading-[0.9] mb-8 text-white/90"
        >
          Entre na era da IA <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/90 to-muted/80">antes da concorrência.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-muted font-light mb-16 max-w-2xl mx-auto"
        >
          30 minutos. Gratuito. Sem compromisso. Apenas clareza estratégica para o seu negócio.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col items-center gap-16"
        >
          <a
            href={WHATSAPP_URL_CTA}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-10 py-5 bg-white/90 backdrop-blur-sm text-black rounded-full font-display font-medium text-xl overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] flex items-center gap-3"
          >
            <span className="relative z-10">Agendar Sessão Estratégica</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          <div className="flex items-center gap-8">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-white transition-colors p-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
              <MessageCircle size={24} />
              <span className="sr-only">WhatsApp</span>
            </a>
            <a href={LINKEDIN_URL} className="text-muted hover:text-white transition-colors p-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
              <Linkedin size={24} />
              <span className="sr-only">LinkedIn</span>
            </a>
            <a href={`mailto:${EMAIL}`} className="text-muted hover:text-white transition-colors p-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
              <Mail size={24} />
              <span className="sr-only">Email</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
