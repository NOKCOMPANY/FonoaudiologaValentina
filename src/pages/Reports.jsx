import { Link } from 'react-router-dom'
import { MonthlyReport } from '../components/reports/MonthlyReport'
import { TokenRefreshBanner } from '../components/ui/TokenRefreshBanner'

export default function Reports() {
  return (
    <div className="min-h-screen bg-cream font-body">
      <div className="bg-purple text-white px-4 py-4 flex items-center gap-3">
        <Link to="/admin" className="text-white/80 hover:text-white text-sm">← Volver</Link>
        <h1 className="font-heading text-xl">Reportes Mensuales</h1>
      </div>
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <TokenRefreshBanner />
      </div>
      <MonthlyReport />
    </div>
  )
}
