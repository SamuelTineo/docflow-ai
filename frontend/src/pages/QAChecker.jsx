import { useState, useCallback, useEffect } from 'react'
import FileDropzone from '../components/FileDropzone'
import { qaCheckDocument } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useAssistant } from '../contexts/AssistantContext'

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

const SEVERITY_STYLE = {
  critical:   { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
  warning:    { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  suggestion: { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
}

const CATEGORY_LABELS = {
  placeholder:     'Campo sin completar',
  grammar:         'Gramática / Ortografía',
  inconsistency:   'Inconsistencia',
  missing_section: 'Sección faltante',
  formatting:      'Formato',
  other:           'Otro',
}

const STEPS = ['Cargando archivo...', 'Extrayendo contenido...', 'Analizando calidad...', 'Listo']

export default function QAChecker() {
  const { t } = useLanguage()
  const { updateContext } = useAssistant()
  const [file, setFile] = useState(null)

  useEffect(() => { updateContext({ activeModule: 'qa' }) }, [updateContext])
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const stepIndex = progress < 20 ? 0 : progress < 60 ? 1 : progress < 95 ? 2 : 3
  const STEPS = t('qa_steps')

  const handleFile = useCallback(f => {
    setFile(f); setResult(null); setError(null); setStatus('idle'); setProgress(0)
    updateContext({ documentName: f?.name || null, moduleOutput: null })
  }, [updateContext])

  const handleCheck = async () => {
    setStatus('loading'); setProgress(5); setError(null)
    try {
      setProgress(15)
      const data = await qaCheckDocument(file, p => setProgress(p))
      setResult(data)
      setStatus('done')
      updateContext({ moduleOutput: data.report })
    } catch (e) {
      setError(e.response?.data?.detail || t('qa_err'))
      setStatus('error')
    }
  }

  const reset = () => {
    setFile(null); setResult(null); setError(null); setStatus('idle'); setProgress(0)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{t('qa_title')}</h2>
        <p className="text-slate-300 mt-1">{t('qa_subtitle')}</p>
      </div>

      <div className="space-y-5">
        <FileDropzone onFile={handleFile} accept={ACCEPT} label={t('drop_label_qa')} />

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
            onClick={handleCheck}
            disabled={status === 'loading'}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {STEPS[stepIndex]}
              </span>
            ) : t('qa_btn')}
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {status === 'done' && result && <QAReport data={result} />}
      </div>
    </div>
  )
}

function QAReport({ data }) {
  const { t } = useLanguage()
  const { report } = data
  const issues = report.issues || []
  const criticalCount  = issues.filter(i => i.severity === 'critical').length
  const warningCount   = issues.filter(i => i.severity === 'warning').length
  const suggestionCount= issues.filter(i => i.severity === 'suggestion').length

  const scoreColor = report.overall_score >= 80
    ? 'text-green-600' : report.overall_score >= 50
    ? 'text-yellow-600' : 'text-red-600'

  const scoreRingColor = report.overall_score >= 80
    ? 'stroke-green-500' : report.overall_score >= 50
    ? 'stroke-yellow-500' : 'stroke-red-500'

  const circumference = 2 * Math.PI * 36
  const offset = circumference - (report.overall_score / 100) * circumference

  return (
    <div className="space-y-4 pt-2">
      {/* Score + counters */}
      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="7" />
            <circle cx="40" cy="40" r="36" fill="none" className={scoreRingColor}
              strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${scoreColor}`}>{report.overall_score}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-sm text-gray-700">{report.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {criticalCount   > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{criticalCount} crítico{criticalCount > 1 ? 's' : ''}</span>}
            {warningCount    > 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">{warningCount} advertencia{warningCount > 1 ? 's' : ''}</span>}
            {suggestionCount > 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{suggestionCount} sugerencia{suggestionCount > 1 ? 's' : ''}</span>}
            {issues.length === 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{t('qa_no_issues')}</span>}
          </div>
        </div>
      </div>

      {/* Issues list */}
      {issues.length > 0 && (
        <div className="space-y-2">
          {['critical', 'warning', 'suggestion'].map(sev =>
            issues.filter(i => i.severity === sev).map((issue, idx) => (
              <IssueCard key={`${sev}-${idx}`} issue={issue} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function IssueCard({ issue }) {
  const { t } = useLanguage()
  const s = SEVERITY_STYLE[issue.severity] || SEVERITY_STYLE.suggestion
  const label = issue.severity === 'critical' ? t('sev_critical') : issue.severity === 'warning' ? t('sev_warning') : t('sev_suggestion')
  return (
    <div className={`p-3 rounded-lg border ${s.border} ${s.bg}`}>
      <div className="flex items-start gap-2">
        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className={`text-xs font-semibold ${s.text}`}>{label}</span>
            <span className="text-xs text-gray-500">{CATEGORY_LABELS[issue.category] || issue.category}</span>
          </div>
          <p className="text-sm text-gray-800">{issue.description}</p>
          {issue.location && (
            <p className="text-xs text-gray-400 mt-0.5">{issue.location}</p>
          )}
        </div>
      </div>
    </div>
  )
}
