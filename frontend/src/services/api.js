import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export async function analyzeDocument(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/analyze/', form, {
    onUploadProgress: e => onProgress?.(Math.round((e.loaded / e.total) * 60)),
  })
  onProgress?.(100)
  return data
}

export async function getConvertFormats(ext) {
  const { data } = await api.get(`/convert/formats?file_ext=${ext}`)
  return data.targets
}

export async function convertDocument(file, targetFormat, onProgress) {
  const form = new FormData()
  form.append('file', file)
  form.append('target_format', targetFormat)

  return api.post('/convert/', form, {
    responseType: 'blob',
    onUploadProgress: e => onProgress?.(Math.round((e.loaded / e.total) * 50)),
    onDownloadProgress: e => onProgress?.(50 + Math.round((e.loaded / (e.total || 1)) * 50)),
  })
}
