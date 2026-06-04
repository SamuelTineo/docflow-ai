import { useState, useCallback } from 'react'
import FileDropzone from '../components/FileDropzone'
import { translateDocument } from '../services/api'

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'ja', label: '日本語',      flag: '🇯🇵' },
]

const STEPS = ['Cargando archivo...', 'Extrayendo contenido...', 'Traduciendo con IA...', 'Generando documento...']

const OUTPUT_LABEL = { docx: 'DOCX', pptx: 'PPTX', pdf: 'PDF' }

export default function Translator() {
  const [file, setFile]           = useState(null)
  const [targetLang, setTargetLang] = useState('en')
  const [status, setStatus]       = useState('idle')
  const [progress, setProgress]   = useState(0)
  const [download, setDownload]   = useState(null)
  const [error, setError]         = useState(null)

  const stepIndex = progress < 20 ? 0 : progress < 50 ? 1 : progress < 85 ? 2 : 3

  const handleFile = useCallback(f => {
    setFile(f); setDownload(null); setError(null); setStatus('idle'); setProgress(0)
  }, [])

  const handleTranslate = async () => {
    setStatus('loading'); setProgress(5); setError(null); setDownload(null)
    try {
      setProgress(15)
      const { blob, filename } = await translateDocument(file, targetLang, p => setProgress(p))
      setDownload({ blob, filename })
      setStatus('done')
    } catch (e) {
      setError(e.response?.data?.detail || 'Error durante la traducción.')
      setStatus('error')
    }
  }

  const handleDownload = () => {
    if (!download) return
    const url = URL.createObjectURL(download.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = download.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFile(null); setDownload(null); setError(null); setStatus('idle'); setProgress(0)
  }

  const ext = file?.name.split('.').pop()?.toLowerCase()
  const langLabel = LANGUAGES.find(l => l.code === targetLang)?.label

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">AI Translator</h2>
        <p className="text-gray-500 mt-1">Traduce documentos preservando su estructura y formato</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <FileDropzone onFile={handleFile} accept={ACCEPT} label="Subí el documento a traducir" />

        {file && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={reset} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}

        {/* Language selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Idioma destino</p>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setTargetLang(lang.code)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  targetLang === lang.code
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>{lang.flag}</span>
                <span className="truncate">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {file && status !== 'done' && (
          <button
            onClick={handleTranslate}
            disabled={status === 'loading'}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
          >
            {status === 'loading' ? STEPS[stepIndex] : `Traducir a ${langLabel}`}
          </button>
        )}

        {status === 'loading' && (
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 text-right">{progress}%</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {status === 'done' && download && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4">
            <div className="text-3xl">✅</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">Traducción completada</p>
              <p className="text-xs text-green-600 mt-0.5">{download.filename}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
              >
                Descargar
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-lg transition-colors"
              >
                Nuevo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
