import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  // Surfaced early during development if the env is not wired up.
  console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen – siehe .env.example')
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export function getFileUrl(bucket: string, storagePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  return data.publicUrl
}

/**
 * Downscales large images to a sane max edge and re-encodes as JPEG before
 * upload, so phone photos don't blow up Storage. Non-images pass through.
 */
async function compressImage(file: File, maxPx = 1920, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      if (width <= maxPx && height <= maxPx && file.type === 'image/jpeg') {
        resolve(file)
        return
      }

      if (width > height && width > maxPx) {
        height = Math.round((height * maxPx) / width)
        width = maxPx
      } else if (height >= width && height > maxPx) {
        width = Math.round((width * maxPx) / height)
        height = maxPx
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
        },
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }
    img.src = objectUrl
  })
}

const MAX_FILE_BYTES = 10 * 1024 * 1024

export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error('Datei zu groß (max. 10 MB)')
  const toUpload = await compressImage(file)
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, toUpload, { upsert: true, contentType: toUpload.type || 'image/jpeg' })
  if (error) throw error
  return path
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path])
}
