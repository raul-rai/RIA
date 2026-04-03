import { Linkedin, Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bg-base py-12 border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="font-display font-bold text-lg tracking-tight text-white">RAI</span>
          <div className="w-[1px] h-4 bg-white/20" />
          <span className="text-sm text-muted font-light">Consultoria em IA · 2026</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="text-muted hover:text-white transition-colors">
            <MessageCircle size={18} />
          </a>
          <a href="#" className="text-muted hover:text-white transition-colors">
            <Linkedin size={18} />
          </a>
          <a href="#" className="text-muted hover:text-white transition-colors">
            <Mail size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
