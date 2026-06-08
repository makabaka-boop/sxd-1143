import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import Overview from '@/pages/Overview'
import Manage from '@/pages/Manage'
import Borrow from '@/pages/Borrow'
import Audit from '@/pages/Audit'
import InventoryCheckPage from '@/pages/InventoryCheck'
import Replenish from '@/pages/Replenish'
import { useAppStore } from '@/stores/useAppStore'
import type { Role } from '@/types'

const roleRoutes: Record<string, Role[]> = {
  '/manage': ['admin'],
  '/borrow': ['admin', 'user'],
  '/audit': ['admin', 'auditor'],
  '/inventory-check': ['admin', 'auditor'],
  '/replenish': ['admin', 'user'],
}

function ProtectedRoute({ path, children }: { path: string; children: React.ReactNode }) {
  const currentRole = useAppStore((s) => s.currentRole)
  const allowedRoles = roleRoutes[path]

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppContent() {
  const loadData = useAppStore((s) => s.loadData)

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/manage" element={<ProtectedRoute path="/manage"><Manage /></ProtectedRoute>} />
        <Route path="/borrow" element={<ProtectedRoute path="/borrow"><Borrow /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute path="/audit"><Audit /></ProtectedRoute>} />
        <Route path="/inventory-check" element={<ProtectedRoute path="/inventory-check"><InventoryCheckPage /></ProtectedRoute>} />
        <Route path="/replenish" element={<ProtectedRoute path="/replenish"><Replenish /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
