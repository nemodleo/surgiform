"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, RefreshCw, WifiOff, X, ChevronLeft, ChevronRight } from "lucide-react"
import { surgiformAPI } from "@/lib/api"
import toast from "react-hot-toast"

interface SurgeryInfoPageProps {
  onComplete: (data: any) => void
  onBack?: () => void
  formData: any
  initialData?: any
}

export default function SurgeryInfoPage({ onComplete, onBack, formData, initialData }: SurgeryInfoPageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consentData, setConsentData] = useState<any>(initialData || null)
  const [textareaValues, setTextareaValues] = useState({
    general_info: "",
    surgical_site: "",
    surgical_method: "",
    purpose: "",
    complications: "",
    postop_course: "",
    others: ""
  })
  
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState("")

  useEffect(() => {
    if (!consentData && formData) {
      generateConsent()
    }
  }, [formData])

  const generateConsent = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await surgiformAPI.generateConsent({
        patient_name: formData.patient_name,
        patient_age: formData.patient_age,
        patient_gender: formData.patient_gender,
        surgery_name: formData.surgery_name,
        symptoms: formData.symptoms,
        surgery_objective: formData.surgery_objective,
        diagnosis_codes: formData.diagnosis_codes ? [formData.diagnosis_codes] : undefined,
        anesthesia_codes: formData.anesthesia_codes ? [formData.anesthesia_codes] : undefined,
        special_conditions: formData.special_conditions,
        participants: formData.participants
      })
      
      setConsentData(response.data)
      // Populate textareas with generated content
      if (response.data?.consents) {
        const newValues: any = {}
        response.data.consents.forEach((consent: any) => {
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
        setTextareaValues(newValues)
      }
      toast.success('수술 정보가 성공적으로 생성되었습니다')
    } catch (error: any) {
      console.error("Error generating consent:", error)
      
      let errorMessage = "수술 동의서 생성 중 오류가 발생했습니다."
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = "네트워크 연결 오류: API 서버가 실행 중인지 확인해주세요."
      } else if (error.response?.status === 404) {
        errorMessage = "API 엔드포인트를 찾을 수 없습니다."
      } else if (error.response?.status === 500) {
        errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    }
    setLoading(false)
  }

  const handleTextareaChange = (field: string, value: string) => {
    setTextareaValues(prev => ({ ...prev, [field]: value }))
  }

  const handleComplete = () => {
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
                toast.info('테스트 모드로 진행합니다')
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
                  className="flex items-center gap-2"
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
                    toast.info('테스트 모드로 진행합니다')
                  }}
                >
                  테스트 모드로 진행
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
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
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
              <label className="text-sm font-medium text-slate-700">
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
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
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
              <label className="text-sm font-medium text-slate-700">
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
              <label className="text-sm font-medium text-slate-700">
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
              <label className="text-sm font-medium text-slate-700">
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
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
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

          {/* 챗봇 아이콘 */}
          {showChat && (
            <div className="fixed bottom-20 right-8 w-80 h-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">AI 어시스턴트</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChat(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-64 overflow-y-auto mb-4 border border-gray-200 rounded p-2">
                <p className="text-sm text-gray-500">수술 정보에 대해 궁금한 점을 물어보세요.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-dark"
                  placeholder="메시지를 입력하세요..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <Button size="sm" className="bg-green-dark hover:bg-green-darker text-white">
                  전송
                </Button>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowChat(!showChat)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-green-dark text-white rounded-full shadow-lg hover:bg-green-darker transition-colors flex items-center justify-center"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
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