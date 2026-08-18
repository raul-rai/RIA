import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';
import {
  resolveDpr, TIERS, downgrade, pickInitialTier, createFpsMeter, prefersReducedMotion,
  type QualityTier,
} from '../lib/canvas-quality';

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

    const spacing = 150; // Adjusted for better perspective at depth

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
            x: (x - cols / 2) * spacing,
            z: z * spacing,
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

      const focalLength = 800;
      const cameraZ = -400 + (currentScroll * 200);
      const cameraY = -320 + (currentScroll * 120);

      // Wave starts at 3600 on fold 0 so the 3D wave is ALREADY right front & center!
      const tsunamiZ = 3600 - (currentScroll * 3400);

      const halfW = width / 2;
      const halfH = height * 0.54; 

      // 1. Update point positions
      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Organic liquid movement
        const noiseX = Math.sin(p.x * 0.005 + time * 1.5);
        const noiseZ = Math.cos(p.z * 0.005 - time * 1.2);
        let y = (noiseX + noiseZ) * 25;

        // ─── WAVE MODELING V3 ────────────────────────
        const curvature = (p.x * p.x) * 0.0002;
        const curvedTsunamiZ = tsunamiZ + curvature;
        
        const distToTsunami = p.z - curvedTsunamiZ;

        if (distToTsunami > -600 && distToTsunami < 1500) {
          let waveHeight = 0;
          if (distToTsunami > 0) {
            waveHeight = Math.cos((distToTsunami / 1500) * (Math.PI / 2));
          } else {
            waveHeight = Math.sqrt(Math.cos((distToTsunami / -600) * (Math.PI / 2)));
          }

          // Initial max amplitude starts at 750 for 3D volume on fold 0, grows as submerged
          const maxAmplitude = 750 + (currentScroll * 1250); 

          const edgeRatio = Math.abs(p.x) / 3800;
          const edgeTaper = Math.pow(Math.max(0, 1 - edgeRatio), 1.6);

          const currentAmplitude = waveHeight * maxAmplitude * edgeTaper;
          y -= currentAmplitude;

          // Organic chaotic foam at the crest
          if (waveHeight > 0.6) {
            const crestNoise = (Math.sin(p.x * 0.01 + time * 4) + Math.cos(p.z * 0.01 - time * 3)) * (50 + currentScroll * 50);
            y -= crestNoise * (waveHeight - 0.6) * 4;
          }
        }

        p.y = y;

        const scale = focalLength / (p.z - cameraZ);
        p.scale = scale;
        p.px = p.x * scale + halfW;
        p.py = (p.y - cameraY) * scale + halfH;
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

          if (p.scale < 0 || p.z < cameraZ) continue;

          let depthAlpha = Math.max(0, 1.2 - ((p.z - cameraZ) / (rows * spacing * 0.8)));

          const distBehindPeak = p.z - tsunamiZ;
          if (distBehindPeak > 0) {
            const fadeOutDist = 2000 - (currentScroll * 1500);
            depthAlpha *= Math.max(0, 1 - (distBehindPeak / fadeOutDist));
          }

          if (depthAlpha <= 0) continue;

          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(pRight.px, pRight.py);
          ctx.lineTo(pBottomRight.px, pBottomRight.py);
          ctx.lineTo(pBottom.px, pBottom.py);
          ctx.closePath();

          const normalizedY = Math.min(1, Math.max(0, (-p.y - 40) / 650));

          if (fillQuads) {
            // Onda opaca em tons de azul (azul cobalto no vale ate azul real eletrico na crista)
            const fillR = Math.floor(10 + normalizedY * 30);
            const fillG = Math.floor(60 + normalizedY * 85);
            const fillB = Math.floor(180 + normalizedY * 70);
            const fillAlpha = Math.min(1.0, depthAlpha);

            ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillAlpha})`;
            ctx.fill();
          }

          // Linhas de grade em azul eletrico / ciano brilhante
          const lineR = Math.floor(40 + normalizedY * 50);
          const lineG = Math.floor(140 + normalizedY * 85);
          const lineB = Math.floor(220 + normalizedY * 35);
          const lineAlpha = Math.min(1.0, depthAlpha);

          ctx.lineWidth = 1.1;
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
