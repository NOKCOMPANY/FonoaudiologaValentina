import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PrivateCalendar } from '../components/calendar/PrivateCalendar'

function dateLabel(d) {
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Admin() {
  const { user, signOut } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Top bar */}
      <div className="bg-purple text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Panel Admin</h1>
          <p className="text-purple-light text-xs">{user?.displayName ?? user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/reportes" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full">
            Reportes
          </Link>
          <button onClick={signOut} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full">
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Date picker */}
        <div className="flex items-center gap-3 mb-6">
          <label className="font-bold text-gray-700 text-sm">Fecha:</label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
          />
          <span className="text-gray-500 text-sm capitalize">{dateLabel(selectedDate)}</span>
        </div>

        <h2 className="font-heading text-xl text-gray-700 mb-4">Sesiones del día</h2>
        <PrivateCalendar selectedDate={selectedDate} />
      </div>
    </div>
  )
}
