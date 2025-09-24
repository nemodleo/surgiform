"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Check, Plus, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"
import { surgiformAPI } from "@/lib/api"
import { createConsentSubmission } from "@/lib/consentDataFormatter"
import toast from "react-hot-toast"

interface ConsentItem {
  item_title: string
  description: string
}

interface ConsentData {
  consents: ConsentItem[]
}

interface FormData extends Record<string, unknown> {
  registration_number: string
  patient_name: string
  patient_age: string
  patient_gender: string
  surgery_name: string
  surgery_date: string
  diagnosis: string
  diagnosis_detail: string
  surgery_site: string
  surgery_site_detail: string
  medical_team: Array<{
    name: string
    is_specialist: boolean
    department: string
  }>
  medical_history: boolean
  smoking: boolean
  allergy: boolean
  airway_abnormal: boolean
  respiratory_disease: boolean
  medication: boolean
  drug_abuse: boolean
  diabetes: boolean
  hypertension: boolean
  hypotension: boolean
  cardiovascular: boolean
  blood_coagulation: boolean
  kidney_disease: boolean
  other_conditions: string
  mortality_risk: number | string
  morbidity_risk: number | string
  participants?: { name: string }[]
}

interface ConfirmationPageProps {
  onComplete: () => void
  onBack?: () => void
  formData: FormData
  consentData: ConsentData
}

interface CanvasData {
  id: string
  title: string
  imageData?: string
}

