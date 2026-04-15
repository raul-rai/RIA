import { motion } from 'motion/react';
import { useInView } from 'motion/react';
import { useRef } from 'react';
import { Mail, Linkedin, MessageCircle, ArrowRight } from 'lucide-react';
import { WHATSAPP_URL_CTA, WHATSAPP_URL, EMAIL, LINKEDIN_URL } from '../constants/links';

export default function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contato" className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-24 md:py-32 border-t border-white/5">
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[34px] md:text-[60px] lg:text-[80px] font-serif tracking-tight leading-[1.1] mb-10 text-white"
        >
          Entre na era da IA <br />
          <span className="italic font-normal opacity-70">antes da concorrência.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-muted font-light mb-16 max-w-2xl mx-auto"
        >
          Diagnóstico estratégico de 30 minutos. Gratuito. Sem compromisso. <br className="hidden md:block" />
          Apenas clareza para o seu próximo passo.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-16"
        >
          <a
            href={WHATSAPP_URL_CTA}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto group relative px-12 py-6 bg-white text-black rounded-3xl font-bold uppercase tracking-widest text-sm overflow-hidden transition-all duration-500 hover:scale-105 hover:bg-accent hover:shadow-[0_0_80px_rgba(0,229,255,0.4)] shadow-2xl flex items-center justify-center gap-4 active:scale-95"
          >
            <span className="relative z-10">Agendar Consultoria Gratuita</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          <div className="flex items-center gap-8 md:gap-12">
            {[
              { href: WHATSAPP_URL, icon: <MessageCircle size={22} />, label: "WhatsApp" },
              { href: LINKEDIN_URL, icon: <Linkedin size={22} />, label: "LinkedIn" },
              { href: `mailto:${EMAIL}`, icon: <Mail size={22} />, label: "Email" }
            ].map((social, i) => (
              <a 
                key={i}
                href={social.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted hover:text-white transition-all transform hover:scale-125 duration-300"
              >
                {social.icon}
                <span className="sr-only">{social.label}</span>
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Decorative center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[180px] pointer-events-none z-0" />
    </section>
  );
}
