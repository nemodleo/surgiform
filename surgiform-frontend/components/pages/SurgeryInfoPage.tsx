"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, WifiOff, X, ChevronLeft, ChevronRight, Bot, Sparkles, ExternalLink } from "lucide-react"
import { surgiformAPI, ChatMessage, ChatRequest } from "@/lib/api"
import { ChatUI } from "@/components/ui/chat"
import { useConsentGeneration } from "@/hooks/useConsentGeneration"
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
  medical_team?: Array<{ name?: string; is_specialist?: boolean; department?: string }>
  surgery_date?: string
  diagnosis?: string
  surgical_site?: string
  [key: string]: unknown
}


interface Reference {
  title: string
  url: string
  text: string
}

interface ConsentData {
  consents?: {
    prognosis_without_surgery?: string
    alternative_treatments?: string
    surgery_purpose_necessity_effect?: string
    surgery_method_content?: {
      overall_description?: string
      estimated_duration?: string
      method_change_or_addition?: string
      transfusion_possibility?: string
      surgeon_change_possibility?: string
    }
    possible_complications_sequelae?: string
    emergency_measures?: string
    mortality_risk?: string
  }
  references?: {
    prognosis_without_surgery?: Reference[]
    alternative_treatments?: Reference[]
    surgery_purpose_necessity_effect?: Reference[]
    surgery_method_content?: Reference[]
    possible_complications_sequelae?: Reference[]
    emergency_measures?: Reference[]
    mortality_risk?: Reference[]
    [key: string]: Reference[] | undefined
  }
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
  const [showTimeMessage, setShowTimeMessage] = useState(false)
  const [showBottomMessage, setShowBottomMessage] = useState(false)
  
