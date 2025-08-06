import React, { createContext, useContext, useState, useCallback } from 'react'

interface MessageContextType {
  message: string
  messageType: 'success' | 'error' | ''
  showMessage: (text: string, type: 'success' | 'error') => void
  clearMessage: () => void
}

const MessageContext = createContext<MessageContextType | undefined>(undefined)

export const useMessage = () => {
  const context = useContext(MessageContext)
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider')
  }
  return context
}

interface MessageProviderProps {
  children: React.ReactNode
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    // 5秒后自动清除消息
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }, [])

  const clearMessage = useCallback(() => {
    setMessage('')
    setMessageType('')
  }, [])

  return (
    <MessageContext.Provider value={{
      message,
      messageType,
      showMessage,
      clearMessage
    }}>
      {children}
    </MessageContext.Provider>
  )
} 