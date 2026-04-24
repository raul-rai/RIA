import { useEffect, useRef } from 'react';

interface DataWave3DProps {
  waveProgress: number; // 0 = far away, 1 = crashed on screen
}

export default function DataWave3D({ waveProgress }: DataWave3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveProgressRef = useRef(waveProgress);

  // Sync prop to ref so the animation loop always reads latest value
  useEffect(() => {
    waveProgressRef.current = waveProgress;
  }, [waveProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let time = 0;
    const cols = 55;
    const rows = 40;
    const spacing = 110;

    // Smooth internal scroll progress (lerps toward waveProgressRef)
    let currentScroll = 0;

    const points: {x: number, y: number, z: number, px: number, py: number, scale: number}[] = [];

    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        points.push({
          x: (x - cols / 2) * spacing,
          z: z * spacing,
          y: 0,
          px: 0, py: 0, scale: 0
        });
      }
    }

    let frameId: number;

    const render = () => {
      // Smooth lerp toward target progress
      currentScroll += (waveProgressRef.current - currentScroll) * 0.04;

      ctx.clearRect(0, 0, width, height);

      time += 0.012 + (currentScroll * 0.008);

      const focalLength = 800;
      const cameraZ = -400 + (currentScroll * 200);
      const cameraY = -150 + (currentScroll * 100);

      const tsunamiZ = 3500 - (currentScroll * 3300);

      const halfW = width / 2;
      const halfH = height * 0.54; 

      // 1. Update point positions
      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Organic liquid movement (V2 math)
        const noiseX = Math.sin(p.x * 0.005 + time * 1.5);
        const noiseZ = Math.cos(p.z * 0.005 - time * 1.2);
        let y = (noiseX + noiseZ) * 20;

        // ─── WAVE MODELING V3 (Curved 'V' Projection) ────────────────────────
        // The peak is no longer a straight line. We add a parabolic delay based on X.
        // Higher X = Higher delay (Peak stays further back).
        const curvature = (p.x * p.x) * 0.0002; // Slightly more pointed
        const curvedTsunamiZ = tsunamiZ + curvature;
        
        const distToTsunami = p.z - curvedTsunamiZ;

        if (distToTsunami > -600 && distToTsunami < 1500) {
          let waveHeight = 0;
          if (distToTsunami > 0) {
            waveHeight = Math.cos((distToTsunami / 1500) * (Math.PI / 2));
          } else {
            waveHeight = Math.sqrt(Math.cos((distToTsunami / -600) * (Math.PI / 2)));
          }

          const maxAmplitude = 400 + (currentScroll * 1400); 

          const edgeRatio = Math.abs(p.x) / 3800;
          const edgeTaper = Math.pow(Math.max(0, 1 - edgeRatio), 1.6);

          const currentAmplitude = waveHeight * maxAmplitude * edgeTaper;
          y -= currentAmplitude;

          // Organic chaotic foam at the crest
          if (waveHeight > 0.7) {
            const crestNoise = (Math.sin(p.x * 0.01 + time * 4) + Math.cos(p.z * 0.01 - time * 3)) * (40 + currentScroll * 60);
            y -= crestNoise * (waveHeight - 0.7) * 4;
          }
        }

        p.y = y;

        const scale = focalLength / (p.z - cameraZ);
        p.scale = scale;
        p.px = p.x * scale + halfW;
        p.py = (p.y - cameraY) * scale + halfH;
      }

      ctx.lineWidth = 1.2;
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

          // Dark blue ocean body fill
          ctx.fillStyle = `rgba(0, 10, 25, ${depthAlpha * 0.98})`;
          ctx.fill();

          // Cyan tech wireframe lines
          const heightIntensity = Math.min(1, Math.max(0, -p.y / (400 + currentScroll * 800)));
          const r = Math.floor(0 + heightIntensity * 100);
          const g = Math.floor(180 + heightIntensity * 75);
          const b = 255;
          const alpha = depthAlpha * (0.3 + heightIntensity * 0.7);

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.stroke();
        }
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{
        maskImage: 'linear-gradient(to bottom, black 80%, transparent 92%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 92%)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}
