// The static cyberpunk beach diorama — never moves, always watches the wave come in.
export default function CyberpunkScene() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* The panoramic scene image */}
      <img
        src="/cyberpunk_scene.png"
        alt="Cidade cyberpunk observando o mar"
        className="absolute inset-0 w-full h-full object-cover object-bottom opacity-70"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Deep sky overlay — ensures the top is pure darkness matching the wave's background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000408] via-[#000408]/60 to-transparent" style={{height: '55%'}} />

      {/* Subtle scanlines for cyberpunk texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.15) 2px, rgba(0,229,255,0.15) 3px)',
          backgroundSize: '100% 3px'
        }}
      />

      {/* Ground-level neon glow bleeding from city */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#00050A] to-transparent" />
    </div>
  );
}
