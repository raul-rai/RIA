import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { AUTHORITIES, type Authority } from '../content/authorities';
import { PROOF_PANELS, type ProofPanel } from '../content/proofPanels';
import { layoutPanels } from '../lib/orbit-wall';
import { useOrbitWall } from '../hooks/useOrbitWall';
import { playerSrc } from '../lib/youtube';

/** Cada slot da parede: um video de autoridade ou um painel de apoio. */
type Slot = { kind: 'video'; authority: Authority } | { kind: 'support'; panel: ProofPanel };

/**
 * Intercala os 3 videos com os paineis de apoio para a parede nao ficar com os
 * videos todos de um lado. Ordem estavel (nao aleatoria) — o SSR e o cliente
 * precisam gerar exatamente a mesma sequencia.
 */
function buildSlots(): Slot[] {
  const videos: Slot[] = AUTHORITIES.map((authority) => ({ kind: 'video', authority }));
  const supports: Slot[] = PROOF_PANELS.map((panel) => ({ kind: 'support', panel }));
  const out: Slot[] = [];
  const max = Math.max(videos.length, supports.length);
  for (let i = 0; i < max; i++) {
    if (videos[i]) out.push(videos[i]);
    if (supports[i]) out.push(supports[i]);
  }
  return out;
}

export default function VideoWall3D() {
  const stageRef = useOrbitWall<HTMLDivElement>();
  const [playing, setPlaying] = useState<string | null>(null);

  const slots = useMemo(buildSlots, []);
  const placements = useMemo(
    () => layoutPanels(slots.length, { arcDeg: 150, radiusPx: 560 }),
    [slots.length],
  );

  return (
    <div ref={stageRef} className="wall-stage" aria-label="Parede de vídeos e provas">
      <div className="wall-rotor">
        <ul className="wall-list">
          {slots.map((slot, i) => {
            const place = placements[i];
            const style = {
              '--panel-rot': `${place.rotateYDeg}deg`,
              '--panel-z': `${place.radiusPx}px`,
            } as React.CSSProperties;

            if (slot.kind === 'video') {
              const a = slot.authority;
              const isPlaying = playing === a.name;
              return (
                <li key={a.name} className="wall-panel wall-video" style={style}>
                  {isPlaying ? (
                    <iframe
                      className="wall-iframe"
                      src={playerSrc(a.videoUrl, a.startTime, a.endTime)}
                      title={`Trecho de ${a.name} no YouTube`}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      className="wall-poster focus-ring-inset"
                      aria-label={`Assistir o trecho de ${a.name}`}
                      onClick={() => setPlaying(a.name)}
                    >
                      <img
                        src={a.thumbnail}
                        loading="lazy"
                        decoding="async"
                        width={640}
                        height={416}
                        alt={a.name}
                        className="wall-poster-img"
                      />
                      <span className="wall-poster-grad" aria-hidden="true" />
                      <span className="wall-poster-meta">
                        <span className="wall-poster-title">{a.title}</span>
                        <span className="wall-poster-name">{a.name}</span>
                      </span>
                      <span className="wall-play" aria-hidden="true">
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      </span>
                    </button>
                  )}
                </li>
              );
            }

            const p = slot.panel;
            return (
              <li key={`support-${i}`} className="wall-panel wall-support" style={style}>
                {p.kind === 'metric' ? (
                  <>
                    <span className="wall-support-value">{p.value}</span>
                    <span className="wall-support-label">{p.label}</span>
                  </>
                ) : (
                  <>
                    <span className="wall-support-value">{p.name}</span>
                    <span className="wall-support-label">{p.note}</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
