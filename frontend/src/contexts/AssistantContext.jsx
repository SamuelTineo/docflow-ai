import { createContext, useCallback, useContext, useState } from 'react'

const AssistantContext = createContext(null)

export function AssistantProvider({ children }) {
  const [activeModule, setActiveModule] = useState(null)
  const [documentName, setDocumentName] = useState(null)
  const [moduleOutput, setModuleOutput] = useState(null)
  const [history, setHistory] = useState([])

  const updateContext = useCallback(updates => {
    if ('activeModule' in updates) setActiveModule(updates.activeModule)
    if ('documentName' in updates) setDocumentName(updates.documentName)
    if ('moduleOutput' in updates) setModuleOutput(updates.moduleOutput)
  }, [])

  const addMessage = useCallback(msg => setHistory(h => [...h, msg]), [])
  const clearHistory = useCallback(() => setHistory([]), [])

  return (
    <AssistantContext.Provider value={{
      activeModule, documentName, moduleOutput,
      history, updateContext, addMessage, clearHistory,
    }}>
      {children}
    </AssistantContext.Provider>
  )
}

export const useAssistant = () => useContext(AssistantContext)
