import { Suspense, lazy, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import AuthorityAccordion from './AuthorityAccordion';
import AuthorityCard from './AuthorityCard';
import { AUTHORITIES, AUTHORITIES_DISCLAIMER, type Authority } from '../content/authorities';

/**
 * O diálogo de vídeo sai do pacote principal.
 *
 * Pode ser tarde porque ele NÃO existe até alguém clicar em "assistir": ele é o
 * único pedaço grande da página que nenhum visitante vê sem pedir. Enquanto
 * ninguém pede, seu código não desce.
 *
 * A montagem CONDICIONAL abaixo é o que torna isto seguro no prerender, e não é
 * detalhe de estilo. O build gera o HTML com `renderToString`, que é síncrono e
 * não sabe esperar: um componente `lazy` que chegue a renderizar no servidor
 * suspende e derruba o prerender inteiro. Com `{selected && ...}`, e `selected`
 * sempre nulo no servidor, ele nunca chega lá.
 *
 * É também por isso que só ELE saiu. Os seis capítulos são todos renderizados
 * no servidor — é essa renderização que faz o site ser legível por um crawler
 * que não executa JavaScript, que é o produto da Frente 1. Dividir por rota ou
 * por capítulo custaria exatamente aquilo.
 */
const VideoModal = lazy(() => import('./VideoModal'));

export default function SocialProofSection() {
  const [selected, setSelected] = useState<Authority | null>(null);
  // Um aberto por vez: a dobra tem 100svh e tres paineis abertos empurrariam o
  // rodape para fora da tela no celular.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  /**
   * A marcacao e local de proposito, e NAO alimenta o Indice de
   * Vulnerabilidade. O indice mede o que a empresa faz, nunca o que ela
   * concorda — ver o cabecalho de VulnerabilityContext, que removeu o eixo de
   * conscientizacao justamente por isso. Aqui a caixa e um gesto de leitura:
   * marca o que a pessoa ja assimilou, e nao muda nenhuma nota.
   */
  const [awarenessChecks, setAwarenessChecks] = useState<boolean[]>(
    () => AUTHORITIES.map(() => false)
  );
  const toggleAwarenessCheck = (index: number) =>
    setAwarenessChecks((prev) => prev.map((v, i) => (i === index ? !v : v)));

  const vistos = awarenessChecks.filter(Boolean).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16 pointer-events-auto flex flex-col justify-center">
      {/* Header */}
      <div className="mb-6 md:mb-10 text-center">
        <div className="glass-chip glass-amber inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3">
          <ShieldAlert size={14} className="text-amber-600" />
          <span className="text-amber-800 text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            Vozes do mercado
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 mb-2 leading-tight">
          Não é só a <span className="italic font-normal text-slate-500">nossa opinião.</span>
        </h2>
        <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light leading-relaxed">
          Três das vozes mais ouvidas do mercado brasileiro, falando sobre a mesma coisa.
          {vistos > 0 && (
            <span className="block mt-1 text-slate-500 font-mono text-[11px] tracking-wider">
              {vistos} de {AUTHORITIES.length} marcados
            </span>
          )}
        </p>
      </div>

      {/* Mobile: acordeon. Desktop: os tres cartoes lado a lado.
          A troca e por CSS e os dois leem o MESMO vetor de marcacoes, entao
          girar o aparelho no meio da leitura nao perde nada. */}
      <div className="max-w-5xl mx-auto w-full">
        <div className="md:hidden">
          <AuthorityAccordion
            authorities={AUTHORITIES}
            openIndex={openIndex}
            onToggleOpen={(i) => setOpenIndex((prev) => (prev === i ? null : i))}
            checks={awarenessChecks}
            onToggleCheck={toggleAwarenessCheck}
            onPlay={setSelected}
          />
        </div>

        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {AUTHORITIES.map((authority, i) => (
            <AuthorityCard
              key={authority.name}
              authority={authority}
              index={i}
              checked={awarenessChecks[i]}
              onToggle={() => toggleAwarenessCheck(i)}
              onPlay={() => setSelected(authority)}
            />
          ))}
        </div>
      </div>

      {/* A negativa de endosso fica na propria dobra, embaixo dos cartoes, e
          nao num rodape distante: quem le o nome e a fala de uma pessoa real
          precisa ler no mesmo lugar que ela nao tem relacao com a RIA. */}
      <p className="mt-6 md:mt-8 mx-auto max-w-3xl text-center text-[10px] md:text-[11px] text-slate-500 leading-relaxed">
        {AUTHORITIES_DISCLAIMER}
      </p>

      {selected && (
        // fallback null de propósito: o clique abre um diálogo, e um esqueleto
        // piscando por 80ms no lugar dele seria mais ruído que espera.
        <Suspense fallback={null}>
          <VideoModal
            isOpen
            onClose={() => setSelected(null)}
            videoUrl={selected.videoUrl}
            title={selected.name}
            bio={selected.bio}
            startTime={selected.startTime}
            endTime={selected.endTime}
          />
        </Suspense>
      )}
    </div>
  );
}
