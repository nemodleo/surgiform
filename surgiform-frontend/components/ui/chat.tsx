"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { X, Bot, Maximize2, Minimize2 } from "lucide-react"
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
    updated_consents?: unknown
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
  title = "이음"
}: ChatUIProps) {
  // Initialize with introduction message if no initial messages
  const introMessage: Message = {
    role: "assistant",
    content: "안녕하세요. 의료진과 환자를 신뢰와 책임으로 잇는 AI 도우미 이음입니다.\n수술 정보 문의부터 동의서 검토·수정까지 도와드릴게요.",
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
  const [, setConversationId] = useState(initialConversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Drag functionality
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [size, setSize] = useState({ width: 400, height: 600 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null>(null)
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [opacity, setOpacity] = useState({
    top: 60,
    middle: 60,
    bottom: 60
  })
  const chatRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const updateOpacity = (section: 'top' | 'middle' | 'bottom', value: number) => {
    setOpacity(prev => ({
      ...prev,
      [section]: value
    }))
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Drag event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chatRef.current) return

    const rect = chatRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Constrain to viewport
      const maxX = window.innerWidth - size.width
      const maxY = window.innerHeight - size.height

      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      })
    } else if (isResizing && resizeDirection && position) {
      const minWidth = 300
      const minHeight = 400

      let newWidth = size.width
      let newHeight = size.height
      let newX = position.x
      let newY = position.y

      if (resizeDirection.includes('e')) {
        // Right edge resize
        const maxWidth = window.innerWidth - position.x
        newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - position.x))
      }
      if (resizeDirection.includes('w')) {
        // Left edge resize
        const maxX = position.x + size.width - minWidth
        newX = Math.max(0, Math.min(maxX, e.clientX))
        newWidth = position.x + size.width - newX
      }
      if (resizeDirection.includes('s')) {
        // Bottom edge resize
        const maxHeight = window.innerHeight - position.y
        newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - position.y))
      }
      if (resizeDirection.includes('n')) {
        // Top edge resize
        const maxY = position.y + size.height - minHeight
        newY = Math.max(0, Math.min(maxY, e.clientY))
        newHeight = position.y + size.height - newY
      }

      setSize({ width: newWidth, height: newHeight })
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeDirection(null)
  }

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setResizeOffset({
      x: e.clientX - size.width,
      y: e.clientY - size.height
    })
  }

  // Add global mouse events
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      if (isDragging) {
        document.body.style.cursor = 'grabbing'
      } else if (isResizing) {
        const cursorMap = {
          'n': 'ns-resize',
          's': 'ns-resize',
          'e': 'ew-resize',
          'w': 'ew-resize',
          'ne': 'nesw-resize',
          'sw': 'nesw-resize',
          'nw': 'nwse-resize',
          'se': 'nwse-resize'
        }
        document.body.style.cursor = cursorMap[resizeDirection!] || 'default'
      }

      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, isResizing, dragOffset.x, dragOffset.y, resizeDirection, position, size])

  // Initialize position and size on mount
  useEffect(() => {
    const initializeChat = () => {
      // Try to get saved data from localStorage
      const savedData = localStorage.getItem('chatWindowData')
      if (savedData) {
        try {
          const { position: savedPos, size: savedSize } = JSON.parse(savedData)

          // Validate and restore size
          if (savedSize && savedSize.width >= 300 && savedSize.height >= 400) {
            setSize(savedSize)
          }

          // Validate and restore position
          if (savedPos) {
            const maxX = window.innerWidth - (savedSize?.width || size.width)
            const maxY = window.innerHeight - (savedSize?.height || size.height)

            if (savedPos.x >= 0 && savedPos.x <= maxX && savedPos.y >= 0 && savedPos.y <= maxY) {
              setPosition(savedPos)
              return
            }
          }
        } catch (e) {
          console.error('[chat] 저장된 채팅 데이터 파싱 실패:', e)
        }
      }

      // Fallback to default position - align with chat button (bottom: 32px, right: 32px)
      // Chat button is 64px square, so position window so its bottom-right aligns with button's bottom-right
      const chatButtonRight = 32
      const chatButtonBottom = 32
      const chatButtonSize = 64

      const x = Math.max(0, window.innerWidth - chatButtonRight - size.width)
      const y = Math.max(0, window.innerHeight - chatButtonBottom - size.height)

      setPosition({ x, y })
    }

    // Only initialize if position is not set yet
    if (position === null) {
      initializeChat()
    }

    // Update bounds on window resize
    const handleResize = () => {
      if (position) {
        const maxX = window.innerWidth - size.width
        const maxY = window.innerHeight - size.height
        setPosition(prev => prev ? {
          x: Math.max(0, Math.min(maxX, prev.x)),
          y: Math.max(0, Math.min(maxY, prev.y))
        } : prev)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [position, size])

  // Save position and size to localStorage when they change
  useEffect(() => {
    if (position && (position.x !== 0 || position.y !== 0)) {
      const dataToSave = {
        position,
        size
      }
      localStorage.setItem('chatWindowData', JSON.stringify(dataToSave))
    }
  }, [position, size])

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading || !onSendMessage) return

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    // 사용자 메시지를 즉시 추가 (UX 개선)
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage("")
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '50px'
    }
    setIsLoading(true)

    try {
      const response = await onSendMessage(userMessage.content, newMessages)
      
      // 서버 응답을 현재 메시지에 추가 (사용자 메시지는 이미 추가되어 있음)
      const assistantMessage: Message = {
        role: "assistant",
        content: response.message,
        timestamp: new Date()
      }
      setMessages([...newMessages, assistantMessage])
      setConversationId(response.conversation_id)
      
    } catch (error) {
      console.error("[chat] 메시지 전송 오류:", error)
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
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 3px #6b7280;
          margin-top: -4px;
        }
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px #6b7280;
        }
        .slider::-webkit-slider-track {
          background: transparent;
          height: 4px;
          border-radius: 2px;
        }
        .slider::-moz-range-track {
          background: transparent;
          height: 4px;
          border-radius: 2px;
          border: none;
        }
        .slider:hover::-webkit-slider-thumb {
          background: #a855f7;
          transform: scale(1.1);
        }
        .slider:hover::-moz-range-thumb {
          background: #a855f7;
          transform: scale(1.1);
        }
      `}</style>
      <Card
        ref={chatRef}
        className="flex flex-col overflow-hidden relative"
        style={{
          height: isFullscreen ? '100vh' : `${size.height}px`,
          width: isFullscreen ? '100vw' : `${size.width}px`,
          // backgroundColor: 'rgba(17, 24, 39, 0.6)',
          backgroundColor: 'transparent',
          color: 'white',
          borderRadius: isFullscreen ? '0' : '1rem',
          border: 'none',
          boxShadow: isFullscreen ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'fixed' as const,
          left: isFullscreen ? '0' : (position ? `${position.x}px` : 'auto'),
          top: isFullscreen ? '0' : (position ? `${position.y}px` : 'auto'),
          zIndex: 50,
          cursor: isDragging ? 'grabbing' : 'default',
          display: position ? 'flex' : 'none' // Hide until position is set
        }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 select-none ${isFullscreen ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
          style={{ backgroundColor: `rgba(17, 24, 39, ${opacity.top / 100})` }}
          onMouseDown={isFullscreen ? undefined : handleMouseDown}
          title={isFullscreen ? "" : "드래그하여 이동"}
        >
          <div className="flex items-center gap-3 pointer-events-none">
            {!isFullscreen && (
              <button
                className="text-gray-400 hover:text-white transition-colors pointer-events-auto"
                title="드래그 핸들"
              >
                <svg className="w-2 h-4" viewBox="0 0 8 16" fill="currentColor">
                  <circle cx="4" cy="2" r="1.5" />
                  <circle cx="4" cy="8" r="1.5" />
                  <circle cx="4" cy="14" r="1.5" />
                </svg>
              </button>
            )}
            
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #c084fc, #a855f7, #f472b6)' }}>
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-medium text-base text-white">{title}</h3>
          </div>
          
          <div className="flex items-center gap-3 pointer-events-none">
            {/* 투명도 조절 슬라이더 - 우측 전체화면 UI 바로 왼쪽에 위치 */}
            <div 
              className="flex items-center pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onMouseMove={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={(opacity.top + opacity.middle + opacity.bottom) / 3}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  setOpacity({
                    top: value,
                    middle: value,
                    bottom: value
                  })
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                className="w-16 h-1 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #1f2937 0%, #1f2937 ${(opacity.top + opacity.middle + opacity.bottom) / 3}%, #4b5563 ${(opacity.top + opacity.middle + opacity.bottom) / 3}%, #4b5563 100%)`
                }}
              />
            </div>
            <button
              className="text-gray-400 hover:text-white transition-colors pointer-events-auto"
              onClick={toggleFullscreen}
              title={isFullscreen ? "창 모드로 변경" : "전체 화면"}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            {onClose && (
              <button
                onClick={() => {
                  onMinimize?.(messages) // Same as minimize button
                }}
                className="text-gray-400 hover:text-white transition-colors pointer-events-auto"
                title="최소화 (대화 유지)"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" style={{ backgroundColor: `rgba(17, 24, 39, ${opacity.middle / 100})` }}>
          {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
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
        <div className="relative" style={{ backgroundColor: `rgba(17, 24, 39, ${opacity.bottom / 100})` }}>
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
                  // backgroundColor: '#1f2937', 
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
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
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                AI Agent powered by SurgiForm
              </p>
            </div>
          </div>
        </div>

        {/* Resize handles - only show when not in fullscreen */}
        {!isFullscreen && (
          <>
            {/* Edge resize handles */}
            <div
              className="absolute top-0 left-0 w-full h-1 cursor-ns-resize hover:bg-blue-500/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
              style={{ zIndex: 60 }}
            />
            <div
              className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-blue-500/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 's')}
              style={{ zIndex: 60 }}
            />
            <div
              className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-blue-500/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
              style={{ zIndex: 60 }}
            />
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
              style={{ zIndex: 60 }}
            />

            {/* Corner resize handles */}
            <div
              className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize hover:bg-blue-500/40 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              style={{
                zIndex: 60,
                borderTopLeftRadius: '1rem'
          }}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize hover:bg-blue-500/40 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              style={{
                zIndex: 60,
                borderTopRightRadius: '1rem'
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize hover:bg-blue-500/40 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              style={{
                zIndex: 60,
                borderBottomLeftRadius: '1rem'
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize hover:bg-blue-500/40 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              style={{
                zIndex: 60,
                borderBottomRightRadius: '1rem'
              }}
            />
          </>
        )}
      </Card>
    </>
  )
}