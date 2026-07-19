import { Navbar } from '../components/ui/Navbar'
import { Hero } from '../components/landing/Hero'
import { Services } from '../components/landing/Services'
import { Contact } from '../components/landing/Contact'

export default function Home() {
  return (
    <main>
      <Navbar />
      <div className="pt-14">
        <Hero />
        <Services />
        <Contact />
      </div>
    </main>
  )
}