export default function ConfirmationPage({ onComplete, onBack, formData, consentData }: ConfirmationPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionRef = useRef(false)
  const [signatures, setSignatures] = useState<Record<string, string>>(() => {
    // Try to restore signatures from sessionStorage on initial load
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmationSignatures')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          console.log('🖋️ Restored signatures from sessionStorage on init:', Object.keys(parsed))
          return parsed
        } catch (e) {
          console.error('Failed to parse saved signatures:', e)
        }
      }
    }
    return {}
  })
  const [canvases, setCanvases] = useState<CanvasData[]>(() => {
    // Try to restore canvases from sessionStorage on initial load
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmationCanvases')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          console.log('🎨 Restored canvases from sessionStorage on init:', parsed.length, 'canvases')
          return parsed
        } catch (e) {
          console.error('Failed to parse saved canvases:', e)
        }
      }
    }
    return []
  })
  const signatureRefs = useRef<Record<string, SignatureCanvas>>({})
  const restoredCanvases = useRef<Set<string>>(new Set())
  const pendingRestores = useRef<Record<string, string>>({})

  // Debug: Monitor sessionStorage changes
  const checkSessionStorage = () => {
    const current = sessionStorage.getItem('confirmationCanvases')
    console.log('🔍 Current sessionStorage confirmationCanvases:', current ? `${current.length} chars` : 'null')
    if (current) {
      try {
        const parsed = JSON.parse(current)
        console.log('🔍 Parsed:', parsed.length, 'canvases with data:', parsed.filter((c: CanvasData) => c.imageData).length)
      } catch (e) {
        console.error('🔍 Parse error:', e)
      }
    }
  }

  // Check sessionStorage every 2 seconds
  useEffect(() => {
    const interval = setInterval(checkSessionStorage, 2000)
    return () => clearInterval(interval)
  }, [])

  // Debug: Log when state changes
  useEffect(() => {
    console.log('📊 Canvases state changed:', canvases.length, 'canvases')
    canvases.forEach((c, i) => {
      console.log(`📊 Canvas ${i}: ${c.id} - ${c.title} - hasData: ${!!c.imageData}`)
    })
  }, [canvases])

  // Debug: Component lifecycle
  useEffect(() => {
    console.log('🔄 ConfirmationPage mounted')
    
    // Expose debug functions to window for manual testing
    if (typeof window !== 'undefined') {
      (window as unknown as { debugCanvas?: { checkStorage: () => void; forceRestore: () => void; clearStorage: () => void } }).debugCanvas = {
        checkStorage: () => {
          console.log('=== MANUAL STORAGE CHECK ===')
          const storage = sessionStorage.getItem('confirmationCanvases')
          console.log('Raw storage:', storage)
          if (storage) {
            const parsed = JSON.parse(storage)
            console.log('Parsed storage:', parsed)
            parsed.forEach((c: CanvasData, i: number) => {
              console.log(`Canvas ${i}: ${c.id}, title: ${c.title}, hasData: ${!!c.imageData}, dataLength: ${c.imageData?.length || 0}`)
            })
          }
          console.log('Current state canvases:', canvases)
          console.log('Restored canvases:', Array.from(restoredCanvases.current))
          console.log('Pending restores:', pendingRestores.current)
        },
        forceRestore: () => {
          console.log('=== FORCING RESTORE ===')
          restoredCanvases.current.clear()
          canvases.forEach(canvas => {
            if (canvas.imageData) {
              restoreCanvas(canvas.id, canvas.imageData)
            }
          })
        },
        clearStorage: () => {
          console.log('=== CLEARING STORAGE ===')
          sessionStorage.removeItem('confirmationCanvases')
        }
      }
    }
    
    return () => {
      console.log('🔄 ConfirmationPage unmounting')
      if (typeof window !== 'undefined') {
        delete (window as unknown as { debugCanvas?: unknown }).debugCanvas
      }
    }
  }, [])

  // Load saved data on mount
  useEffect(() => {
    console.log('🚀 ConfirmationPage mounting, checking sessionStorage...')
    
    // Debug: Show all sessionStorage keys
    const allKeys = Object.keys(sessionStorage)
    console.log('📦 All sessionStorage keys:', allKeys)
    
    // Signature data is now loaded in the state initializer
    // Just log what we have
    console.log('🖋️ Current signatures on mount:', Object.keys(signatures))

    // Canvas data is now loaded in the state initializer
    // Just log what we have
    console.log('🎨 Current canvases on mount:', canvases.length, 'canvases')
    canvases.forEach((c: CanvasData, index: number) => {
      console.log(`📋 Canvas ${index + 1}: id=${c.id}, title="${c.title}", hasData=${!!c.imageData}, dataLength=${c.imageData?.length || 0}`)
    })
  }, [])

  // Save signatures whenever they change
  useEffect(() => {
    if (Object.keys(signatures).length > 0) {
      sessionStorage.setItem('confirmationSignatures', JSON.stringify(signatures))
    }
  }, [signatures])

  // Save canvases whenever they change (including empty array to handle deletions)
  useEffect(() => {
    console.log('💾 Saving canvases to sessionStorage:', canvases.length, 'canvases')
    canvases.forEach((c, index) => {
      console.log(`💾 Canvas ${index + 1}: id=${c.id}, title="${c.title}", hasData=${!!c.imageData}, dataLength=${c.imageData?.length || 0}`)
    })
    sessionStorage.setItem('confirmationCanvases', JSON.stringify(canvases))
    console.log('💾 Saved to sessionStorage successfully')
  }, [canvases])

  // Attempt to restore all canvases when they're loaded
  useEffect(() => {
    console.log(`🔄 Canvas data loaded, attempting to restore ${canvases.length} canvases`)
    canvases.forEach(canvas => {
      if (canvas.imageData && !restoredCanvases.current.has(canvas.id)) {
        console.log(`📋 Scheduling restore for loaded canvas ${canvas.id}`)
        // Try to restore after a delay
        setTimeout(() => {
          if (signatureRefs.current[canvas.id]) {
            restoreCanvas(canvas.id, canvas.imageData!)
          } else {
            console.log(`⏳ Canvas ${canvas.id} ref not ready, storing for later`)
            pendingRestores.current[canvas.id] = canvas.imageData!
          }
        }, 500)
      }
    })
  }, [canvases.length]) // Only trigger when number of canvases changes

  // Function to restore a specific canvas
  const restoreCanvas = (canvasId: string, imageData: string) => {
    console.log(`Restore request for canvas ${canvasId}, data length: ${imageData.length}`)
    
    if (restoredCanvases.current.has(canvasId)) {
      console.log(`Canvas ${canvasId} already restored, skipping`)
      return
    }
    
    // Store pending restore data
    pendingRestores.current[canvasId] = imageData
    
    if (!signatureRefs.current[canvasId]) {
      console.log(`Canvas ${canvasId} ref not ready, will restore when ref is set`)
      return
    }
    
    const ref = signatureRefs.current[canvasId]
    const attemptRestore = (attempts = 0) => {
      try {
        ref.fromDataURL(imageData)
        restoredCanvases.current.add(canvasId)
        delete pendingRestores.current[canvasId]
        console.log(`✅ Canvas ${canvasId} restored successfully on attempt ${attempts + 1}`)
      } catch (e) {
        console.log(`❌ Canvas ${canvasId} restore attempt ${attempts + 1} failed:`, (e as Error).message)
        if (attempts < 15) {
          setTimeout(() => attemptRestore(attempts + 1), 100 + (attempts * 50))
        } else {
          console.error(`💥 Failed to restore canvas ${canvasId} after ${attempts + 1} attempts`)
        }
      }
    }
    
    // Start restoration immediately, then with delays if it fails
    attemptRestore()
  }

  const handleSignatureClear = (key: string) => {
    if (signatureRefs.current[key]) {
      signatureRefs.current[key].clear()
      setSignatures(prev => {
        const newSigs = { ...prev }
        delete newSigs[key]
        // Update sessionStorage after clearing
        sessionStorage.setItem('confirmationSignatures', JSON.stringify(newSigs))
        return newSigs
      })
    }
  }

  const handleSignatureSave = (key: string) => {
    console.log('handleSignatureSave called for:', key)
    if (signatureRefs.current[key]) {
      if (!signatureRefs.current[key].isEmpty()) {
        const dataUrl = signatureRefs.current[key].toDataURL()
        console.log('Saving signature:', key, 'Data URL length:', dataUrl.length)
        setSignatures(prev => {
          const updated = { ...prev, [key]: dataUrl }
          console.log('Updated signatures state:', Object.keys(updated))
          // Also save to sessionStorage immediately
          sessionStorage.setItem('tempSignatures', JSON.stringify(updated))
          return updated
        })
      } else {
        console.log('Signature canvas is empty for:', key)
      }
    } else {
      console.log('Signature ref not found for:', key)
    }
  }

  const addCanvas = (section: string) => {
    const newCanvas: CanvasData = {
      id: `canvas_${Date.now()}`,
      title: `${section} 설명 그림`
    }
    console.log('➕ Adding new canvas:', newCanvas.id, 'for section:', section)
    setCanvases(prev => {
      const updated = [...prev, newCanvas]
      console.log('➕ New canvas added, total canvases:', updated.length)
      // Immediately save to sessionStorage
      sessionStorage.setItem('confirmationCanvases', JSON.stringify(updated))
      console.log('💾 Saved new canvas to sessionStorage')
      return updated
    })
  }

  // Auto-save canvas on every stroke
  const handleCanvasEnd = (canvasId: string) => {
    console.log(`🖌️ handleCanvasEnd called for canvas ${canvasId}`)
    if (signatureRefs.current[canvasId]) {
      const isEmpty = signatureRefs.current[canvasId].isEmpty()
      console.log(`🖌️ Canvas ${canvasId} isEmpty: ${isEmpty}`)
      if (!isEmpty) {
        const dataUrl = signatureRefs.current[canvasId].toDataURL()
        console.log('💾 Saving canvas drawing:', canvasId, 'Data length:', dataUrl.length)
        setCanvases(prev => {
          const updated = prev.map(canvas => 
            canvas.id === canvasId ? { ...canvas, imageData: dataUrl } : canvas
          )
          console.log('💾 Updated canvases state, total canvases:', updated.length)
          // Immediately save to sessionStorage
          sessionStorage.setItem('confirmationCanvases', JSON.stringify(updated))
          console.log('💾 Saved to sessionStorage immediately')
          return updated
        })
      } else {
        console.log('⚠️ Canvas is empty, not saving')
      }
    } else {
      console.log('❌ No canvas ref found for', canvasId)
    }
  }

  const deleteCanvas = (canvasId: string) => {
    setCanvases(prev => {
      const updated = prev.filter(c => c.id !== canvasId)
      // Update sessionStorage after deletion
      sessionStorage.setItem('confirmationCanvases', JSON.stringify(updated))
      return updated
    })
    // Clean up restored state
    restoredCanvases.current.delete(canvasId)
    // Clean up ref
    delete signatureRefs.current[canvasId]
  }

  const handleComplete = async () => {
    if (isSubmitting || submissionRef.current) {
      console.log('Already submitting, ignoring duplicate call')
      return
    }

    console.log('handleComplete called')
    console.log('Current signatures:', Object.keys(signatures))
    console.log('Signatures patient exists:', !!signatures.patient)
    console.log('Signatures doctor exists:', !!signatures.doctor)

    setIsSubmitting(true)
    submissionRef.current = true

    try {
      // Debug: Log original form data
      console.log('Original formData before transformation:', formData)
      console.log('formData.other_conditions:', formData.other_conditions)
      console.log('formData.medical_history:', formData.medical_history)
      console.log('formData.diabetes:', formData.diabetes)

      // Prepare consent data for backend submission
      const consentSubmissionData = createConsentSubmission(formData)
      console.log('Submitting consent data to backend:', consentSubmissionData)
      console.log('special_conditions.other:', consentSubmissionData.special_conditions.other)
      console.log('special_conditions.past_history:', consentSubmissionData.special_conditions.past_history)

      // Submit to backend
      const response = await surgiformAPI.submitConsentData(consentSubmissionData)
      console.log('Backend response:', response.data)

      if (response.data.success) {
        toast.success('동의서가 성공적으로 제출되었습니다')

        // 서명 데이터와 캔버스 데이터를 모두 저장 (페이지에서는 사용, PDF에서는 제외)
        const allSignatureData = {
          ...signatures,
          canvases: canvases.filter(c => c.imageData).map(c => ({
            id: c.id,
            title: c.title,
            imageData: c.imageData
          }))
        }

        console.log('Saving signature data:', Object.keys(allSignatureData))

        // Save to sessionStorage for consent flow persistence
        sessionStorage.setItem('signatureData', JSON.stringify(allSignatureData))
        sessionStorage.setItem('confirmationCompleted', 'true')
        sessionStorage.setItem('canvasDrawings', JSON.stringify(canvases.filter(c => c.imageData)))
        // Also save to localStorage as backup
        localStorage.setItem('signatureData', JSON.stringify(allSignatureData))
        localStorage.setItem('canvasDrawings', JSON.stringify(canvases.filter(c => c.imageData)))

        console.log('Data saved to storage')
        onComplete()
      } else {
        toast.error(response.data.message || '동의서 제출에 실패했습니다')
      }
    } catch (error) {
      console.error('Error submitting consent data:', error)
      toast.error('동의서 제출 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
      submissionRef.current = false
    }
  }

  const requiredSignatures = [
    { key: "patient", label: "환자 서명", name: formData.patient_name },
    { key: "doctor", label: "의사 서명", name: formData.participants?.[0]?.name || "의사" }
  ]

  const allSignaturesComplete = requiredSignatures.every(sig => signatures[sig.key])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            수술 동의서 확인 및 서명
          </h2>
          <p className="text-sm text-slate-600">
            수술 동의서 내용을 최종 확인하고 서명해주세요
          </p>
        </div>
        {/* 환자 정보 */}
        <div>
            <h3 className="text-base font-semibold text-slate-900 mb-6">환자 정보</h3>
            <div className="space-y-6">
              {/* 기본 정보 테이블 */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">등록번호</th>
                      <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.registration_number || ""}</td>
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">환자명</th>
                      <td className="px-4 py-3 text-sm text-slate-900">{formData.patient_name}</td>
                    </tr>
                    <tr>
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">수술명</th>
                      <td className="px-4 py-3 text-sm text-slate-900" colSpan={3}>{formData.surgery_name || ""}</td>
                    </tr>
                    <tr>
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">나이/성별</th>
                      <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.patient_age}세 / {formData.patient_gender === "MALE" ? "남성" : "여성"}</td>
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">시행예정일</th>
                      <td className="px-4 py-3 text-sm text-slate-900">{formData.surgery_date || ""}</td>
                    </tr>
                    <tr>
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">진단명</th>
                      <td className="px-4 py-3 text-sm text-slate-900" colSpan={3}>{formData.diagnosis || ""}</td>
                    </tr>
                    <tr>
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">수술부위표시</th>
                      <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.surgery_site_detail || ""}</td>
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">수술부위</th>
                      <td className="px-4 py-3 text-sm text-slate-900">{formData.surgery_site || ""}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 참여 의료진 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">※ 참여 의료진</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">집도의</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">전문의여부</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">진료과목</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(formData.medical_team || formData.participants || []).map((doctor: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{doctor.name || ""}</td>
                          <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{doctor.is_specialist ? "전문의" : "일반의"}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{doctor.department || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
              </div>

              {/* 환자 상태 및 특이사항 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">1. 환자 상태 및 특이사항</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">과거병력</th>
                        <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.medical_history ? "있음" : "없음"}</td>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">당뇨병</th>
                        <td className="px-4 py-3 text-sm text-slate-900">{formData.diabetes ? "있음" : "없음"}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">흡연유무</th>
                        <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.smoking ? "흡연" : "비흡연"}</td>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">고혈압</th>
                        <td className="px-4 py-3 text-sm text-slate-900">{formData.hypertension ? "있음" : "없음"}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">알레르기</th>
                        <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.allergy ? "있음" : "없음"}</td>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">저혈압</th>
                        <td className="px-4 py-3 text-sm text-slate-900">{formData.hypotension ? "있음" : "없음"}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">기도이상</th>
                        <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.airway_abnormal ? "있음" : "없음"}</td>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">심혈관질환</th>
                        <td className="px-4 py-3 text-sm text-slate-900">{formData.cardiovascular ? "있음" : "없음"}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">호흡기질환</th>
                        <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.respiratory_disease ? "있음" : "없음"}</td>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">혈액응고 관련 질환</th>
                        <td className="px-4 py-3 text-sm text-slate-900">{formData.blood_coagulation ? "있음" : "없음"}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">복용약물</th>
                        <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.medication ? "있음" : "없음"}</td>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">신장질환</th>
                        <td className="px-4 py-3 text-sm text-slate-900">{formData.kidney_disease ? "있음" : "없음"}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">마약복용 혹은 약물사고</th>
                        <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.drug_abuse ? "있음" : "없음"}</td>
                        <td className="px-4 py-3 text-sm text-slate-900" colSpan={2}></td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">기타</th>
                        <td className="px-4 py-3 text-sm text-slate-900" colSpan={3}>{formData.other_conditions || ""}</td>
                      </tr>
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        </div>

        {/* 수술 동의 내용 */}
        <div>
              {/* <h3 className="text-base font-semibold text-slate-900 mb-6">수술 동의 내용</h3> */}
              <div>
            {/* 번호별 수술 정보 */}
            {(() => {
              try {
                const saved = sessionStorage.getItem('surgeryInfoTextareas');
                const surgeryData = saved ? JSON.parse(saved) : {};
                
                // consentData에서도 데이터를 가져와서 병합
                const consentConsents = consentData?.consents || {};
                
                const allItems = [
                  // 1. 환자 상태 및 특이사항은 상단 환자 정보 섹션에서 이미 표시되므로 생략
                  { number: "2", title: "예정된 수술/시술/검사를 하지 않을 경우의 예후", key: "2", consentKey: "prognosis_without_surgery" },
                  { number: "3", title: "예정된 수술 이외의 시행 가능한 다른 방법", key: "3", consentKey: "alternative_treatments" },
                  { number: "4", title: "수술 목적/필요/효과", key: "4", consentKey: "surgery_purpose_necessity_effect" },
                  { number: "5-1", title: "수술 과정 전반에 대한 설명", key: "5-1", consentKey: "surgery_method_content.overall_description" },
                  { number: "5-2", title: "수술 추정 소요시간", key: "5-2", consentKey: "surgery_method_content.estimated_duration" },
                  { number: "5-3", title: "수술 방법 변경 및 수술 추가 가능성", key: "5-3", consentKey: "surgery_method_content.method_change_or_addition" },
                  { number: "5-4", title: "수혈 가능성", key: "5-4", consentKey: "surgery_method_content.transfusion_possibility" },
                  { number: "5-5", title: "집도의 변경 가능성", key: "5-5", consentKey: "surgery_method_content.surgeon_change_possibility" },
                  { number: "6", title: "발생 가능한 합병증/후유증/부작용", key: "6", consentKey: "possible_complications_sequelae" },
                  { number: "7", title: "문제 발생시 조치사항", key: "7", consentKey: "emergency_measures" },
                  { number: "8", title: "진단/수술 관련 사망 위험성", key: "8", consentKey: "mortality_risk" }
                ];
                
                return allItems.map((item, index) => {
                  // 여러 소스에서 데이터 가져오기 (우선순위: surgeryData 번호키 > consentData > surgeryData 기존키)
                  let content = surgeryData[item.key] || "";
                  
                  // consentData에서 데이터 가져오기
                  if (!content && item.consentKey) {
                    if (item.consentKey.includes('.')) {
                      // 중첩된 키 처리 (예: surgery_method_content.overall_description)
                      const keys = item.consentKey.split('.');
                      let value = consentConsents;
                      for (const key of keys) {
                        value = value?.[key as keyof typeof value];
                        if (!value) break;
                      }
                      content = value || "";
                    } else {
                      content = (consentConsents as any)[item.consentKey] || "";
                    }
                  }
                  
                  // 모든 항목을 표시 (내용이 없어도 제목은 보여줌)
                  
                  return (
                  <div key={index} className="mb-10">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-slate-900">{item.number}. {item.title}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCanvas(`${item.number}. ${item.title}`)}
                        className="border-slate-200 hover:bg-slate-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        그림 추가
                      </Button>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm text-slate-900 whitespace-pre-wrap">
                        {content || "내용이 입력되지 않았습니다."}
                      </span>
                    </div>
                    
                    {canvases.filter(c => c.title.includes(`${item.number}. ${item.title}`)).map(canvas => (
                      <div key={canvas.id} className="mt-3 p-3 bg-white rounded-md border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-slate-700">{canvas.title}</p>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (signatureRefs.current[canvas.id]) {
                                  signatureRefs.current[canvas.id].clear()
                                  setCanvases(prev => {
                                    const updated = prev.map(c => 
                                      c.id === canvas.id ? { ...c, imageData: undefined } : c
                                    )
                                    sessionStorage.setItem('confirmationCanvases', JSON.stringify(updated))
                                    return updated
                                  })
                                  restoredCanvases.current.delete(canvas.id)
                                }
                              }}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                              title="그림 지우기"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCanvas(canvas.id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                              title="그림 삭제"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border border-slate-200 rounded bg-white relative">
                          <SignatureCanvas
                            ref={(ref) => {
                              if (ref) {
                                console.log(`🎨 Setting ref for canvas ${canvas.id}`)
                                signatureRefs.current[canvas.id] = ref
                                
                                const imageData = pendingRestores.current[canvas.id] || canvas.imageData
                                if (imageData && !restoredCanvases.current.has(canvas.id)) {
                                  console.log(`📦 Found image data for canvas ${canvas.id}, restoring...`)
                                  setTimeout(() => restoreCanvas(canvas.id, imageData), 300)
                                }
                              }
                            }}
                            canvasProps={{
                              className: "w-full",
                                height: 500
                            }}
                            onEnd={() => {
                              console.log(`🎨 onEnd triggered for canvas ${canvas.id}`)
                              handleCanvasEnd(canvas.id)
                            }}
                            onBegin={() => {
                              console.log(`✏️ Drawing started on canvas ${canvas.id}`)
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  );
                }).filter(Boolean); // null 항목 제거
              } catch (e) {
                console.error('Error loading surgery info data:', e);
                return null;
              }
            })()}

            {/* API에서 생성된 동의 내용들은 1-8번 항목으로만 제한하므로 제거 */}
              </div>
            </div>

        {/* 전자 서명 */}
        <div>
            <h3 className="text-base font-semibold text-slate-900 mb-6">9. 전자 서명</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {requiredSignatures.map(sig => (
                <div key={sig.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    {sig.label} - {sig.name}
                  </label>
                    <div className="flex gap-2">
                      <Button
                      variant="ghost"
                        size="sm"
                        onClick={() => handleSignatureClear(sig.key)}
                        className="border-slate-200 hover:bg-slate-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="border-2 border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors">
                    <SignatureCanvas
                      ref={(ref) => {
                        if (ref) {
                          signatureRefs.current[sig.key] = ref
                          // Restore saved signature if exists
                          if (signatures[sig.key] && ref.isEmpty()) {
                            ref.fromDataURL(signatures[sig.key])
                          }
                        }
                      }}
                      canvasProps={{
                        className: "w-full",
                      height: 250
                      }}
                      onEnd={() => handleSignatureSave(sig.key)}
                    />
                  </div>
                  {signatures[sig.key] && (
                    <p className="text-sm text-emerald-600 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      서명 완료
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
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
            disabled={!allSignaturesComplete || isSubmitting}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-6 py-3 h-auto font-medium rounded-lg transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                제출중...
              </>
            ) : (
              <>
                다음 단계
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}