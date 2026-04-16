import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

function OceanMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geomRef = useRef<THREE.PlaneGeometry>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Smooth target for interpolation
  const targetScroll = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      targetScroll.current = Math.min(1, Math.max(0, window.scrollY / (maxScroll || 1)));
    };
    // Initialize
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 60x60 is ~3600 vertices. CPU can handle this comfortably at 60fps
  const { positions, basePositions } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(160, 160, 60, 60);
    const positions = geom.attributes.position.array as Float32Array;
    const basePositions = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i++) {
        basePositions[i] = positions[i];
    }
    return { positions, basePositions };
  }, []);

  useFrame((state) => {
    if (!geomRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Smooth scroll interpolation
    setScrollProgress(prev => {
        const diff = targetScroll.current - prev;
        return prev + diff * 0.05; // Lerp factor
    });
    
    const count = positions.length / 3;
    for (let i = 0; i < count; i++) {
        const x = basePositions[i * 3];
        const y = basePositions[i * 3 + 1];
        
        // Base liquid ripple (constant small movement)
        const noiseX = Math.sin(x * 0.15 + time * 0.8);
        const noiseY = Math.cos(y * 0.15 + time * 0.8);
        let zPos = (noiseX + noiseY) * 1.5;
        
        // --- TSUNAMI LOGIC ---
        // The plane stretches from y = -80 (back) to y = 80 (front near camera)
        // When scroll = 0, peak is at -100 (hidden behind fog)
        // When scroll = 1, peak is at +20 (crashing into camera)
        const tsunamiPeak = -100 + (scrollProgress * 130); 
        
        const distToPeak = y - tsunamiPeak;
        
        if (distToPeak > -40 && distToPeak < 40) {
            let heightAmplitude = 0;
            if (distToPeak > 0) {
                // Front phase of the wave
                heightAmplitude = Math.cos((distToPeak / 40) * (Math.PI / 2));
            } else {
                // Back phase of the wave (drop off)
                heightAmplitude = Math.cos((distToPeak / -40) * (Math.PI / 2));
                heightAmplitude = Math.pow(heightAmplitude, 1.5); // Sharper drop
            }
            
            // As we scroll down, the wave becomes much more gigantic
            const maxZ = 5 + (scrollProgress * 45);
            
            // Add chaotic peaks at the crest of the wave
            const crestNoise = (Math.sin(x * 0.3 + time * 2.5) + Math.cos(y * 0.2 - time * 2)) * 3;
            
            // Add the height (negative because we rotated the plane -90deg on X)
            zPos -= heightAmplitude * maxZ; 
            
            // Amplify noise only at the crest tip
            if (heightAmplitude > 0.8) {
                zPos -= crestNoise * (heightAmplitude - 0.8) * 8;
            }
        }
        
        // Dampen edges to avoid plane boundaries showing
        const edgeDamp = Math.max(0, 1 - Math.abs(x) / 80);
        
        positions[i * 3 + 2] = zPos * edgeDamp;
    }
    
    geomRef.current.attributes.position.needsUpdate = true;
    geomRef.current.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2 + 0.1, 0, 0]} position={[0, -5, -40]}>
      <planeGeometry ref={geomRef} args={[160, 160, 60, 60]} />
      <meshStandardMaterial 
        color="#030303" 
        roughness={0.15} 
        metalness={0.8} 
        envMapIntensity={0.5}
      />
    </mesh>
  );
}

export default function Tsunami3D() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas 
        camera={{ position: [0, 2, 0], fov: 65, near: 0.1, far: 200 }} 
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
      >
        <fog attach="fog" args={['#000', 10, 80]} />
        <ambientLight intensity={0.4} />
        
        {/* Cinematic Lighting for Liquid Reflections */}
        {/* Main Cyan top-light */}
        <pointLight position={[0, 15, -10]} intensity={400} color="#00E5FF" distance={80} />
        {/* Deep blue side-light */}
        <pointLight position={[-20, 5, -20]} intensity={350} color="#1d4ed8" distance={100} />
        {/* Electric cyan rim-light */}
        <pointLight position={[20, 10, 5]} intensity={300} color="#00E5FF" distance={80} />
        {/* Subtle white front-light for specularity */}
        <pointLight position={[0, 5, 20]} intensity={200} color="#ffffff" distance={50} />
        
        <OceanMesh />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#000] pointer-events-none z-10" />
    </div>
  );
}
