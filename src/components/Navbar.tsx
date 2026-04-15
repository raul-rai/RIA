import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WHATSAPP_URL } from '../constants/links';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-6"
    >
      <div className={`max-w-5xl mx-auto rounded-full px-6 py-3 flex items-center justify-between transition-all duration-500 premium-glass ${
        scrolled ? 'py-2 px-6 scale-[0.98]' : ''
      }`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <span className="font-serif font-bold text-xs text-black">R</span>
          </div>
          <span className="font-serif font-semibold text-lg tracking-tight text-white">
            RIA
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          <button onClick={() => scrollTo('servicos')} className="text-xs uppercase tracking-widest text-muted hover:text-white transition-colors">Serviços</button>
          <button onClick={() => scrollTo('sobre')} className="text-xs uppercase tracking-widest text-muted hover:text-white transition-colors">Sobre</button>
          <button onClick={() => scrollTo('contato')} className="text-xs uppercase tracking-widest text-muted hover:text-white transition-colors">Contato</button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-black transition-all duration-300 shadow-xl"
          >
            Falar agora
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute top-24 left-4 right-4 premium-glass rounded-3xl p-8 flex flex-col gap-8 md:hidden shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
            <button onClick={() => scrollTo('servicos')} className="text-2xl font-serif text-left hover:text-accent transition-colors">Serviços</button>
            <button onClick={() => scrollTo('sobre')} className="text-2xl font-serif text-left hover:text-accent transition-colors">Sobre</button>
            <button onClick={() => scrollTo('contato')} className="text-2xl font-serif text-left hover:text-accent transition-colors">Contato</button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-8 py-5 mt-4 rounded-2xl bg-white text-black text-center text-sm font-bold uppercase tracking-widest border border-white transition-all active:scale-95"
            >
              Consultoria Gratuita
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
