import { useState, useCallback, useEffect } from 'react'
import FileDropzone from '../components/FileDropzone'
import { translateDocument } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useAssistant } from '../contexts/AssistantContext'

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
  const { t } = useLanguage()
  const { updateContext } = useAssistant()
  const [file, setFile]           = useState(null)

  useEffect(() => { updateContext({ activeModule: 'translate' }) }, [updateContext])
  const [targetLang, setTargetLang] = useState('en')
  const [status, setStatus]       = useState('idle')
  const [progress, setProgress]   = useState(0)
  const [download, setDownload]   = useState(null)
  const [error, setError]         = useState(null)

  const stepIndex = progress < 20 ? 0 : progress < 50 ? 1 : progress < 85 ? 2 : 3
  const STEPS = t('translate_steps')

  const handleFile = useCallback(f => {
    setFile(f); setDownload(null); setError(null); setStatus('idle'); setProgress(0)
    updateContext({ documentName: f?.name || null, moduleOutput: null })
  }, [updateContext])

  const handleTranslate = async () => {
    setStatus('loading'); setProgress(5); setError(null); setDownload(null)
    try {
      setProgress(15)
      const { blob, filename } = await translateDocument(file, targetLang, p => setProgress(p))
      setDownload({ blob, filename })
      setStatus('done')
      updateContext({ moduleOutput: `Translated to ${targetLang}: ${filename}` })
    } catch (e) {
      setError(e.response?.data?.detail || t('translate_err'))
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{t('translate_title')}</h2>
        <p className="text-slate-300 mt-1">{t('translate_subtitle')}</p>
      </div>

      <div className="space-y-5">
        <FileDropzone onFile={handleFile} accept={ACCEPT} label={t('drop_label_translate')} />

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
          <p className="text-sm font-medium text-slate-300 mb-2">{t('translate_lang_label')}</p>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setTargetLang(lang.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  targetLang === lang.code
                    ? 'border-transparent bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md'
                    : 'border-white/20 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase px-1 py-0.5 rounded ${
                  targetLang === lang.code ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{lang.code}</span>
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
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {STEPS[stepIndex]}
              </span>
            ) : `${t('translate_btn')} ${langLabel}`}
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {status === 'done' && download && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4">
            <div className="text-3xl">✅</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">{t('translate_done')}</p>
              <p className="text-xs text-green-600 mt-0.5">{download.filename}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
              >
                {t('btn_download')}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-lg transition-colors"
              >
                {t('btn_new')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
