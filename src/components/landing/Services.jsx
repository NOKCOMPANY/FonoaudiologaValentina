import { WavyBorderTop } from '../ui/WavyBorder'

const services = [
  {
    emoji: '📚',
    title: 'Taller Educativo',
    description:
      'Sesiones estructuradas de 3 horas para potenciar el desarrollo integral de tu hijo/a a través de actividades y juegos personalizados según su edad, necesidades e intereses.',
    badges: ['Incluye materiales', 'Informe escrito', '3 horas'],
    ideal: 'Ideal para estimulación temprana',
    prices: {
      weekday: '$37.500',
      weekend: 'A consultar',
    },
    bg: 'bg-orange',
    badgeBg: 'bg-orange/20 text-orange-800',
    border: 'border-orange/30',
    textLight: 'text-orange-50',
  },
  {
    emoji: '🧸',
    title: 'Babysitter Fonoaudiológico',
    description:
      'Cuidado y acompañamiento seguro respetando los ritmos, intereses y rutinas de tu hijo/a. Con actividades de estimulación integradas a la rutina diaria.',
    badges: ['Mínimo 1 hora', 'A domicilio', 'Pago por hora'],
    ideal: 'Ideal para cuidado con intención terapéutica',
    prices: {
      weekday: '$10.000/hr · $12.500/hr +20:00',
      weekend: 'A consultar',
    },
    bg: 'bg-teal',
    badgeBg: 'bg-teal/20 text-teal-800',
    border: 'border-teal/30',
    textLight: 'text-teal-50',
  },
  {
    emoji: '🗣️',
    title: 'Terapia Fonoaudiológica',
    description:
      'Evaluación y tratamiento personalizado del lenguaje, habla y comunicación. Sesiones diseñadas para acompañar a cada niño/a según sus necesidades específicas.',
    badges: ['Evaluación inicial', 'Plan personalizado', 'Seguimiento'],
    ideal: 'Ideal para dificultades de lenguaje y habla',
    prices: {
      weekday: 'A consultar',
      weekend: 'A consultar',
    },
    bg: 'bg-purple',
    badgeBg: 'bg-purple/20 text-purple-800',
    border: 'border-purple/30',
    textLight: 'text-purple-50',
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

function ServiceCard({ service }) {
  return (
    <div className={`${service.bg} rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />

      <div className="relative">
        <span className="text-5xl">{service.emoji}</span>
        <h3 className="font-heading text-white text-2xl mt-2">{service.title}</h3>
        <p className="font-body text-white/90 text-sm mt-1 leading-relaxed">{service.description}</p>

        <p className="font-body text-white/70 text-xs mt-3 italic">{service.ideal}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {service.badges.map((b) => (
            <span key={b} className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              {b}
            </span>
          ))}
        </div>

        {/* Price table */}
        <div className="mt-4 bg-black/20 rounded-2xl p-4">
          <p className="text-white/70 text-xs font-bold uppercase tracking-wide mb-2">Tarifa</p>
          <PriceRow label="Lunes – Viernes" value={service.prices.weekday} />
          <PriceRow label="Sábado – Domingo" value={service.prices.weekend} />
        </div>
      </div>
    </div>
  )
}

export function Services() {
  return (
    <section className="bg-purple pb-0">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-heading text-4xl text-white">Mis Servicios</h2>
          <p className="font-body text-purple-light mt-2">
            Todos los servicios son <strong className="text-white">a domicilio</strong>, adaptados a cada niño/a
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s) => (
            <ServiceCard key={s.title} service={s} />
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
