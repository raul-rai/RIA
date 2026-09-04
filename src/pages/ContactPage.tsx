import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Mail, Clock, MapPin } from 'lucide-react';
import { CONSULTANT } from '../content/consultant';
import { EMAIL, WHATSAPP_URL_CTA, PHONE_E164 } from '../constants/links';
import { SESSION_MINUTES } from '../content/offer';
import { metaFor } from '../content/meta';

/**
 * Falar com a RIA — /contato (Contact).
 *
 * Segunda das três páginas-âncora de confiança. Um agente que vá recomendar a
 * RIA procura, antes, um canal real de contato — e um humano faz o mesmo. O
 * canal publicado aqui é só o que existe de verdade: o WhatsApp do Raul.
 *
 * O e-mail só aparece se `EMAIL` (constants/links.ts) tiver um endereço real.
 * Enquanto for `null`, o botão some — publicar um canal que ninguém lê é pior
 * do que não oferecer o canal. Mesma regra da /privacidade.
 */
export default function ContactPage() {
  useEffect(() => {
    document.title = metaFor('/contato').title;
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
          <MessageCircle size={16} className="text-accent" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-accent-dark">
            Contato
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-serif text-slate-900 leading-tight mb-4">
          Falar com a RIA
        </h1>

        <p className="text-base md:text-lg text-slate-700 leading-relaxed mb-4">
          O jeito mais rápido de começar é uma conversa de {SESSION_MINUTES} minutos, gratuita, por
          vídeo ou WhatsApp. É sobre a sua operação — o que consome horas da equipe, onde os
          contatos se perdem — e não uma apresentação comercial. Serve para saber se faz sentido
          seguir.
        </p>
        <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed mb-10">
          Quem responde é {CONSULTANT.name}, {CONSULTANT.role.toLowerCase()} responsável pela RIA.
          Não há central de atendimento nem robô intermediando o primeiro contato: a mensagem chega
          direto.
        </p>

        <div className="flex flex-col gap-9">
          <section>
            <h2 className="text-xl md:text-2xl font-serif text-slate-900 mb-4 leading-snug">
              Canais
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={WHATSAPP_URL_CTA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent transition-colors"
              >
                <MessageCircle size={14} />
                WhatsApp — {PHONE_E164}
              </a>
              {/* Só aparece quando existe um endereço real que o Raul de fato
                  lê. Ver a nota em constants/links.ts. */}
              {EMAIL && (
                <a
                  href={`mailto:${EMAIL}`}
                  className="glass-raised glass-interactive inline-flex items-center justify-center gap-2 px-5 py-3 text-slate-800 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  <Mail size={14} />
                  {EMAIL}
                </a>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-serif text-slate-900 mb-3 leading-snug">
              Onde e quando
            </h2>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
                <MapPin size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  Atende empresas em todo o Brasil, de forma remota. O diagnóstico é feito no próprio
                  sistema do cliente, sem exigir deslocamento.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
                <Clock size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  Mensagens no WhatsApp costumam ser respondidas em horário comercial. Pedidos sobre
                  dados pessoais têm prazo de resposta de até 15 dias, conforme a Política de
                  Privacidade.
                </span>
              </li>
            </ul>
          </section>

          <section className="border-t border-slate-900/10 pt-8">
            <p className="text-xs text-slate-500 leading-relaxed">
              Para saber mais sobre quem conduz o trabalho, veja a página{' '}
              <Link to="/sobre" className="font-semibold text-slate-600 hover:text-accent underline underline-offset-2">
                Sobre a RIA
              </Link>
              . Para entender o tratamento de dados, a{' '}
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
