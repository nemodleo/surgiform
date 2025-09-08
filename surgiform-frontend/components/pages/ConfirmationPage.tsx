"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Check, Plus, ChevronLeft, ChevronRight, X } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"

interface ConsentItem {
  item_title: string
  description: string
}

interface ConsentData {
  consents: ConsentItem[]
}

interface FormData {
  patient_name: string
  patient_age: string
  patient_gender: string
  surgery_name?: string
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
  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [canvases, setCanvases] = useState<CanvasData[]>([])
  const signatureRefs = useRef<Record<string, SignatureCanvas>>({})

  const handleSignatureClear = (key: string) => {
    if (signatureRefs.current[key]) {
      signatureRefs.current[key].clear()
      setSignatures(prev => {
        const newSigs = { ...prev }
        delete newSigs[key]
        return newSigs
      })
    }
  }

  const handleSignatureSave = (key: string) => {
    if (signatureRefs.current[key]) {
      const dataUrl = signatureRefs.current[key].toDataURL()
      console.log('Saving signature:', key, dataUrl.substring(0, 50) + '...')
      setSignatures(prev => ({ ...prev, [key]: dataUrl }))
    }
  }

  const addCanvas = (section: string) => {
    const newCanvas: CanvasData = {
      id: `canvas_${Date.now()}`,
      title: `${section} 설명 그림`
    }
    setCanvases(prev => [...prev, newCanvas])
  }

  // Auto-save canvas on every stroke
  const handleCanvasEnd = (canvasId: string) => {
    if (signatureRefs.current[canvasId]) {
      const dataUrl = signatureRefs.current[canvasId].toDataURL()
      console.log('Saving canvas drawing:', canvasId, dataUrl.substring(0, 50) + '...')
      setCanvases(prev => {
        const updated = prev.map(canvas => 
          canvas.id === canvasId ? { ...canvas, imageData: dataUrl } : canvas
        )
        // Also save to localStorage immediately
        localStorage.setItem('canvasDrawings', JSON.stringify(updated.filter(c => c.imageData)))
        return updated
      })
    }
  }

  const deleteCanvas = (canvasId: string) => {
    setCanvases(prev => prev.filter(c => c.id !== canvasId))
  }

  const handleComplete = () => {
    const allSignatureData = {
      ...signatures,
      canvases: canvases.filter(c => c.imageData).map(c => ({
        id: c.id,
        title: c.title,
        imageData: c.imageData
      }))
    }
    
    localStorage.setItem('signatureData', JSON.stringify(allSignatureData))
    localStorage.setItem('canvasDrawings', JSON.stringify(canvases.filter(c => c.imageData)))
    onComplete()
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
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-6">환자 정보</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">이름:</span>
                <span className="font-medium text-slate-900">{formData.patient_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">나이:</span>
                <span className="font-medium text-slate-900">{formData.patient_age}세</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">성별:</span>
                <span className="font-medium text-slate-900">{formData.patient_gender === "MALE" ? "남성" : "여성"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">수술명:</span>
                <span className="font-medium text-slate-900">{formData.surgery_name || "지정되지 않음"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 수술 동의 내용 */}
        {consentData?.consents && (
          <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-6">수술 동의 내용</h3>
              <div className="space-y-4">
                {consentData.consents.map((consent: ConsentItem, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-900">{consent.item_title}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCanvas(consent.item_title)}
                        className="border-slate-200 hover:bg-slate-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        그림 추가
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600">{consent.description}</p>
                    
                    {canvases.filter(c => c.title.includes(consent.item_title)).map(canvas => (
                      <div key={canvas.id} className="mt-3 p-3 bg-white rounded-md border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-slate-700">{canvas.title}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCanvas(canvas.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Drawing canvas with auto-save */}
                        <div className="border border-slate-200 rounded bg-white">
                          <SignatureCanvas
                            ref={(ref) => {
                              if (ref) signatureRefs.current[canvas.id] = ref
                            }}
                            canvasProps={{
                              className: "w-full",
                              height: 250
                            }}
                            onEnd={() => handleCanvasEnd(canvas.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 전자 서명 */}
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-6">전자 서명</h3>
            <div className="space-y-4">
              {requiredSignatures.map(sig => (
                <div key={sig.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">{sig.label} - {sig.name}</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
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
                        if (ref) signatureRefs.current[sig.key] = ref
                      }}
                      canvasProps={{
                        className: "w-full",
                        height: 150
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
            disabled={!allSignaturesComplete}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-6 py-3 h-auto font-medium rounded-lg transition-all flex items-center gap-2"
          >
            다음 단계
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}