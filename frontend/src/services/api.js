import axios from 'axios'
import { getStoredApiKey } from '../components/MockBanner'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

api.interceptors.request.use(config => {
  const key = getStoredApiKey()
  if (key) config.headers['X-Claude-Key'] = key
  return config
})

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

export async function translateDocument(file, targetLang, onProgress) {
  const form = new FormData()
  form.append('file', file)
  form.append('target_lang', targetLang)
  const response = await api.post('/translate/', form, {
    responseType: 'blob',
    onUploadProgress: e => onProgress?.(Math.round((e.loaded / e.total) * 40)),
    onDownloadProgress: e => onProgress?.(40 + Math.round((e.loaded / (e.total || 1)) * 55)),
  })
  onProgress?.(100)
  const disposition = response.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : `translated_${file.name}`
  return { blob: response.data, filename }
}

export async function qaCheckDocument(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/qa/', form, {
    onUploadProgress: e => onProgress?.(Math.round((e.loaded / e.total) * 60)),
  })
  onProgress?.(100)
  return data
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
