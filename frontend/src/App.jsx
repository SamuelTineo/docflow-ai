import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Analyzer from './pages/Analyzer'
import Translator from './pages/Translator'
import Converter from './pages/Converter'
import QAChecker from './pages/QAChecker'
import { useLanguage } from './contexts/LanguageContext'
import MockBanner from './components/MockBanner'

const MODULES = [
  { path: '/analyze',   icon: '🔍', color: 'blue',    labelKey: 'mod_analyze_label',   descKey: 'mod_analyze_desc',   actionKey: 'mod_analyze_action'   },
  { path: '/translate', icon: '🌐', color: 'violet',  labelKey: 'mod_translate_label', descKey: 'mod_translate_desc', actionKey: 'mod_translate_action' },
  { path: '/convert',   icon: '🔄', color: 'emerald', labelKey: 'mod_convert_label',   descKey: 'mod_convert_desc',   actionKey: 'mod_convert_action'   },
  { path: '/qa',        icon: '✅', color: 'amber',   labelKey: 'mod_qa_label',        descKey: 'mod_qa_desc',        actionKey: 'mod_qa_action'        },
]

const LANGS = [
  { code: 'es', flag: '🇦🇷', abbr: 'ESP' },
  { code: 'en', flag: '🇺🇸', abbr: 'ENG' },
  { code: 'pt', flag: '🇧🇷', abbr: 'POR' },
]

const COLOR = {
  blue:    { bg: 'bg-blue-50',   border: 'hover:border-blue-400',   btn: 'bg-blue-600 hover:bg-blue-700',   icon: 'bg-blue-100'   },
  violet:  { bg: 'bg-violet-50', border: 'hover:border-violet-400', btn: 'bg-violet-600 hover:bg-violet-700', icon: 'bg-violet-100' },
  emerald: { bg: 'bg-emerald-50',border: 'hover:border-emerald-400',btn: 'bg-emerald-600 hover:bg-emerald-700',icon: 'bg-emerald-100'},
  amber:   { bg: 'bg-amber-50',  border: 'hover:border-amber-400',  btn: 'bg-amber-500 hover:bg-amber-600',  icon: 'bg-amber-100'  },
}

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { lang, setLang, t } = useLanguage()
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    fetch('/health').then(r => r.json()).then(d => setIsMock(!!d.use_mock)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {isMock && <MockBanner />}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Left: app name */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-2xl">📄</span>
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">DocFlow AI</span>
          </Link>

          {/* Center: module nav */}
          {!isHome && (
            <nav className="flex items-center gap-1">
              {MODULES.map(m => (
                <NavLink
                  key={m.path}
                  to={m.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`
                  }
                >
                  {m.icon} {t(m.labelKey)}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right: language switcher */}
          <div className="flex items-center gap-1 shrink-0">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  lang === l.code
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {l.abbr}
              </button>
            ))}
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
        </Routes>
      </main>
    </div>
  )
}

function Home() {
  const { t } = useLanguage()
  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">📄</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">DocFlow AI</h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">{t('hero_subtitle')}</p>
      </div>

      {/* Module cards — 2×2 grid of squares */}
      <div className="grid grid-cols-2 gap-5">
        {MODULES.map(m => {
          const c = COLOR[m.color]
          return (
            <Link
              key={m.path}
              to={m.path}
              className={`min-h-[260px] bg-white border border-gray-200 rounded-2xl p-6 ${c.border} hover:shadow-lg transition-all flex flex-col justify-between group`}
            >
              <div>
                <div className={`${c.icon} w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4`}>
                  {m.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">{t(m.labelKey)}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{t(m.descKey)}</p>
              </div>
              <span className={`${c.btn} text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors text-center mt-4`}>
                {t(m.actionKey)} →
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
