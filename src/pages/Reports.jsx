import { Link } from 'react-router-dom'
import { MonthlyReport } from '../components/reports/MonthlyReport'
import { TokenRefreshBanner } from '../components/ui/TokenRefreshBanner'

export default function Reports() {
  return (
    <div className="min-h-screen bg-cream font-body">
      <div className="bg-purple text-white px-4 py-4 flex items-center gap-3">
        <Link
          to="/admin"
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition"
        >
          ← Volver
        </Link>
        <h1 className="font-heading text-xl">Reportes Mensuales</h1>
      </div>
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <TokenRefreshBanner />
      </div>
      <MonthlyReport />
    </div>
  )
}
