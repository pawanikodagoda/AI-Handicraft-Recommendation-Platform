const MAX_DIMENSION = 1600
const QUALITY = 0.85

/**
 * Shrinks a photo in the browser before upload.
 *
 * Phone cameras produce 5-15MB files, which PHP rejects outright
 * (upload_max_filesize defaults to 2M) before Laravel can even validate
 * them - the seller just saw their photo silently fail to attach. A
 * 1600px JPEG is far more than a product listing needs and keeps
 * uploads well under any sane server limit.
 */
export async function compressImage(file) {
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // PNGs may be transparent try-on cutouts, so keep them lossless.
  const keepPng = file.type === 'image/png'
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, keepPng ? 'image/png' : 'image/jpeg', keepPng ? undefined : QUALITY)
  )
  if (!blob || blob.size >= file.size) return file

  const name = file.name.replace(/\.[^.]+$/, '') + (keepPng ? '.png' : '.jpg')
  return new File([blob], name, { type: blob.type })
}

export function compressImages(files) {
  return Promise.all(Array.from(files).map(compressImage))
}
