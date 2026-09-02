import { useEffect, useId, useRef } from 'react';
import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import { X, Award, Quote } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  bio?: string;
  startTime?: number;
  endTime?: number;
}

/**
 * O endereço do player, montado a partir do videoUrl da autoridade.
 *
 * IFRAME PURO, SEM A IFRAME API — e a troca não é de estilo.
 *
 * Antes este componente injetava `https://www.youtube.com/iframe_api` e montava
 * um `YT.Player`. Mesmo depois de o player passar para o domínio sem cookie, o
 * SCRIPT da API só existe em www.youtube.com: a requisição dele revelava o IP
 * do visitante e, para quem estivesse logado no YouTube, levava os cookies
 * daquele domínio junto. Ou seja, o `-nocookie` do player não fechava o buraco
 * — só o estreitava.
 *
 * A API era usada para UMA coisa: fechar o modal quando o trecho terminava,
 * consultando `getCurrentTime()` a cada 500 ms. Mas `start` e `end` são
 * parâmetros nativos do embed, então o recorte continua exato sem uma linha de
 * JavaScript de terceiro.
 *
 * MUDANÇA DE COMPORTAMENTO, declarada: o modal não se fecha mais sozinho no fim
 * do trecho. O vídeo para no ponto certo e o visitante fecha quando quiser.
 * Reproduzir o fechamento automático sem a API exigiria um `setTimeout` cego,
 * que fecharia o modal na cara de quem tivesse pausado.
 */
