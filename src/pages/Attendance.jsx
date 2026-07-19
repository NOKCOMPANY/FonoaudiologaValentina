import { Link } from 'react-router-dom'
import { AttendanceTracker } from '../components/attendance/AttendanceTracker'

export default function Attendance() {
  return (
    <div className="min-h-screen bg-cream font-body">
      <div className="bg-purple text-white px-4 py-4 flex items-center gap-3">
        <Link to="/admin" className="text-white/80 hover:text-white text-sm">← Volver</Link>
        <h1 className="font-heading text-xl">Registro de Asistencia</h1>
      </div>
      <AttendanceTracker />
    </div>
  )
}
