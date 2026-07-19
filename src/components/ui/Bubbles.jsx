/**
 * HeroBubbles — decoración inmersiva con 3 capas de profundidad.
 * Se coloca como position:absolute dentro de la sección Hero
 * (no fixed, para evitar el problema del stacking context).
 *
 * Capa 1 — fondal: blobs enormes y muy difuminados (sensación de profundidad)
 * Capa 2 — media: orbs medianos con leve blur (punto medio)
 * Capa 3 — delantera: partículas pequeñas y nítidas con glow (primer plano)
 */
export function Bubbles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">

      {/* ── Capa 1: fondal — blobs enormes, muy difuminados ──────── */}
      <div
        className="absolute rounded-full animate-drift-slower"
        style={{
          width: 420, height: 420,
          top: '-120px', left: '-80px',
          background: 'rgba(124,58,237,0.13)',
          filter: 'blur(70px)',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute rounded-full animate-drift-slow"
        style={{
          width: 360, height: 360,
          top: '30%', right: '-100px',
          background: 'rgba(6,182,212,0.11)',
          filter: 'blur(60px)',
          animationDelay: '4s',
        }}
      />
      <div
        className="absolute rounded-full animate-drift"
        style={{
          width: 300, height: 300,
          bottom: '-60px', left: '30%',
          background: 'rgba(236,72,153,0.09)',
          filter: 'blur(55px)',
          animationDelay: '8s',
        }}
      />
      <div
        className="absolute rounded-full animate-drift-slower"
        style={{
          width: 250, height: 250,
          top: '50%', left: '-40px',
          background: 'rgba(249,115,22,0.08)',
          filter: 'blur(50px)',
          animationDelay: '2s',
        }}
      />

      {/* ── Capa 2: media — orbs con leve blur ───────────────────── */}
      <div
        className="absolute rounded-full animate-float"
        style={{
          width: 90, height: 90,
          top: '8%', left: '6%',
          background: 'rgba(124,58,237,0.25)',
          border: '1px solid rgba(124,58,237,0.4)',
          filter: 'blur(3px)',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute rounded-full animate-float-slow"
        style={{
          width: 60, height: 60,
          top: '22%', right: '10%',
          background: 'rgba(6,182,212,0.28)',
          border: '1px solid rgba(6,182,212,0.45)',
          filter: 'blur(2px)',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute rounded-full animate-float-slower"
        style={{
          width: 75, height: 75,
          bottom: '20%', left: '12%',
          background: 'rgba(249,115,22,0.25)',
          border: '1px solid rgba(249,115,22,0.4)',
          filter: 'blur(2px)',
          animationDelay: '4s',
        }}
      />
      <div
        className="absolute rounded-full animate-float"
        style={{
          width: 45, height: 45,
          top: '55%', left: '40%',
          background: 'rgba(236,72,153,0.28)',
          border: '1px solid rgba(236,72,153,0.45)',
          filter: 'blur(1.5px)',
          animationDelay: '1.5s',
        }}
      />
      <div
        className="absolute rounded-full animate-float-slow"
        style={{
          width: 110, height: 110,
          bottom: '10%', right: '6%',
          background: 'rgba(124,58,237,0.20)',
          border: '1px solid rgba(124,58,237,0.35)',
          filter: 'blur(3px)',
          animationDelay: '3s',
        }}
      />

      {/* ── Capa 3: delantera — partículas nítidas con glow ──────── */}
      <div
        className="absolute rounded-full animate-glow-pulse"
        style={{
          width: 12, height: 12,
          top: '14%', right: '28%',
          background: 'rgba(124,58,237,0.9)',
          boxShadow: '0 0 16px 4px rgba(124,58,237,0.5)',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute rounded-full animate-glow-pulse"
        style={{
          width: 8, height: 8,
          top: '42%', left: '18%',
          background: 'rgba(6,182,212,0.9)',
          boxShadow: '0 0 12px 3px rgba(6,182,212,0.5)',
          animationDelay: '1s',
        }}
      />
      <div
        className="absolute rounded-full animate-glow-pulse"
        style={{
          width: 10, height: 10,
          bottom: '28%', right: '18%',
          background: 'rgba(249,115,22,0.9)',
          boxShadow: '0 0 14px 3px rgba(249,115,22,0.5)',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute rounded-full animate-glow-pulse"
        style={{
          width: 6, height: 6,
          top: '68%', left: '55%',
          background: 'rgba(236,72,153,0.9)',
          boxShadow: '0 0 10px 3px rgba(236,72,153,0.5)',
          animationDelay: '0.5s',
        }}
      />
      <div
        className="absolute rounded-full animate-glow-pulse"
        style={{
          width: 9, height: 9,
          top: '78%', left: '8%',
          background: 'rgba(124,58,237,0.8)',
          boxShadow: '0 0 12px 3px rgba(124,58,237,0.4)',
          animationDelay: '1.8s',
        }}
      />

    </div>
  )
}
