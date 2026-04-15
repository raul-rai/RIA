import { useEffect, useRef } from 'react';

export default function DataWave3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    // OPTIMIZATION: Drastically reduced grid resolution (fewer polygons) 
    // but increased spacing to cover the same physical area. 
    // This reduces CPU/GPU load by ~80% while keeping the same visual scale.
    const cols = 60; 
    const rows = 45; 
    const spacing = 90;
    
    let targetScroll = 0;
    let currentScroll = 0;

    const handleScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      targetScroll = Math.min(1, Math.max(0, window.scrollY / (maxScroll || 1)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
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
      currentScroll += (targetScroll - currentScroll) * 0.05;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      time += 0.015 + (currentScroll * 0.01);

      const focalLength = 800;
      const cameraZ = -400 + (currentScroll * 200); 
      const cameraY = -100 + (currentScroll * 150);

      // The wave starts far away (3500) and moves towards the camera.
      // We adjust the multiplier so that at currentScroll = 1 (bottom of page),
      // the wave is right in front of the camera (e.g., tsunamiZ = 0 or slightly positive),
      // instead of passing far behind it (-1000).
      const tsunamiZ = 3500 - (currentScroll * 3300);
      
      // OPTIMIZATION: Cache half width/height
      const halfW = width / 2;
      const halfH = height / 2 + 150;

      // 1. Update points (Math phase)
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        
        let y = Math.sin(p.x * 0.01 + time) * 15 
              + Math.sin(p.z * 0.02 - time * 0.8) * 15;
        
        const distToTsunami = p.z - tsunamiZ;
        
        if (distToTsunami > -600 && distToTsunami < 1500) {
          let waveHeight = 0;
          if (distToTsunami > 0) {
            waveHeight = Math.cos((distToTsunami / 1500) * (Math.PI / 2));
          } else {
            // OPTIMIZATION: Math.sqrt is faster than Math.pow(..., 0.5)
            waveHeight = Math.sqrt(Math.cos((distToTsunami / -600) * (Math.PI / 2)));
          }

          const maxAmplitude = 400 + (currentScroll * 1200); 
          
          // OPTIMIZATION: x * x is faster than Math.pow(x, 2)
          const edgeRatio = Math.abs(p.x) / 3000;
          const edgeTaper = Math.max(0, 1 - (edgeRatio * edgeRatio));
          
          const currentAmplitude = waveHeight * maxAmplitude * edgeTaper;
          y -= currentAmplitude;

          if (waveHeight > 0.7) {
            const noise = (Math.sin(p.x * 0.05 + time * 5) + Math.cos(p.z * 0.05 - time * 3)) * (40 + currentScroll * 60);
            y -= noise * (waveHeight - 0.7) * 4;
          }
        }

        p.y = y;

        const scale = focalLength / (p.z - cameraZ);
        p.scale = scale;
        p.px = p.x * scale + halfW;
        p.py = (p.y - cameraY) * scale + halfH;
      }

      ctx.lineWidth = 1.5; // Slightly thicker lines for visibility
      ctx.lineJoin = 'round';
      
      // 2. Draw phase (Painter's Algorithm)
      for (let z = rows - 2; z >= 0; z--) {
        for (let x = 0; x < cols - 1; x++) {
          const idx = z * cols + x;
          const p = points[idx];
          const pRight = points[idx + 1];
          const pBottom = points[idx + cols];
          const pBottomRight = points[idx + cols + 1];

          if (p.scale < 0 || p.z < cameraZ) continue;

          let depthAlpha = Math.max(0, 1.4 - ((p.z - cameraZ) / (rows * spacing)));
          
          // Escurecer o fundo (linhas distantes) quando a onda se aproxima
          const distBehindPeak = p.z - tsunamiZ;
          if (distBehindPeak > 0) {
            const fadeOutDist = 3000 - (currentScroll * 2500); 
            depthAlpha *= Math.max(0, 1 - (distBehindPeak / fadeOutDist));
          }

          if (depthAlpha <= 0) continue;
          
          const heightIntensity = Math.min(1, Math.max(0, -p.y / (400 + currentScroll * 1000)));
          
          // More vibrant cyan/blue colors
          const r = Math.floor(0 + heightIntensity * 50); 
          const g = Math.floor(180 + heightIntensity * 75); 
          const b = Math.floor(255); 
          
          const alpha = depthAlpha * (0.35 + heightIntensity * 0.65);
          
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(pRight.px, pRight.py);
          ctx.lineTo(pBottomRight.px, pBottomRight.py);
          ctx.lineTo(pBottom.px, pBottom.py);
          ctx.closePath();

          // Solid fill for occlusion
          ctx.fillStyle = `rgba(3, 3, 3, ${depthAlpha * 0.9})`; 
          ctx.fill();

          // Wireframe stroke
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
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Removed bg-bg-base to allow App-level glows to show through */}
      <canvas ref={canvasRef} className="w-full h-full opacity-100" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-60" />
    </div>
  );
}