  // 진행률 표시를 위한 훅
  const { 
    generateConsent: generateConsentWithProgress, 
    isGenerating, 
    progress, 
    progressMessage 
  } = useConsentGeneration({
    onSuccess: (result) => {
      console.log('동의서 생성 성공:', result);
      const { consents, references } = result;
      
      // Transform references from API format to ConsentData format
      const transformedReferences: ConsentData['references'] = {};
      if (references && Array.isArray(references)) {
        references.forEach((ref) => {
          const categoryKey = ref.category.toLowerCase().replace(/\s+/g, '_') as keyof ConsentData['references'];
          if (!transformedReferences[categoryKey]) {
            transformedReferences[categoryKey] = [];
          }
          transformedReferences[categoryKey]?.push(...ref.references.map(r => ({
            title: r.title,
            url: r.url,
            text: ref.content
          })));
        });
      }

      // ConsentData 형태로 설정
      setConsentData({
        consents: consents as ConsentData['consents'],
        references: transformedReferences
      });
      
            if (consents) {
              setTextareaValues((prev: typeof textareaValues) => {
                const newValues: Record<string, string> = { ...prev };
                
                // 사용자 입력이 없는 경우만 API 응답으로 채우기 (번호 기반 키 우선)
                // 2. 예정된 수술/시술/검사를 하지 않을 경우의 예후
                if (consents.prognosis_without_surgery && (!prev["2"] || prev["2"].trim() === "")) {
                  newValues["2"] = consents.prognosis_without_surgery;
                  newValues.general_info = consents.prognosis_without_surgery; // fallback
                }
                
                // 3. 예정된 수술 이외의 시행 가능한 다른 방법
                if (consents.alternative_treatments && (!prev["3"] || prev["3"].trim() === "")) {
                  newValues["3"] = consents.alternative_treatments;
                  newValues.surgical_site = consents.alternative_treatments; // fallback
                }
                
                // 4. 수술 목적/필요/효과
                if (consents.surgery_purpose_necessity_effect && (!prev["4"] || prev["4"].trim() === "")) {
                  newValues["4"] = consents.surgery_purpose_necessity_effect;
                  newValues.purpose = consents.surgery_purpose_necessity_effect; // fallback
                }
                
                // surgery_method_content 하위 필드들
                if (consents.surgery_method_content) {
                  // 5-1. 수술 과정 전반에 대한 설명
                  if (consents.surgery_method_content.overall_description && (!prev["5-1"] || prev["5-1"].trim() === "")) {
                    newValues["5-1"] = consents.surgery_method_content.overall_description;
                    newValues.overall_description = consents.surgery_method_content.overall_description;
                    newValues.surgical_method = consents.surgery_method_content.overall_description; // fallback
                  }
                  
                  // 5-2. 수술 추정 소요시간
                  if (consents.surgery_method_content.estimated_duration && (!prev["5-2"] || prev["5-2"].trim() === "")) {
                    newValues["5-2"] = consents.surgery_method_content.estimated_duration;
                    newValues.estimated_duration = consents.surgery_method_content.estimated_duration;
                  }
                  
                  // 5-3. 수술 방법 변경 및 수술 추가 가능성
                  if (consents.surgery_method_content.method_change_or_addition && (!prev["5-3"] || prev["5-3"].trim() === "")) {
                    newValues["5-3"] = consents.surgery_method_content.method_change_or_addition;
                    newValues.method_change_or_addition = consents.surgery_method_content.method_change_or_addition;
                  }
                  
                  // 5-4. 수혈 가능성
                  if (consents.surgery_method_content.transfusion_possibility && (!prev["5-4"] || prev["5-4"].trim() === "")) {
                    newValues["5-4"] = consents.surgery_method_content.transfusion_possibility;
                    newValues.transfusion_possibility = consents.surgery_method_content.transfusion_possibility;
                  }
                  
                  // 5-5. 집도의 변경 가능성
                  if (consents.surgery_method_content.surgeon_change_possibility && (!prev["5-5"] || prev["5-5"].trim() === "")) {
                    newValues["5-5"] = consents.surgery_method_content.surgeon_change_possibility;
                    newValues.surgeon_change_possibility = consents.surgery_method_content.surgeon_change_possibility;
                  }
                }
                
                // 6. 발생 가능한 합병증/후유증/부작용
                if (consents.possible_complications_sequelae && (!prev["6"] || prev["6"].trim() === "")) {
                  newValues["6"] = consents.possible_complications_sequelae;
                  newValues.complications = consents.possible_complications_sequelae; // fallback
                }
                
                // 7. 문제 발생시 조치사항
                if (consents.emergency_measures && (!prev["7"] || prev["7"].trim() === "")) {
                  newValues["7"] = consents.emergency_measures;
                  newValues.postop_course = consents.emergency_measures; // fallback
                }
                
                // 8. 진단/수술 관련 사망 위험성
                if (consents.mortality_risk && (!prev["8"] || prev["8"].trim() === "")) {
                  newValues["8"] = consents.mortality_risk;
                  newValues.others = consents.mortality_risk; // fallback
                }
                
                return newValues;
              });
            }
      toast.success('수술 정보가 성공적으로 생성되었습니다');
    },
    onError: (error) => {
      console.error("Error generating consent:", error);
      setError(error.message);
    }
  });

  // 진행률에 따른 메시지 업데이트
  const getProgressMessage = () => {
    if (virtualProgress < 10) return "요청 데이터 검증 중..."
    if (virtualProgress < 20) return "환자 정보 처리 중..."
    if (virtualProgress < 30) return "의료 용어 번역 중..."
    if (virtualProgress < 40) return "키워드 추출 중..."
    if (virtualProgress < 50) return "의료 문서 검색 중..."
    if (virtualProgress < 60) return "수술 위험도 분석 중..."
    if (virtualProgress < 70) return "대안 치료법 검토 중..."
    if (virtualProgress < 80) return "합병증 정보 수집 중..."
    if (virtualProgress < 90) return "동의서 내용 생성 중..."
    return "최종 검토 중..."
  }

