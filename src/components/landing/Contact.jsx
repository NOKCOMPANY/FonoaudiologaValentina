export function Contact() {
  return (
    <section className="bg-cream py-16 px-6">
      <div className="max-w-xl mx-auto text-center">
        <span className="text-5xl">💬</span>
        <h2 className="font-heading text-4xl text-purple mt-3">¡Contáctame!</h2>
        <p className="font-body text-gray-600 mt-3">
          ¿Tienes dudas o quieres agendar? Escríbeme directamente, respondo rápido.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <a
            href="https://wa.me/56962275500"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform hover:scale-105 text-lg"
          >
            <span>💬</span> +56 9 6227 5500
          </a>
          <a
            href="mailto:Valentinapauroca0@gmail.com"
            className="flex items-center justify-center gap-2 bg-purple hover:bg-purple-dark text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform hover:scale-105 text-lg"
          >
            <span>✉️</span> Email
          </a>
        </div>

        <p className="font-body text-gray-400 text-sm mt-6">Valentinapauroca0@gmail.com</p>
      </div>
    </section>
  )
}
