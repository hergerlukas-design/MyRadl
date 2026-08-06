import { registerSW } from 'virtual:pwa-register'

// Zentrale Verwaltung der Service-Worker-Registrierung, damit sowohl der
// Update-Banner als auch der manuelle „Aktualisieren"-Button in den
// Einstellungen denselben Zustand teilen.

type UpdateFn = (reloadPage?: boolean) => Promise<void>

let updateSW: UpdateFn | null = null
let needRefresh = false
const listeners = new Set<(value: boolean) => void>()

function emit() {
  for (const l of listeners) l(needRefresh)
}

/** Einmalig beim App-Start aufrufen. */
export function initPWA() {
  updateSW = registerSW({
    onNeedRefresh() {
      needRefresh = true
      emit()
    },
    onOfflineReady() {},
  })

  // Beim Zurückkehren zur App sowie stündlich im Hintergrund nach Updates
  // suchen (ohne Reload) – findet sich eins, erscheint der Banner.
  const check = () => {
    updateSW?.().catch(() => {})
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
  window.setInterval(check, 60 * 60 * 1000)
}

/** Abonniert Änderungen am „Update verfügbar"-Zustand. Liefert Unsubscribe. */
export function subscribeNeedRefresh(cb: (value: boolean) => void) {
  listeners.add(cb)
  cb(needRefresh)
  return () => {
    listeners.delete(cb)
  }
}

export function getNeedRefresh() {
  return needRefresh
}

/** Wartendes Update anwenden und die App neu laden. */
export async function applyUpdate() {
  if (updateSW) await updateSW(true)
  else window.location.reload()
}

/**
 * Manuell nach einem Update suchen. Liefert true, wenn eines bereitsteht.
 * Der Banner erscheint dann ohnehin über das Abo.
 */
export async function checkForUpdate(): Promise<boolean> {
  try {
    await updateSW?.()
  } catch {
    /* Netzwerkfehler ignorieren – Nutzer kann erneut versuchen. */
  }
  // onNeedRefresh feuert asynchron; kurz warten, damit der Status stimmt.
  await new Promise((r) => setTimeout(r, 400))
  return needRefresh
}
