const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadImage(file: File): Promise<{ secure_url: string }> {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  // Use /image/upload for images (required for unsigned preset)
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  const body = await res.json().catch(() => ({})) as { secure_url?: string; error?: { message?: string }; message?: string }

  if (!res.ok) {
    const msg = body?.error?.message ?? body?.message ?? `Upload failed: ${res.status}`
    throw new Error(msg)
  }

  if (!body.secure_url) {
    throw new Error('Upload succeeded but no URL returned')
  }

  return { secure_url: body.secure_url }
}
