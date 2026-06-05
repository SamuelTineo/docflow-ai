import { useState, useCallback, useEffect } from 'react'
import FileDropzone from '../components/FileDropzone'
import { analyzeDocument, generateQuiz } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useAssistant } from '../contexts/AssistantContext'

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

export default function Analyzer() {
  const { t } = useLanguage()
  const { updateContext } = useAssistant()
  const [file, setFile] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => { updateContext({ activeModule: 'analyze' }) }, [updateContext])

  const [summaryStatus, setSummaryStatus] = useState('idle')
  const [summaryProgress, setSummaryProgress] = useState(0)
  const [summaryResult, setSummaryResult] = useState(null)
  const [summaryError, setSummaryError] = useState(null)

  const [quizStatus, setQuizStatus] = useState('idle')
  const [quizProgress, setQuizProgress] = useState(0)
  const [quizResult, setQuizResult] = useState(null)
  const [quizError, setQuizError] = useState(null)
  const [revealed, setRevealed] = useState({})
  const [numQuestions, setNumQuestions] = useState(5)

  const handleFile = useCallback(f => {
    setFile(f)
    setSummaryResult(null); setSummaryError(null); setSummaryStatus('idle'); setSummaryProgress(0)
    setQuizResult(null); setQuizError(null); setQuizStatus('idle'); setQuizProgress(0)
    setRevealed({})
    updateContext({ documentName: f?.name || null, moduleOutput: null })
  }, [updateContext])

  const reset = () => handleFile(null)

  const handleAnalyze = async () => {
    setSummaryStatus('loading'); setSummaryProgress(5); setSummaryError(null)
    try {
      setSummaryProgress(15)
      const data = await analyzeDocument(file, p => setSummaryProgress(p))
      setSummaryResult(data)
      setSummaryStatus('done')
      updateContext({ moduleOutput: data })
    } catch (e) {
      setSummaryError(e.response?.data?.detail || t('analyze_err'))
      setSummaryStatus('error')
    }
  }

  const handleQuiz = async () => {
    setQuizStatus('loading'); setQuizProgress(5); setQuizError(null); setRevealed({})
    try {
      setQuizProgress(15)
      const data = await generateQuiz(file, numQuestions, p => setQuizProgress(p))
      setQuizResult(data)
      setQuizStatus('done')
    } catch (e) {
      setQuizError(e.response?.data?.detail || t('quiz_err'))
      setQuizStatus('error')
    }
  }

  const toggleReveal = i => setRevealed(r => ({ ...r, [i]: !r[i] }))

  const summarySteps = t('analyze_steps')
  const quizSteps = t('quiz_steps')
  const summaryStepIdx = summaryProgress < 20 ? 0 : summaryProgress < 60 ? 1 : summaryProgress < 95 ? 2 : 3
  const quizStepIdx = quizProgress < 20 ? 0 : quizProgress < 60 ? 1 : quizProgress < 95 ? 2 : 3

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{t('doc_intel_title')}</h2>
        <p className="text-slate-300 mt-1">{t('doc_intel_subtitle')}</p>
      </div>

      <div className="space-y-5">
        <FileDropzone onFile={handleFile} accept={ACCEPT} label={t('drop_label_analyze')} />

        {file && (
          <>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={reset} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-gray-200 -mx-0">
              {[['summary', t('tab_summary')], ['quiz', t('tab_quiz')]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Summary tab */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                {summaryStatus !== 'done' && (
                  <button
                    onClick={handleAnalyze}
                    disabled={summaryStatus === 'loading'}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {summaryStatus === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {summarySteps[summaryStepIdx]}
                      </span>
                    ) : t('analyze_btn')}
                  </button>
                )}

                {summaryError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{summaryError}</div>
                )}

                {summaryStatus === 'done' && summaryResult && <AnalysisResult data={summaryResult} />}
              </div>
            )}

            {/* Quiz tab */}
            {activeTab === 'quiz' && (
              <div className="space-y-4">
                {quizStatus !== 'done' && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 shrink-0">{t('quiz_num_label')}</span>
                    <div className="flex gap-1">
                      {[3, 5, 7, 10].map(n => (
                        <button
                          key={n}
                          onClick={() => setNumQuestions(n)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                            numQuestions === n
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-200 text-gray-500 hover:border-blue-400'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quizStatus !== 'done' && (
                  <button
                    onClick={handleQuiz}
                    disabled={quizStatus === 'loading'}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {quizStatus === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {quizSteps[quizStepIdx]}
                      </span>
                    ) : t('quiz_btn')}
                  </button>
                )}

                {quizError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{quizError}</div>
                )}

                {quizStatus === 'done' && quizResult && (
                  <div className="space-y-3">
                    {quizResult.questions?.length > 0 ? (
                      quizResult.questions.map((q, i) => (
                        <QuizCard
                          key={i}
                          index={i}
                          question={q.question}
                          answer={q.answer}
                          revealed={!!revealed[i]}
                          onToggle={() => toggleReveal(i)}
                          t={t}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">{t('quiz_empty')}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <QuizCopyButton questions={quizResult.questions} filename={file?.name} t={t} />
                      <button
                        onClick={() => downloadQuizTxt(quizResult.questions, file?.name)}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        {t('quiz_download')}
                      </button>
                      <button
                        onClick={handleQuiz}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        {t('quiz_regenerate')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatQuizText(questions, filename) {
  const header = `Quiz${filename ? ` — ${filename}` : ''}\nGenerado con DocFlow AI\n\n`
  return header + questions.map((q, i) => `${i + 1}. ${q.question}\n   → ${q.answer}`).join('\n\n')
}

function downloadQuizTxt(questions, filename) {
  const text = formatQuizText(questions, filename)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `quiz_${filename?.replace(/\.[^.]+$/, '') || 'document'}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function QuizCopyButton({ questions, filename, t }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(formatQuizText(questions, filename))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className={`flex-1 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
        copied ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}
    >
      {copied ? t('quiz_copied') : t('quiz_copy')}
    </button>
  )
}

function QuizCard({ index, question, answer, revealed, onToggle, t }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4 bg-white">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <p className="text-sm font-medium text-gray-800 leading-relaxed">{question}</p>
        </div>
        <button
          onClick={onToggle}
          className="mt-2 ml-9 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {revealed ? t('quiz_hide') : t('quiz_reveal')}
        </button>
      </div>
      {revealed && (
        <div className="px-4 pb-4 pl-[52px]">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">{answer}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisResult({ data }) {
  const { t } = useLanguage()
  const { analysis, metadata } = data

  return (
    <div className="space-y-4 pt-2">
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

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('analyze_summary')}</p>
        <p className="text-gray-800 text-sm leading-relaxed">{analysis.summary}</p>
      </div>

      <EntityGrid entities={analysis.key_entities} />

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
