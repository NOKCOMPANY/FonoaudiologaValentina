import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

import Home         from './pages/Home'
import Availability from './pages/Availability'
import Login        from './pages/Login'
import Admin        from './pages/Admin'
import Reports      from './pages/Reports'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/disponibilidad" element={<Availability />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/admin"          element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/admin/reportes" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
