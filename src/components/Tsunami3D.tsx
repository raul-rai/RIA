import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

function ParticleOcean() {
  const pointsRef = useRef<THREE.Points>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const targetScroll = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      targetScroll.current = Math.min(1, Math.max(0, window.scrollY / (maxScroll || 1)));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 120x120 = 14,400 data nodes. Extremely dense, tech-heavy look.
  const { positions, basePositions, geometry } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(160, 160, 120, 120);
    const positions = geom.attributes.position.array as Float32Array;
    const basePositions = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i++) {
        basePositions[i] = positions[i];
    }
    return { positions, basePositions, geometry: geom };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    setScrollProgress(prev => {
        const diff = targetScroll.current - prev;
        return prev + diff * 0.05; 
    });
    
    const count = positions.length / 3;
    for (let i = 0; i < count; i++) {
        const x = basePositions[i * 3];
        const y = basePositions[i * 3 + 1];
        
        // Micro-fluctuations of the data points
        const noiseX = Math.sin(x * 0.2 + time * 0.8);
        const noiseY = Math.cos(y * 0.2 + time * 0.8);
        let zPos = (noiseX + noiseY) * 1.5;
        
        // --- TSUNAMI PHYSICS ---
        const tsunamiPeak = -100 + (scrollProgress * 150); 
        const distToPeak = y - tsunamiPeak;
        
        if (distToPeak > -40 && distToPeak < 40) {
            let heightAmplitude = 0;
            if (distToPeak > 0) {
                heightAmplitude = Math.cos((distToPeak / 40) * (Math.PI / 2));
            } else {
                heightAmplitude = Math.cos((distToPeak / -40) * (Math.PI / 2));
                heightAmplitude = Math.pow(heightAmplitude, 1.5); 
            }
            
            // Towering height as scroll reaches bottom
            const maxZ = 5 + (scrollProgress * 65); 
            
            // Chaotic data peaks
            const crestNoise = (Math.sin(x * 0.4 + time * 3) + Math.cos(y * 0.3 - time * 2)) * 4;
            
            zPos -= heightAmplitude * maxZ; 
            
            // Points break apart slightly at the absolute peak, simulating "digital foam"
            if (heightAmplitude > 0.8) {
                zPos -= crestNoise * (heightAmplitude - 0.8) * 8;
                positions[i * 3] = x + (Math.sin(time * 5 + y) * (heightAmplitude - 0.8) * 2);
            } else {
                positions[i * 3] = x; // Reset X for non-peak
            }
        } else {
            positions[i * 3] = x; // Reset X
        }
        
        const edgeDamp = Math.max(0, 1 - Math.abs(x) / 80);
        positions[i * 3 + 2] = zPos * edgeDamp;
    }
    
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group rotation={[-Math.PI / 2 + 0.1, 0, 0]} position={[0, -5, -40]}>
      {/* 1. The glowing data nodes (Points) */}
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial 
          size={0.25} 
          color="#00E5FF" 
          transparent={true} 
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* 2. The underlying neural wireframe */}
      <mesh ref={wireframeRef} geometry={geometry}>
        <meshBasicMaterial 
          color="#00838F" 
          wireframe={true} 
          transparent={true} 
          opacity={0.06} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function Tsunami3D() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas 
        camera={{ position: [0, 2, 0], fov: 65, near: 0.1, far: 200 }} 
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
      >
        {/* The fog hides the distant grid, fading it into the "Deep Sky" */}
        <fog attach="fog" args={['#010205', 10, 70]} />
        <ParticleOcean />
      </Canvas>
      
      {/* 
        SKY VS OCEAN CONTRAST LAYER 
        The top is pure black (giving the "Sky" contrast).
        The bottom is completely transparent to let the Neon Neon particles shine at 100% brightness.
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#010205] via-transparent to-transparent pointer-events-none z-10" />
    </div>
  );
}
