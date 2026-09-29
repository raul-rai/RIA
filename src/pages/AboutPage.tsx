import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, MessageCircle } from 'lucide-react';
import { CONSULTANT } from '../content/consultant';
import { PATHS } from '../content/paths';
import { WHATSAPP_URL_CTA } from '../constants/links';
import { metaFor } from '../content/meta';

/**
 * Sobre a RIA — /sobre (About).
 *
 * Uma das três páginas-âncora de confiança que um agente de IA abre antes de
 * recomendar um negócio: quem é, como falar, o que faz com os dados. A home
 * vende; esta página comprova que existe gente por trás. É deliberadamente
 * estática e sem animação, como a /privacidade — quem chega aqui quer ler.
 *
 * Todo o conteúdo vem dos MESMOS módulos que a home renderiza
 * (content/consultant.ts, content/paths.ts). Nada é reescrito à mão aqui: se o
 * posicionamento mudar no site, esta página muda junto, sem divergir.
 */
export default function AboutPage() {
  useEffect(() => {
    document.title = metaFor('/sobre').title;
  }, []);

  return (
    <div className="bg-white text-slate-900 font-sans min-h-screen">
      <main className="max-w-3xl mx-auto px-5 py-12 md:py-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-accent mb-8 py-2"
        >
          <ArrowLeft size={14} />
          Voltar para a página
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <Compass size={16} className="text-accent" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-accent-dark">
            Sobre
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-serif text-slate-900 leading-tight mb-4">
          Sobre a RIA
        </h1>

        <p className="text-base md:text-lg text-slate-700 leading-relaxed mb-4">
          A RIA — Revolução da Inteligência Artificial é uma consultoria de IA para empresas
          brasileiras. O trabalho começa medindo o site do cliente em duas notas independentes: a
          do Google Lighthouse, que avalia desempenho, acessibilidade, práticas recomendadas e SEO,
          e a de prontidão para agentes de IA, que avalia se o ChatGPT, o Gemini, o Perplexity e o
          Claude conseguem descobrir, acessar e usar o site. As duas notas nunca são somadas.
        </p>
        <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed mb-10">
          Depois do laudo, há dois caminhos: um site novo, construído desde o começo para ser
          rápido, encontrável e legível por agentes de IA, ou a otimização do que já existe,
          corrigindo exatamente o que a medição apontou. Atende pequenas e médias empresas em todo
          o Brasil.
        </p>

        <div className="flex flex-col gap-9">
          <section>
            <h2 className="text-xl md:text-2xl font-serif text-slate-900 mb-3 leading-snug">
              Quem conduz
            </h2>
            <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed mb-2">
              <strong className="font-semibold">{CONSULTANT.name}</strong> — {CONSULTANT.role}.{' '}
              {CONSULTANT.tagline}
            </p>
            {CONSULTANT.bio.map((paragraph) => (
              <p key={paragraph} className="text-sm md:text-[15px] text-slate-700 leading-relaxed mb-3">
                {paragraph}
              </p>
            ))}
            <ul className="flex flex-col gap-2.5 mt-2">
              {CONSULTANT.credentials.map((c) => (
                <li
                  key={c}
                  className="text-sm md:text-[15px] text-slate-700 leading-relaxed pl-4 border-l-2 border-accent/30"
                >
                  {c}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-serif text-slate-900 mb-3 leading-snug">
              O que a RIA faz
            </h2>
            <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed mb-4">
              O trabalho segue dois caminhos. São os mesmos que a página inicial apresenta —
              descritos aqui para quem (ou o que) precisa ler sem executar JavaScript:
            </p>
            <div className="flex flex-col gap-5">
              {PATHS.map((path) => (
                <div key={path.id}>
                  <h3 className="text-base md:text-lg font-serif text-slate-900 mb-1">
                    {path.label}
                  </h3>
                  <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed">
                    {path.promise}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-900/10 pt-8">
            <h2 className="text-xl md:text-2xl font-serif text-slate-900 mb-3">Como começa</h2>
            <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed mb-4">
              Uma conversa de 15 minutos, gratuita, por vídeo ou WhatsApp — sobre a sua operação, não
              uma apresentação de slides. Serve para saber se faz sentido seguir. Sem contrato de
              fidelidade: o prazo e o indicador de sucesso entram por escrito na proposta antes de
              começar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={WHATSAPP_URL_CTA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent transition-colors"
              >
                <MessageCircle size={14} />
                Falar no WhatsApp
              </a>
              <Link
                to="/contato"
                className="glass-raised glass-interactive inline-flex items-center justify-center gap-2 px-5 py-3 text-slate-800 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Formas de contato
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-6 leading-relaxed">
              Como a RIA trata os dados coletados no site está descrito na{' '}
              <Link to="/privacidade" className="font-semibold text-slate-600 hover:text-accent underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
