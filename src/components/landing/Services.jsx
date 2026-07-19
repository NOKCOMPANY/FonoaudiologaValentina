import { WavyBorderTop } from '../ui/WavyBorder'
import { useScrollReveal } from '../../lib/useScrollReveal'

const services = [
  {
    emoji: '📚',
    title: 'Taller Educativo',
    description:
      'Sesiones estructuradas de 3 horas para potenciar el desarrollo integral de tu hijo/a a través de actividades y juegos personalizados según su edad, necesidades e intereses.',
    badges: ['Incluye materiales', 'Informe escrito', '3 horas'],
    ideal: 'Ideal para estimulación temprana',
    prices: { weekday: '$37.500', weekend: 'A consultar' },
    bg: 'bg-orange',
    glow: 'rgba(249,115,22,0.4)',
    photo: 'taller.jpg',
    photoAlt: 'Sesión de taller educativo con materiales didácticos',
  },
  {
    emoji: '🧸',
    title: 'Babysitter Fonoaudiológico',
    description:
      'Cuidado y acompañamiento seguro respetando los ritmos, intereses y rutinas de tu hijo/a. Con actividades de estimulación integradas a la rutina diaria.',
    badges: ['Mínimo 1 hora', 'A domicilio', 'Pago por hora'],
    ideal: 'Ideal para cuidado con intención terapéutica',
    prices: { weekday: '$10.000/hr · $12.500/hr +20:00', weekend: 'A consultar' },
    bg: 'bg-teal',
    glow: 'rgba(6,182,212,0.4)',
    photo: 'babysitter.jpg',
    photoAlt: 'Sesión de babysitter fonoaudiológico',
  },
  {
    emoji: '🗣️',
    title: 'Terapia Fonoaudiológica',
    description:
      'Evaluación y tratamiento personalizado del lenguaje, habla y comunicación. Sesiones diseñadas para acompañar a cada niño/a según sus necesidades específicas.',
    badges: ['Evaluación inicial', 'Plan personalizado', 'Seguimiento'],
    ideal: 'Ideal para dificultades de lenguaje y habla',
    prices: { weekday: 'A consultar', weekend: 'A consultar' },
    bg: 'bg-purple',
    glow: 'rgba(124,58,237,0.4)',
    photo: 'terapia.jpg',
    photoAlt: 'Sesión de terapia fonoaudiológica',
  },
]

function PriceRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-white/20 last:border-0">
      <span className="text-sm font-body text-white/80">{label}</span>
      <span className="text-sm font-bold font-body text-white">{value}</span>
    </div>
  )
}

function ServiceCard({ service, delay }) {
  const [ref, visible] = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`service-card ${service.bg} rounded-3xl shadow-xl flex flex-col overflow-hidden transition-all duration-500 ${
        visible ? 'animate-fade-up opacity-100' : 'opacity-0 translate-y-5'
      }`}
      style={{
        animationDelay: delay,
        boxShadow: visible ? `0 8px 32px ${service.glow}, 0 2px 8px rgba(0,0,0,0.15)` : undefined,
      }}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}images/${service.photo}`}
          alt={service.photoAlt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20" />
        <span className="absolute top-3 left-3 text-4xl drop-shadow">{service.emoji}</span>
        {/* Glow overlay en hover */}
        <div
          className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-300"
          style={{ background: `radial-gradient(circle at center, ${service.glow} 0%, transparent 70%)` }}
        />
      </div>

      <div className="p-6 relative flex flex-col gap-4">
        {/* Orbs decorativos dentro de la card */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 right-2 w-8 h-8 bg-white/5 rounded-full" />

        <div className="relative">
          <h3 className="font-heading text-white text-2xl">{service.title}</h3>
          <p className="font-body text-white/90 text-sm mt-1 leading-relaxed">{service.description}</p>
          <p className="font-body text-white/70 text-xs mt-3 italic">{service.ideal}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {service.badges.map((b) => (
              <span key={b} className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                {b}
              </span>
            ))}
          </div>

          <div className="mt-4 bg-black/20 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/70 text-xs font-bold uppercase tracking-wide mb-2">Tarifa</p>
            <PriceRow label="Lunes – Viernes" value={service.prices.weekday} />
            <PriceRow label="Sábado – Domingo" value={service.prices.weekend} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function Services() {
  return (
    <section className="relative bg-purple pb-0 overflow-hidden">
      {/* Orbs decorativos en la sección púrpura */}
      <div
        className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none animate-drift-slower"
        style={{ background: 'rgba(255,255,255,0.04)', filter: 'blur(40px)', animationDelay: '1s' }}
      />
      <div
        className="absolute bottom-20 right-0 w-96 h-96 rounded-full pointer-events-none animate-drift-slow"
        style={{ background: 'rgba(6,182,212,0.08)', filter: 'blur(50px)', animationDelay: '5s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none animate-drift"
        style={{ background: 'rgba(255,255,255,0.03)', filter: 'blur(30px)', animationDelay: '3s' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-heading text-4xl text-white">Mis Servicios</h2>
          <p className="font-body text-purple-light mt-2">
            Todos los servicios son <strong className="text-white">a domicilio</strong>, adaptados a cada niño/a
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <ServiceCard key={s.title} service={s} delay={`${i * 0.15}s`} />
          ))}
        </div>

        <p className="text-center text-purple-light/60 text-xs mt-6 font-body">
          * Precios con IVA incluido · Tarifas fines de semana y terapia a coordinar directamente
        </p>
      </div>

      <WavyBorderTop fill="#FFF8F0" />
    </section>
  )
}
