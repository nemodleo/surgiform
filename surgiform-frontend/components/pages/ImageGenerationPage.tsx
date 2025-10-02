"use client"

import { useState, useEffect } from "react"
import styles from "@/styles/page-layout.module.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight, Trash2, RefreshCw } from "lucide-react"
import { surgiformAPI, type SurgicalStep, type GeneratedImage } from "@/lib/api"
import toast from "react-hot-toast"

interface ImageData {
  steps: SurgicalStep[]
  images: GeneratedImage[]
}

interface FormData extends Record<string, unknown> {
  surgery_name: string
  patient_name: string
}

interface ImageGenerationPageProps {
  onComplete: (data: ImageData) => void
  onBack: () => void
  formData: FormData
  initialData?: ImageData
}

interface ImageCard {
  id: string
  index: number
  title: string
  desc: string
  geminiPrompt: string
  image?: GeneratedImage
  isGenerating?: boolean
}

export default function ImageGenerationPage({
  onComplete,
  onBack,
  formData,
  initialData
}: ImageGenerationPageProps) {
  const [cards, setCards] = useState<ImageCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasExtractedSteps, setHasExtractedSteps] = useState(false)

  // Cache key for extracted steps
  const getCacheKey = (surgeryName: string) => `extracted_steps_${surgeryName}`

  useEffect(() => {
    if (initialData?.steps) {
      // Load from existing data
      const initialCards = initialData.steps.map(step => ({
        id: step.id,
        index: step.index,
        title: step.title,
        desc: step.desc,
        geminiPrompt: step.geminiPrompt,
        image: initialData.images?.find(img => img.stepId === step.id)
      }))
      setCards(initialCards)
      setHasExtractedSteps(true)
    } else if (formData.surgery_name) {
      // Check cache first
      const cacheKey = getCacheKey(formData.surgery_name as string)
      const cachedSteps = sessionStorage.getItem(cacheKey)

      if (cachedSteps) {
        try {
          const parsedSteps = JSON.parse(cachedSteps)
          const initialCards = parsedSteps.map((step: SurgicalStep) => ({
            id: step.id,
            index: step.index,
            title: step.title,
            desc: step.desc,
            geminiPrompt: step.geminiPrompt
          }))
          setCards(initialCards)
          setHasExtractedSteps(true)
          toast.success('캐시된 수술 이미지를 불러왔습니다')
        } catch (error) {
          console.error('Failed to parse cached steps:', error)
          extractSteps()
        }
      } else {
        // Extract steps automatically
        extractSteps()
      }
    }
  }, [formData.surgery_name, initialData])

  const extractSteps = async () => {
    if (!formData.surgery_name) return

    setIsLoading(true)
    try {
      const response = await surgiformAPI.extractSurgicalSteps({
        procedure_name: formData.surgery_name as string,
        max_steps: 3,
        language: 'ko'
      })

      const initialCards = response.data.steps.map(step => ({
        id: step.id,
        index: step.index,
        title: step.title,
        desc: step.desc,
        geminiPrompt: step.geminiPrompt
      }))

      setCards(initialCards)
      setHasExtractedSteps(true)

      // Cache the extracted steps
      const cacheKey = getCacheKey(formData.surgery_name as string)
      sessionStorage.setItem(cacheKey, JSON.stringify(response.data.steps))

      toast.success('수술 단계가 성공적으로 재생성되었습니다')
    } catch (error) {
      console.error('Failed to extract steps:', error)
      toast.error('수술 이미지 추출에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const generateImage = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, isGenerating: true } : c
    ))

    try {
      const response = await surgiformAPI.generateSurgicalImages({
        steps: [{
          id: card.id,
          index: card.index,
          title: card.title,
          desc: card.desc,
          geminiPrompt: card.geminiPrompt
        }]
      })

      const generatedImage = response.data.images[0]
      if (generatedImage) {
        setCards(prev => prev.map(c =>
          c.id === cardId ? { ...c, image: generatedImage, isGenerating: false } : c
        ))
        toast.success('이미지가 생성되었습니다')
      }
    } catch (error) {
      console.error('Failed to generate image:', error)
      toast.error('이미지 생성에 실패했습니다')
      setCards(prev => prev.map(c =>
        c.id === cardId ? { ...c, isGenerating: false } : c
      ))
    }
  }

  const addNewCard = () => {
    const newIndex = cards.length + 1
    const newCard: ImageCard = {
      id: `s${newIndex}`,
      index: newIndex,
      title: '',
      desc: '',
      geminiPrompt: ''
    }
    setCards(prev => [...prev, newCard])
  }

  const updateCard = (cardId: string, field: keyof ImageCard, value: string) => {
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, [field]: value } : c
    ))
  }

  const removeCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId))
  }

  const handleComplete = () => {
    const steps: SurgicalStep[] = cards.map(card => ({
      id: card.id,
      index: card.index,
      title: card.title,
      desc: card.desc,
      geminiPrompt: card.geminiPrompt
    }))

    const images: GeneratedImage[] = cards
      .filter(card => card.image)
      .map(card => card.image!)

    onComplete({ steps, images })
  }

  const canProceed = cards.length > 0 && cards.every(card =>
    card.title.trim() && card.desc.trim() && card.geminiPrompt.trim()
  )

  return (
    <div className={`max-w-4xl mx-auto ${styles.pageBottomSpacing}`}>
      <div className="space-y-8">
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              수술 이미지 생성
            </h2>
            <p className="text-sm text-slate-600">
              프롬프트를 수정하여 원하는 이미지를 생성할 수 있고, 생성된 이미지는 다음 단계인 "확인 · 서명" 그림 캔버스에서 사용할 수 있습니다.
            </p>
          </div>
        </div>

        {isLoading && !hasExtractedSteps ? (
          <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-slate-600">수술 단계를 추출하고 있습니다...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => (
                <div key={card.id} className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors relative">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        # {card.index}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCard(card.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1 block">
                          제목
                        </Label>
                        <Input
                          value={card.title}
                          onChange={(e) => updateCard(card.id, 'title', e.target.value)}
                          placeholder="예: 절개 만들기"
                          className="h-10 bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1 block">
                          설명
                        </Label>
                        <textarea
                          value={card.desc}
                          onChange={(e) => updateCard(card.id, 'desc', e.target.value)}
                          placeholder="예: 복부에 수술 절개를 만듭니다"
                          className="min-h-[60px] bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md w-full p-2 text-sm resize-none"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1 block">
                          이미지 프롬프트
                        </Label>
                        <textarea
                          value={card.geminiPrompt}
                          onChange={(e) => updateCard(card.id, 'geminiPrompt', e.target.value)}
                          placeholder="이미지 생성을 위한 프롬프트를 입력하세요"
                          className="min-h-[80px] bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md w-full p-2 text-sm resize-none"
                        />
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        {card.image ? (
                          <div className="space-y-3">
                            <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                              <img
                                src={`data:${card.image.mimeType};base64,${card.image.data}`}
                                alt={card.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              onClick={() => generateImage(card.id)}
                              size="sm"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-lg"
                              disabled={!card.geminiPrompt.trim() || card.isGenerating}
                            >
                              {card.isGenerating ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  재생성 중...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-4 h-4 mr-2" />
                                  재생성
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => generateImage(card.id)}
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-lg"
                            disabled={!card.geminiPrompt.trim() || card.isGenerating}
                          >
                            {card.isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                생성 중...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-4 h-4 mr-2" />
                                이미지 생성
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-dashed border-2 border-slate-300 bg-slate-50/50 rounded-xl min-h-[400px] flex items-center justify-center">
                <Button
                  variant="ghost"
                  onClick={addNewCard}
                  className="flex flex-col items-center space-y-2 text-slate-500 hover:text-slate-700 h-auto p-6"
                >
                  <Plus className="w-8 h-8" />
                  <span className="text-sm">새 카드 추가</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Section */}
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 h-auto font-medium rounded-lg"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            이전
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={extractSteps}
              disabled={isLoading}
              className="border-blue-200 hover:bg-blue-50 text-blue-700 px-6 py-3 h-auto font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              AI 재생성
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!canProceed}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-6 py-3 h-auto font-medium rounded-lg transition-all"
            >
              다음
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}