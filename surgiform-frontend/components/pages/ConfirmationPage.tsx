"use client"

import { useState, useRef, useEffect } from "react"
import styles from "@/styles/page-layout.module.css"
import { Button } from "@/components/ui/button"
import { RotateCcw, Check, Plus, ChevronLeft, ChevronRight, X, Loader2, Upload, Image as ImageIcon, Mic, Play, Square, FileText, Eraser, Pause, Bot, Sparkles } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"
import { createConsentSubmission } from "@/lib/consentDataFormatter"
import toast from "react-hot-toast"
import { ChatUI } from "@/components/ui/chat"
import { useConsentGeneration } from "@/hooks/useConsentGeneration"

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

interface GeneratedImage {
  stepId: string;
  mimeType: string;
  data: string; // Base64 encoded image
  url?: string;
}

interface ConfirmationPageProps {
  onComplete: () => void
  onBack?: () => void
  formData: FormData
  consentData: ConsentData
  generatedImages?: GeneratedImage[]
}

interface CanvasData {
  id: string
  title: string
  imageData?: string
  createdAt: number // 추가: 생성 시간
}

interface AudioData {
  id: string
  title: string
  audioBlob?: Blob
  audioUrl?: string
  duration?: number
  createdAt: number // 추가: 생성 시간
}

interface TextData {
  id: string
  title: string
  content: string
  createdAt: number // 추가: 생성 시간
}

interface MediaElement {
  id: string
  title: string
  type: 'canvas' | 'audio' | 'text'
  createdAt: number
  canvasData?: CanvasData
  audioData?: AudioData
  textData?: TextData
}

