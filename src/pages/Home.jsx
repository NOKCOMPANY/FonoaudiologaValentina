import { Navbar } from '../components/ui/Navbar'
import { Hero } from '../components/landing/Hero'
import { Services } from '../components/landing/Services'
import { Contact } from '../components/landing/Contact'
import { Bubbles } from '../components/ui/Bubbles'

export default function Home() {
  return (
    <main className="relative">
      <Bubbles />
      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />
        <div className="pt-14">
          <Hero />
          <Services />
          <Contact />
        </div>
      </div>
    </main>
  )
}
