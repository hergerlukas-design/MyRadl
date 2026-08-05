import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Spinner from '@/components/ui/Spinner'
import Login from '@/pages/Login'
import Bikes from '@/pages/Bikes'
import BikeDetail from '@/pages/BikeDetail'
import PartForm from '@/pages/PartForm'
import PartDetail from '@/pages/PartDetail'
import ReplacePart from '@/pages/ReplacePart'
import Search from '@/pages/Search'
import Settings from '@/pages/Settings'

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Navigate to="/bikes" replace /></Protected>} />
      <Route path="/bikes" element={<Protected><Bikes /></Protected>} />
      <Route path="/bikes/:bikeId" element={<Protected><BikeDetail /></Protected>} />
      <Route path="/bikes/:bikeId/parts/new" element={<Protected><PartForm /></Protected>} />
      <Route path="/parts/:partId" element={<Protected><PartDetail /></Protected>} />
      <Route path="/parts/:partId/edit" element={<Protected><PartForm /></Protected>} />
      <Route path="/parts/:partId/replace" element={<Protected><ReplacePart /></Protected>} />
      <Route path="/search" element={<Protected><Search /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/bikes" replace />} />
    </Routes>
  )
}
