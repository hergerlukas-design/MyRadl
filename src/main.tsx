import { StrictMode, useState, useCallback, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from '@/hooks/useAuth'
import App from './App'
import UpdateBanner from './components/UpdateBanner'
import './index.css'

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
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true)
      },
      onOfflineReady() {},
    })
    setUpdateSW(() => update)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        update(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  const handleUpdate = useCallback(() => {
    updateSW?.(true).then(() => window.location.reload())
  }, [updateSW])

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
