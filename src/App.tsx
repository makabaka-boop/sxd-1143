import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import Overview from '@/pages/Overview'
import Manage from '@/pages/Manage'
import Borrow from '@/pages/Borrow'
import Audit from '@/pages/Audit'
import { useAppStore } from '@/stores/useAppStore'

function AppContent() {
  const loadData = useAppStore((s) => s.loadData)

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/manage" element={<Manage />} />
        <Route path="/borrow" element={<Borrow />} />
        <Route path="/audit" element={<Audit />} />
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
