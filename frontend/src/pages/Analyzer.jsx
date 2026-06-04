import { useState, useCallback } from 'react'
import FileDropzone from '../components/FileDropzone'
import { analyzeDocument } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

const DOC_TYPE_LABELS = {
  contract: 'Contrato', invoice: 'Factura', report: 'Reporte',
  presentation: 'Presentación', letter: 'Carta', form: 'Formulario', other: 'Otro',
}

const STEPS = ['Cargando archivo...', 'Extrayendo contenido...', 'Analizando con IA...', 'Listo']

export default function Analyzer() {
  const { t } = useLanguage()
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const stepIndex = progress < 20 ? 0 : progress < 60 ? 1 : progress < 95 ? 2 : 3
  const STEPS = t('analyze_steps')

  const handleFile = useCallback(f => {
    setFile(f); setResult(null); setError(null); setStatus('idle'); setProgress(0)
  }, [])

  const handleAnalyze = async () => {
    setStatus('loading'); setProgress(5); setError(null)
    try {
      setProgress(15)
      const data = await analyzeDocument(file, p => setProgress(p))
      setResult(data)
      setStatus('done')
    } catch (e) {
      setError(e.response?.data?.detail || t('analyze_err'))
      setStatus('error')
    }
  }

  const reset = () => {
    setFile(null); setResult(null); setError(null); setStatus('idle'); setProgress(0)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">{t('analyze_title')}</h2>
        <p className="text-gray-500 mt-1">{t('analyze_subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <FileDropzone onFile={handleFile} accept={ACCEPT} label={t('drop_label_analyze')} />

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

        {file && status !== 'done' && (
          <button
            onClick={handleAnalyze}
            disabled={status === 'loading'}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
          >
            {status === 'loading' ? STEPS[stepIndex] : t('analyze_btn')}
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

        {status === 'done' && result && <AnalysisResult data={result} />}
      </div>
    </div>
  )
}

function AnalysisResult({ data }) {
  const { t } = useLanguage()
  const { analysis, metadata } = data

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {DOC_TYPE_LABELS[analysis.document_type] || analysis.document_type}
        </span>
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
          {analysis.language?.toUpperCase()}
        </span>
        {metadata?.pages && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            {metadata.pages} {metadata.pages === 1 ? t('doc_pages') : t('doc_pages_pl')}
          </span>
        )}
        {metadata?.is_scanned && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">{t('doc_scanned')}</span>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('analyze_summary')}</p>
        <p className="text-gray-800 text-sm leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Entities */}
      <EntityGrid entities={analysis.key_entities} />

      {/* Structure */}
      {analysis.structure?.sections?.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('analyze_sections')}</p>
          <ul className="space-y-1">
            {analysis.structure.sections.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-gray-400">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function useEntityLabels() {
  const { t } = useLanguage()
  return {
    dates: t('entity_dates'), amounts: t('entity_amounts'), people: t('entity_people'),
    organizations: t('entity_organizations'), locations: t('entity_locations'),
  }
}

function EntityGrid({ entities }) {
  const labels = useEntityLabels()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.entries(entities || {}).map(([key, values]) =>
        values?.length > 0 ? (
          <EntityCard key={key} label={labels[key] || key} items={values} />
        ) : null
      )}
    </div>
  )
}

function EntityCard({ label, items }) {
  return (
    <div className="p-3 border border-gray-200 rounded-lg">
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
