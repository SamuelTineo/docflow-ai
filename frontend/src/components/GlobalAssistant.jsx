import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, MessageCircle, Send, Trash2, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAssistant } from '../contexts/AssistantContext'
import { chatWithAssistant } from '../services/api'

const MODULE_PATHS = {
  analyze: '/analyze', translate: '/translate', convert: '/convert', qa: '/qa',
}

export default function GlobalAssistant() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { activeModule, documentName, moduleOutput, history, addMessage, clearHistory } = useAssistant()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, open, loading])

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    const prevHistory = history
    addMessage({ role: 'user', content: msg })
    setLoading(true)
    try {
      const res = await chatWithAssistant({
        activeModule, documentName, moduleOutput,
        history: prevHistory,
        message: msg,
      })
      addMessage({ role: 'assistant', content: res.answer, suggestedModule: res.suggested_module })
    } catch {
      addMessage({ role: 'assistant', content: t('assistant_error') })
    } finally {
      setLoading(false)
    }
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          open
            ? 'bg-gray-700 hover:bg-gray-800 text-white'
            : 'bg-gradient-to-br from-blue-600 to-violet-600 hover:opacity-90 text-white'
        }`}
        aria-label="AI Assistant"
      >
        {open ? <X size={20} strokeWidth={2.5} /> : <MessageCircle size={22} strokeWidth={2} />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ width: '360px', maxHeight: '500px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-sm text-white flex-1">{t('assistant_title')}</span>
            {documentName && (
              <span className="text-xs text-white/60 truncate max-w-[100px]">{documentName}</span>
            )}
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Limpiar conversación"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[220px]">
            {history.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-6 px-2">{t('assistant_welcome')}</p>
            )}
            {history.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                goToLabel={t('assistant_go_to')}
                onNavigate={mod => { navigate(MODULE_PATHS[mod]); setOpen(false) }}
              />
            ))}
            {loading && (
              <div className="flex gap-1 items-center px-3 py-2.5 bg-gray-100 rounded-2xl rounded-tl-none w-fit ml-8">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={t('assistant_placeholder')}
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                autoFocus
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-3 py-2 bg-gradient-to-br from-blue-600 to-violet-600 hover:opacity-90 disabled:opacity-40 text-white rounded-xl transition-opacity flex items-center justify-center"
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MessageBubble({ msg, goToLabel, onNavigate }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start gap-2'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={13} className="text-white" strokeWidth={2} />
        </div>
      )}
      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-none'
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
        }`}>
          {msg.content}
        </div>
        {msg.suggestedModule && (
          <button
            onClick={() => onNavigate(msg.suggestedModule)}
            className="text-xs text-blue-600 hover:text-violet-600 font-medium px-1 transition-colors"
          >
            {goToLabel} →
          </button>
        )}
      </div>
    </div>
  )
}
