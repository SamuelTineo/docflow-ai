import { Routes, Route, NavLink } from 'react-router-dom'
import Analyzer from './pages/Analyzer'
import Translator from './pages/Translator'
import Converter from './pages/Converter'
import QAChecker from './pages/QAChecker'

const modules = [
  { path: '/analyze',  label: 'Document Analyzer', icon: '🔍', desc: 'Extrae y estructura contenido',       ready: true  },
  { path: '/translate',label: 'AI Translator',      icon: '🌐', desc: 'Traduce preservando layout',          ready: true  },
  { path: '/convert',  label: 'Format Converter',   icon: '🔄', desc: 'Convierte entre formatos',            ready: true  },
  { path: '/qa',       label: 'QA Checker',         icon: '✅', desc: 'Detecta inconsistencias y errores',   ready: true  },
]

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <h1 className="text-xl font-bold text-gray-900">DocFlow AI</h1>
          <span className="text-sm text-gray-400 ml-1">Document Processing</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/"         element={<Home modules={modules} />} />
          <Route path="/analyze"  element={<Analyzer />} />
          <Route path="/translate"element={<Translator />} />
          <Route path="/convert"  element={<Converter />} />
          <Route path="/qa"       element={<QAChecker />} />
        </Routes>
      </main>
    </div>
  )
}

function Home({ modules }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">¿Qué querés hacer?</h2>
      <p className="text-gray-500 mb-8">Seleccioná un módulo para comenzar</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modules.map(m => (
          <NavLink
            key={m.path}
            to={m.path}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="text-3xl mb-3">{m.icon}</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{m.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{m.desc}</p>
            {m.ready
              ? <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Disponible</span>
              : <span className="inline-block mt-3 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Próximamente</span>
            }
          </NavLink>
        ))}
      </div>
    </div>
  )
}
