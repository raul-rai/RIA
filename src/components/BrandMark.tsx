import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { prefersReducedMotion } from '../lib/canvas-quality';

/**
 * A marca se apresenta antes de se recolher.
 *
 * O <title> da pagina ja diz "RIA — Revolucao da Inteligencia Artificial", mas
 * o chip do canto mostrava so a sigla: o visitante nunca descobria o que ela
 * significa, e a expansao estava a tres palavras de distancia. Aqui a frase
 * inteira e digitada e depois colapsa sobre as proprias iniciais —
 * R(evolucao da) I(nteligencia) A(rtificial) — revelando que a sigla sempre
 * esteve dentro dela.
 *
 * As caudas colapsam por LARGURA MEDIDA, nao por scaleX. scaleX nao reflui os
 * vizinhos: as iniciais deslizariam por cima do espaco vazio em vez de se
 * encostarem, e o efeito inteiro depende de elas se encostarem.
 *
 * O estado final e identico ao chip que existia antes. A animacao chega no
 * design atual; nao inventa um novo.
 */

/** Iniciais em indice par, caudas em indice impar. A alternancia e o contrato. */
const SEGMENTS = ['R', 'evolução da ', 'I', 'nteligência ', 'A', 'rtificial'];

const FULL_LENGTH = SEGMENTS.reduce((n, s) => n + s.length, 0);

/** Onde cada segmento comeca na frase, para a digitacao cortar por indice. */
const OFFSETS = SEGMENTS.map((_, i) =>
  SEGMENTS.slice(0, i).reduce((n, s) => n + s.length, 0),
);

const isInitial = (i: number) => i % 2 === 0;

type Phase = 'typing' | 'reveal' | 'collapse' | 'done';

const CHAR_MS = 61;
const HOLD_MS = 400;
const REVEAL_MS = 800;
const COLLAPSE_MS = 900;
const SETTLE_MS = 400;

const EASE = [0.16, 1, 0.3, 1] as const;

export default function BrandMark() {
  // Lido uma vez: se o usuario trocar a preferencia no meio da animacao, parar
  // no meio do colapso deixaria a marca ilegivel.
  const reduced = useRef(prefersReducedMotion()).current;

  const [typed, setTyped] = useState(reduced ? FULL_LENGTH : 0);
  const [phase, setPhase] = useState<Phase>(reduced ? 'done' : 'typing');
  const [widths, setWidths] = useState<number[] | null>(null);
  const tailRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  const typingDone = typed >= FULL_LENGTH;

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setTyped((n) => (n >= FULL_LENGTH ? n : n + 1));
    }, CHAR_MS);
    return () => clearInterval(id);
  }, [reduced]);

  /**
   * Depende de `typingDone`, nao de `phase`. Com `phase` na lista, a primeira
   * troca de fase re-executaria o efeito e a limpeza mataria os timers das
   * fases seguintes — a animacao congelaria na revelacao.
   */
  useEffect(() => {
    if (reduced || !typingDone) return;
    const timers = [
      setTimeout(() => setPhase('reveal'), HOLD_MS),
      setTimeout(() => setPhase('collapse'), HOLD_MS + REVEAL_MS),
      setTimeout(() => setPhase('done'), HOLD_MS + REVEAL_MS + COLLAPSE_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced, typingDone]);

  /** Medida tirada na revelacao: ali as caudas ainda estao inteiras e opacas. */
  useLayoutEffect(() => {
    if (reduced || phase !== 'reveal' || widths) return;
    setWidths(SEGMENTS.map((_, i) => (isInitial(i) ? 0 : tailRefs.current[i]?.offsetWidth ?? 0)));
  }, [reduced, phase, widths]);

  const collapsed = phase === 'collapse' || phase === 'done';
  const settled = phase === 'done';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // Sem movimento reduzido a marca entra com um respiro. Com ele, o chip ja
      // nasce pronto: nao faz sentido atrasar em 0,3s um estado que existe
      // justamente para nao ter transicao nenhuma.
      transition={reduced ? { duration: 0 } : { delay: 0.3 }}
      className="hidden md:block fixed top-6 left-6 z-30 pointer-events-none"
    >
      <div className="glass-chip flex items-center gap-3 px-4 py-2 rounded-full">
        {/* O ponto assenta por ultimo. O espaco dele fica reservado desde o
            inicio para o chip nao dar um pulo de layout no fim. */}
        <motion.div
          animate={{ scale: settled ? 1 : 0 }}
          transition={{ duration: SETTLE_MS / 1000, ease: EASE }}
          className="w-2 h-2 shrink-0 rounded-full bg-accent animate-pulse"
        />

        {/* A leitura assistiva nunca ve a sopa de letras: le a marca por extenso,
            uma vez, desde o primeiro frame. */}
        <span className="sr-only">RIA — Revolução da Inteligência Artificial</span>

        <motion.span
          aria-hidden="true"
          animate={{ letterSpacing: settled ? '0.35em' : '0.08em' }}
          transition={{ duration: COLLAPSE_MS / 1000, ease: EASE }}
          className="text-slate-900 text-[11px] font-black leading-none whitespace-pre"
        >
          {SEGMENTS.map((seg, i) => {
            const text = seg.slice(0, Math.max(0, Math.min(seg.length, typed - OFFSETS[i])));

            // Iniciais e caudas usam as MESMAS classes de caixa. Um
            // inline-block com overflow:hidden alinha pela borda inferior, nao
            // pela linha de base: misturar os dois modos desalinharia o R do
            // resto da frase durante o colapso.
            const box = 'inline-block overflow-hidden whitespace-pre align-top';

            if (isInitial(i)) {
              return <span key={i} className={box}>{text}</span>;
            }

            const w = widths?.[i];
            return (
              <motion.span
                key={i}
                ref={(el) => { tailRefs.current[i] = el; }}
                className={box}
                animate={
                  collapsed
                    ? { width: 0, opacity: 0 }
                    : w !== undefined
                      ? { width: w, opacity: 0.28 }
                      : {}
                }
                transition={{
                  duration: (collapsed ? COLLAPSE_MS : REVEAL_MS) / 1000,
                  ease: EASE,
                }}
              >
                {text}
              </motion.span>
            );
          })}
        </motion.span>
      </div>
    </motion.div>
  );
}
