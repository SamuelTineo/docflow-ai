import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Analyzer from './pages/Analyzer'
import Translator from './pages/Translator'
import Converter from './pages/Converter'
import QAChecker from './pages/QAChecker'
import Scanner from './pages/Scanner'
import Educator from './pages/Educator'
import { BookOpen, Camera, ChevronDown, FileOutput, FileSearch, FileText, Languages, ShieldCheck, Sparkles } from 'lucide-react'
import { useLanguage } from './contexts/LanguageContext'
import { AssistantProvider } from './contexts/AssistantContext'
import MockBanner from './components/MockBanner'
import GlobalAssistant from './components/GlobalAssistant'

const MODULES = [
  { path: '/analyze',   Icon: FileSearch,  color: 'blue',    labelKey: 'mod_analyze_label',   descKey: 'mod_analyze_desc',   actionKey: 'mod_analyze_action'   },
  { path: '/educator',  Icon: BookOpen,    color: 'rose',    labelKey: 'mod_educator_label',  descKey: 'mod_educator_desc',  actionKey: 'mod_educator_action'  },
  { path: '/translate', Icon: Languages,   color: 'violet',  labelKey: 'mod_translate_label', descKey: 'mod_translate_desc', actionKey: 'mod_translate_action' },
  { path: '/scanner',   Icon: Camera,      color: 'cyan',    labelKey: 'mod_scanner_label',   descKey: 'mod_scanner_desc',   actionKey: 'mod_scanner_action'   },
  { path: '/qa',        Icon: ShieldCheck, color: 'amber',   labelKey: 'mod_qa_label',        descKey: 'mod_qa_desc',        actionKey: 'mod_qa_action'        },
  { path: '/convert',   Icon: FileOutput,  color: 'emerald', labelKey: 'mod_convert_label',   descKey: 'mod_convert_desc',   actionKey: 'mod_convert_action'   },
]

const LANGS = [
  { code: 'es', flag: '🌎', abbr: 'ESP' },
  { code: 'en', flag: '🇺🇸', abbr: 'ENG' },
  { code: 'pt', flag: '🇧🇷', abbr: 'POR' },
]

const COLOR = {
  blue:    { bg: 'bg-blue-50',   border: 'hover:border-blue-400',   btn: 'bg-blue-600 hover:bg-blue-700',     icon: 'bg-blue-100'   },
  violet:  { bg: 'bg-violet-50', border: 'hover:border-violet-400', btn: 'bg-violet-600 hover:bg-violet-700', icon: 'bg-violet-100' },
  emerald: { bg: 'bg-emerald-50',border: 'hover:border-emerald-400',btn: 'bg-emerald-600 hover:bg-emerald-700',icon: 'bg-emerald-100'},
  amber:   { bg: 'bg-amber-50',  border: 'hover:border-amber-400',  btn: 'bg-amber-500 hover:bg-amber-600',   icon: 'bg-amber-100'  },
  cyan:    { bg: 'bg-cyan-50',   border: 'hover:border-cyan-400',   btn: 'bg-cyan-600 hover:bg-cyan-700',     icon: 'bg-cyan-100'   },
  rose:    { bg: 'bg-rose-50',  border: 'hover:border-rose-400',   btn: 'bg-rose-600 hover:bg-rose-700',     icon: 'bg-rose-100'   },
}

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { lang, setLang, t } = useLanguage()
  const [isMock, setIsMock] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  useEffect(() => {
    const handler = e => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || ''
    fetch(`${base}/health`).then(r => r.json()).then(d => setIsMock(!!d.use_mock)).catch(() => {})
  }, [])

  return (
    <AssistantProvider>
    <div className="min-h-screen bg-slate-700">
      {isMock && <MockBanner />}
      <header className="bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center">
          {/* Left: app name */}
          <div className="flex-1">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <FileText size={26} className="text-white" strokeWidth={2.5} />
              <span className="text-xl font-extrabold tracking-tight text-white">DocFlow AI</span>
            </Link>
          </div>

          {/* Center: module nav */}
          {!isHome && (
            <nav className="flex items-center gap-1">
              {MODULES.map(m => (
                <NavLink
                  key={m.path}
                  to={m.path}
                  className={({ isActive }) =>
                    `relative group p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <m.Icon size={18} />
                  <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    {t(m.labelKey)}
                  </span>
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right: language switcher */}
          <div className="flex-1 flex justify-end">
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
            >
              {LANGS.find(l => l.code === lang)?.abbr}
              <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[90px]">
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false) }}
                    className={`w-full flex items-center px-3 py-2 text-xs font-semibold transition-colors ${
                      lang === l.code
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {l.abbr}
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/analyze"   element={<Analyzer />} />
          <Route path="/translate" element={<Translator />} />
          <Route path="/convert"   element={<Converter />} />
          <Route path="/qa"        element={<QAChecker />} />
          <Route path="/scanner"   element={<Scanner />} />
          <Route path="/educator"  element={<Educator />} />
        </Routes>
      </main>
      <GlobalAssistant />
    </div>
    </AssistantProvider>
  )
}

function Home() {
  const { t } = useLanguage()
  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="relative w-16 h-16 shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg">
              <FileText size={36} className="text-white" strokeWidth={1.75} />
            </div>
            <Sparkles size={14} className="text-yellow-300 absolute bottom-2 right-2" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white">DocFlow AI</h1>
        </div>
        <p className="text-lg text-slate-300 whitespace-nowrap">{t('hero_subtitle')}</p>
      </div>

      {/* Module cards — 2-column grid */}
      <div className="grid grid-cols-2 gap-5">
        {MODULES.map((m) => {
          const c = COLOR[m.color]
          return (
            <Link
              key={m.path}
              to={m.path}
              className={`min-h-[220px] bg-white border border-gray-200 rounded-2xl p-6 ${c.border} hover:shadow-lg transition-all flex flex-col justify-between group`}
            >
              <div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-blue-600 to-violet-600 shadow-md">
                  <m.Icon size={36} className="text-white" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight tracking-tight">{t(m.labelKey)}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{t(m.descKey)}</p>
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg text-center mt-4">
                {t(m.actionKey)} →
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
