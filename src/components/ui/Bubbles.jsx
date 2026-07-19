const BUBBLES = [
  { size: 80,  color: 'bg-purple/10 border-purple/10',  top: '10%',  left: '5%',   anim: 'animate-float',        delay: '0s'   },
  { size: 50,  color: 'bg-teal/10 border-teal/10',      top: '30%',  right: '8%',  anim: 'animate-float-slow',   delay: '2s'   },
  { size: 120, color: 'bg-pink/8 border-pink/10',       top: '62%',  left: '2%',   anim: 'animate-float-slower', delay: '4s'   },
  { size: 40,  color: 'bg-orange/10 border-orange/10',  top: '18%',  left: '42%',  anim: 'animate-float',        delay: '1s'   },
  { size: 90,  color: 'bg-purple/8 border-purple/10',   bottom: '18%',right: '5%', anim: 'animate-float-slow',   delay: '3s'   },
  { size: 60,  color: 'bg-teal/8 border-teal/10',       bottom: '8%',left: '28%',  anim: 'animate-float-slower', delay: '5s'   },
  { size: 35,  color: 'bg-pink/10 border-pink/10',      top: '50%',  right: '24%', anim: 'animate-float',        delay: '2.5s' },
]

export function Bubbles() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className={`absolute rounded-full border ${b.color} ${b.anim}`}
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  )
}
