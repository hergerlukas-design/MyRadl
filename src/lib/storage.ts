import { uploadFile, deleteFile, getFileUrl } from './supabase'

// Single public bucket. Paths are namespaced by the owner's user id so the
// Storage RLS policy ("<user_id>/…") only lets a user write into their folder.
export const PHOTO_BUCKET = 'photos'

function ext(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
}

export async function uploadBikePhoto(userId: string, bikeId: string, file: File): Promise<string> {
  const path = `${userId}/bikes/${bikeId}_${Date.now()}.${ext(file)}`
  return uploadFile(PHOTO_BUCKET, path, file)
}

export async function uploadPartPhoto(userId: string, partId: string, file: File): Promise<string> {
  const path = `${userId}/parts/${partId}_${Date.now()}.${ext(file)}`
  return uploadFile(PHOTO_BUCKET, path, file)
}

/** Resolve a stored Storage path to a public URL. Returns null for empty paths. */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return getFileUrl(PHOTO_BUCKET, path)
}

export function deletePhoto(path: string): Promise<void> {
  return deleteFile(PHOTO_BUCKET, path)
}
