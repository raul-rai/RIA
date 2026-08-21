import { Link } from 'react-router-dom';
import { CONSULTANT } from '../content/consultant';

/**
 * Rodapé.
 *
 * A página não tinha nenhum — o que significava que a política de privacidade,
 * uma vez criada, não teria como ser encontrada por quem não soubesse a URL.
 * Rodapé é onde todo mundo procura isso, inclusive o jurídico do prospect.
 *
 * Deliberadamente discreto: esta página termina no agente, e o rodapé não pode
 * competir com a conversão. Ele existe para ser encontrado, não para ser visto.
 */
export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-900/10 bg-white/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 text-center sm:text-left leading-snug">
          {CONSULTANT.name} — {CONSULTANT.role}
        </p>
        <nav className="flex items-center gap-4">
          <Link
            to="/privacidade"
            className="text-[11px] font-semibold text-slate-600 hover:text-accent underline underline-offset-2 py-2"
          >
            Política de privacidade
          </Link>
        </nav>
      </div>
    </footer>
  );
}
