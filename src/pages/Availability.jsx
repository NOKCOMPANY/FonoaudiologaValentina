import { Navbar } from '../components/ui/Navbar'
import { PublicAvailability } from '../components/calendar/PublicAvailability'

export default function Availability() {
  return (
    <>
      <Navbar />
      <div className="pt-14">
        <PublicAvailability />
      </div>
    </>
  )
}
