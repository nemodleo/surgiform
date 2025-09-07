"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, RotateCcw, Check, Plus } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"

interface ConfirmationPageProps {
  onComplete: () => void
  formData: any
  consentData: any
}

interface CanvasData {
  id: string
  title: string
  imageData?: string
}

export default function ConfirmationPage({ onComplete, formData, consentData }: ConfirmationPageProps) {
  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [canvases, setCanvases] = useState<CanvasData[]>([])
  const [showCanvas, setShowCanvas] = useState<string | null>(null)
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
      setSignatures(prev => ({ ...prev, [key]: dataUrl }))
    }
  }

  const addCanvas = (section: string) => {
    const newCanvas: CanvasData = {
      id: `canvas_${Date.now()}`,
      title: `${section} 설명 그림`
    }
    setCanvases(prev => [...prev, newCanvas])
    setShowCanvas(newCanvas.id)
  }

  const saveCanvas = (canvasId: string) => {
    if (signatureRefs.current[canvasId]) {
      const dataUrl = signatureRefs.current[canvasId].toDataURL()
      setCanvases(prev => prev.map(canvas => 
        canvas.id === canvasId ? { ...canvas, imageData: dataUrl } : canvas
      ))
      setShowCanvas(null)
    }
  }

  const handleComplete = () => {
    const allSignatureData = {
      ...signatures,
      canvases: canvases.filter(c => c.imageData)
    }
    
    localStorage.setItem('signatureData', JSON.stringify(allSignatureData))
    onComplete()
  }

  const requiredSignatures = [
    { key: "patient", label: "환자 서명", name: formData.patient_name },
    { key: "doctor", label: "의사 서명", name: formData.participants?.[0]?.name || "의사" }
  ]

  const allSignaturesComplete = requiredSignatures.every(sig => signatures[sig.key])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>수술 동의서 확인 및 서명</CardTitle>
          <CardDescription>
            수술 동의서 내용을 최종 확인하고 서명해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">환자 정보</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">이름:</span> {formData.patient_name}
              </div>
              <div>
                <span className="text-gray-600">나이:</span> {formData.patient_age}세
              </div>
              <div>
                <span className="text-gray-600">성별:</span> {formData.patient_gender === "MALE" ? "남성" : "여성"}
              </div>
              <div>
                <span className="text-gray-600">수술명:</span> {formData.surgery_name}
              </div>
            </div>
          </div>

          {consentData?.consents && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">수술 동의 내용</h3>
              {consentData.consents.map((consent: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{consent.item_title}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCanvas(consent.item_title)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      그림 추가
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">{consent.description}</p>
                  
                  {canvases.filter(c => c.title.includes(consent.item_title) && c.imageData).map(canvas => (
                    <div key={canvas.id} className="mt-2 p-2 bg-gray-100 rounded">
                      <p className="text-xs text-gray-500 mb-1">{canvas.title}</p>
                      <img 
                        src={canvas.imageData} 
                        alt={canvas.title}
                        className="max-w-full h-auto border rounded"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">전자 서명</h3>
            {requiredSignatures.map(sig => (
              <div key={sig.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium">{sig.label} - {sig.name}</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSignatureClear(sig.key)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSignatureSave(sig.key)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <SignatureCanvas
                    ref={(ref) => {
                      if (ref) signatureRefs.current[sig.key] = ref
                    }}
                    canvasProps={{
                      className: "w-full",
                      height: 150
                    }}
                  />
                </div>
                {signatures[sig.key] && (
                  <p className="text-sm text-green-600">✓ 서명 완료</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showCanvas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>설명 그림 그리기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-gray-300 rounded-lg bg-white mb-4">
                <SignatureCanvas
                  ref={(ref) => {
                    if (ref) signatureRefs.current[showCanvas] = ref
                  }}
                  canvasProps={{
                    className: "w-full",
                    height: 300
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCanvas(null)}>
                  취소
                </Button>
                <Button onClick={() => saveCanvas(showCanvas)}>
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleComplete}
          disabled={!allSignaturesComplete}
          size="lg"
        >
          서명 완료 및 PDF 생성
        </Button>
      </div>
    </div>
  )
}