function playerSrc(videoUrl: string, startTime?: number, endTime?: number): string {
  const videoId = videoUrl.match(/(?:embed\/|v=)([^?&]+)/)?.[1] ?? '';
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    start: String(startTime ?? 0),
  });
  if (endTime) params.set('end', String(endTime));
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/** O que o Tab alcança dentro do diálogo, na ordem do documento. */
const FOCALIZAVEIS =
  'a[href], button:not([disabled]), iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function VideoModal({ isOpen, onClose, videoUrl, title, bio, startTime, endTime }: VideoModalProps) {
  const painelRef = useRef<HTMLDivElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);
  const tituloId = useId();

  /**
   * O diálogo, com o que faltava para ele ser um diálogo.
   *
   * Medido antes: `role` null, `aria-modal` null, sem rótulo, foco parado no
   * <body> depois de abrir, Escape não fechava e a página continuava rolando
   * atrás. Ou seja: para quem navega por teclado ou leitor de tela, isto era
   * uma div que apareceu, e o resto da página seguia sendo o documento ativo.
   *
   * LIMITE HONESTO — o player é um iframe de outra origem. Enquanto o foco
   * estiver DENTRO dele, os eventos de teclado pertencem ao YouTube e não
   * chegam aqui: o Escape não fecha e a armadilha de foco não prende. Não há
   * conserto para isso do lado de fora do iframe; o que dá para garantir, e
   * está garantido, é que o botão de fechar continua visível e alcançável, e
   * que sair do iframe com Tab devolve o foco à armadilha.
   */
  useEffect(() => {
    if (!isOpen) return;

    focoAnterior.current = document.activeElement as HTMLElement | null;
    // O foco entra pelo botão de fechar: é a saída, e é o que alguém que
    // abriu sem querer precisa encontrar primeiro.
    fecharRef.current?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !painelRef.current) return;

      const alvos = [...painelRef.current.querySelectorAll<HTMLElement>(FOCALIZAVEIS)];
      if (alvos.length === 0) return;
      const primeiro = alvos[0];
      const ultimo = alvos[alvos.length - 1];
      const atual = document.activeElement;

      if (e.shiftKey && (atual === primeiro || !painelRef.current.contains(atual))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && atual === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', aoTeclar);

    // A página não pode rolar atrás do diálogo: com o modal aberto o
    // documento ativo é ele, e rolar o que está por baixo é o sintoma mais
    // visível de que o navegador ainda acha o contrário.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
      // Devolve o foco ao botão que abriu. Sem isto, fechar o modal joga o
      // teclado de volta ao início da página, e a pessoa perde o lugar.
      focoAnterior.current?.focus();
    };
  }, [isOpen, onClose]);

  /**
   * DESMONTE IMEDIATO, SEM ANIMAÇÃO DE SAÍDA — e a escolha é deliberada.
   *
   * O `exit` das duas camadas estava escrito desde sempre e nunca rodava,
   * porque este `return null` vinha ANTES do <AnimatePresence>. Tentei
   * consertar movendo a condição para dentro dele. O resultado, medido no
   * preview: a animação de saída completava (opacity 0, transform no valor
   * final, nenhuma animação em curso) e o AnimatePresence NÃO desmontava o
   * nó — nem com `key` no filho, nem sem o motion aninhado do painel de bio.
   *
   * O que ficava no DOM não era um resto inofensivo: era um
   * `role="dialog" aria-modal="true"` invisível, que continua dizendo ao
   * leitor de tela para ignorar o resto da página, com um iframe do YouTube
   * vivo tocando dentro dele.
   *
   * Entre a animação de saída e o desmonte confiável, o desmonte ganha. As
   * animações de ENTRADA continuam (initial/animate não dependem do
   * AnimatePresence); o que não existe é o fade de saída — e agora não existe
   * de forma declarada, em vez de existir no código e não na tela.
   */
  if (!isOpen) return null;

  const src = playerSrc(videoUrl, startTime, endTime);

  return (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-8 backdrop-blur-3xl bg-black/90 pointer-events-auto"
        onClick={onClose}
      >
        <m.div
          ref={painelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={tituloId}
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="glass glass-dark w-full max-w-7xl rounded-3xl overflow-hidden flex flex-col md:flex-row h-fit max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Floats over video on mobile, top right on desktop */}
          <button
            ref={fecharRef}
            onClick={onClose}
            aria-label="Fechar o vídeo"
            className="absolute top-4 right-4 z-[110] p-3 rounded-full bg-slate-950/55 backdrop-blur-md border border-white/15 text-white hover:bg-accent hover:text-black transition-all"
          >
            <X size={20} aria-hidden="true" />
          </button>

          {/* O player. Sobe só agora, com o modal — nada do YouTube é pedido
              enquanto o visitante não clica em "Assistir o trecho". */}
          <div className="w-full md:w-[70%] aspect-video bg-black flex-shrink-0">
            <iframe
              src={src}
              title={`Trecho de ${title} no YouTube`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          {/* Bio Section - 30% width on desktop */}
          <div className="w-full md:w-[30%] p-6 md:p-10 flex flex-col justify-center bg-gradient-to-br from-white/[0.02] to-transparent overflow-y-auto">
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Award size={16} className="text-accent" />
                <span className="text-accent-dark text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em]">Quem fala</span>
              </div>
              
              {/* É este h3 que dá NOME ao diálogo (aria-labelledby). Um leitor
                  de tela anuncia "diálogo, Ricardo Amorim" em vez de "diálogo". */}
              <h3 id={tituloId} className="text-2xl md:text-3xl font-serif text-white mb-2">
                {title}
              </h3>
              <div className="w-12 h-1 bg-accent/30 mb-6 rounded-full" />

              {bio && (
                <div className="relative">
                  <Quote size={32} className="absolute -top-4 -left-4 text-white/5 opacity-40" />
                  <p className="text-white/60 text-sm md:text-base font-light leading-relaxed italic relative z-10">
                    {bio}
                  </p>
                </div>
              )}

              {/*
                Quem esta servindo o video, dito na tela.

                A politica de privacidade passou a declarar o YouTube — mas
                politica e o lugar onde se confere depois, nao onde se descobre
                na hora. Este aviso fica onde a transferencia acontece, ao lado
                do player que acabou de subir.
              */}
              <p className="mt-6 pt-4 border-t border-white/10 text-white/40 text-[11px] leading-relaxed">
                Vídeo servido pelo YouTube em modo sem cookies
                (<span className="font-mono">youtube-nocookie.com</span>). Ao reproduzir, o YouTube
                recebe o seu IP.{' '}
                <Link
                  to="/privacidade"
                  target="_blank"
                  className="text-accent underline underline-offset-2 hover:text-white"
                >
                  Como trato seus dados
                </Link>
                .
              </p>

              {/*
                Aqui ficava um rodape de "PROTOCOLO / RIA_AUTH_VERIFIED" com um
                cracha de "AUTO-STOP: 23:58" ou "FULL_PLAYBACK". Era cosplay de
                terminal: nada ali era verificado por protocolo nenhum, e o
                unico efeito real era carimbar jargao falso ao lado do nome de
                uma pessoa publica que nao tem relacao com a RIA — no painel
                onde a pagina mais precisa parecer sobria.

                O recorte do video continua existindo: `endTime` segue parando
                a reproducao no ponto certo, so nao se anuncia mais.
              */}
            </m.div>
          </div>
        </m.div>
      </m.div>
  );
}