  // 메시지 번갈아가기 위한 useEffect
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setShowTimeMessage(prev => !prev)
      }, 3000) // 3초마다 번갈아가기
      
      return () => clearInterval(interval)
    }
  }, [isGenerating])

  // 하단 메시지 번갈아가기 (3초 주기, 엇갈린 타이밍)
  useEffect(() => {
    if (isGenerating) {
      let interval: NodeJS.Timeout
      
      // 1.5초 지연 후 시작해서 타이밍 엇갈리게
      const timeout = setTimeout(() => {
        interval = setInterval(() => {
          setShowBottomMessage(prev => !prev)
        }, 3000) // 3초마다 번갈아가기
      }, 1500)
      
      return () => {
        clearTimeout(timeout)
        if (interval) clearInterval(interval)
      }
    }
  }, [isGenerating])

  // 가상 진행률을 위한 state
  const [virtualProgress, setVirtualProgress] = useState(0)

  // 가상 진행률 업데이트 useEffect (1분 30초 = 90초에 맞춤)
  useEffect(() => {
    if (isGenerating) {
      // 시작할 때 0으로 초기화
      setVirtualProgress(0)
      
      const interval = setInterval(() => {
        setVirtualProgress(prev => {
          // 90초(1분 30초)에 85%까지 도달하도록 계산
          // 총 90초 동안 85% 증가 = 약 0.94%/초
          if (prev < 85) {
            const increment = 0.94 // 90초에 85% 도달
            return Math.min(prev + increment, 85)
          }
          return prev
        })
      }, 1000) // 1초마다 업데이트
      
      return () => clearInterval(interval)
    }
    // isGenerating이 false가 되어도 즉시 100%로 만들지 않음
    // API 응답이 완료되면 useConsentGeneration 훅에서 별도로 100% 처리
  }, [isGenerating])

  // API 완료 시 100% 처리를 위한 useEffect
  useEffect(() => {
    if (!isGenerating && virtualProgress > 0 && virtualProgress < 100) {
      // API가 완료되었고 이전에 진행 중이었다면 100%로 설정
      const timer = setTimeout(() => {
        setVirtualProgress(100)
      }, 500) // 0.5초 지연으로 자연스러운 완료
      
      return () => clearTimeout(timer)
    }
  }, [isGenerating, virtualProgress])
  
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
      "1": "", // 환자 상태 및 특이사항
      "2": "", // 예정된 수술/시술/검사를 하지 않을 경우의 예후
      "3": "", // 예정된 수술 이외의 시행 가능한 다른 방법
      "4": "", // 수술 목적/필요/효과
      "5-1": "", // 수술 과정 전반에 대한 설명
      "5-2": "", // 수술 추정 소요시간
      "5-3": "", // 수술 방법 변경 및 수술 추가 가능성
      "5-4": "", // 수혈 가능성
      "5-5": "", // 집도의 변경 가능성
      "6": "", // 발생 가능한 합병증/후유증/부작용
      "7": "", // 문제 발생시 조치사항
      "8": "", // 진단/수술 관련 사망 위험성
      // 기존 키들도 유지 (하위 호환성)
      general_info: "",
      surgical_site: "",
      surgical_method: "",
      purpose: "",
      overall_description: "",
      estimated_duration: "",
      method_change_or_addition: "",
      transfusion_possibility: "",
      surgeon_change_possibility: "",
      complications: "",
      postop_course: "",
      others: ""
    }
  })
  
  const [showChat, setShowChat] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // Track if API call is in progress to prevent duplicates
  const isGeneratingRef = useRef(false)

  // Save current data function - defined early to avoid hoisting issues
  const saveCurrentData = useCallback(() => {
    const dataToSubmit: ConsentData = {
      ...consentData,
      consents: {
        prognosis_without_surgery: textareaValues.general_info,
        alternative_treatments: textareaValues.surgical_site,
        surgery_purpose_necessity_effect: textareaValues.purpose,
        surgery_method_content: {
          overall_description: textareaValues.surgical_method
        },
        possible_complications_sequelae: textareaValues.complications,
        emergency_measures: textareaValues.postop_course,
        mortality_risk: textareaValues.others
      }
    }
    // Save to sessionStorage directly
    sessionStorage.setItem('consentData', JSON.stringify(dataToSubmit))
    return dataToSubmit
  }, [consentData, textareaValues])

  // Save textarea values to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(textareaValues))
  }, [textareaValues])

  // Auto-resize textareas on initial load and when values change
  useEffect(() => {
    const adjustTextareaHeight = (field: string) => {
      const textarea = document.querySelector(`textarea[data-field="${field}"]`) as HTMLTextAreaElement
      if (textarea && textareaValues[field]) {
        textarea.style.height = 'auto'
        const newHeight = Math.max(80, textarea.scrollHeight + 24)
        textarea.style.height = `${newHeight}px`
      }
    }

    // Adjust all textareas
    Object.keys(textareaValues).forEach(adjustTextareaHeight)
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
    // Prevent duplicate API calls
    if (isGeneratingRef.current || isGenerating) {
      return
    }

    isGeneratingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      const payload = {
        patient_name: (formData.patient_name as string) || '',
        age: parseInt((formData.patient_age as string) || '0'),
        gender: ((formData.patient_gender as string) === '여' ? 'F' : 'M') as 'F' | 'M',
        surgery_name: (formData.surgery_name as string) || '',
        scheduled_date: (formData.surgery_date as string) || new Date().toISOString().split('T')[0],
        diagnosis: (formData.diagnosis as string) || '',
        surgical_site_mark: (formData.surgery_site_detail as string) || '',
        patient_condition: (formData.symptoms as string) || '',
        registration_no: (formData.registration_number as string) || '',
        participants: formData.medical_team?.map((p: { name?: string; is_specialist?: boolean; department?: string }) => ({
          name: p.name || '',
          is_specialist: p.is_specialist !== undefined ? p.is_specialist : true,
          department: p.department || ''
        })) || [],
        special_conditions: {
          past_history: formData.medical_history === true,
          diabetes: formData.diabetes === true,
          smoking: formData.smoking === true,
          hypertension: formData.hypertension === true,
          allergy: formData.allergy === true,
          cardiovascular: formData.cardiovascular === true,
          respiratory: formData.respiratory_disease === true,
          coagulation: formData.blood_coagulation === true,
          medications: formData.medication === true,
          renal: formData.kidney_disease === true,
          drug_abuse: formData.drug_abuse === true,
          other: formData.other_conditions && typeof formData.other_conditions === 'string' && formData.other_conditions.trim()
            ? formData.other_conditions.trim()
            : null
        },
        ...((() => {
          const mortalityRisk = typeof formData.mortality_risk === 'string'
            ? parseFloat(formData.mortality_risk as string)
            : formData.mortality_risk as number
          const morbidityRisk = typeof formData.morbidity_risk === 'string'
            ? parseFloat(formData.morbidity_risk as string)
            : formData.morbidity_risk as number

          // Only include possum_score if both values are provided and valid
          if (!isNaN(mortalityRisk) && !isNaN(morbidityRisk) && mortalityRisk > 0 && morbidityRisk > 0) {
            return {
              possum_score: {
                mortality_risk: mortalityRisk,
                morbidity_risk: morbidityRisk
              }
            }
          }
          return {}
        })())
      };

      console.log('동의서 생성 시작 - 진행률 표시와 함께:', payload);
      
      // 진행률 표시와 함께 동의서 생성
      await generateConsentWithProgress(payload);

    } catch (error: unknown) {
      console.error("동의서 생성 오류:", error);
      // 에러는 useConsentGeneration에서 처리됨
    } finally {
      isGeneratingRef.current = false
      setLoading(false)
    }
  }, [
    formData.patient_name,
    formData.patient_age,
    formData.patient_gender,
    formData.surgery_name,
    formData.surgery_date,
    formData.diagnosis,
    generateConsentWithProgress,
    isGenerating
  ])

  useEffect(() => {
    if (!consentData && formData && formData.patient_name) {
      generateConsent()
    }
  }, [consentData, formData.patient_name, generateConsent])

  const handleTextareaChange = (field: string, value: string) => {
    setTextareaValues((prev: typeof textareaValues) => ({ ...prev, [field]: value }))
  }

  // Inline reference component for section titles
  const InlineReferences = ({ references }: { references?: Reference[] }) => {
    // 배열인지 확인하고 빈 배열인 경우도 처리
    if (!references || !Array.isArray(references) || references.length === 0) return null

    return (
      <div className="inline-flex items-center gap-1 ml-2">
        <div className="text-xs text-slate-500">출처 ·</div>
        <div className="text-xs font-medium text-slate-700">{references.length}</div>

        {/* 번호 버튼들 */}
        <div className="inline-flex items-center gap-1">
          {references.slice(0, 4).map((ref, index) => (
            <a
              key={index}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-4 h-4 bg-red-500 text-white rounded-full text-center leading-4 text-[10px] font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              {index + 1}
            </a>
          ))}

          {/* 4개 이상일 때 +n 표시 */}
          {references.length > 4 && (
            <div className="relative group">
              <span className="w-4 h-4 bg-slate-400 text-white rounded-full text-center leading-4 text-[10px] font-medium cursor-pointer hover:bg-slate-500 transition-colors flex items-center justify-center">
                +{references.length - 4}
              </span>

              {/* 호버 시 추가 레퍼런스 표시 */}
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-3 space-y-2">
                  {references.slice(4).map((ref, index) => (
                    <a
                      key={index + 4}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-xs hover:bg-slate-50 p-2 rounded transition-colors"
                    >
                      <span className="flex-shrink-0 w-4 h-4 bg-red-500 text-white rounded-full text-center leading-4 text-[10px] font-medium">
                        {index + 5}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-900 font-medium truncate">{ref.title}</div>
                        <div className="text-slate-500 truncate">{new URL(ref.url).hostname}</div>
                      </div>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Auto-resize textarea function
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>, field: string) => {
    const textarea = e.target

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'

    // Set height to scrollHeight + some padding for an extra line
    const newHeight = Math.max(80, textarea.scrollHeight + 24) // 80px minimum, +24px for extra line
    textarea.style.height = `${newHeight}px`

    // Update the value
    handleTextareaChange(field, textarea.value)
  }

  const handleSendChatMessage = async (message: string, history: ChatMessage[]) => {
    try {
      // Unused variable - commented out to fix build error
      // const currentConsents = [
      //   { category: "수술 정보", item_title: "일반 정보", description: textareaValues.general_info },
      //   { category: "수술 부위", item_title: "수술 부위", description: textareaValues.surgical_site },
      //   { category: "수술 방법", item_title: "수술 방법", description: textareaValues.surgical_method },
      //   { category: "수술 목적", item_title: "수술 목적", description: textareaValues.purpose },
      //   { category: "합병증", item_title: "수술 관련 합병증", description: textareaValues.complications },
      //   { category: "수술 후 경과", item_title: "수술 후 경과", description: textareaValues.postop_course },
      //   { category: "기타", item_title: "기타 사항", description: textareaValues.others }
      // ]

      const chatRequest: ChatRequest = {
        message,
        conversation_id: conversationId,
        history,
        // consents와 references 필드 제거 - API 형식 불일치
        system_prompt: `당신의 이름은 '이음'입니다. 의료진과 환자를 신뢰와 책임으로 이어주는 AI 도우미입니다.
        당신은 수술 동의서 작성을 도와주는 의료 AI 어시스턴트입니다. 
        환자 정보: ${formData.patient_name}, ${formData.patient_age}세, ${formData.patient_gender}
        수술명: ${formData.surgery_name}
        증상: ${formData.symptoms}
        수술 목적: ${formData.surgery_objective}
        
        현재 작성 중인 수술 동의서 내용:
        - 일반 정보: ${textareaValues.general_info}
        - 수술 부위: ${textareaValues.surgical_site}
        - 수술 방법: ${textareaValues.surgical_method}
        - 수술 목적: ${textareaValues.purpose}
        - 합병증: ${textareaValues.complications}
        - 수술 후 경과: ${textareaValues.postop_course}
        - 기타: ${textareaValues.others}
        
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
      throw error
    }
  }

  const handleComplete = () => {
    const dataToSubmit = saveCurrentData()
    onComplete(dataToSubmit)
    toast.success('수술 정보가 저장되었습니다')
  }

  // 로딩 상태 UI
  if (loading || isGenerating) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="min-h-[30vh] flex flex-col items-center justify-center px-4">
          {/* 스피너와 아이콘 */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {/* 외부 링 */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-100"></div>
              {/* 회전하는 링 */}
              <div className="w-14 h-14 rounded-full border-2 border-transparent border-t-slate-600 border-r-slate-600 animate-spin"></div>
              {/* 중앙 아이콘 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Bot className="w-6 h-6 text-slate-600" />
              </div>
            </div>
            
            {/* 메인 메시지 */}
            <h1 className="text-xl font-bold text-slate-900 text-center mb-3">
              수술 동의서 생성 중
            </h1>
          </div>
          
          {/* 진행 상태 */}
          <div className="text-center mb-5">
            <p className="text-base text-slate-600 font-normal">
              {showTimeMessage 
                ? "약 1-2분 소요"
                : getProgressMessage()
              }
            </p>
          </div>

          {/* 진행률 섹션 */}
          <div className="w-full max-w-md mb-4">
            {/* 진행률 바 */}
            <div className="relative">
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${virtualProgress}%` }}
                >
                </div>
              </div>
            </div>
          </div>
          
          {/* 번갈아가는 안심 메시지 */}
          <div className="text-center">
            <span className="text-sm text-slate-500">
              {showBottomMessage 
                ? "의료 문장 24만+건을 분석해 정확도를 검증하고 있습니다"
                : "잠시만 기다려주세요. 최고 품질의 동의서를 준비하고 있습니다."
              }
            </span>
          </div>
          
          {/* 배경 장식 요소 */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-50 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-slate-100 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-pulse" style={{ animationDelay: '3s' }}></div>
          </div>
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
                const dummyData: ConsentData = {
                  consents: undefined
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
                    const dummyData: ConsentData = {
                      consents: undefined
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
                1. 환자 상태 및 특이사항
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                2. 예정된 수술/시술/검사를 하지 않을 경우의 예후
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.prognosis_without_surgery} />
                {!(Array.isArray(consentData?.references) ? [] : consentData?.references?.prognosis_without_surgery)?.length && (
                  <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
                )}
              </label>
              <textarea
                data-field="general_info"
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["2"] || textareaValues.general_info}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "2": e.target.value,
                    general_info: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center">
                3. 예정된 수술 이외의 시행 가능한 다른 방법
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.alternative_treatments} />
              </label>
              <textarea
                data-field="surgical_site"
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["3"] || textareaValues.surgical_site}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "3": e.target.value,
                    surgical_site: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                4. 수술 목적/필요/효과
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content} />
                {!(Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content)?.length && (
                  <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
                )}
              </label>
              <textarea
                data-field="surgical_method"
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["4"] || textareaValues.surgical_method}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "4": e.target.value,
                    surgical_method: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center">
                5. 수술 방법 및 내용
              </label>
            </div>
          
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                5-1. 수술 과정 전반에 대한 설명
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.overall_description} />
                {!(Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.overall_description)?.length && (
                  <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
                )}
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["5-1"] || textareaValues.overall_description}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "5-1": e.target.value,
                    overall_description: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                5-2. 수술 추정 소요시간
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.estimated_duration} />
                {!(Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.estimated_duration)?.length && (
                  <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
                )}
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["5-2"] || textareaValues.estimated_duration}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "5-2": e.target.value,
                    estimated_duration: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                5-3. 수술 방법 변경 및 수술 추가 가능성
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.method_change_or_addition} />
                {!(Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.method_change_or_addition)?.length && (
                  <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
                )}
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["5-3"] || textareaValues.method_change_or_addition}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "5-3": e.target.value,
                    method_change_or_addition: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                5-4. 수혈 가능성
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.transfusion_possibility} />
                {!(Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.transfusion_possibility)?.length && (
                  <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
                )}
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["5-4"] || textareaValues.transfusion_possibility}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "5-4": e.target.value,
                    transfusion_possibility: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                5-5. 집도의 변경 가능성
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.surgeon_change_possibility} />
                {!(Array.isArray(consentData?.references) ? [] : consentData?.references?.surgery_method_content?.surgeon_change_possibility)?.length && (
                  <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
                )}
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["5-5"] || textareaValues.surgeon_change_possibility}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "5-5": e.target.value,
                    surgeon_change_possibility: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center">
                6. 발생 가능한 합병증/후유증/부작용
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.possible_complications_sequelae} />
              </label>
              <textarea
                data-field="complications"
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["6"] || textareaValues.complications}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "6": e.target.value,
                    complications: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center">
                7. 문제 발생시 조치사항
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.emergency_measures} />
              </label>
              <textarea
                data-field="postop_course"
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["7"] || textareaValues.postop_course}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "7": e.target.value,
                    postop_course: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                8. 진단/수술 관련 사망 위험성
                <InlineReferences references={Array.isArray(consentData?.references) ? [] : consentData?.references?.mortality_risk} />
                {!(Array.isArray(consentData?.references) ? [] : consentData?.references?.mortality_risk)?.length && (
                  <button className="w-5 h-5 bg-slate-500 text-white rounded-full text-xs">S</button>
                )}
              </label>
              <textarea
                data-field="others"
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-md resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none transition-all"
                value={textareaValues["8"] || textareaValues.others}
                onChange={(e) => {
                  const newValues = { 
                    ...textareaValues, 
                    "8": e.target.value,
                    others: e.target.value 
                  };
                  setTextareaValues(newValues);
                  sessionStorage.setItem('surgeryInfoTextareas', JSON.stringify(newValues));
                }}
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