export default function ConfirmationPage({ onComplete, onBack, formData, consentData, generatedImages = [] }: ConfirmationPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageSelectionModal, setImageSelectionModal] = useState<{
    isOpen: boolean
    canvasId: string
  }>({ isOpen: false, canvasId: '' })

  const {
    showChat,
    setShowChat,
    chatMessages,
    setChatMessages,
    handleSendMessage: handleChatMessage,
  } = useConsentGeneration()

  useEffect(() => {
  }, [generatedImages])
  const submissionRef = useRef(false)
  const [surgerySiteMarking, setSurgerySiteMarking] = useState<{
    marking: 'yes' | 'no' | null
    reason: string
  }>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('surgerySiteMarking')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
        }
      }
    }
    return { marking: null, reason: '' }
  })
  const [signatures, setSignatures] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmationSignatures')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return parsed
        } catch (e) {
        }
      }
    }
    return {}
  })
  const [canvases, setCanvases] = useState<CanvasData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmationCanvases')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return parsed
        } catch (e) {
        }
      }
    }
    return []
  })

  const [audioRecordings, setAudioRecordings] = useState<AudioData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmationAudioRecordings')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
        }
      }
    }
    return []
  })

  const [textNotes, setTextNotes] = useState<TextData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmationTextNotes')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
        }
      }
    }
    return []
  })

  const [isRecording, setIsRecording] = useState(false)
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playingTime, setPlayingTime] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const playingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioAnalyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const waveformRef = useRef<number[]>([])
  const currentRecordingTimeRef = useRef<number>(0)

  const signatureRefs = useRef<Record<string, SignatureCanvas>>({})
  const restoredCanvases = useRef<Set<string>>(new Set())
  const pendingRestores = useRef<Record<string, string>>({})

  const checkSessionStorage = () => {
    const current = sessionStorage.getItem('confirmationCanvases')
    if (current) {
      try {
        const parsed = JSON.parse(current)
      } catch (e) {
      }
    }
  }

  useEffect(() => {
    const interval = setInterval(checkSessionStorage, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (playingTimerRef.current) {
        clearInterval(playingTimerRef.current)
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  useEffect(() => {
    canvases.forEach((c, i) => {
    })
  }, [canvases])

  useEffect(() => {
    
    if (typeof window !== 'undefined') {
      (window as unknown as { debugCanvas?: { checkStorage: () => void; forceRestore: () => void; clearStorage: () => void } }).debugCanvas = {
        checkStorage: () => {
          const storage = sessionStorage.getItem('confirmationCanvases')
          if (storage) {
            const parsed = JSON.parse(storage)
            parsed.forEach((c: CanvasData, i: number) => {
            })
          }
        },
        forceRestore: () => {
          restoredCanvases.current.clear()
          canvases.forEach(canvas => {
            if (canvas.imageData) {
              restoreCanvas(canvas.id, canvas.imageData)
            }
          })
        },
        clearStorage: () => {
          sessionStorage.removeItem('confirmationCanvases')
        }
      }
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as { debugCanvas?: unknown }).debugCanvas
      }
    }
  }, [])

  useEffect(() => {
    
    const allKeys = Object.keys(sessionStorage)
    

    canvases.forEach((c: CanvasData, index: number) => {
    })
  }, [canvases, signatures])

  useEffect(() => {
    if (Object.keys(signatures).length > 0) {
      sessionStorage.setItem('confirmationSignatures', JSON.stringify(signatures))
    }
  }, [signatures])

  useEffect(() => {
    canvases.forEach((c, index) => {
    })
    saveCanvasesToStorage(canvases)
  }, [canvases])

  useEffect(() => {
    canvases.forEach(canvas => {
      if (canvas.imageData && !restoredCanvases.current.has(canvas.id)) {
        setTimeout(() => {
          if (signatureRefs.current[canvas.id]) {
            restoreCanvas(canvas.id, canvas.imageData!)
          } else {
            pendingRestores.current[canvas.id] = canvas.imageData!
          }
        }, 500)
      }
    })
  }, [canvases]) // Trigger when canvases changes

  const restoreCanvas = (canvasId: string, imageData: string) => {
    
    if (restoredCanvases.current.has(canvasId)) {
      return
    }
    
    pendingRestores.current[canvasId] = imageData
    
    if (!signatureRefs.current[canvasId]) {
      return
    }
    
    const ref = signatureRefs.current[canvasId]
    const attemptRestore = (attempts = 0) => {
      try {
        ref.fromDataURL(imageData)
        restoredCanvases.current.add(canvasId)
        delete pendingRestores.current[canvasId]
      } catch (e) {
        if (attempts < 15) {
          setTimeout(() => attemptRestore(attempts + 1), 100 + (attempts * 50))
        } else {
        }
      }
    }
    
    attemptRestore()
  }

  const handleSignatureClear = (key: string) => {
    if (signatureRefs.current[key]) {
      signatureRefs.current[key].clear()
      setSignatures(prev => {
        const newSigs = { ...prev }
        delete newSigs[key]
        sessionStorage.setItem('confirmationSignatures', JSON.stringify(newSigs))
        return newSigs
      })
    }
  }

  const handleSignatureSave = (key: string) => {
    if (signatureRefs.current[key]) {
      if (!signatureRefs.current[key].isEmpty()) {
        const dataUrl = signatureRefs.current[key].toDataURL()
        setSignatures(prev => {
          const updated = { ...prev, [key]: dataUrl }
          sessionStorage.setItem('tempSignatures', JSON.stringify(updated))
          return updated
        })
      } else {
      }
    } else {
    }
  }

  const addCanvas = (section: string) => {
    const now = Date.now()
    const newCanvas: CanvasData = {
      id: `canvas_${now}`,
      title: `${section} - 그림`,
      createdAt: now
    }
    setCanvases(prev => {
      const updated = [...prev, newCanvas]
      saveCanvasesToStorage(updated)
      return updated
    })
  }

  const addAudioRecording = (section: string) => {
    const now = Date.now()
    const newAudio: AudioData = {
      id: `audio_${now}`,
      title: `${section} - 음성`,
      createdAt: now
    }
    setAudioRecordings(prev => {
      const updated = [...prev, newAudio]
      sessionStorage.setItem('confirmationAudioRecordings', JSON.stringify(updated))
      return updated
    })
  }

  const removeAudioRecording = (audioId: string) => {
    setAudioRecordings(prev => {
      const updated = prev.filter(audio => audio.id !== audioId)
      sessionStorage.setItem('confirmationAudioRecordings', JSON.stringify(updated))
      return updated
    })
  }

  const addTextNote = (section: string) => {
    const now = Date.now()
    const newText: TextData = {
      id: `text_${now}`,
      title: `${section} - 텍스트`,
      content: '',
      createdAt: now
    }
    setTextNotes(prev => {
      const updated = [...prev, newText]
      sessionStorage.setItem('confirmationTextNotes', JSON.stringify(updated))
      return updated
    })
  }

  const removeTextNote = (textId: string) => {
    setTextNotes(prev => {
      const updated = prev.filter(text => text.id !== textId)
      sessionStorage.setItem('confirmationTextNotes', JSON.stringify(updated))
      return updated
    })
  }

  const updateTextNote = (textId: string, content: string) => {
    setTextNotes(prev => {
      const updated = prev.map(text => 
        text.id === textId ? { ...text, content } : text
      )
      sessionStorage.setItem('confirmationTextNotes', JSON.stringify(updated))
      return updated
    })
  }

  const getSortedMediaElements = (section: string): MediaElement[] => {
    const sectionCanvases = canvases
      .filter(c => c.title.includes(section))
      .map(canvas => ({
        id: canvas.id,
        title: canvas.title,
        type: 'canvas' as const,
        createdAt: canvas.createdAt,
        canvasData: canvas
      }))

    const sectionAudios = audioRecordings
      .filter(a => a.title.includes(section))
      .map(audio => ({
        id: audio.id,
        title: audio.title,
        type: 'audio' as const,
        createdAt: audio.createdAt,
        audioData: audio
      }))

    const sectionTexts = textNotes
      .filter(t => t.title.includes(section))
      .map(text => ({
        id: text.id,
        title: text.title,
        type: 'text' as const,
        createdAt: text.createdAt,
        textData: text
      }))

    return [...sectionCanvases, ...sectionAudios, ...sectionTexts].sort((a, b) => a.createdAt - b.createdAt)
  }


  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '00:00'
    }
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const analyzeAudioLevel = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    
    const normalizedValue = Math.min(average / 255, 1)
    waveformRef.current.push(normalizedValue)
    
    if (waveformRef.current.length > 100) {
      waveformRef.current = waveformRef.current.slice(-100)
    }
    
    setWaveformData([...waveformRef.current])
    
    animationFrameRef.current = requestAnimationFrame(() => analyzeAudioLevel(analyser))
  }

  const checkMicrophonePermission = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      return permissionStatus.state
    } catch (error) {
      return 'unknown'
    }
  }

  const startRecording = async (audioId: string) => {
    
    const existingRecording = audioRecordings.find(rec => rec.id === audioId)
    if (existingRecording && existingRecording.audioBlob) {
      toast.error('이미 녹음된 음성이 있습니다. 새로 녹음하려면 기존 음성을 삭제해주세요.')
      return
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('이 브라우저는 음성 녹음을 지원하지 않습니다.')
      return
    }
    
    if (!window.MediaRecorder) {
      toast.error('이 브라우저는 MediaRecorder를 지원하지 않습니다.')
      return
    }


    try {
      
      
      const streamPromise = navigator.mediaDevices.getUserMedia({ 
        audio: true
      })
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('getUserMedia timeout after 5 seconds')), 5000)
      })
      
      const stream = await Promise.race([streamPromise, timeoutPromise]) as MediaStream
      
      
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioAnalyserRef.current = analyser
      
      analyzeAudioLevel(analyser)
      
      const supportedTypes = [
        'audio/webm;codecs=opus',  // 최우선 - 가장 안정적
        'audio/webm',
        'audio/mp4',
        'audio/wav',
        'audio/ogg'
      ]

      let mimeType = ''
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          break
        }
      }
      
      if (!mimeType) {
        mimeType = 'audio/webm'
      }

      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000, // 적절한 비트레이트 설정
      }
      
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []


      setRecordingId(audioId)
      setIsRecording(true)
      setRecordingTime(0)

      
      currentRecordingTimeRef.current = 0
      recordingTimerRef.current = setInterval(() => {
        currentRecordingTimeRef.current += 1
        setRecordingTime(currentRecordingTimeRef.current)
        
        if (currentRecordingTimeRef.current >= 300) {
          stopRecording()
          toast.error('녹음 시간이 5분을 초과했습니다.')
        }
        
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          try {
            if (typeof mediaRecorderRef.current.requestData === 'function') {
              mediaRecorderRef.current.requestData()
            }
          } catch {
          }
        }
      }, 1000)
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          
          if (event.timecode && event.timecode > 0) {
            const timecodeSeconds = event.timecode / 1000
            const currentTime = currentRecordingTimeRef.current
            
            const moreAccurateTime = Math.max(currentTime, timecodeSeconds)
            if (moreAccurateTime > currentTime) {
              currentRecordingTimeRef.current = moreAccurateTime
            }
          }
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const audioUrl = URL.createObjectURL(audioBlob)

        generateSTTText()

        const capturedRecordingTime = currentRecordingTimeRef.current
        const stateRecordingTime = recordingTime

        const updateAudioDuration = (duration: number) => {
          setAudioRecordings(prev => {
            const updated = prev.map(recording => {
              if (recording.id === audioId) {
                const currentDuration = recording.duration || 0
                const finalDuration = Math.max(duration, currentDuration)
                
                if (finalDuration > currentDuration) {
                  return { ...recording, audioBlob, audioUrl, duration: finalDuration }
                } else {
                  return { ...recording, audioBlob, audioUrl }
                }
              }
              return recording
            })
            sessionStorage.setItem('confirmationAudioRecordings', JSON.stringify(updated))
            return updated
          })
        }

        const bestDuration = Math.max(capturedRecordingTime, stateRecordingTime)
        updateAudioDuration(bestDuration)

        const tempAudio = new Audio(audioUrl)
        
        const updateFromAudio = () => {
          const actualDuration = tempAudio.duration
          
          if (actualDuration && isFinite(actualDuration) && !isNaN(actualDuration) && actualDuration > 0) {
            const mostAccurateDuration = Math.max(actualDuration, bestDuration)
            updateAudioDuration(mostAccurateDuration)
          }
        }

        tempAudio.addEventListener('loadedmetadata', updateFromAudio)
        
        tempAudio.addEventListener('durationchange', updateFromAudio)
        
        tempAudio.addEventListener('canplay', updateFromAudio)

        const checkDuration = (delay: number) => {
          setTimeout(() => {
            if (tempAudio.readyState >= 1) { // HAVE_METADATA
              const actualDuration = tempAudio.duration
              
              if (actualDuration && isFinite(actualDuration) && !isNaN(actualDuration) && actualDuration > 0) {
                const finalDuration = Math.max(actualDuration, bestDuration)
                updateAudioDuration(finalDuration)
              } else if (bestDuration > 0) {
                updateAudioDuration(bestDuration)
              }
            }
          }, delay)
        }

        checkDuration(100)
        checkDuration(500)
        checkDuration(1000)
        checkDuration(2000)


        stream.getTracks().forEach(track => {
          track.stop()
        })
        toast.success('음성 녹음이 완료되었습니다.')
      }
      
      mediaRecorder.onstart = () => {
      }
      
      mediaRecorder.onerror = (event) => {
        
        if (event.error && event.error.name === 'NotSupportedError') {
        }
        
        toast.error('음성 녹음 중 오류가 발생했습니다.')
        setIsRecording(false)
        setRecordingId(null)
      }
      
      mediaRecorder.start() // timeSlice 없이 시작 - 브라우저 호환성 향상
      toast('음성 녹음을 시작했습니다.')
      
    } catch (error) {
      const errorObj = error as Error

      if (errorObj.name === 'NotAllowedError') {
        const userConfirmed = window.confirm(
          '마이크 권한이 거부되었습니다.\n\n' +
          '다음 방법으로 권한을 허용해주세요:\n\n' +
          'Chrome:\n' +
          '1. 주소창 왼쪽 🔒 아이콘 클릭\n' +
          '2. 마이크를 "허용"으로 변경\n' +
          '또는\n' +
          'chrome://settings/content/microphone 접속\n\n' +
          'Safari:\n' +
          'Safari → 환경설정 → 웹사이트 → 마이크\n' +
          'localhost 항목 찾아서 권한 삭제\n\n' +
          '권한 설정 후 페이지를 새로고침하시겠습니까?'
        )
        
        if (userConfirmed) {
          window.location.reload()
        }
        
      } else if (errorObj.name === 'NotFoundError') {
        toast.error('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.')
      } else if (errorObj.name === 'NotSupportedError') {
        toast.error('이 브라우저는 음성 녹음을 지원하지 않습니다.')
      } else if (errorObj.message && errorObj.message.includes('timeout')) {
        toast.error('마이크 권한 요청이 시간 초과되었습니다. 브라우저 설정에서 마이크 권한을 확인해주세요.')
        
        const retryConfirmed = window.confirm(
          '마이크 권한이 아직 허용되지 않았습니다.\n\n' +
          '브라우저 설정에서 마이크 권한을 허용한 후\n' +
          '다시 시도하시겠습니까?'
        )
        
        if (retryConfirmed) {
          startRecording(audioId)
        }
      } else {
        toast.error('음성 녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.')
      }
    }
  }
  
  const generateSTTText = () => {
    
  }

  const stopRecording = () => {
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingId(null)
      
      setTimeout(() => {
        setRecordingTime(0)
        setWaveformData([])
        waveformRef.current = []
        currentRecordingTimeRef.current = 0
      }, 100)
    }
  }
  
  const playAudio = (audioId: string) => {
    const recording = audioRecordings.find(r => r.id === audioId)
    if (recording?.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      const audio = new Audio(recording.audioUrl)
      audioRef.current = audio
      setPlayingId(audioId)
      
      setPlayingTime(0)
      playingTimerRef.current = setInterval(() => {
        if (audio && !audio.paused) {
          setPlayingTime(audio.currentTime)
          const randomValue = Math.random() * 0.8 + 0.2
          setWaveformData(prev => {
            const newData = [...prev, randomValue]
            return newData.slice(-50) // 최대 50개 데이터 포인트 유지
          })
        }
      }, 100)
      
      audio.onended = () => {
        setPlayingId(null)
        setPlayingTime(0)
        setWaveformData([])
        if (playingTimerRef.current) {
          clearInterval(playingTimerRef.current)
          playingTimerRef.current = null
        }
      }
      
      audio.play()
    }
  }
  
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingId(null)
      setPlayingTime(0)
      setWaveformData([])
      if (playingTimerRef.current) {
        clearInterval(playingTimerRef.current)
        playingTimerRef.current = null
      }
    }
  }

  const handleCanvasEnd = (canvasId: string) => {
    if (signatureRefs.current[canvasId]) {
      const isEmpty = signatureRefs.current[canvasId].isEmpty()
      if (!isEmpty) {
        const dataUrl = signatureRefs.current[canvasId].toDataURL()
        setCanvases(prev => {
          const updated = prev.map(canvas => 
            canvas.id === canvasId ? { ...canvas, imageData: dataUrl } : canvas
          )
          saveCanvasesToStorage(updated)
          return updated
        })
      } else {
      }
    } else {
    }
  }

  const deleteCanvas = (canvasId: string) => {
    setCanvases(prev => {
      const updated = prev.filter(c => c.id !== canvasId)
      saveCanvasesToStorage(updated)
      return updated
    })
    restoredCanvases.current.delete(canvasId)
    delete signatureRefs.current[canvasId]
  }

  const resizeImageToFit = (dataUrl: string, maxWidth: number = 335, maxHeight: number = 600, quality: number = 1): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        const originalWidth = img.width
        const originalHeight = img.height
        
        const scaleX = maxWidth / originalWidth
        const scaleY = maxHeight / originalHeight
        const scale = Math.min(scaleX, scaleY) // 더 작은 스케일 사용
        
        const resizedWidth = Math.floor(originalWidth * scale)
        const resizedHeight = Math.floor(originalHeight * scale)
        
        canvas.width = resizedWidth
        canvas.height = resizedHeight

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, resizedWidth, resizedHeight)
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      img.src = dataUrl
    })
  }

  const saveCanvasesToStorage = (canvases: CanvasData[]) => {
    try {
      const data = JSON.stringify(canvases)
      sessionStorage.setItem('confirmationCanvases', data)
    } catch (error) {
      try {
        localStorage.setItem('confirmationCanvases', JSON.stringify(canvases))
        toast('데이터가 localStorage에 저장되었습니다.')
      } catch (localError) {
        toast.error('저장 공간이 부족합니다. 이미지를 다시 업로드해주세요.')
      }
    }
  }

  const handleImageUpload = async (canvasId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('이미지 크기가 너무 큽니다. 50MB 이하의 파일을 선택해주세요.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const originalImageData = e.target?.result as string
      if (signatureRefs.current[canvasId]) {
        try {
          const resizedImageData = await resizeImageToFit(originalImageData, 335, 600, 1)
          
          const canvas = signatureRefs.current[canvasId]
          const img = new window.Image()
          img.onload = () => {
            const canvasElement = canvas.getCanvas()
            const ctx = canvasElement.getContext('2d')
            
            if (ctx) {
              const canvasWidth = canvasElement.width
              const canvasHeight = canvasElement.height
              
              
              const offsetX = 0  // 좌측 정렬
              const offsetY = 0  // 상단 정렬
              
              ctx.clearRect(0, 0, canvasWidth, canvasHeight)
              
              ctx.drawImage(img, offsetX, offsetY)
              
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
              
              setCanvases(prev => {
                const updated = prev.map(canvas => 
                  canvas.id === canvasId ? { ...canvas, imageData: dataUrl } : canvas
                )
                saveCanvasesToStorage(updated)
                return updated
              })
              
              toast.success('이미지가 캔버스에 추가되었습니다.')
            } else {
              toast.error('캔버스 컨텍스트를 가져올 수 없습니다.')
            }
          }
          img.src = resizedImageData
        } catch (error) {
          toast.error('이미지 처리 중 오류가 발생했습니다.')
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleGeneratedImageAdd = async (canvasId: string, generatedImage: GeneratedImage) => {
    if (signatureRefs.current[canvasId]) {
      try {
        const imageData = `data:${generatedImage.mimeType};base64,${generatedImage.data}`

        const resizedImageData = await resizeImageToFit(imageData, 250, 600, 1)

        const canvas = signatureRefs.current[canvasId]
        const img = new Image()
        img.onload = () => {
          const canvasElement = canvas.getCanvas()
          const ctx = canvasElement.getContext('2d')

          if (ctx) {
            const canvasWidth = canvasElement.width
            const canvasHeight = canvasElement.height

            const offsetX = 0  // 좌측 정렬
            const offsetY = 0  // 상단 정렬

            ctx.clearRect(0, 0, canvasWidth, canvasHeight)

            ctx.drawImage(img, offsetX, offsetY)

            const dataUrl = canvas.toDataURL('image/png')

            setCanvases(prev => {
              const updated = prev.map(canvas =>
                canvas.id === canvasId ? { ...canvas, imageData: dataUrl } : canvas
              )
              saveCanvasesToStorage(updated)
              return updated
            })

            toast.success('생성된 이미지가 캔버스에 추가되었습니다.')
          } else {
            toast.error('캔버스 컨텍스트를 가져올 수 없습니다.')
          }
        }
        img.src = resizedImageData
      } catch (error) {
        toast.error('이미지 처리 중 오류가 발생했습니다.')
      }
    }
  }

  const handleSendMessage = async (message: string, history: any[]) => {
    try {
      const consents = consentData.consents.reduce((acc, item) => {
        const key = item.item_title.toLowerCase().replace(/\s+/g, '_')
        acc[key] = item.description
        return acc
      }, {} as Record<string, string>)

      const response = await handleChatMessage(message, history, {
        formData,
        consents,
      })

      return response
    } catch (error) {
      throw error
    }
  }

  const handleComplete = async () => {
    if (isSubmitting || submissionRef.current) {
      return
    }


    setIsSubmitting(true)
    submissionRef.current = true

    try {

      const consentSubmissionData = createConsentSubmission(formData)

      
      toast.success('동의서가 성공적으로 저장되었습니다')

      const allSignatureData = {
        ...signatures,
        canvases: canvases.map(c => ({
          id: c.id,
          title: c.title,
          imageData: c.imageData
        }))
      }


      try {
        localStorage.setItem('signatureData', JSON.stringify(allSignatureData))
        localStorage.setItem('canvasDrawings', JSON.stringify(canvases))
        localStorage.setItem('consentSubmissionData', JSON.stringify(consentSubmissionData))
        localStorage.setItem('confirmationCompleted', 'true')

        sessionStorage.setItem('confirmationCompleted', 'true')

      } catch (storageError) {
        toast('데이터가 서버에 저장되었습니다')
      }

      onComplete()
    } catch (error) {
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


  return (
    <div className={`max-w-4xl mx-auto ${styles.pageBottomSpacing}`}>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            수술 동의서 확인
          </h2>
          <p className="text-sm text-slate-600">
            수술 동의서 내용을 최종 확인하고 서명해주세요.
          </p>
        </div>
        {/* 수술 동의서 내용 */}
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="p-6 space-y-6">
            {/* 수술 동의서 제목 */}
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-slate-900 mb-8">수술 동의서</h1>
              
              {/* 수술 동의서 제목 미디어 요소들 */}
              {getSortedMediaElements("수술 동의서 제목").map(mediaElement => {
                const canvas = mediaElement.type === 'canvas' ? mediaElement.canvasData : null
                const audio = mediaElement.type === 'audio' ? mediaElement.audioData : null
                const text = mediaElement.type === 'text' ? mediaElement.textData : null
                
                return (
                <div key={mediaElement.id} className="mt-3 p-3 bg-white rounded-md border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-700">{mediaElement.title}</p>
                    <div className="flex gap-1">
                      {mediaElement.type === 'canvas' && canvas && (
                        <>
                          {/* 생성된 이미지 선택 버튼 */}
                          {generatedImages.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setImageSelectionModal({ isOpen: true, canvasId: mediaElement.id })}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-green-500"
                              title="AI 생성 이미지 선택"
                            >
                              <ImageIcon className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`image-upload-${mediaElement.id}`) as HTMLInputElement
                              input?.click()
                            }}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500"
                            title="이미지 첨부"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(mediaElement.id, file)
                              }
                            }}
                            className="hidden"
                            id={`image-upload-${mediaElement.id}`}
                          />
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
                                  saveCanvasesToStorage(updated)
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
                        </>
                      )}
                      
                      {mediaElement.type === 'audio' && audio && (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            {recordingId === mediaElement.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={stopRecording}
                                  className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                  title="녹음 중지"
                                >
                                  <Square className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                  <span className="text-red-600 font-mono text-sm font-medium">
                                    {formatTime(recordingTime)}
                                  </span>
                                  <span className="text-slate-400 text-xs">/</span>
                                  <span className="text-slate-400 text-xs">
                                    {formatTime(300)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 h-4">
                                  {waveformData.slice(-15).map((value, index) => (
                                    <div
                                      key={index}
                                      className="bg-red-500 rounded-full transition-all duration-75"
                                      style={{
                                        width: '2px',
                                        height: `${Math.max(value * 12 + 1, 1)}px`,
                                        opacity: 0.7 + (value * 0.3)
                                      }}
                                    />
                                  ))}
                                </div>
                              </>
                            ) : audio.audioUrl ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (playingId === mediaElement.id) {
                                      stopAudio()
                                    } else {
                                      playAudio(mediaElement.id)
                                    }
                                  }}
                                  className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                                  title={playingId === mediaElement.id ? "재생 중지" : "재생"}
                                >
                                  {playingId === mediaElement.id ? (
                                    <Square className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4 ml-0.5" />
                                  )}
                                </Button>
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-600 font-mono text-sm font-medium">
                                    {playingId === mediaElement.id ? formatTime(playingTime) : (() => {
                                      const duration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                      return duration > 0 ? formatTime(Math.floor(duration)) : '00:00'
                                    })()}
                                  </span>
                                  <span className="text-slate-400 text-xs">/</span>
                                  <span className="text-slate-400 text-xs">
                                    {(() => {
                                      const totalDuration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                      return totalDuration > 0 ? formatTime(Math.floor(totalDuration)) : '00:00'
                                    })()}
                                  </span>
                                </div>
                                {playingId === mediaElement.id && (
                                  <div className="flex items-center gap-0.5 h-4">
                                    {waveformData.slice(-15).map((value, index) => (
                                      <div
                                        key={index}
                                        className="bg-blue-500 rounded-full transition-all duration-75"
                                        style={{
                                          width: '2px',
                                          height: `${Math.max(value * 12 + 1, 1)}px`,
                                          opacity: 0.7 + (value * 0.3)
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startRecording(mediaElement.id)}
                                  className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full"
                                  title="녹음 시작"
                                  disabled={isRecording}
                                >
                                  <Mic className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAudioRecording(mediaElement.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            title="삭제"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {mediaElement.type === 'text' && text && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTextNote(mediaElement.id)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                          title="텍스트 삭제"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* 텍스트 요소인 경우에만 텍스트 에디터 렌더링 */}
                  {mediaElement.type === 'text' && text && (
                    <div className="space-y-2">
                      <textarea
                        value={text.content}
                        onChange={(e) => updateTextNote(mediaElement.id, e.target.value)}
                        placeholder="텍스트를 입력하세요..."
                        className="w-full p-3 border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                    </div>
                  )}
                  
                  {/* 캔버스 요소인 경우에만 SignatureCanvas 렌더링 */}
                  {mediaElement.type === 'canvas' && canvas && (
                  <div className="border border-slate-200 rounded bg-white relative">
                    <SignatureCanvas
                      ref={(ref) => {
                        if (ref) {
                          signatureRefs.current[canvas.id] = ref
                          const imageData = pendingRestores.current[canvas.id] || canvas.imageData
                          if (imageData && !restoredCanvases.current.has(canvas.id)) {
                            setTimeout(() => restoreCanvas(canvas.id, imageData), 300)
                          }
                        }
                      }}
                      canvasProps={{
                        className: "w-full",
                        height: 500
                      }}
                      onEnd={() => {
                        handleCanvasEnd(canvas.id)
                      }}
                      onBegin={() => {
                      }}
                    />
                  </div>
                  )}
                </div>
                )
              })}
              
              {/* 수술 동의서 제목 미디어 아이콘 영역 */}
              <div className="flex items-center justify-end py-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#ffffff' }}
                    title="추가"
                  >
                    <Plus className="h-3 w-3" style={{ color: '#3c82f5' }} />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addCanvas("수술 동의서 제목")}
                    title="그림 추가"
                  >
                    <ImageIcon className="h-3 w-3 text-white" />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addAudioRecording("수술 동의서 제목")}
                    title="음성 추가"
                  >
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addTextNote("수술 동의서 제목")}
                    title="텍스트 추가"
                  >
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
        {/* 환자 정보 */}
        <div>
                <h4 className="text-base font-semibold text-slate-900 mb-6">환자 정보</h4>
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
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">수술부위</th>
                      <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.surgery_site_detail || ""}</td>
                      <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">수술부위표시</th>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 cursor-pointer" onClick={() => {
                            if (surgerySiteMarking.marking === 'yes') {
                              const newMarking = { ...surgerySiteMarking, marking: null }
                              setSurgerySiteMarking(newMarking)
                              sessionStorage.setItem('surgerySiteMarking', JSON.stringify(newMarking))
                            } else {
                              const newMarking = { ...surgerySiteMarking, marking: 'yes' as 'yes' | 'no' }
                              setSurgerySiteMarking(newMarking)
                              sessionStorage.setItem('surgerySiteMarking', JSON.stringify(newMarking))
                            }
                          }}>
                            <input 
                              type="radio" 
                              name="surgery_site_marking" 
                              value="yes" 
                              className="w-3 h-3 pointer-events-none" 
                              checked={surgerySiteMarking.marking === 'yes'}
                              readOnly
                            />
                            <span className="text-sm">예</span>
                          </div>
                          <div className="flex items-center gap-1 cursor-pointer" onClick={() => {
                            if (surgerySiteMarking.marking === 'no') {
                              const newMarking = { ...surgerySiteMarking, marking: null }
                              setSurgerySiteMarking(newMarking)
                              sessionStorage.setItem('surgerySiteMarking', JSON.stringify(newMarking))
                            } else {
                              const newMarking = { ...surgerySiteMarking, marking: 'no' as 'yes' | 'no' }
                              setSurgerySiteMarking(newMarking)
                              sessionStorage.setItem('surgerySiteMarking', JSON.stringify(newMarking))
                            }
                          }}>
                            <input 
                              type="radio" 
                              name="surgery_site_marking" 
                              value="no" 
                              className="w-3 h-3 pointer-events-none" 
                              checked={surgerySiteMarking.marking === 'no'}
                              readOnly
                            />
                            <span className="text-sm">아니오</span>
                          </div>
                          <span className="text-sm text-slate-500">(사유: </span>
                          <input 
                            type="text" 
                            value={surgerySiteMarking.reason}
                            onChange={(e) => {
                              const newMarking = { ...surgerySiteMarking, reason: e.target.value }
                              setSurgerySiteMarking(newMarking)
                              sessionStorage.setItem('surgerySiteMarking', JSON.stringify(newMarking))
                            }}
                            className="border border-slate-300 rounded px-2 py-1 text-sm w-32"
                            placeholder="사유 입력"
                          />
                          <span className="text-sm text-slate-500">)</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 환자 정보 미디어 요소들 */}
              {getSortedMediaElements("환자 정보").map(mediaElement => {
                const canvas = mediaElement.type === 'canvas' ? mediaElement.canvasData : null
                const audio = mediaElement.type === 'audio' ? mediaElement.audioData : null
                const text = mediaElement.type === 'text' ? mediaElement.textData : null
                
                return (
                <div key={mediaElement.id} className="mt-3 p-3 bg-white rounded-md border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-700">{mediaElement.title}</p>
                    <div className="flex gap-1">
                      {mediaElement.type === 'canvas' && canvas && (
                        <>
                          {/* 생성된 이미지 선택 버튼 */}
                          {generatedImages.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setImageSelectionModal({ isOpen: true, canvasId: mediaElement.id })}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-green-500"
                              title="AI 생성 이미지 선택"
                            >
                              <ImageIcon className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`image-upload-${mediaElement.id}`) as HTMLInputElement
                              input?.click()
                            }}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500"
                            title="이미지 첨부"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(mediaElement.id, file)
                              }
                            }}
                            className="hidden"
                            id={`image-upload-${mediaElement.id}`}
                          />
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
                                  saveCanvasesToStorage(updated)
                                  return updated
                                })
                              }
                            }}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-orange-500"
                            title="지우기"
                          >
                            <Eraser className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCanvas(mediaElement.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            title="삭제"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      
                      {mediaElement.type === 'audio' && audio && (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            {recordingId === mediaElement.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={stopRecording}
                                  className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                  title="녹음 중지"
                                >
                                  <Square className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                  <span className="text-red-600 font-mono text-sm font-medium">
                                    {formatTime(recordingTime)}
                                  </span>
                                  <span className="text-slate-400 text-xs">/</span>
                                  <span className="text-slate-400 text-xs">
                                    {formatTime(300)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 h-4">
                                  {waveformData.slice(-15).map((value, index) => (
                                    <div
                                      key={index}
                                      className="bg-red-500 rounded-full transition-all duration-75"
                                      style={{
                                        width: '2px',
                                        height: `${Math.max(value * 12 + 1, 1)}px`,
                                        opacity: 0.7 + (value * 0.3)
                                      }}
                                    />
                                  ))}
                                </div>
                              </>
                            ) : audio.audioUrl ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (playingId === mediaElement.id) {
                                      stopAudio()
                                    } else {
                                      playAudio(mediaElement.id)
                                    }
                                  }}
                                  className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                                  title={playingId === mediaElement.id ? "재생 중지" : "재생"}
                                >
                                  {playingId === mediaElement.id ? (
                                    <Square className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4 ml-0.5" />
                                  )}
                                </Button>
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-600 font-mono text-sm font-medium">
                                    {playingId === mediaElement.id ? formatTime(playingTime) : (() => {
                                      const duration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                      return duration > 0 ? formatTime(Math.floor(duration)) : '00:00'
                                    })()}
                                  </span>
                                  <span className="text-slate-400 text-xs">/</span>
                                  <span className="text-slate-400 text-xs">
                                    {(() => {
                                      const totalDuration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                      return totalDuration > 0 ? formatTime(Math.floor(totalDuration)) : '00:00'
                                    })()}
                                  </span>
                                </div>
                                {playingId === mediaElement.id && (
                                  <div className="flex items-center gap-0.5 h-4">
                                    {waveformData.slice(-15).map((value, index) => (
                                      <div
                                        key={index}
                                        className="bg-blue-500 rounded-full transition-all duration-75"
                                        style={{
                                          width: '2px',
                                          height: `${Math.max(value * 12 + 1, 1)}px`,
                                          opacity: 0.7 + (value * 0.3)
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startRecording(mediaElement.id)}
                                  className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full"
                                  title="녹음 시작"
                                  disabled={isRecording}
                                >
                                  <Mic className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAudioRecording(mediaElement.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            title="삭제"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {mediaElement.type === 'text' && text && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTextNote(mediaElement.id)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                          title="텍스트 삭제"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* 텍스트 요소인 경우에만 텍스트 에디터 렌더링 */}
                  {mediaElement.type === 'text' && text && (
                    <div className="space-y-2">
                      <textarea
                        value={text.content}
                        onChange={(e) => updateTextNote(mediaElement.id, e.target.value)}
                        placeholder="텍스트를 입력하세요..."
                        className="w-full p-3 border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                    </div>
                  )}
                  
                  {/* 캔버스 요소인 경우에만 SignatureCanvas 렌더링 */}
                  {mediaElement.type === 'canvas' && canvas && (
                  <div className="border border-slate-200 rounded bg-white relative">
                    <SignatureCanvas
                      ref={(ref) => {
                        if (ref) {
                          signatureRefs.current[canvas.id] = ref
                          const imageData = pendingRestores.current[canvas.id] || canvas.imageData
                          if (imageData && !restoredCanvases.current.has(canvas.id)) {
                            setTimeout(() => restoreCanvas(canvas.id, imageData), 300)
                          }
                        }
                      }}
                      canvasProps={{
                        className: "w-full",
                        height: 500
                      }}
                      onEnd={() => {
                        handleCanvasEnd(canvas.id)
                      }}
                      onBegin={() => {
                      }}
                    />
                  </div>
                  )}
                  
                </div>
                )
              })}

              {/* 환자 정보 미디어 아이콘 영역 */}
              <div className="flex items-center justify-end py-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#ffffff' }}
                    title="추가"
                  >
                    <Plus className="h-3 w-3" style={{ color: '#3c82f5' }} />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addCanvas("환자 정보")}
                    title="그림 추가"
                  >
                    <ImageIcon className="h-3 w-3 text-white" />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addAudioRecording("환자 정보")}
                    title="음성 추가"
                  >
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addTextNote("환자 정보")}
                    title="텍스트 추가"
                  >
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>

              {/* 참여 의료진 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">참여 의료진</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">성명</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">전문의여부</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">진료과목</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(formData.medical_team || formData.participants || []).map((doctor: { name?: string; is_specialist?: boolean; department?: string }, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">
                            {doctor.name || ""}
                            {doctor.is_specialist ? " (집도의)" : ""}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{doctor.is_specialist ? "전문의" : "일반의"}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{doctor.department || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>

              {/* 참여 의료진 미디어 요소들 */}
              {getSortedMediaElements("참여 의료진").map(mediaElement => {
                const canvas = mediaElement.type === 'canvas' ? mediaElement.canvasData : null
                const audio = mediaElement.type === 'audio' ? mediaElement.audioData : null
                const text = mediaElement.type === 'text' ? mediaElement.textData : null
                
                return (
                <div key={mediaElement.id} className="mt-3 p-3 bg-white rounded-md border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-700">{mediaElement.title}</p>
                    <div className="flex gap-1">
                      {mediaElement.type === 'canvas' && canvas && (
                        <>
                          {/* 생성된 이미지 선택 버튼 */}
                          {generatedImages.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setImageSelectionModal({ isOpen: true, canvasId: mediaElement.id })}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-green-500"
                              title="AI 생성 이미지 선택"
                            >
                              <ImageIcon className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`image-upload-${mediaElement.id}`) as HTMLInputElement
                              input?.click()
                            }}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500"
                            title="이미지 첨부"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(mediaElement.id, file)
                              }
                            }}
                            className="hidden"
                            id={`image-upload-${mediaElement.id}`}
                          />
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
                                  saveCanvasesToStorage(updated)
                                  return updated
                                })
                              }
                            }}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-orange-500"
                            title="지우기"
                          >
                            <Eraser className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCanvas(mediaElement.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            title="삭제"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      
                      {mediaElement.type === 'audio' && audio && (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            {recordingId === mediaElement.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={stopRecording}
                                  className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                  title="녹음 중지"
                                >
                                  <Square className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                  <span className="text-red-600 font-mono text-sm font-medium">
                                    {formatTime(recordingTime)}
                                  </span>
                                  <span className="text-slate-400 text-xs">/</span>
                                  <span className="text-slate-400 text-xs">
                                    {formatTime(300)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 h-4">
                                  {waveformData.slice(-15).map((value, index) => (
                                    <div
                                      key={index}
                                      className="bg-red-500 rounded-full transition-all duration-75"
                                      style={{
                                        width: '2px',
                                        height: `${Math.max(value * 12 + 1, 1)}px`,
                                        opacity: 0.7 + (value * 0.3)
                                      }}
                                    />
                                  ))}
                                </div>
                              </>
                            ) : audio.audioUrl ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (playingId === mediaElement.id) {
                                      stopAudio()
                                    } else {
                                      playAudio(mediaElement.id)
                                    }
                                  }}
                                  className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                                  title={playingId === mediaElement.id ? "재생 중지" : "재생"}
                                >
                                  {playingId === mediaElement.id ? (
                                    <Square className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4 ml-0.5" />
                                  )}
                                </Button>
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-600 font-mono text-sm font-medium">
                                    {playingId === mediaElement.id ? formatTime(playingTime) : (() => {
                                      const duration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                      return duration > 0 ? formatTime(Math.floor(duration)) : '00:00'
                                    })()}
                                  </span>
                                  <span className="text-slate-400 text-xs">/</span>
                                  <span className="text-slate-400 text-xs">
                                    {(() => {
                                      const totalDuration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                      return totalDuration > 0 ? formatTime(Math.floor(totalDuration)) : '00:00'
                                    })()}
                                  </span>
                                </div>
                                {playingId === mediaElement.id && (
                                  <div className="flex items-center gap-0.5 h-4">
                                    {waveformData.slice(-15).map((value, index) => (
                                      <div
                                        key={index}
                                        className="bg-blue-500 rounded-full transition-all duration-75"
                                        style={{
                                          width: '2px',
                                          height: `${Math.max(value * 12 + 1, 1)}px`,
                                          opacity: 0.7 + (value * 0.3)
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startRecording(mediaElement.id)}
                                  className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full"
                                  title="녹음 시작"
                                  disabled={isRecording}
                                >
                                  <Mic className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAudioRecording(mediaElement.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            title="삭제"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {mediaElement.type === 'text' && text && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTextNote(mediaElement.id)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                          title="텍스트 삭제"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* 텍스트 요소인 경우에만 텍스트 에디터 렌더링 */}
                  {mediaElement.type === 'text' && text && (
                    <div className="space-y-2">
                      <textarea
                        value={text.content}
                        onChange={(e) => updateTextNote(mediaElement.id, e.target.value)}
                        placeholder="텍스트를 입력하세요..."
                        className="w-full p-3 border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                    </div>
                  )}
                  
                  {/* 캔버스 요소인 경우에만 SignatureCanvas 렌더링 */}
                  {mediaElement.type === 'canvas' && canvas && (
                  <div className="border border-slate-200 rounded bg-white relative">
                    <SignatureCanvas
                      ref={(ref) => {
                        if (ref) {
                          signatureRefs.current[canvas.id] = ref
                          const imageData = pendingRestores.current[canvas.id] || canvas.imageData
                          if (imageData && !restoredCanvases.current.has(canvas.id)) {
                            setTimeout(() => restoreCanvas(canvas.id, imageData), 300)
                          }
                        }
                      }}
                      canvasProps={{
                        className: "w-full",
                        height: 500
                      }}
                      onEnd={() => {
                        handleCanvasEnd(canvas.id)
                      }}
                      onBegin={() => {
                      }}
                    />
                  </div>
                  )}
                  
                </div>
                )
              })}

              {/* 참여 의료진 미디어 아이콘 영역 */}
              <div className="flex items-center justify-end py-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#ffffff' }}
                    title="추가"
                  >
                    <Plus className="h-3 w-3" style={{ color: '#3c82f5' }} />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addCanvas("참여 의료진")}
                    title="그림 추가"
                  >
                    <ImageIcon className="h-3 w-3 text-white" />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addAudioRecording("참여 의료진")}
                    title="음성 추가"
                  >
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addTextNote("참여 의료진")}
                    title="텍스트 추가"
                  >
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                </div>
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

              {/* 환자 상태 및 특이사항 미디어 요소들 */}
              {getSortedMediaElements("1. 환자 상태 및 특이사항").map(mediaElement => {
                const canvas = mediaElement.type === 'canvas' ? mediaElement.canvasData : null
                const audio = mediaElement.type === 'audio' ? mediaElement.audioData : null
                const text = mediaElement.type === 'text' ? mediaElement.textData : null
                
                return (
                <div key={mediaElement.id} className="mt-3 p-3 bg-white rounded-md border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-700">{mediaElement.title}</p>
                    <div className="flex gap-1">
                      {mediaElement.type === 'canvas' && canvas && (
                        <>
                          {/* 생성된 이미지 선택 버튼 */}
                          {generatedImages.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setImageSelectionModal({ isOpen: true, canvasId: mediaElement.id })}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-green-500"
                              title="AI 생성 이미지 선택"
                            >
                              <ImageIcon className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`image-upload-${mediaElement.id}`) as HTMLInputElement
                              input?.click()
                            }}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500"
                            title="이미지 첨부"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(mediaElement.id, file)
                              }
                            }}
                            className="hidden"
                            id={`image-upload-${mediaElement.id}`}
                          />
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
                                  saveCanvasesToStorage(updated)
                                  return updated
                                })
                              }
                            }}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-orange-500"
                            title="지우기"
                          >
                            <Eraser className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCanvas(mediaElement.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            title="삭제"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      
                      {mediaElement.type === 'audio' && audio && (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            {recordingId === mediaElement.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={stopRecording}
                                  className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                  title="녹음 중지"
                                >
                                  <Square className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                  <span className="text-red-600 font-mono text-sm font-medium">
                                    {formatTime(recordingTime)}
                                  </span>
                                  <span className="text-slate-400 text-xs">/</span>
                                  <span className="text-slate-400 text-xs">
                                    {formatTime(300)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 h-4">
                                  {waveformData.slice(-15).map((value, index) => (
                                    <div
                                      key={index}
                                      className="bg-red-500 rounded-full transition-all duration-75"
                                      style={{
                                        width: '2px',
                                        height: `${Math.max(value * 12 + 1, 1)}px`,
                                        opacity: 0.7 + (value * 0.3)
                                      }}
                                    />
                                  ))}
                                </div>
                              </>
                            ) : audio.audioUrl ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (playingId === mediaElement.id) {
                                      stopAudio()
                                    } else {
                                      playAudio(mediaElement.id)
                                    }
                                  }}
                                  className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                                  title={playingId === mediaElement.id ? "재생 중지" : "재생"}
                                >
                                  {playingId === mediaElement.id ? (
                                    <Square className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4 ml-0.5" />
                                  )}
                                </Button>
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-600 font-mono text-sm font-medium">
                                    {playingId === mediaElement.id ? formatTime(playingTime) : (() => {
                                      const duration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                      return duration > 0 ? formatTime(Math.floor(duration)) : '00:00'
                                    })()}
                                  </span>
                                  <span className="text-slate-400 text-xs">/</span>
                                  <span className="text-slate-400 text-xs">
                                    {(() => {
                                      const totalDuration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                      return totalDuration > 0 ? formatTime(Math.floor(totalDuration)) : '00:00'
                                    })()}
                                  </span>
                                </div>
                                {playingId === mediaElement.id && (
                                  <div className="flex items-center gap-0.5 h-4">
                                    {waveformData.slice(-15).map((value, index) => (
                                      <div
                                        key={index}
                                        className="bg-blue-500 rounded-full transition-all duration-75"
                                        style={{
                                          width: '2px',
                                          height: `${Math.max(value * 12 + 1, 1)}px`,
                                          opacity: 0.7 + (value * 0.3)
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startRecording(mediaElement.id)}
                                  className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full"
                                  title="녹음 시작"
                                  disabled={isRecording}
                                >
                                  <Mic className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAudioRecording(mediaElement.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            title="삭제"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {mediaElement.type === 'text' && text && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTextNote(mediaElement.id)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                          title="텍스트 삭제"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* 텍스트 요소인 경우에만 텍스트 에디터 렌더링 */}
                  {mediaElement.type === 'text' && text && (
                    <div className="space-y-2">
                      <textarea
                        value={text.content}
                        onChange={(e) => updateTextNote(mediaElement.id, e.target.value)}
                        placeholder="텍스트를 입력하세요..."
                        className="w-full p-3 border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                    </div>
                  )}
                  
                  {/* 캔버스 요소인 경우에만 SignatureCanvas 렌더링 */}
                  {mediaElement.type === 'canvas' && canvas && (
                  <div className="border border-slate-200 rounded bg-white relative">
                    <SignatureCanvas
                      ref={(ref) => {
                        if (ref) {
                          signatureRefs.current[canvas.id] = ref
                          const imageData = pendingRestores.current[canvas.id] || canvas.imageData
                          if (imageData && !restoredCanvases.current.has(canvas.id)) {
                            setTimeout(() => restoreCanvas(canvas.id, imageData), 300)
                          }
                        }
                      }}
                      canvasProps={{
                        className: "w-full",
                        height: 500
                      }}
                      onEnd={() => {
                        handleCanvasEnd(canvas.id)
                      }}
                      onBegin={() => {
                      }}
                    />
                  </div>
                  )}
                  
                </div>
                )
              })}

              {/* 환자 상태 및 특이사항 미디어 아이콘 영역 */}
              <div className="flex items-center justify-end py-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#ffffff' }}
                    title="추가"
                  >
                    <Plus className="h-3 w-3" style={{ color: '#3c82f5' }} />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addCanvas("1. 환자 상태 및 특이사항")}
                    title="그림 추가"
                  >
                    <ImageIcon className="h-3 w-3 text-white" />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addAudioRecording("1. 환자 상태 및 특이사항")}
                    title="음성 추가"
                  >
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                    onClick={() => addTextNote("1. 환자 상태 및 특이사항")}
                    title="텍스트 추가"
                  >
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                </div>
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
                
                const consentConsents = consentData?.consents || {};
                
                const allItems = [
                  { number: "2", title: "예정된 수술/시술/검사를 하지 않을 경우의 예후", key: "2", consentKey: "prognosis_without_surgery" },
                  { number: "3", title: "예정된 수술 이외의 시행 가능한 다른 방법", key: "3", consentKey: "alternative_treatments" },
                  { number: "4", title: "수술 목적/필요/효과", key: "4", consentKey: "surgery_purpose_necessity_effect" },
                  { number: "5", title: "수술 방법 및 내용", key: "5", consentKey: "surgery_method_content" },
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
                  let content = surgeryData[item.key] || "";
                  
                  if (!content && item.consentKey) {
                    if (item.consentKey.includes('.')) {
                      const keys = item.consentKey.split('.');
                      let value: unknown = consentConsents;
                      for (const key of keys) {
                        value = (value as Record<string, unknown>)?.[key];
                        if (!value) break;
                      }
                      content = value as string || "";
                    } else {
                      content = (consentConsents as unknown as Record<string, unknown>)[item.consentKey] as string || "";
                    }
                  }
                  
                  
                  return (
                  <div key={index} className="mb-10">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">{item.number}. {item.title}</h4>
                    
                    {/* 5-3. 수술 방법 변경 및 수술 추가 가능성에 대한 특별 동의서 블록 */}
                    {item.number === "5-3" && (
                      <div className="mb-4 p-6 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-sm text-slate-800 leading-relaxed">
                          수술·시술·검사(이하 ‘수술 등’) 과정에서 환자의 상태에 따라 부득이하게 방법이 변경되거나 범위가 추가될 수 있습니다.<br />
                          이 경우, 추가 설명이 필요한 사항이 있으면 수술 시행 전에 환자 또는 대리인에게 설명하고 동의를 받아야 합니다.<br />
                          다만, 수술 도중 환자의 상태로 인해 사전 설명과 동의가 불가능할 정도로 긴급한 변경 또는 추가가 필요한 경우에는,
                          시행 후 가능한 한 신속히 그 사유와 결과를 환자 또는 대리인에게 설명하도록 합니다.
                        </div>
                      </div>
                    )}
                    
                    {/* 5-5. 집도의 변경 가능성에 대한 특별 동의서 블록 */}
                    {item.number === "5-5" && (
                      <div className="mb-4 p-6 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-sm text-slate-800 leading-relaxed">
                          수술·시술·검사 과정에서 환자의 상태나 의료기관의 사정(예: 응급환자 진료, 주치의의 질병·출장 등)에 따라 부득이하게 주치의(집도의)가 변경될 수 있습니다.
                          이 경우, 시행 전에 환자 또는 대리인에게 변경 사유를 설명하고 동의를 받습니다.<br />
                          다만, 시행 도중 긴급한 상황으로 사전 설명과 동의가 불가능한 경우에는,
                          시행 후 지체 없이 변경 사유와 결과를 환자 또는 대리인에게 설명합니다.
                        </div>
                      </div>
                    )}
                    
                    {item.number !== "5" && (
                    <div className="mb-3">
                      <span className="text-sm text-slate-900 whitespace-pre-wrap">
                        {content || "내용이 입력되지 않았습니다."}
                      </span>
                    </div>
                    )}
                    
                    {/* 통합된 미디어 요소들 (입력 순서대로) */}
                    {getSortedMediaElements(`${item.number}. ${item.title}`).map(mediaElement => {
                      const canvas = mediaElement.type === 'canvas' ? mediaElement.canvasData : null
                      const audio = mediaElement.type === 'audio' ? mediaElement.audioData : null
                      const text = mediaElement.type === 'text' ? mediaElement.textData : null
                      
                      return (
                      <div key={mediaElement.id} className="mt-3 p-3 bg-white rounded-md border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-slate-700">{mediaElement.title}</p>
                          <div className="flex gap-1">
                            {mediaElement.type === 'canvas' && canvas && (
                              <>
                                {/* 생성된 이미지 선택 버튼 */}
                                {generatedImages.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setImageSelectionModal({ isOpen: true, canvasId: mediaElement.id })}
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-green-500"
                                    title="AI 생성 이미지 선택"
                                  >
                                    <ImageIcon className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const input = document.getElementById(`image-upload-${mediaElement.id}`) as HTMLInputElement
                                    input?.click()
                                  }}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500"
                                  title="이미지 첨부"
                                >
                                  <Upload className="h-3 w-3" />
                                </Button>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleImageUpload(mediaElement.id, file)
                                    }
                                  }}
                                  className="hidden"
                                  id={`image-upload-${mediaElement.id}`}
                                />
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
                                        saveCanvasesToStorage(updated)
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
                              </>
                            )}
                            
                            {mediaElement.type === 'audio' && audio && (
                              <div className="flex items-center justify-between w-full">
                                {/* 좌측 컨트롤 영역 */}
                                <div className="flex items-center gap-3">
                                  {/* 녹음 중일 때: 중지 버튼 + 시간 + 파형 */}
                                  {recordingId === mediaElement.id ? (
                                    <>
                                      {/* 중지 버튼 */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={stopRecording}
                                        className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                        title="녹음 중지"
                                      >
                                        <Square className="h-4 w-4" />
                                      </Button>
                                      
                                      {/* 시간 표시 */}
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-600 font-mono text-sm font-medium">
                                          {formatTime(recordingTime)}
                                        </span>
                                        <span className="text-slate-400 text-xs">/</span>
                                        <span className="text-slate-400 text-xs">
                                          {formatTime(300)}
                                        </span>
                          </div>
                                      
                                      {/* 파형 표시 */}
                                      <div className="flex items-center gap-0.5 h-4">
                                        {waveformData.slice(-15).map((value, index) => (
                                          <div
                                            key={index}
                                            className="bg-red-500 rounded-full transition-all duration-75"
                                            style={{
                                              width: '2px',
                                              height: `${Math.max(value * 12 + 1, 1)}px`,
                                              opacity: 0.7 + (value * 0.3)
                                            }}
                                          />
                                        ))}
                        </div>
                                    </>
                                  ) : audio.audioUrl ? (
                                    <>
                                      {/* 재생/정지 버튼 */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (playingId === mediaElement.id) {
                                            stopAudio()
                                          } else {
                                            playAudio(mediaElement.id)
                                          }
                                        }}
                                        className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                                        title={playingId === mediaElement.id ? "재생 중지" : "재생"}
                                      >
                                        {playingId === mediaElement.id ? (
                                          <Square className="h-4 w-4" />
                                        ) : (
                                          <Play className="h-4 w-4 ml-0.5" />
                                        )}
                                      </Button>
                                      
                                      {/* 재생 시간 */}
                                      <div className="flex items-center gap-1">
                                        <span className="text-blue-600 font-mono text-sm font-medium">
                                          {playingId === mediaElement.id ? formatTime(playingTime) : (() => {
                                            const duration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                            return duration > 0 ? formatTime(Math.floor(duration)) : '00:00'
                                          })()}
                                        </span>
                                        <span className="text-slate-400 text-xs">/</span>
                                        <span className="text-slate-400 text-xs">
                                          {(() => {
                                            const totalDuration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                            return totalDuration > 0 ? formatTime(Math.floor(totalDuration)) : '00:00'
                                          })()}
                                        </span>
                                      </div>
                                      
                                      {/* 재생 중 파형 표시 */}
                                      {playingId === mediaElement.id && (
                                        <div className="flex items-center gap-0.5 h-4">
                                          {waveformData.slice(-15).map((value, index) => (
                                            <div
                                              key={index}
                                              className="bg-blue-500 rounded-full transition-all duration-75"
                                              style={{
                                                width: '2px',
                                                height: `${Math.max(value * 12 + 1, 1)}px`,
                                                opacity: 0.7 + (value * 0.3)
                                              }}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {/* 녹음 시작 버튼 */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startRecording(mediaElement.id)}
                                        className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full"
                                        title="녹음 시작"
                                        disabled={isRecording}
                                      >
                                        <Mic className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                                
                                {/* 우측 삭제 버튼 */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAudioRecording(mediaElement.id)}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                                  title="삭제"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            
                            {mediaElement.type === 'text' && text && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTextNote(mediaElement.id)}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                                title="텍스트 삭제"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* 텍스트 요소인 경우에만 텍스트 에디터 렌더링 */}
                        {mediaElement.type === 'text' && text && (
                          <div className="space-y-2">
                            <textarea
                              value={text.content}
                              onChange={(e) => updateTextNote(mediaElement.id, e.target.value)}
                              placeholder="텍스트를 입력하세요..."
                              className="w-full p-3 border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={4}
                            />
                          </div>
                        )}
                        
                        {/* 캔버스 요소인 경우에만 SignatureCanvas 렌더링 */}
                        {mediaElement.type === 'canvas' && canvas && (
                        <div className="border border-slate-200 rounded bg-white relative">
                          <SignatureCanvas
                            ref={(ref) => {
                              if (ref) {
                                signatureRefs.current[canvas.id] = ref
                                
                                const imageData = pendingRestores.current[canvas.id] || canvas.imageData
                                if (imageData && !restoredCanvases.current.has(canvas.id)) {
                                  setTimeout(() => restoreCanvas(canvas.id, imageData), 300)
                                }
                              }
                            }}
                            canvasProps={{
                              className: "w-full",
                                height: 500
                            }}
                            onEnd={() => {
                              handleCanvasEnd(canvas.id)
                            }}
                            onBegin={() => {
                            }}
                          />
                        </div>
                        )}
                        
                      </div>
                      )
                    })}

                    {/* 미디어 아이콘 영역 */}
                    <div className="flex items-center justify-end py-2 mt-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                          style={{ backgroundColor: '#ffffff' }}
                          title="추가"
                        >
                          <Plus className="h-3 w-3" style={{ color: '#3c82f5' }} />
                        </div>
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                          onClick={() => addCanvas(`${item.number}. ${item.title}`)}
                          title="그림 추가"
                        >
                          <ImageIcon className="h-3 w-3 text-white" />
                        </div>
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                          onClick={() => addAudioRecording(`${item.number}. ${item.title}`)}
                          title="음성 추가"
                        >
                          <Mic className="h-3 w-3 text-white" />
                        </div>
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                          onClick={() => addTextNote(`${item.number}. ${item.title}`)}
                          title="텍스트 추가"
                        >
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>

                  </div>
                  );
                }).filter(Boolean); // null 항목 제거
              } catch (e) {
                return null;
              }
            })()}

            {/* API에서 생성된 동의 내용들은 1-8번 항목으로만 제한하므로 제거 */}
              </div>
            </div>

            {/* 수술 동의서 확인 */}
            <div className="mt-8 pt-8 border-t-2 border-slate-200">
                <h3 className="text-base font-semibold text-slate-900 mb-6">수술 동의서 확인</h3>

                {/* 수술 동의서 확인 미디어 요소들 */}
                {getSortedMediaElements("수술 동의서 확인").map(mediaElement => {
                  const canvas = mediaElement.type === 'canvas' ? mediaElement.canvasData : null
                  const audio = mediaElement.type === 'audio' ? mediaElement.audioData : null
                  const text = mediaElement.type === 'text' ? mediaElement.textData : null
                  
                  return (
                  <div key={mediaElement.id} className="mt-3 p-3 bg-white rounded-md border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-700">{mediaElement.title}</p>
                      <div className="flex gap-1">
                        {mediaElement.type === 'canvas' && canvas && (
                          <>
                            {/* 생성된 이미지 선택 버튼 */}
                            {generatedImages.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setImageSelectionModal({ isOpen: true, canvasId: mediaElement.id })}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-green-500"
                                title="AI 생성 이미지 선택"
                              >
                                <ImageIcon className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const input = document.getElementById(`image-upload-${mediaElement.id}`) as HTMLInputElement
                                input?.click()
                              }}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500"
                              title="이미지 첨부"
                            >
                              <Upload className="h-3 w-3" />
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleImageUpload(mediaElement.id, file)
                                }
                              }}
                              className="hidden"
                              id={`image-upload-${mediaElement.id}`}
                            />
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
                                    saveCanvasesToStorage(updated)
                                    return updated
                                  })
                                }
                              }}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-orange-500"
                              title="지우기"
                            >
                              <Eraser className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCanvas(mediaElement.id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                              title="삭제"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        
                        {mediaElement.type === 'audio' && audio && (
                          <div className="flex items-center gap-2">
                            {audio.audioBlob ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => playAudio(mediaElement.id)}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500"
                                  title={playingId === mediaElement.id ? "일시정지" : "재생"}
                                >
                                  {playingId === mediaElement.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                </Button>
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 text-xs">
                                    {(() => {
                                      const totalDuration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                      return totalDuration > 0 ? formatTime(Math.floor(totalDuration)) : '00:00'
                                    })()}
                                  </span>
                                </div>
                                
                                {playingId === mediaElement.id && (
                                  <div className="flex items-center gap-0.5 h-4">
                                    {waveformData.slice(-15).map((value, index) => (
                                      <div
                                        key={index}
                                        className="bg-blue-500 rounded-full transition-all duration-75"
                                        style={{
                                          width: '2px',
                                          height: `${Math.max(value * 12 + 1, 1)}px`,
                                          opacity: 0.7 + (value * 0.3)
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startRecording(mediaElement.id)}
                                  className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full"
                                  title="녹음 시작"
                                  disabled={isRecording}
                                >
                                  <Mic className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                        
                        {mediaElement.type === 'text' && text && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTextNote(mediaElement.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            title="텍스트 삭제"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* 텍스트 요소인 경우에만 텍스트 에디터 렌더링 */}
                    {mediaElement.type === 'text' && text && (
                      <div className="space-y-2">
                        <textarea
                          value={text.content}
                          onChange={(e) => updateTextNote(mediaElement.id, e.target.value)}
                          placeholder="텍스트를 입력하세요..."
                          className="w-full p-3 border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                        />
                      </div>
                    )}
                    
                    {/* 캔버스 요소인 경우에만 SignatureCanvas 렌더링 */}
                    {mediaElement.type === 'canvas' && canvas && (
                    <div className="border border-slate-200 rounded bg-white relative">
                      <SignatureCanvas
                        ref={(ref) => {
                          if (ref) {
                            signatureRefs.current[canvas.id] = ref
                            const imageData = pendingRestores.current[canvas.id] || canvas.imageData
                            if (imageData && !restoredCanvases.current.has(canvas.id)) {
                              setTimeout(() => restoreCanvas(canvas.id, imageData), 300)
                            }
                          }
                        }}
                        canvasProps={{
                          className: "w-full",
                          height: 500
                        }}
                        onEnd={() => {
                          handleCanvasEnd(canvas.id)
                        }}
                        onBegin={() => {
                        }}
                      />
                    </div>
                    )}
                    
                  </div>
                  )
                })}

                {/* 수술 동의서 확인 미디어 아이콘 영역 */}
                <div className="flex items-center justify-end py-2 mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                      style={{ backgroundColor: '#ffffff' }}
                      title="추가"
                    >
                      <Plus className="h-3 w-3" style={{ color: '#3c82f5' }} />
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                      onClick={() => addCanvas("수술 동의서 확인")}
                      title="그림 추가"
                    >
                      <ImageIcon className="h-3 w-3 text-white" />
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                      onClick={() => addAudioRecording("수술 동의서 확인")}
                      title="음성 추가"
                    >
                      <Mic className="h-3 w-3 text-white" />
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
                    style={{ backgroundColor: '#3c82f5' }}
                      onClick={() => addTextNote("수술 동의서 확인")}
                      title="텍스트 추가"
                    >
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>

                {/* 동의 내용 */}
                <div className="mb-6">
                  <p className="text-sm text-slate-700 mb-4">아래 내용을 읽고 동의해 주세요.</p>
                  <div className="border border-slate-200 rounded-lg bg-slate-50 p-4">
                    <ol className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-start">
                        <span className="inline-block w-6 h-6 bg-slate-600 text-white rounded-full text-xs flex items-center justify-center font-semibold mr-3 mt-0.5 flex-shrink-0">1</span>
                        <span>나는 수술/시술/검사의 목적, 효과, 과정, 예상되는 위험에 대해 설명을 들었습니다.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-6 h-6 bg-slate-600 text-white rounded-full text-xs flex items-center justify-center font-semibold mr-3 mt-0.5 flex-shrink-0">2</span>
                        <span>궁금한 점을 의료진에게 질문할 수 있었고, 충분히 생각할 시간을 가졌습니다.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-6 h-6 bg-slate-600 text-white rounded-full text-xs flex items-center justify-center font-semibold mr-3 mt-0.5 flex-shrink-0">3</span>
                        <span>예상치 못한 합병증이나 사고가 생길 수 있음을 이해합니다.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-6 h-6 bg-slate-600 text-white rounded-full text-xs flex items-center justify-center font-semibold mr-3 mt-0.5 flex-shrink-0">4</span>
                        <span>수술/시술/검사에 협조하고, 내 상태를 정확히 알릴 것을 약속합니다.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-6 h-6 bg-slate-600 text-white rounded-full text-xs flex items-center justify-center font-semibold mr-3 mt-0.5 flex-shrink-0">5</span>
                        <span>수술 방법이나 범위가 바뀔 수 있다는 설명을 들었습니다.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-6 h-6 bg-slate-600 text-white rounded-full text-xs flex items-center justify-center font-semibold mr-3 mt-0.5 flex-shrink-0">6</span>
                        <span>담당의사가 바뀔 수 있다는 설명을 들었습니다.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-6 h-6 bg-slate-600 text-white rounded-full text-xs flex items-center justify-center font-semibold mr-3 mt-0.5 flex-shrink-0">7</span>
                        <span>일정이 바뀔 수 있음을 이해합니다.</span>
                      </li>
                    </ol>
                  </div>
                </div>
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
            disabled={isSubmitting}
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

      {/* 이미지 선택 모달 */}
      {imageSelectionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">AI 생성 이미지 선택</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImageSelectionModal({ isOpen: false, canvasId: '' })}
                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedImages.map((genImage, index) => (
                <div
                  key={index}
                  className="relative group cursor-pointer border-2 border-slate-200 hover:border-blue-500 rounded-lg overflow-hidden transition-colors"
                  onClick={() => {
                    handleGeneratedImageAdd(imageSelectionModal.canvasId, genImage)
                    setImageSelectionModal({ isOpen: false, canvasId: '' })
                  }}
                >
                  <img
                    src={`data:${genImage.mimeType};base64,${genImage.data}`}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-opacity">
                      선택
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {generatedImages.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                생성된 이미지가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat UI */}
      {showChat && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatUI
            onClose={() => {
              setShowChat(false)
              setChatMessages([]) // Clear messages on close
            }}
            onMinimize={(messages) => {
              setChatMessages(messages) // Save messages before hiding
              setShowChat(false)
            }}
            onSendMessage={handleSendMessage}
            initialMessages={chatMessages} // Pass saved messages
            disableEdit={true} // 수정 기능 완전 비활성화
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
  )
}
