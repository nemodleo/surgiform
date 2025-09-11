"use client"

import { useState, useRef, useEffect } from "react"
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
      (window as any).debugCanvas = {
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
        delete (window as any).debugCanvas
      }
    }
  }, [])

  // Load saved data on mount
  useEffect(() => {
    console.log('🚀 ConfirmationPage mounting, checking sessionStorage...')
    
    // Debug: Show all sessionStorage keys
    const allKeys = Object.keys(sessionStorage)
    console.log('📦 All sessionStorage keys:', allKeys)
    
    // Load signature data from sessionStorage (consent flow specific)
    const savedSignatures = sessionStorage.getItem('confirmationSignatures')
    console.log('🖋️ confirmationSignatures in sessionStorage:', savedSignatures ? 'Found' : 'Not found')
    if (savedSignatures) {
      try {
        const parsed = JSON.parse(savedSignatures)
        setSignatures(parsed)
        console.log('✅ Loaded signatures from sessionStorage:', Object.keys(parsed))
      } catch (e) {
        console.error('❌ Error loading signatures:', e)
      }
    }

    // Load canvas data from sessionStorage
    const savedCanvases = sessionStorage.getItem('confirmationCanvases')
    console.log('🎨 confirmationCanvases in sessionStorage:', savedCanvases ? `Found (${savedCanvases.length} chars)` : 'Not found')
    if (savedCanvases) {
      try {
        const parsed = JSON.parse(savedCanvases)
        setCanvases(parsed)
        console.log('✅ Loaded canvases from sessionStorage:', parsed.length, 'canvases')
        parsed.forEach((c: CanvasData, index: number) => {
          console.log(`📋 Canvas ${index + 1}: id=${c.id}, title="${c.title}", hasData=${!!c.imageData}, dataLength=${c.imageData?.length || 0}`)
        })
      } catch (e) {
        console.error('❌ Error loading canvases:', e)
      }
    } else {
      console.log('⚠️ No canvas data found in sessionStorage')
    }
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
        console.log(`❌ Canvas ${canvasId} restore attempt ${attempts + 1} failed:`, e.message)
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
    console.log('➕ Adding new canvas:', newCanvas.id, 'for section:', section)
    setCanvases(prev => {
      const updated = [...prev, newCanvas]
      console.log('➕ New canvas added, total canvases:', updated.length)
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

  const handleComplete = () => {
    const allSignatureData = {
      ...signatures,
      canvases: canvases.filter(c => c.imageData).map(c => ({
        id: c.id,
        title: c.title,
        imageData: c.imageData
      }))
    }
    
    // Save to sessionStorage for consent flow persistence
    sessionStorage.setItem('signatureData', JSON.stringify(allSignatureData))
    sessionStorage.setItem('confirmationCompleted', 'true')
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
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (signatureRefs.current[canvas.id]) {
                                  signatureRefs.current[canvas.id].clear()
                                  // Clear the saved data
                                  setCanvases(prev => {
                                    const updated = prev.map(c => 
                                      c.id === canvas.id ? { ...c, imageData: undefined } : c
                                    )
                                    sessionStorage.setItem('confirmationCanvases', JSON.stringify(updated))
                                    return updated
                                  })
                                  // Mark as not restored so it can be restored again if needed
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
                        
                        {/* Drawing canvas with auto-save */}
                        <div className="border border-slate-200 rounded bg-white relative">
                          {canvas.imageData && (
                            <div className="absolute top-2 right-2 z-10 text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              저장됨
                            </div>
                          )}
                          <SignatureCanvas
                            ref={(ref) => {
                              if (ref) {
                                console.log(`🎨 Setting ref for canvas ${canvas.id}`)
                                signatureRefs.current[canvas.id] = ref
                                
                                // Check for pending restore data or current canvas data
                                const imageData = pendingRestores.current[canvas.id] || canvas.imageData
                                if (imageData && !restoredCanvases.current.has(canvas.id)) {
                                  console.log(`📦 Found image data for canvas ${canvas.id}, restoring...`)
                                  // Use a longer delay to ensure canvas is fully ready
                                  setTimeout(() => restoreCanvas(canvas.id, imageData), 300)
                                }
                              }
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