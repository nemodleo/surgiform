"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, X, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
}

interface ChatUIProps {
  onClose?: () => void
  onMinimize?: (messages: Message[]) => void
  onSendMessage?: (message: string, history: Message[]) => Promise<{
    message: string
    conversation_id: string
    history: Message[]
    updated_consents?: any
    is_content_modified?: boolean
  }>
  conversationId?: string
  initialMessages?: Message[]
  placeholder?: string
  title?: string
}

export function ChatUI({ 
  onClose,
  onMinimize, 
  onSendMessage, 
  conversationId: initialConversationId,
  initialMessages = [],
  placeholder = "메시지를 입력하세요...",
  title = "이음"
}: ChatUIProps) {
  // Initialize with introduction message if no initial messages
  const introMessage: Message = {
    role: "assistant",
    content: "안녕하세요. 의료진과 환자를 신뢰와 책임으로 잇는\nAI 도우미 이음입니다.\n수술 정보 문의부터 동의서 검토·수정까지 도와드릴게요.",
    timestamp: new Date()
  }
  
  const [messages, setMessages] = useState<Message[]>([])
  
  // Initialize messages on mount or when initialMessages change
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages)
    } else {
      setMessages([introMessage])
    }
  }, [initialMessages.length]) // Only depend on length to avoid infinite loop
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(initialConversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading || !onSendMessage) return

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '50px'
    }
    setIsLoading(true)

    try {
      const response = await onSendMessage(userMessage.content, [...messages, userMessage])
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response.message,
        timestamp: new Date()
      }

      const updatedMessages = response.history || [...messages, userMessage, assistantMessage]
      setMessages(updatedMessages)
      setConversationId(response.conversation_id)
      
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "죄송합니다. 메시지 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <style jsx global>{`
        @keyframes chat-bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8,0,1,1);
          }
          50% {
            transform: none;
            animation-timing-function: cubic-bezier(0,0,0.2,1);
          }
        }
        @keyframes chat-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .chat-animate-bounce {
          animation: chat-bounce 1s infinite;
        }
        .chat-animate-pulse {
          animation: chat-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <Card 
        className="flex flex-col overflow-hidden"
        style={{ 
          height: '600px', 
          width: '400px',
          backgroundColor: '#111827', 
          color: 'white',
          borderRadius: '1rem',
          border: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#111827' }}>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-white">
              <svg className="w-2 h-4" viewBox="0 0 8 16" fill="currentColor">
                <circle cx="4" cy="2" r="1.5" />
                <circle cx="4" cy="8" r="1.5" />
                <circle cx="4" cy="14" r="1.5" />
              </svg>
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #c084fc, #a855f7, #f472b6)' }}>
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-medium text-base text-white">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => onMinimize?.(messages)}
              title="최소화 (대화 유지)"
            >
              <svg className="w-5 h-1" viewBox="0 0 20 4" fill="currentColor">
                <rect width="20" height="4" />
              </svg>
            </button>
            {onClose && (
              <button
                onClick={() => {
                  setMessages([introMessage]) // Reset to intro message when closing
                  setConversationId(undefined)
                  onClose()
                }}
                className="text-gray-400 hover:text-white transition-colors"
                title="닫기 (대화 삭제)"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" style={{ backgroundColor: '#111827' }}>
          {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #c084fc, #f472b6)' }}>
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
                {message.role === "assistant" ? (
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: '#d1d5db' }}>
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl px-3 py-2 max-w-[70%] ml-auto" style={{ backgroundColor: 'rgba(168, 85, 247, 0.8)' }}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-white">
                      {message.content}
                    </p>
                  </div>
                )}
              </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center chat-animate-pulse" style={{ background: 'linear-gradient(to bottom right, #c084fc, #f472b6)' }}>
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#1f2937' }}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full chat-animate-bounce" style={{ backgroundColor: '#9ca3af', animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full chat-animate-bounce" style={{ backgroundColor: '#9ca3af', animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full chat-animate-bounce" style={{ backgroundColor: '#9ca3af', animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Positioned at bottom, expands upward */}
        <div className="relative" style={{ backgroundColor: '#111827' }}>
          <div className="p-4">
            <div className="relative flex items-end">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value)
                  // Auto-resize textarea
                  if (inputRef.current) {
                    inputRef.current.style.height = 'auto'
                    inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 300) + 'px' // Max height ~300px (half of 600px window)
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                className="w-full resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all overflow-y-auto"
                style={{ 
                  backgroundColor: '#1f2937', 
                  color: 'white',
                  minHeight: '50px',
                  maxHeight: '300px',
                  padding: '12px 48px 12px 16px',
                  fontSize: '14px',
                  borderRadius: '1rem',
                  height: '50px'
                }}
                disabled={isLoading}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-3 bottom-3 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                style={{ 
                  backgroundColor: !inputMessage.trim() || isLoading ? '#374151' : '#4b5563',
                  opacity: !inputMessage.trim() || isLoading ? 0.5 : 1,
                  cursor: !inputMessage.trim() || isLoading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (inputMessage.trim() && !isLoading) {
                    e.currentTarget.style.backgroundColor = '#6b7280'
                  }
                }}
                onMouseLeave={(e) => {
                  if (inputMessage.trim() && !isLoading) {
                    e.currentTarget.style.backgroundColor = '#4b5563'
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#e5e7eb" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
            
            {/* Footer */}
            <div className="mt-3 text-center">
              <p className="text-xs" style={{ color: '#6b7280' }}>
                AI Agent powered by <span style={{ color: '#9ca3af' }}>SurgiForm</span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}