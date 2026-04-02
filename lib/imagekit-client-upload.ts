const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

export type ImageKitAuthPayload = {
  token: string
  expire: number
  signature: string
  publicKey: string
  folder?: string
}

export type ImageKitUploadResult = {
  fileId: string
  name: string
  url: string
}

export async function uploadFileToImageKit(
  file: File,
  auth: ImageKitAuthPayload
): Promise<ImageKitUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', file.name)
  formData.append('publicKey', auth.publicKey)
  formData.append('signature', auth.signature)
  formData.append('token', auth.token)
  formData.append('expire', String(auth.expire))
  if (auth.folder) {
    formData.append('folder', auth.folder)
  }

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  })

  const text = await res.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    throw new Error(text || 'Upload failed')
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' &&
      parsed !== null &&
      'message' in parsed &&
      typeof (parsed as { message: unknown }).message === 'string'
        ? (parsed as { message: string }).message
        : text || 'Upload failed'
    throw new Error(msg)
  }

  const obj = parsed as { url?: string; fileId?: string; name?: string }
  if (!obj.url) {
    throw new Error('Upload response missing URL')
  }

  return {
    url: obj.url,
    fileId: obj.fileId ?? '',
    name: obj.name ?? file.name,
  }
}
