import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

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
