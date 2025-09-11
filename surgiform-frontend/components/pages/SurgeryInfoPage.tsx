"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw, WifiOff, X, ChevronLeft, ChevronRight, Bot, Sparkles } from "lucide-react"
import { surgiformAPI, ChatMessage, ChatRequest } from "@/lib/api"
import { ChatUI } from "@/components/ui/chat"
import toast from "react-hot-toast"

interface FormData {
  patient_name?: string
  patient_age?: string
  patient_gender?: string
  surgery_name?: string
  symptoms?: string
  surgery_objective?: string
  diagnosis_codes?: string
  anesthesia_codes?: string
  special_conditions?: string
  participants?: unknown[]
  [key: string]: unknown
}

interface ConsentItem {
  category?: string
  description?: string
  item_title?: string
}

interface ConsentData {
  consents?: ConsentItem[]
  [key: string]: unknown
}

interface SurgeryInfoPageProps {
  onComplete: (data: ConsentData) => void
  onBack?: () => void
  formData: FormData
  initialData?: ConsentData
}

export default function SurgeryInfoPage({ onComplete, onBack, formData, initialData }: SurgeryInfoPageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consentData, setConsentData] = useState<ConsentData | null>(initialData || null)
  const [textareaValues, setTextareaValues] = useState(() => {
    // Try to restore saved values from sessionStorage
    const saved = sessionStorage.getItem('surgeryInfoTextareas')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved textarea values:', e)
      }
    }
    return {
      general_info: "",
      surgical_site: "",
      surgical_method: "",
      purpose: "",
      complications: "",
      postop_course: "",
      others: ""
    }
  })
  
  const [showChat, setShowChat] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // Save current data function - defined early to avoid hoisting issues
  const saveCurrentData = useCallback(() => {
    const dataToSubmit = {
      ...consentData,
      consents: [
        { category: "수술 정보", item_title: "일반 정보", description: textareaValues.general_info },
        { category: "수술 부위", item_title: "수술 부위", description: textareaValues.surgical_site },
        { category: "수술 방법", item_title: "수술 방법", description: textareaValues.surgical_method },
        { category: "수술 목적", item_title: "수술 목적", description: textareaValues.purpose },
        { category: "합병증", item_title: "수술 관련 합병증", description: textareaValues.complications },
        { category: "수술 후 경과", item_title: "수술 후 경과", description: textareaValues.postop_course },
        { category: "기타", item_title: "기타 사항", description: textareaValues.others }
      ]
    }
    // Save to sessionStorage directly
    sessionStorage.setItem('consentData', JSON.stringify(dataToSubmit))
    return dataToSubmit
  }, [consentData, textareaValues])

  // Save textarea values to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(textareaValues))
  }, [textareaValues])

  // Expose save function to window for progress bar navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { validateSurgeryInfo?: () => void }).validateSurgeryInfo = () => {
        // Save data before navigating
        saveCurrentData()
        // Navigate to confirmation page
        window.location.href = '/consent/confirmation'
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as Window & { validateSurgeryInfo?: () => void }).validateSurgeryInfo
      }
    }
  }, [textareaValues, consentData, saveCurrentData])

  const generateConsent = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await surgiformAPI.generateConsent({
        patient_name: formData.patient_name || '',
        patient_age: parseInt(formData.patient_age || '0'),
        patient_gender: (formData.patient_gender === '여' ? 'FEMALE' : 'MALE') as 'MALE' | 'FEMALE',
        surgery_name: formData.surgery_name || '',
        symptoms: formData.symptoms || '',
        surgery_objective: formData.surgery_objective || '',
        diagnosis_codes: formData.diagnosis_codes ? [formData.diagnosis_codes] : undefined,
        anesthesia_codes: formData.anesthesia_codes ? [formData.anesthesia_codes] : undefined,
        special_conditions: undefined,
        participants: formData.participants as Array<{ name: string; department: string; role: string }> | undefined
      })
      
      setConsentData(response.data as unknown as ConsentData)
      // Populate textareas with generated content
      if (response.data?.consents) {
        const newValues: Record<string, string> = {}
        response.data.consents.forEach((consent: ConsentItem) => {
          if (consent.category === "수술 정보") {
            newValues.general_info = consent.description || ""
          } else if (consent.category === "수술 부위") {
            newValues.surgical_site = consent.description || ""
          } else if (consent.category === "수술 방법") {
            newValues.surgical_method = consent.description || ""
          } else if (consent.category === "수술 목적") {
            newValues.purpose = consent.description || ""
          } else if (consent.category === "합병증") {
            newValues.complications = consent.description || ""
          } else if (consent.category === "수술 후 경과") {
            newValues.postop_course = consent.description || ""
          }
        })
        setTextareaValues((prev: typeof textareaValues) => ({ ...prev, ...newValues }))
      }
      toast.success('수술 정보가 성공적으로 생성되었습니다')
    } catch (error: unknown) {
      const err = error as { code?: string; response?: { status?: number; data?: { message?: string } } }
      console.error("Error generating consent:", error)
      
      let errorMessage = "수술 동의서 생성 중 오류가 발생했습니다."
      
      if (err.code === 'ERR_NETWORK') {
        errorMessage = "네트워크 연결 오류: API 서버가 실행 중인지 확인해주세요."
      } else if (err.response?.status === 404) {
        errorMessage = "API 엔드포인트를 찾을 수 없습니다."
      } else if (err.response?.status === 500) {
        errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    }
    setLoading(false)
  }, [formData])

  useEffect(() => {
    if (!consentData && formData) {
      generateConsent()
    }
  }, [consentData, formData, generateConsent])

  const handleTextareaChange = (field: string, value: string) => {
    setTextareaValues((prev: typeof textareaValues) => ({ ...prev, [field]: value }))
  }

  const handleSendChatMessage = async (message: string, history: ChatMessage[]) => {
    try {
      const currentConsents = [
        { category: "수술 정보", item_title: "일반 정보", description: textareaValues.general_info },
        { category: "수술 부위", item_title: "수술 부위", description: textareaValues.surgical_site },
        { category: "수술 방법", item_title: "수술 방법", description: textareaValues.surgical_method },
        { category: "수술 목적", item_title: "수술 목적", description: textareaValues.purpose },
        { category: "합병증", item_title: "수술 관련 합병증", description: textareaValues.complications },
        { category: "수술 후 경과", item_title: "수술 후 경과", description: textareaValues.postop_course },
        { category: "기타", item_title: "기타 사항", description: textareaValues.others }
      ]

      const chatRequest: ChatRequest = {
        message,
        conversation_id: conversationId,
        history,
        consents: currentConsents,
        system_prompt: `당신의 이름은 '이음'입니다. 의료진과 환자를 신뢰와 책임으로 이어주는 AI 도우미입니다.
        당신은 수술 동의서 작성을 도와주는 의료 AI 어시스턴트입니다. 
        환자 정보: ${formData.patient_name}, ${formData.patient_age}세, ${formData.patient_gender}
        수술명: ${formData.surgery_name}
        증상: ${formData.symptoms}
        수술 목적: ${formData.surgery_objective}
        
        사용자의 질문에 정확하고 친절하게 답변하며, 필요시 수술 정보를 수정하는 데 도움을 주세요.`
      }

      const response = await surgiformAPI.sendChatMessage(chatRequest)
      
      // Update conversation ID if new
      if (!conversationId && response.data.conversation_id) {
        setConversationId(response.data.conversation_id)
      }
      
      // Update messages state
      setChatMessages(response.data.history || [...history, { role: "user", content: message }, { role: "assistant", content: response.data.message, timestamp: new Date() }])

      // Update consents if modified
      if (response.data.is_content_modified && response.data.updated_consents) {
        const updatedConsents = response.data.updated_consents
        const newValues: Record<string, string> = {}
        
        updatedConsents.forEach((consent) => {
          if (consent.category === "수술 정보") {
            newValues.general_info = consent.description || ""
          } else if (consent.category === "수술 부위") {
            newValues.surgical_site = consent.description || ""
          } else if (consent.category === "수술 방법") {
            newValues.surgical_method = consent.description || ""
          } else if (consent.category === "수술 목적") {
            newValues.purpose = consent.description || ""
          } else if (consent.category === "합병증") {
            newValues.complications = consent.description || ""
          } else if (consent.category === "수술 후 경과") {
            newValues.postop_course = consent.description || ""
          } else if (consent.category === "기타") {
            newValues.others = consent.description || ""
          }
        })
        
        setTextareaValues((prev: typeof textareaValues) => ({ ...prev, ...newValues }))
        toast.success('수술 정보가 AI의 제안에 따라 업데이트되었습니다')
      }

      return response.data
    } catch (error) {
      console.error("Error sending chat message:", error)
      throw error
    }
  }

  const handleComplete = () => {
    const dataToSubmit = saveCurrentData()
    onComplete(dataToSubmit)
    toast.success('수술 정보가 저장되었습니다')
  }

  // 로딩 상태 UI
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-green-dark" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">수술 정보를 생성하고 있습니다</h3>
          <p className="text-sm text-gray-600 mt-2">AI가 최적의 정보를 준비 중입니다...</p>
        </div>
      </div>
    )
  }

  // 에러 상태 UI
  if (error && !consentData) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>연결 오류</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setError(null)
                // 더미 데이터로 진행
                const dummyData = {
                  consents: []
                }
                setConsentData(dummyData)
                toast.success('수기 입력 모드로 진행합니다')
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-3 bg-gray-200 rounded-full">
                <WifiOff className="h-8 w-8 text-gray-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 max-w-md">{error}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={generateConsent} 
                  className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  다시 시도
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const dummyData = {
                      consents: []
                    }
                    setConsentData(dummyData)
                    setError(null)
                    toast.success('수기 입력 모드로 진행합니다')
                  }}
                >
                  수기 입력 모드로 진행
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 정상 UI - 스크린샷과 동일한 레이아웃
  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Reference Textbook을 기반으로 작성된 수술 관련 정보입니다.
          </h2>
          <p className="text-sm text-slate-600">
            확인 후 수정사항이 있으면 반영한 후 확정해주세요.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                1. 예정된 수술 이름과 관련 정보의 제목
                <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues.general_info}
                onChange={(e) => handleTextareaChange('general_info', e.target.value)}
                placeholder="수술 관련 일반 정보를 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                2. 예정된 수술 이름과 관련 기능의 다른 정보
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues.surgical_site}
                onChange={(e) => handleTextareaChange('surgical_site', e.target.value)}
                placeholder="수술 부위 정보를 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                3. 수술적 방식/절차/방법
                <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues.surgical_method}
                onChange={(e) => handleTextareaChange('surgical_method', e.target.value)}
                placeholder="수술 방법을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                4. 수술적 방법 및 내용
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues.purpose}
                onChange={(e) => handleTextareaChange('purpose', e.target.value)}
                placeholder="수술 목적을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                5. 발생 가능한 환자별/수술별/부위별
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues.complications}
                onChange={(e) => handleTextareaChange('complications', e.target.value)}
                placeholder="수술 관련 합병증을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                6. 환병 발생시 조치사항
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues.postop_course}
                onChange={(e) => handleTextareaChange('postop_course', e.target.value)}
                placeholder="수술 후 경과를 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                7. 기타(수술 관련 사전 확인된)
                <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues.others}
                onChange={(e) => handleTextareaChange('others', e.target.value)}
                placeholder="기타 사항을 입력하세요"
              />
            </div>
          </div>
        </div>

          {/* Chat UI */}
          {showChat && (
            <div className="fixed bottom-8 right-8 z-50">
              <ChatUI
                onClose={() => {
                  setShowChat(false)
                  setConversationId(undefined) // Clear conversation on close
                  setChatMessages([]) // Clear messages on close
                }}
                onMinimize={(messages) => {
                  setChatMessages(messages) // Save messages before hiding
                  setShowChat(false)
                }} // Save and hide, keep conversation
                onSendMessage={handleSendChatMessage}
                conversationId={conversationId}
                initialMessages={chatMessages} // Pass saved messages
                title="이음"
                placeholder="수술 정보에 대해 궁금한 점을 물어보세요..."
              />
            </div>
          )}
          
          {/* Chat Button with Animation - Hide when chat is open */}
          {!showChat && (
            <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 40 }}>
              {/* Pulsing background effect */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                  width: '64px', 
                  height: '64px',
                  background: 'linear-gradient(to right, #3b82f6, #a855f7)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  opacity: 0.75
                }} 
              />
              
              {/* Main button */}
              <button
                onClick={() => setShowChat(true)}
                className="relative flex items-center justify-center overflow-hidden group"
                style={{ 
                  width: '64px', 
                  height: '64px',
                  background: 'linear-gradient(to right, #2563eb, #9333ea)',
                  color: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.3s',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 35px 60px -15px rgba(0, 0, 0, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
              >
                {/* Sparkle effect */}
                <Sparkles 
                  className="absolute"
                  style={{ 
                    top: '4px', 
                    right: '4px', 
                    width: '16px', 
                    height: '16px',
                    color: '#fde047',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }} 
                />
                
                {/* AI Bot Icon */}
                <Bot 
                  className="transition-transform group-hover:scale-110"
                  style={{ 
                    width: '32px', 
                    height: '32px',
                    zIndex: 10,
                    color: 'white'
                  }} 
                />
                
                {/* Rotating gradient overlay */}
                <div 
                  className="absolute inset-0 rotate-45 transition-transform duration-700 group-hover:translate-x-[-12rem]"
                  style={{ 
                    background: 'linear-gradient(to top right, transparent, rgba(255,255,255,0.2), transparent)',
                    transform: 'translateX(48px) rotate(45deg)'
                  }} 
                />
              </button>
              
              {/* "이음" label */}
              <div 
                className="absolute whitespace-nowrap pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"
                style={{ 
                  top: '-32px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                이음 - 의료진과 환자를 잇는 AI
              </div>
            </div>
          )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onBack || (() => window.history.back())}
          className="border-slate-200 hover:bg-slate-50 px-6 py-3 h-auto font-medium rounded-lg transition-all flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          이전 단계
        </Button>
        <Button
          onClick={handleComplete}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 h-auto font-medium rounded-lg transition-all flex items-center gap-2"
        >
          다음 단계
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}