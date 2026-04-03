import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WHATSAPP_URL } from '../constants/links';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className={`max-w-7xl mx-auto rounded-2xl px-6 py-4 flex items-center justify-between border transition-all duration-300 ${
        scrolled
          ? 'bg-black/90 border-white/10 backdrop-blur-xl'
          : 'glass-card border-white/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="font-display font-bold text-sm text-black">RIA</span>
          </div>
          <span className="font-display font-medium text-lg tracking-tight text-white hidden sm:block">
            Revolução da Inteligência Artificial
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a onClick={() => scrollTo('servicos')} className="cursor-pointer text-sm text-muted hover:text-white transition-colors">Serviços</a>
          <a onClick={() => scrollTo('sobre')} className="cursor-pointer text-sm text-muted hover:text-white transition-colors">Sobre</a>
          <a onClick={() => scrollTo('contato')} className="cursor-pointer text-sm text-muted hover:text-white transition-colors">Contato</a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-full border border-white/20 text-sm font-medium text-white hover:bg-white hover:text-black transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]"
          >
            Falar agora
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-muted hover:text-white transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-6 right-6 mt-2 glass-card rounded-2xl p-6 flex flex-col gap-6 md:hidden border border-white/5"
        >
          <a onClick={() => scrollTo('servicos')} className="cursor-pointer text-base text-muted hover:text-white transition-colors">Serviços</a>
          <a onClick={() => scrollTo('sobre')} className="cursor-pointer text-base text-muted hover:text-white transition-colors">Sobre</a>
          <a onClick={() => scrollTo('contato')} className="cursor-pointer text-base text-muted hover:text-white transition-colors">Contato</a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-6 py-3 mt-2 rounded-full bg-white text-black text-sm font-medium transition-colors text-center block"
          >
            Falar agora
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
}
