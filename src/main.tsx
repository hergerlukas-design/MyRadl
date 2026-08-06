import { StrictMode, useState, useCallback, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import { initPWA, subscribeNeedRefresh, applyUpdate } from '@/lib/pwa'
import App from './App'
import UpdateBanner from './components/UpdateBanner'
import './index.css'

initPWA()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function Root() {
  const [needRefresh, setNeedRefresh] = useState(false)

  useEffect(() => subscribeNeedRefresh(setNeedRefresh), [])

  const handleUpdate = useCallback(() => {
    applyUpdate()
  }, [])

  return (
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {needRefresh && <UpdateBanner onUpdate={handleUpdate} />}
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
