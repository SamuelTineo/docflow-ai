import { useState, useCallback, useEffect } from 'react'
import { GraduationCap, BookOpen, Download, ExternalLink, RotateCcw, CheckCircle, XCircle, Plus, X } from 'lucide-react'
import FileDropzone from '../components/FileDropzone'
import { generateMCQuiz, generateQuiz } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useAssistant } from '../contexts/AssistantContext'

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

export default function Educator() {
  const { t } = useLanguage()
  const { updateContext } = useAssistant()

  const [tab, setTab] = useState('teacher')
  const [file, setFile] = useState(null)

  // Teacher state
  const [quizType, setQuizType] = useState('mc')
  const [numQuestions, setNumQuestions] = useState(5)
  const [includeKey, setIncludeKey] = useState(true)
  const [teacherStatus, setTeacherStatus] = useState('idle') // idle | loading | building | error
  const [selectedQuestions, setSelectedQuestions] = useState([])  // carrito
  const [availablePool, setAvailablePool] = useState([])           // lote actual
  const [generatingMore, setGeneratingMore] = useState(false)
  const [teacherError, setTeacherError] = useState(null)
  const [gFormsStatus, setGFormsStatus] = useState('idle') // idle | loading | done | error
  const [gFormUrl, setGFormUrl] = useState(null)

  // Student state
  const [studentStatus, setStudentStatus] = useState('idle')
  const [studentQuiz, setStudentQuiz] = useState(null)
  const [studentError, setStudentError] = useState(null)
  const [studentProgress, setStudentProgress] = useState(0)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState({})
  const [showResults, setShowResults] = useState(false)

  useEffect(() => { updateContext({ activeModule: 'educator' }) }, [updateContext])

  const resetTeacher = () => {
    setTeacherStatus('idle'); setTeacherError(null)
    setSelectedQuestions([]); setAvailablePool([]); setGeneratingMore(false)
    setGFormsStatus('idle'); setGFormUrl(null)
  }

  const handleFile = useCallback(f => {
    setFile(f)
    resetTeacher()
    setStudentQuiz(null); setStudentError(null); setStudentStatus('idle'); setStudentProgress(0)
    setCurrentQ(0); setSelected({}); setShowResults(false)
    updateContext({ documentName: f?.name || null, moduleOutput: null })
  }, [updateContext]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = t2 => {
    setTab(t2)
    resetTeacher()
    setStudentQuiz(null); setStudentError(null); setStudentStatus('idle')
    setCurrentQ(0); setSelected({}); setShowResults(false)
  }

  // ── Teacher: generate first pool ──────────────────────────────
  const handleTeacherGenerate = async () => {
    setTeacherStatus('loading'); setTeacherError(null)
    setSelectedQuestions([]); setAvailablePool([])
    try {
      const poolSize = numQuestions * 2
      const result = quizType === 'mc'
        ? await generateMCQuiz(file, poolSize)
        : await generateQuiz(file, poolSize)
      setAvailablePool(result.questions)
      setTeacherStatus('building')
    } catch (e) {
      setTeacherError(e.response?.data?.detail || t('educator_err'))
      setTeacherStatus('error')
    }
  }

  // ── Teacher: generate more ─────────────────────────────────────
  const handleGenerateMore = async () => {
    setGeneratingMore(true)
    try {
      const poolSize = numQuestions * 2
      const result = quizType === 'mc'
        ? await generateMCQuiz(file, poolSize)
        : await generateQuiz(file, poolSize)
      setAvailablePool(prev => [...prev, ...result.questions])
    } catch {
      // silently ignore — user can retry
    } finally {
      setGeneratingMore(false)
    }
  }

  const selectQuestion = q => {
    setAvailablePool(prev => prev.filter(p => p !== q))
    setSelectedQuestions(prev => [...prev, q])
  }

  const removeQuestion = q => {
    setSelectedQuestions(prev => prev.filter(p => p !== q))
  }

  // ── Teacher: download .docx ────────────────────────────────────
  const downloadDocx = async () => {
    const { Document, Packer, Paragraph, TextRun } = await import('docx')
    const qs = selectedQuestions
    const isMC = !!qs[0]?.options
    const baseName = file?.name?.replace(/\.[^.]+$/, '') || 'documento'
    const children = []

    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Quiz — ${baseName}`, bold: true, size: 32 })],
        spacing: { after: 300 },
      })
    )

    qs.forEach((q, i) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${q.question}`, bold: true })],
          spacing: { before: 280, after: 100 },
        })
      )
      if (isMC) {
        Object.entries(q.options).forEach(([k, v]) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${k}) ${v}` })],
              spacing: { before: 60 },
              indent: { left: 360 },
            })
          )
        })
      }
    })

    if (includeKey) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '─'.repeat(40) })],
          spacing: { before: 400, after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: t('educator_include_key').toUpperCase(), bold: true })],
          spacing: { after: 160 },
        })
      )
      qs.forEach((q, i) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true }),
              new TextRun({ text: isMC ? `${q.correct}) ${q.options[q.correct]}` : q.answer }),
            ],
            spacing: { before: 80 },
          })
        )
        if (isMC && q.answer) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: q.answer, italics: true, color: '555555' })],
              indent: { left: 360 },
            })
          )
        }
      })
    }

    const doc = new Document({ sections: [{ children }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiz_${baseName}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Teacher: create Google Form ────────────────────────────────
  const createGoogleForm = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      alert('Configurá VITE_GOOGLE_CLIENT_ID en el .env para usar Google Forms.')
      return
    }
    if (!window.google?.accounts?.oauth2) {
      alert('Google Identity Services no cargó. Recargá la página.')
      return
    }
    setGFormsStatus('loading')
    const isMC = !!selectedQuestions[0]?.options

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/forms.body',
      callback: async (response) => {
        if (response.error) { setGFormsStatus('error'); return }
        try {
          const token = response.access_token
          const title = `Quiz — ${file?.name?.replace(/\.[^.]+$/, '') || 'Documento'}`

          const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ info: { title } }),
          })
          if (!createRes.ok) throw new Error()
          const form = await createRes.json()

          // Step 1: enable quiz mode
          const quizRes = await fetch(
            `https://forms.googleapis.com/v1/forms/${form.formId}:batchUpdate`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requests: [{
                  updateSettings: {
                    settings: { quizSettings: { isQuiz: true } },
                    updateMask: 'quizSettings.isQuiz',
                  },
                }],
              }),
            }
          )
          if (!quizRes.ok) throw new Error()

          // Step 2: add questions with correct answers
          const itemRequests = selectedQuestions.map((q, i) => ({
            createItem: {
              item: {
                title: q.question,
                questionItem: {
                  question: {
                    required: true,
                    ...(isMC
                      ? {
                          grading: {
                            pointValue: 1,
                            correctAnswers: {
                              answers: [{ value: `${q.correct}) ${q.options[q.correct]}` }],
                            },
                          },
                          choiceQuestion: {
                            type: 'RADIO',
                            options: Object.entries(q.options).map(([k, v]) => ({ value: `${k}) ${v}` })),
                            shuffle: false,
                          },
                        }
                      : { textQuestion: { paragraph: true } }),
                  },
                },
              },
              location: { index: i },
            },
          }))

          const batchRes = await fetch(
            `https://forms.googleapis.com/v1/forms/${form.formId}:batchUpdate`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ requests: itemRequests }),
            }
          )
          if (!batchRes.ok) throw new Error()

          const editUrl = `https://docs.google.com/forms/d/${form.formId}/edit`
          setGFormUrl(editUrl)
          setGFormsStatus('done')
          window.open(editUrl, '_blank')
        } catch {
          setGFormsStatus('error')
        }
      },
    })

    tokenClient.requestAccessToken({ prompt: '' })
  }

  // ── Student: generate + quiz flow ─────────────────────────────
  const handleStudentGenerate = async () => {
    setStudentStatus('loading'); setStudentProgress(5); setStudentError(null)
    setCurrentQ(0); setSelected({}); setShowResults(false)
    try {
      const result = await generateMCQuiz(file, numQuestions, p => setStudentProgress(p))
      setStudentQuiz(result)
      setStudentStatus('quiz')
    } catch (e) {
      setStudentError(e.response?.data?.detail || t('educator_err'))
      setStudentStatus('error')
    }
  }

  const selectAnswer = (qIndex, option) => {
    if (selected[qIndex] !== undefined) return
    setSelected(prev => ({ ...prev, [qIndex]: option }))
  }

  const nextQuestion = () => {
    const total = studentQuiz.questions.length
    if (currentQ < total - 1) setCurrentQ(q => q + 1)
    else setShowResults(true)
  }

  const studentReset = () => {
    setStudentStatus('idle'); setStudentQuiz(null)
    setCurrentQ(0); setSelected({}); setShowResults(false)
  }


  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          {t('educator_title')}
        </h1>
        <p className="text-slate-300 mt-1">{t('educator_subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-800 rounded-2xl p-1 w-fit">
        {[
          { key: 'teacher', Icon: GraduationCap, label: t('educator_tab_teacher') },
          { key: 'student', Icon: BookOpen,      label: t('educator_tab_student') },
        ].map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* File upload — shown when idle */}
      {(tab === 'teacher' ? teacherStatus === 'idle' : studentStatus === 'idle') && (
        <FileDropzone
          onFile={handleFile}
          accept={ACCEPT}
          label={tab === 'teacher' ? t('educator_drop_teacher') : t('educator_drop_student')}
        />
      )}

      {/* ── TEACHER FLOW ── */}
      {tab === 'teacher' && (
        <>
          {/* Config */}
          {teacherStatus === 'idle' && file && (
            <div className="space-y-4">
              {/* Quiz type */}
              <div>
                <p className="text-slate-300 text-sm font-medium mb-2">{t('educator_quiz_type')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'mc',   label: t('educator_mc') },
                    { key: 'open', label: t('educator_open') },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setQuizType(opt.key)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        quizType === opt.key
                          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white border-transparent'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Num questions + include key */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm">{t('educator_num_label')}</span>
                  {[3, 5, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setNumQuestions(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                        numQuestions === n
                          ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white'
                          : 'bg-white text-gray-700 hover:border-blue-300 border border-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeKey}
                    onChange={e => setIncludeKey(e.target.checked)}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <span className="text-slate-300 text-sm">{t('educator_include_key')}</span>
                </label>
              </div>

              <button
                onClick={handleTeacherGenerate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold hover:opacity-90 transition-all"
              >
                {t('educator_generate')}
              </button>
            </div>
          )}

          {/* Loading inicial */}
          {teacherStatus === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300 text-sm">{t('educator_steps')[2]}</p>
            </div>
          )}

          {/* Error */}
          {teacherStatus === 'error' && (
            <div className="text-center py-8 space-y-3">
              <p className="text-red-400 text-sm">{teacherError}</p>
              <button onClick={resetTeacher} className="flex items-center gap-2 mx-auto text-white text-sm hover:opacity-80">
                <RotateCcw size={15} /> {t('educator_retry')}
              </button>
            </div>
          )}

          {/* Building: selección de preguntas */}
          {teacherStatus === 'building' && (
            <div className="space-y-4">

              {/* Carrito — seleccionadas */}
              <div className="bg-white rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{t('educator_selected_label')}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{t('educator_basket_hint')}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedQuestions.length >= numQuestions
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {selectedQuestions.length}/{numQuestions}
                  </span>
                </div>

                {selectedQuestions.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4 italic">{t('educator_basket_empty')}</p>
                ) : (
                  <div className="space-y-2">
                    {selectedQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <CheckCircle size={15} className="text-green-500 shrink-0 mt-0.5" />
                        <p className="text-gray-800 text-sm flex-1 leading-snug">{q.question}</p>
                        <button
                          onClick={() => removeQuestion(q)}
                          className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                          title={t('educator_remove_btn')}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={downloadDocx}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                      >
                        <Download size={14} /> {t('educator_docx')}
                      </button>

                      {gFormsStatus === 'done' && gFormUrl ? (
                        <a
                          href={gFormUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                        >
                          <ExternalLink size={14} /> {t('educator_gforms_open')}
                        </a>
                      ) : (
                        <button
                          onClick={gFormsStatus === 'error' ? () => setGFormsStatus('idle') : createGoogleForm}
                          disabled={gFormsStatus === 'loading'}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            gFormsStatus === 'error'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                          }`}
                        >
                          {gFormsStatus === 'loading' ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ExternalLink size={14} />
                          )}
                          {gFormsStatus === 'loading'
                            ? t('educator_gforms_creating')
                            : gFormsStatus === 'error'
                            ? t('educator_gforms_error')
                            : 'Google Forms'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pool disponible */}
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-3">
                  {t('educator_available')}
                  <span className="ml-1 font-normal text-slate-400">({availablePool.length})</span>
                </p>
                {availablePool.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6 italic">{t('educator_pool_empty')}</p>
                ) : (
                  <div className="space-y-3">
                    {availablePool.map((q, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4">
                        <p className="text-gray-900 font-semibold text-sm mb-3 leading-snug">{q.question}</p>
                        {q.options && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {Object.entries(q.options).map(([k, v]) => (
                              <div key={k} className="text-xs px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
                                <span className="font-bold text-blue-600 mr-1">{k})</span>{v}
                              </div>
                            ))}
                          </div>
                        )}
                        {!q.options && (
                          <p className="text-gray-500 text-xs italic mb-3">{q.answer}</p>
                        )}
                        <button
                          onClick={() => selectQuestion(q)}
                          disabled={selectedQuestions.length >= numQuestions}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={12} /> {t('educator_select_btn')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generar más */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateMore}
                  disabled={generatingMore}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {generatingMore
                    ? <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    : <RotateCcw size={15} />
                  }
                  {t('educator_generate_more')}
                </button>
                <button
                  onClick={resetTeacher}
                  className="text-slate-500 hover:text-white text-sm transition-colors"
                >
                  {t('educator_new')}
                </button>
              </div>

            </div>
          )}
        </>
      )}

      {/* ── STUDENT FLOW ── */}
      {tab === 'student' && (
        <>
          {/* Config */}
          {studentStatus === 'idle' && file && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm">{t('educator_num_label')}</span>
                {[3, 5, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumQuestions(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                      numQuestions === n
                        ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white'
                        : 'bg-white text-gray-700 hover:border-blue-300 border border-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={handleStudentGenerate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold hover:opacity-90 transition-all"
              >
                {t('educator_start')}
              </button>
            </div>
          )}

          {/* Loading */}
          {studentStatus === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300 text-sm">{t('educator_steps')[2]}</p>
            </div>
          )}

          {/* Error */}
          {studentStatus === 'error' && (
            <div className="text-center py-8 space-y-3">
              <p className="text-red-400 text-sm">{studentError}</p>
              <button onClick={() => setStudentStatus('idle')} className="flex items-center gap-2 mx-auto text-white text-sm hover:opacity-80">
                <RotateCcw size={15} /> {t('educator_retry')}
              </button>
            </div>
          )}

          {/* Quiz — one question at a time */}
          {studentStatus === 'quiz' && studentQuiz && !showResults && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                    style={{ width: `${((currentQ + 1) / studentQuiz.questions.length) * 100}%` }}
                  />
                </div>
                <span className="text-slate-400 text-xs shrink-0">
                  {currentQ + 1} {t('educator_question_of')} {studentQuiz.questions.length}
                </span>
              </div>

              {/* Question card */}
              {(() => {
                const q = studentQuiz.questions[currentQ]
                const answered = selected[currentQ]
                return (
                  <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
                    <p className="text-white font-semibold">{q.question}</p>
                    <div className="space-y-2">
                      {Object.entries(q.options).map(([k, v]) => {
                        let style = 'bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer'
                        if (answered) {
                          if (k === q.correct) style = 'bg-green-500/25 text-green-300 border border-green-500/40'
                          else if (k === answered) style = 'bg-red-500/25 text-red-300 border border-red-500/40'
                          else style = 'bg-slate-700 text-slate-500 cursor-default'
                        }
                        return (
                          <button
                            key={k}
                            onClick={() => selectAnswer(currentQ, k)}
                            disabled={!!answered}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${style}`}
                          >
                            <span className="font-bold mr-2">{k})</span>{v}
                          </button>
                        )
                      })}
                    </div>

                    {/* Feedback after answering */}
                    {answered && (
                      <div className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${
                        answered === q.correct ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'
                      }`}>
                        {answered === q.correct
                          ? <CheckCircle size={16} className="shrink-0 mt-0.5" />
                          : <XCircle size={16} className="shrink-0 mt-0.5" />
                        }
                        <span>{answered === q.correct ? '¡Correcto!' : `${t('educator_wrong_label')} ${q.correct}) ${q.options[q.correct]}`}</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              <button
                onClick={nextQuestion}
                disabled={selected[currentQ] === undefined}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {currentQ < studentQuiz.questions.length - 1 ? t('educator_next') : t('educator_finish')}
              </button>
            </div>
          )}

          {/* Results screen */}
          {showResults && studentQuiz && (() => {
            const total = studentQuiz.questions.length
            const correct = Object.entries(selected).filter(([i, ans]) => ans === studentQuiz.questions[i].correct).length
            const pct = Math.round((correct / total) * 100)
            const wrong = studentQuiz.questions.filter((_, i) => selected[i] !== _.correct)

            return (
              <div className="space-y-5">
                {/* Score */}
                <div className="bg-slate-800 rounded-2xl p-6 text-center">
                  <div className={`text-6xl font-black mb-1 ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {pct}%
                  </div>
                  <p className="text-slate-300 text-sm">{correct}/{total} {t('educator_results_correct')}</p>
                </div>

                {/* Wrong answers */}
                {wrong.length > 0 && (
                  <div className="space-y-3">
                    {wrong.map((q, i) => {
                      const qi = studentQuiz.questions.indexOf(q)
                      return (
                        <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-red-500/20">
                          <p className="text-slate-200 text-sm font-semibold mb-1">{q.question}</p>
                          <p className="text-slate-400 text-xs">
                            <span className="text-slate-500">Tu respuesta: </span>
                            <span className="text-red-400">{selected[qi]}) {q.options[selected[qi]]}</span>
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            <span className="text-slate-500">{t('educator_wrong_label')} </span>
                            <span className="text-green-400">{q.correct}) {q.options[q.correct]}</span>
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setCurrentQ(0); setSelected({}); setShowResults(false) }}
                    className="flex-1 py-2.5 rounded-xl bg-white text-gray-700 text-sm font-semibold hover:shadow-md transition-all"
                  >
                    {t('educator_retry')}
                  </button>
                  <button
                    onClick={studentReset}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-all"
                  >
                    {t('educator_new')}
                  </button>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
