import { useState, useRef, useEffect } from 'react'
import { Camera, Copy, Languages, FileSearch, RotateCcw, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { extractFromScan } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useAssistant } from '../contexts/AssistantContext'

export default function Scanner() {
  const { t } = useLanguage()
  const { updateContext } = useAssistant()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [phase, setPhase] = useState('idle')
  const [extractedText, setExtractedText] = useState('')
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState(null)
  const [capturedFile, setCapturedFile] = useState(null)

  useEffect(() => { updateContext({ activeModule: 'scanner' }) }, [updateContext])

  async function processImage(file) {
    setCapturedFile(file)
    setPreview(URL.createObjectURL(file))
    setPhase('processing')
    try {
      const result = await extractFromScan(file)
      setExtractedText(result.text)
      setPhase('done')
      updateContext({ documentName: file.name, moduleOutput: result.text })
    } catch {
      setPhase('error')
    }
  }

  async function handleCapture() {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Camera: Cap, CameraResultType, CameraSource } = await import('@capacitor/camera')
        const photo = await Cap.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        })
        const res = await fetch(photo.dataUrl)
        const blob = await res.blob()
        processImage(new File([blob], 'scan.jpg', { type: 'image/jpeg' }))
      } catch (e) {
        if (e?.message !== 'User cancelled photos app') setPhase('error')
      }
    } else {
      fileRef.current.click()
    }
  }

  function handleFileInput(e) {
    const f = e.target.files?.[0]
    if (f) processImage(f)
    e.target.value = ''
  }

  function copyText() {
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function reset() {
    setPhase('idle')
    setExtractedText('')
    setPreview(null)
    setCapturedFile(null)
    updateContext({ documentName: null, moduleOutput: null })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          {t('scanner_title')}
        </h1>
        <p className="text-slate-300 mt-1">{t('scanner_subtitle')}</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {phase === 'idle' && (
        <button
          onClick={handleCapture}
          className="w-full border border-transparent rounded-2xl p-10 text-center cursor-pointer transition-all group bg-gradient-to-br from-blue-600 to-violet-600 hover:opacity-90"
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-white group-hover:shadow-md group-hover:scale-105 transition-all">
            <Camera size={30} className="text-violet-600" strokeWidth={2} />
          </div>
          <p className="font-semibold text-white text-base mb-1">{t('scanner_hint')}</p>
          <p className="text-sm text-white/70">PNG, JPG — máx. 10 MB</p>
        </button>
      )}

      {phase === 'processing' && (
        <div className="flex flex-col items-center gap-5 py-14">
          {preview && (
            <img src={preview} className="w-32 h-32 rounded-2xl object-cover shadow-lg" alt="scan preview" />
          )}
          <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">{t('scanner_processing')}</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            {preview && (
              <img src={preview} className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-md" alt="scan" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{t('scanner_result_title')}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {extractedText.split(/\s+/).filter(Boolean).length} {t('scanner_words')}
              </p>
            </div>
            <button
              onClick={reset}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors shrink-0"
              title={t('scanner_retry')}
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4 max-h-64 overflow-y-auto">
            <pre className="text-slate-200 text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {extractedText}
            </pre>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={copyText}
              className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 hover:shadow-lg transition-all"
            >
              {copied
                ? <CheckCircle size={24} className="text-green-500" />
                : <Copy size={24} className="text-slate-700" />
              }
              <span className="text-xs font-semibold text-slate-700">
                {copied ? t('scanner_copied') : t('scanner_copy')}
              </span>
            </button>

            <button
              onClick={() => navigate('/translate', { state: { preloadedFile: capturedFile } })}
              className="flex flex-col items-center gap-2 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-4 hover:opacity-90 transition-all"
            >
              <Languages size={24} className="text-white" />
              <span className="text-xs font-semibold text-white">{t('scanner_translate')}</span>
            </button>

            <button
              onClick={() => navigate('/analyze', { state: { preloadedFile: capturedFile } })}
              className="flex flex-col items-center gap-2 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-4 hover:opacity-90 transition-all"
            >
              <FileSearch size={24} className="text-white" />
              <span className="text-xs font-semibold text-white">{t('scanner_analyze')}</span>
            </button>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="flex flex-col items-center gap-4 py-14">
          <p className="text-red-400 text-sm">{t('scanner_err')}</p>
          <button
            onClick={reset}
            className="flex items-center gap-2 text-white text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <RotateCcw size={16} />
            {t('scanner_retry')}
          </button>
        </div>
      )}
    </div>
  )
}
