import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const STORAGE_KEY = 'docflow_api_key'

export function getStoredApiKey() {
  return sessionStorage.getItem(STORAGE_KEY) || ''
}

export default function MockBanner() {
  const { lang } = useLanguage()
  const [key, setKey]         = useState('')
  const [saved, setSaved]     = useState(!!getStoredApiKey())
  const [visible, setVisible] = useState(true)
  const [show, setShow]       = useState(false)
  const [info, setInfo]       = useState(false)
  const infoRef               = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (infoRef.current && !infoRef.current.contains(e.target)) setInfo(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setSaved(!!getStoredApiKey())
  }, [])

  const handleSave = () => {
    const trimmed = key.trim()
    if (!trimmed) return
    sessionStorage.setItem(STORAGE_KEY, trimmed)
    setSaved(true)
    setShow(false)
    setKey('')
  }

  const handleClear = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setSaved(false)
  }

  if (!visible) return null

  const T = COPY[lang] || COPY.es

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
        <span className="text-amber-600 text-sm shrink-0">⚡</span>

        {saved ? (
          <>
            <span className="text-sm text-amber-800 flex-1">{T.active}</span>
            <button onClick={handleClear} className="text-xs text-amber-600 hover:text-amber-800 underline shrink-0">
              {T.remove}
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-amber-800 flex-1">{T.notice}</span>
            <button
              onClick={() => setShow(s => !s)}
              className="text-xs font-medium px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md shrink-0 transition-colors"
            >
              {show ? T.cancel : T.configure}
            </button>
          </>
        )}

        {/* Info button */}
        <div className="relative shrink-0" ref={infoRef}>
          <button
            onClick={() => setInfo(s => !s)}
            className="w-5 h-5 rounded-full border border-amber-400 text-amber-600 hover:bg-amber-100 text-xs font-bold leading-none flex items-center justify-center transition-colors"
            title={T.info_title}
          >
            i
          </button>
          {info && (
            <div className="absolute right-0 top-7 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 text-left">
              <p className="text-xs font-semibold text-gray-700 mb-2">🔒 {T.info_title}</p>
              <ul className="space-y-1.5">
                {T.info_points.map((p, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-green-500 shrink-0">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2">{T.info_tip}</p>
            </div>
          )}
        </div>

        <button onClick={() => setVisible(false)} className="text-amber-400 hover:text-amber-600 shrink-0">✕</button>
      </div>

      {show && !saved && (
        <div className="max-w-5xl mx-auto mt-2 flex gap-2">
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="sk-ant-api03-..."
            className="flex-1 text-sm px-3 py-1.5 border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
          />
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-sm rounded-lg font-medium transition-colors"
          >
            {T.activate}
          </button>
        </div>
      )}
    </div>
  )
}

const COPY = {
  es: {
    notice:    'Modo demo activo — las respuestas de IA son simuladas. Ingresá tu Claude API key para activar la IA en tiempo real.',
    active:    '✅ Claude API activa — las respuestas son reales para esta sesión.',
    configure: 'Configurar API key',
    cancel:    'Cancelar',
    activate:  'Activar',
    remove:    'Quitar key',
    info_title: 'Tu clave es segura',
    info_points: [
      'La key se guarda solo en tu navegador (sessionStorage) y se olvida al cerrar la pestaña.',
      'No se almacena en ningún servidor ni base de datos.',
      'Solo se usa para hacer llamadas directas a la API de Anthropic.',
      'Nunca se comparte con terceros ni se registra en logs.',
    ],
    info_tip: '💡 Tip: podés crear una key con límite de gasto bajo en console.anthropic.com para mayor tranquilidad.',
  },
  en: {
    notice:    'Demo mode active — AI responses are simulated. Enter your Claude API key to enable real AI for this session.',
    active:    '✅ Claude API active — responses are real for this session.',
    configure: 'Configure API key',
    cancel:    'Cancel',
    activate:  'Activate',
    remove:    'Remove key',
    info_title: 'Your key is safe',
    info_points: [
      'The key is stored only in your browser (sessionStorage) and forgotten when you close the tab.',
      'It is never stored on any server or database.',
      'It is only used to make direct calls to the Anthropic API.',
      'It is never shared with third parties or written to any logs.',
    ],
    info_tip: '💡 Tip: you can create a key with a low spending limit at console.anthropic.com for extra peace of mind.',
  },
  pt: {
    notice:    'Modo demo ativo — respostas de IA são simuladas. Insira sua Claude API key para ativar a IA em tempo real.',
    active:    '✅ Claude API ativa — as respostas são reais para esta sessão.',
    configure: 'Configurar API key',
    cancel:    'Cancelar',
    activate:  'Ativar',
    remove:    'Remover key',
    info_title: 'Sua chave está segura',
    info_points: [
      'A key é armazenada apenas no seu navegador (sessionStorage) e esquecida ao fechar a aba.',
      'Não é armazenada em nenhum servidor ou banco de dados.',
      'É usada apenas para chamadas diretas à API da Anthropic.',
      'Nunca é compartilhada com terceiros nem registrada em logs.',
    ],
    info_tip: '💡 Dica: crie uma key com limite de gasto baixo em console.anthropic.com para maior segurança.',
  },
}
