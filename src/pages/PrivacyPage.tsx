import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, MessageCircle, Mail } from 'lucide-react';
import { PRIVACY_SECTIONS, CONTROLLER, LAST_UPDATED } from '../content/privacy';
import { metaFor } from '../content/meta';

/**
 * Política de Privacidade — /privacidade.
 *
 * Página estática deliberadamente simples: sem canvas, sem HUD, sem animação
 * de entrada. Quem chega aqui quer ler e sair, e metade das vezes é alguém do
 * jurídico do prospect conferindo se dá para assinar contrato com a RIA.
 *
 * O conteúdo vive em content/privacy.ts porque é lido por humano E precisa
 * acompanhar o que o código faz. Ver a nota de manutenção lá.
 */
export default function PrivacyPage() {
  // Escrito porque a navegação pelo rodapé não recarrega o documento: sem isto
  // a política herdaria o título da home. O valor vem da MESMA fonte que o
  // prerender injetou neste HTML, então os dois não podem divergir.
  useEffect(() => {
    document.title = metaFor('/privacidade').title;
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
          <ShieldCheck size={16} className="text-accent" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-accent-dark">
            Privacidade e dados
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-serif text-slate-900 leading-tight mb-3">
          Política de Privacidade
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Última atualização: {LAST_UPDATED}. Escrita em português comum, de propósito — uma política
          que você não consegue ler não protege ninguém.
        </p>

        <div className="flex flex-col gap-9">
          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl md:text-2xl font-serif text-slate-900 mb-3 leading-snug">
                {section.title}
              </h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="text-sm md:text-[15px] text-slate-700 leading-relaxed mb-3">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="flex flex-col gap-2.5 mt-2">
                  {section.bullets.map((b) => (
                    <li
                      key={b}
                      className="text-sm md:text-[15px] text-slate-700 leading-relaxed pl-4 border-l-2 border-accent/30"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="border-t border-slate-900/10 pt-8">
            <h2 className="text-xl md:text-2xl font-serif text-slate-900 mb-3">Como falar comigo</h2>
            <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed mb-4">
              Qualquer pedido sobre seus dados — acesso, correção, exclusão, revogação de
              consentimento — chega direto em mim{' '}
              {CONTROLLER.email ? 'por um destes canais:' : 'pelo WhatsApp:'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={CONTROLLER.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent transition-colors"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
              {/* Só aparece quando existe um endereço real. Um botão de e-mail
                  apontando para uma caixa que ninguém lê faz o titular acreditar
                  que exerceu um direito que não chegou a lugar nenhum. */}
              {CONTROLLER.email && (
                <a
                  href={`mailto:${CONTROLLER.email}`}
                  className="glass-raised glass-interactive inline-flex items-center justify-center gap-2 px-5 py-3 text-slate-800 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  <Mail size={14} />
                  {CONTROLLER.email}
                </a>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Controlador: {CONTROLLER.name}
              {CONTROLLER.document ? ` — CNPJ ${CONTROLLER.document}` : ''}. Prazo de resposta: até 15
              dias.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
