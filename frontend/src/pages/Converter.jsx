import { useState, useCallback, useEffect } from 'react'
import FileDropzone from '../components/FileDropzone'
import { convertDocument, getConvertFormats } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useAssistant } from '../contexts/AssistantContext'

const FORMAT_LABELS = {
  pdf:  'PDF',
  docx: 'Word (.docx)',
  png:  'PNG (imágenes)',
  jpg:  'JPG (imágenes)',
}

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

export default function Converter() {
  const { t } = useLanguage()
  const { updateContext } = useAssistant()
  const [file, setFile] = useState(null)

  useEffect(() => { updateContext({ activeModule: 'convert' }) }, [updateContext])
  const [formats, setFormats] = useState([])
  const [target, setTarget] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = useCallback(async f => {
    setFile(f)
    setTarget(null)
    setResult(null)
    setError(null)
    setStatus('idle')
    updateContext({ documentName: f?.name || null, moduleOutput: null })
    const ext = f.name.split('.').pop()
    try {
      const available = await getConvertFormats(ext)
      setFormats(available)
    } catch {
      setFormats([])
      setError(t('convert_err'))
    }
  }, [])

  const handleConvert = async () => {
    setStatus('loading')
    setProgress(0)
    setError(null)
    try {
      const response = await convertDocument(file, target, setProgress)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const disposition = response.headers['content-disposition'] || ''
      const match = disposition.match(/filename="(.+)"/)
      const resultName = match ? match[1] : `converted.${target}`
      setResult({ url, name: resultName })
      setStatus('done')
      updateContext({ moduleOutput: `Converted to ${target?.toUpperCase()}: ${resultName}` })
    } catch (e) {
      setError(e.response?.data?.detail || t('convert_err'))
      setStatus('error')
    }
  }

  const reset = () => {
    setFile(null); setFormats([]); setTarget(null)
    setResult(null); setError(null); setStatus('idle'); setProgress(0)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{t('convert_title')}</h2>
        <p className="text-slate-300 mt-1">{t('convert_subtitle')}</p>
      </div>

      <div className="space-y-5">
        <FileDropzone onFile={handleFile} accept={ACCEPT} label={t('convert_drop')} />

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

        {formats.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{t('convert_to')}</p>
            <div className="flex flex-wrap gap-2">
              {formats.map(f => (
                <button
                  key={f}
                  onClick={() => { setTarget(f); setResult(null); setStatus('idle') }}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                    ${target === f
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400'}`}
                >
                  {FORMAT_LABELS[f] || f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {target && status !== 'done' && (
          <button
            onClick={handleConvert}
            disabled={status === 'loading'}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('convert_loading')}
              </span>
            ) : `${t('convert_btn')} ${FORMAT_LABELS[target] || target}`}
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {status === 'done' && result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-4">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{t('convert_done')}</p>
              <p className="text-xs text-green-600 truncate">{result.name}</p>
            </div>
            <a
              href={result.url}
              download={result.name}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium"
            >
              {t('btn_download')}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
