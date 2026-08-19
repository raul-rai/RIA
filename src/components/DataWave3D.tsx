import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';
import {
  resolveDpr, TIERS, downgrade, pickInitialTier, createFpsMeter, prefersReducedMotion,
  type QualityTier,
} from '../lib/canvas-quality';
import {
  resolveWaveCamera, surfaceY, projectPoint, quadDepthAlpha, underwaterStops, SPACING,
} from '../lib/wave-scene';

interface DataWave3DProps {
  /** Progresso 0 → 1. MotionValue para nao disparar re-render a cada frame. */
  progress: MotionValue<number>;
}

export default function DataWave3D({ progress }: DataWave3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.style.background =
        'radial-gradient(120% 80% at 50% 118%, rgba(0,180,216,0.12) 0%, rgba(0,180,216,0.02) 45%, transparent 72%)';
      return;
    }

    let width = window.innerWidth;
    let height = window.innerHeight;

    /**
     * O tamanho de exibicao fica com o CSS (w-full h-full sobre um container
     * fixed inset-0). Aqui so o buffer de desenho e ajustado. Antes o tamanho
     * vinha de style.width/height inline, o que travava o canvas na altura
     * medida no momento do resize — quando a barra de URL do celular recolhia,
     * sobrava uma faixa branca no rodape ate o proximo resize.
     */
    const applySize = () => {
      const dpr = resolveDpr(window.devicePixelRatio);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    applySize();

    let time = 0;

    const reduced = prefersReducedMotion();

    let tier: QualityTier = reduced
      ? 'low'
      : pickInitialTier({
          cores: navigator.hardwareConcurrency ?? 4,
          width: window.innerWidth,
        });

    let cols = TIERS[tier].cols;
    let rows = TIERS[tier].rows;
    let fillQuads = TIERS[tier].fill;

    // Smooth internal scroll progress (lerps toward waveProgressRef)
    let currentScroll = 0;

    let points: { x: number; y: number; z: number; px: number; py: number; scale: number }[] = [];

    const buildPoints = () => {
      cols = TIERS[tier].cols;
      rows = TIERS[tier].rows;
      fillQuads = TIERS[tier].fill;
      points = [];
      for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
          points.push({
            x: (x - cols / 2) * SPACING,
            z: z * SPACING,
            y: 0,
            px: 0, py: 0, scale: 0,
          });
        }
      }
    };

    buildPoints();

    const fps = createFpsMeter(60);
    let badWindows = 0;

    let frameId: number;

    const render = () => {
      // Smooth lerp toward target progress
      const target = progress.get();
      // 0.09 alcanca o scroll em ~1s. Mais lento que isso e a agua continua
      // deslizando sobre o conteudo depois que o leitor ja chegou no capitulo.
      currentScroll += reduced ? target - currentScroll : (target - currentScroll) * 0.09;

      ctx.clearRect(0, 0, width, height);

      if (!reduced) {
        time += 0.012 + currentScroll * 0.008;
      }

      const camera = resolveWaveCamera(currentScroll);

      /**
       * A agua vista por dentro, pintada antes da malha.
       *
       * Este bloco e o que garante que a ultima dobra nunca volte ao branco: a
       * cobertura do fundo deixa de depender de a malha estar enquadrada. Sem
       * ele, assim que a crista passava pela camera nao sobrava nenhum
       * quadrilatero dentro do viewport, e a dobra de conversao — o agente e a
       * agenda — aparecia sobre branco puro.
       */
      const stops = underwaterStops(camera.submersion);
      if (stops) {
        const water = ctx.createLinearGradient(0, 0, 0, height);
        for (const s of stops) water.addColorStop(s.offset, s.color);
        ctx.fillStyle = water;
        ctx.fillRect(0, 0, width, height);
      }

      // 1. Update point positions
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.y = surfaceY(p.x, p.z, camera, time);
        const projected = projectPoint(p.x, p.y, p.z, camera, width, height);
        p.scale = projected.scale;
        p.px = projected.px;
        p.py = projected.py;
      }

      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';

      // 2. Draw back to front
      for (let z = rows - 2; z >= 0; z--) {
        for (let x = 0; x < cols - 1; x++) {
          const idx = z * cols + x;
          const p = points[idx];
          const pRight = points[idx + 1];
          const pBottom = points[idx + cols];
          const pBottomRight = points[idx + cols + 1];

          if (p.scale < 0 || p.z < camera.cameraZ) continue;

          const depthAlpha = quadDepthAlpha(p.z, camera, rows);
          if (depthAlpha <= 0) continue;

          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(pRight.px, pRight.py);
          ctx.lineTo(pBottomRight.px, pBottomRight.py);
          ctx.lineTo(pBottom.px, pBottom.py);
          ctx.closePath();

          const normalizedY = Math.min(1, Math.max(0, (-p.y - 40) / 650));

          if (fillQuads) {
            // Onda 3D em tom Azul Oceano com gradiente azul cobalto -> azul real
            const fillR = Math.floor(12 + normalizedY * 30);
            const fillG = Math.floor(74 + normalizedY * 80);
            const fillB = Math.floor(110 + normalizedY * 110);
            const fillAlpha = Math.min(0.85, depthAlpha);

            ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillAlpha})`;
            ctx.fill();
          }

          // Linhas da malha em Ciano / Azul Elétrico brilhante. Submersa, a
          // superficie e vista de baixo contra a luz: o arame clareia para
          // continuar legivel sobre o azul escuro da agua.
          const lift = camera.submersion * 60;
          const lineR = Math.floor(56 + normalizedY * 40 + lift);
          const lineG = Math.floor(189 + normalizedY * 40 + lift * 0.4);
          const lineB = 248;
          const lineAlpha = Math.min(0.95, depthAlpha);

          ctx.lineWidth = 1.2;
          ctx.strokeStyle = `rgba(${lineR}, ${lineG}, ${lineB}, ${lineAlpha})`;
          ctx.stroke();
        }
      }

      const avg = fps.tick(performance.now());
      if (avg !== null) {
        if (avg < 45 && tier !== 'low') {
          badWindows++;
          if (badWindows >= 2) {
            tier = downgrade(tier);
            buildPoints();
            badWindows = 0;
          }
        } else {
          badWindows = 0;
        }
      }

      if (!reduced && running) {
        frameId = requestAnimationFrame(render);
      }
    };

    let running = true;

    const start = () => {
      if (!running) {
        running = true;
        frameId = requestAnimationFrame(render);
      }
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    if (!reduced) {
      frameId = requestAnimationFrame(render);
    } else {
      render();
    }

    /**
     * No celular a barra de URL entra e sai sozinha durante a rolagem, e cada
     * entrada dispara um `resize` com ate ~120px de diferenca de altura. Como
     * `applySize` reatribui canvas.width, o navegador descarta o bitmap e
     * realoca — a onda pisca a cada mudanca de direcao do dedo, exatamente
     * quando o usuario esta lendo. Largura muda so em rotacao de verdade; a
     * altura so vale redesenho quando a diferenca e maior que a barra.
     */
    const URL_BAR_TOLERANCE = 140;

    const handleResize = () => {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      const widthChanged = nextWidth !== width;
      const heightJumped = Math.abs(nextHeight - height) > URL_BAR_TOLERANCE;
      if (!widthChanged && !heightJumped) return;
      applySize();
    };

    window.addEventListener('resize', handleResize);

    const unsubscribe = reduced ? progress.on('change', () => render()) : undefined;

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', handleResize);
      unsubscribe?.();
    };
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
      />
    </div>
  );
}
