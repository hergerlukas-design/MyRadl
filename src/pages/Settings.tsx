import { LogOut, Bike as BikeIcon } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'

export default function Settings() {
  const { user, signOut } = useAuth()

  return (
    <Layout title="Mehr">
      <div className="p-4 space-y-5">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4">
          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
            <BikeIcon className="text-primary" size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500">Angemeldet als</p>
            <p className="font-medium text-gray-900 truncate">{user?.email ?? '—'}</p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-red-600 font-semibold py-3 rounded-xl active:scale-[0.98] transition-transform"
        >
          <LogOut size={18} /> Abmelden
        </button>

        <p className="text-center text-xs text-gray-400">MyRadl v{__APP_VERSION__}</p>
      </div>
    </Layout>
  )
}
