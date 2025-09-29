"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Check, Plus, ChevronLeft, ChevronRight, X, Loader2, Upload, Image as ImageIcon, Mic, MicOff, Play, Square, FileText, Eraser, Pause } from "lucide-react"
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

// 통합된 미디어 요소 인터페이스
interface MediaElement {
  id: string
  title: string
  type: 'canvas' | 'audio' | 'text'
  createdAt: number
  canvasData?: CanvasData
  audioData?: AudioData
  textData?: TextData
}

export default function ConfirmationPage({ onComplete, onBack, formData, consentData }: ConfirmationPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionRef = useRef(false)
  const [surgerySiteMarking, setSurgerySiteMarking] = useState<{
    marking: 'yes' | 'no' | null
    reason: string
  }>(() => {
    // Try to restore from sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('surgerySiteMarking')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('[ConfirmationPage] 저장된 수술 부위 표시 파싱 실패:', e)
        }
      }
    }
    return { marking: null, reason: '' }
  })
  const [signatures, setSignatures] = useState<Record<string, string>>(() => {
    // Try to restore signatures from sessionStorage on initial load
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmationSignatures')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return parsed
        } catch (e) {
          console.error('[ConfirmationPage] 저장된 서명 파싱 실패:', e)
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
          console.error('[ConfirmationPage] 저장된 캔버스 파싱 실패:', e)
        }
      }
    }
    return []
  })

  // 음성 녹음 관련 상태
  const [audioRecordings, setAudioRecordings] = useState<AudioData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmationAudioRecordings')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('[ConfirmationPage] 저장된 음성 녹음 파싱 실패:', e)
        }
      }
    }
    return []
  })

  // 텍스트 관련 상태
  const [textNotes, setTextNotes] = useState<TextData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmationTextNotes')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('[ConfirmationPage] 저장된 텍스트 노트 파싱 실패:', e)
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
  const [audioLevel, setAudioLevel] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [sttText, setSttText] = useState<string>('')
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

  // Debug: Monitor sessionStorage changes
  const checkSessionStorage = () => {
    const current = sessionStorage.getItem('confirmationCanvases')
    console.log('🔍 Current sessionStorage confirmationCanvases:', current ? `${current.length} chars` : 'null')
    if (current) {
      try {
        const parsed = JSON.parse(current)
        console.log('🔍 Parsed:', parsed.length, 'canvases with data:', parsed.filter((c: CanvasData) => c.imageData).length)
      } catch (e) {
        console.error('[ConfirmationPage] 데이터 파싱 오류:', e)
      }
    }
  }

  // Check sessionStorage every 2 seconds
  useEffect(() => {
    const interval = setInterval(checkSessionStorage, 2000)
    return () => clearInterval(interval)
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 타이머 정리
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (playingTimerRef.current) {
        clearInterval(playingTimerRef.current)
      }
      
      // 애니메이션 프레임 정리
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      // 오디오 정리
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
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
    console.log('💾 Saving canvases to storage:', canvases.length, 'canvases')
    canvases.forEach((c, index) => {
      console.log(`💾 Canvas ${index + 1}: id=${c.id}, title="${c.title}", hasData=${!!c.imageData}, dataLength=${c.imageData?.length || 0}`)
    })
    saveCanvasesToStorage(canvases)
    console.log('💾 Saved to storage successfully')
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
          console.error(`[ConfirmationPage] 캔버스 복원 실패 (${attempts + 1}회 시도 후):`, canvasId)
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
    const now = Date.now()
    const newCanvas: CanvasData = {
      id: `canvas_${now}`,
      title: `${section} - 그림`,
      createdAt: now
    }
    console.log('➕ Adding new canvas:', newCanvas.id, 'for section:', section)
    setCanvases(prev => {
      const updated = [...prev, newCanvas]
      console.log('➕ New canvas added, total canvases:', updated.length)
      // Immediately save to storage
      saveCanvasesToStorage(updated)
      console.log('💾 Saved new canvas to storage')
      return updated
    })
  }

  // 음성 녹음 요소 추가
  const addAudioRecording = (section: string) => {
    const now = Date.now()
    const newAudio: AudioData = {
      id: `audio_${now}`,
      title: `${section} - 음성`,
      createdAt: now
    }
    console.log('🎤 Adding new audio recording:', newAudio.id, 'for section:', section)
    setAudioRecordings(prev => {
      const updated = [...prev, newAudio]
      console.log('🎤 New audio added, total recordings:', updated.length)
      // Immediately save to storage
      sessionStorage.setItem('confirmationAudioRecordings', JSON.stringify(updated))
      console.log('💾 Saved new audio to storage')
      return updated
    })
  }

  // 음성 녹음 요소 삭제
  const removeAudioRecording = (audioId: string) => {
    console.log('🗑️ Removing audio recording:', audioId)
    setAudioRecordings(prev => {
      const updated = prev.filter(audio => audio.id !== audioId)
      sessionStorage.setItem('confirmationAudioRecordings', JSON.stringify(updated))
      console.log('🗑️ Audio removed, remaining recordings:', updated.length)
      return updated
    })
  }

  // 텍스트 노트 추가
  const addTextNote = (section: string) => {
    const now = Date.now()
    const newText: TextData = {
      id: `text_${now}`,
      title: `${section} - 텍스트`,
      content: '',
      createdAt: now
    }
    console.log('📝 Adding new text note:', newText.id, 'for section:', section)
    setTextNotes(prev => {
      const updated = [...prev, newText]
      console.log('📝 New text added, total notes:', updated.length)
      // Immediately save to storage
      sessionStorage.setItem('confirmationTextNotes', JSON.stringify(updated))
      console.log('💾 Saved new text to storage')
      return updated
    })
  }

  // 텍스트 노트 삭제
  const removeTextNote = (textId: string) => {
    console.log('🗑️ Removing text note:', textId)
    setTextNotes(prev => {
      const updated = prev.filter(text => text.id !== textId)
      sessionStorage.setItem('confirmationTextNotes', JSON.stringify(updated))
      console.log('🗑️ Text removed, remaining notes:', updated.length)
      return updated
    })
  }

  // 텍스트 노트 내용 업데이트
  const updateTextNote = (textId: string, content: string) => {
    setTextNotes(prev => {
      const updated = prev.map(text => 
        text.id === textId ? { ...text, content } : text
      )
      sessionStorage.setItem('confirmationTextNotes', JSON.stringify(updated))
      return updated
    })
  }

  // 통합된 미디어 요소 생성 (입력 순서대로 정렬)
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

    // 생성 시간순으로 정렬
    return [...sectionCanvases, ...sectionAudios, ...sectionTexts].sort((a, b) => a.createdAt - b.createdAt)
  }


  // 시간 포맷 함수
  const formatTime = (seconds: number) => {
    // Infinity, NaN, 또는 음수 값 처리
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '00:00'
    }
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 음성 크기 분석 및 파형 시각화 함수
  const analyzeAudioLevel = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    
    // 평균 음성 레벨 계산
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    setAudioLevel(average)
    
    // 파형 데이터 생성 (iOS Voice Memo 스타일)
    const normalizedValue = Math.min(average / 255, 1)
    waveformRef.current.push(normalizedValue)
    
    // 파형 데이터 길이 제한 (최대 100개)
    if (waveformRef.current.length > 100) {
      waveformRef.current = waveformRef.current.slice(-100)
    }
    
    setWaveformData([...waveformRef.current])
    
    // 계속 분석
    animationFrameRef.current = requestAnimationFrame(() => analyzeAudioLevel(analyser))
  }

  // 마이크 권한 상태 확인
  const checkMicrophonePermission = async () => {
    try {
      console.log('🎤 권한 상태 확인 시작...')
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      console.log('🎤 마이크 권한 상태:', permissionStatus.state)
      console.log('🎤 권한 상태 객체:', permissionStatus)
      return permissionStatus.state
    } catch (error) {
      console.log('🎤 권한 상태 확인 실패 (일부 브라우저에서 지원하지 않음):', error)
      console.log('🎤 에러 상세:', error.name, error.message)
      return 'unknown'
    }
  }

  // 음성 녹음 함수들
  const startRecording = async (audioId: string) => {
    console.log('🎤 startRecording called with audioId:', audioId)
    
    // 5분 제한 확인
    const existingRecording = audioRecordings.find(rec => rec.id === audioId)
    if (existingRecording && existingRecording.audioBlob) {
      toast.error('이미 녹음된 음성이 있습니다. 새로 녹음하려면 기존 음성을 삭제해주세요.')
      return
    }
    
    // MediaRecorder 지원 확인
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('[ConfirmationPage] MediaDevices API 미지원')
      toast.error('이 브라우저는 음성 녹음을 지원하지 않습니다.')
      return
    }
    
    if (!window.MediaRecorder) {
      console.error('[ConfirmationPage] MediaRecorder API 미지원')
      toast.error('이 브라우저는 MediaRecorder를 지원하지 않습니다.')
      return
    }

    // 권한 상태 미리 확인 (선택적)
    let permissionState = 'unknown'
    try {
      permissionState = await checkMicrophonePermission()
      console.log('🎤 Current permission state:', permissionState)
    } catch (error) {
      console.log('🎤 권한 상태 확인 실패, 직접 시도:', error)
    }
    
    if (permissionState === 'denied') {
      const userConfirmed = window.confirm(
        '마이크 권한이 거부되었습니다.\n\n' +
        '다음 방법으로 권한을 허용해주세요:\n\n' +
        'Chrome:\n' +
        '1. 주소창 왼쪽 🔒 아이콘 클릭\n' +
        '2. 마이크를 "허용"으로 변경\n' +
        '또는\n' +
        'chrome://settings/content/microphone 접속\n' +
        'localhost:3000 찾아서 권한 삭제 후 재시도\n\n' +
        'Safari:\n' +
        'Safari → 환경설정 → 웹사이트 → 마이크\n' +
        'localhost 항목 찾아서 권한 삭제\n\n' +
        '권한 설정 후 페이지를 새로고침하시겠습니까?'
      )
      
      if (userConfirmed) {
        window.location.reload()
      }
      return
    }
    
    // 권한 요청 대신 바로 권한 설정 안내 팝업 표시
    console.log('🎤 마이크 권한 설정 안내 팝업 표시')
    
    const userConfirmed = window.confirm(
      '마이크 권한이 필요합니다.\n\n' +
      '허용 방법:\n' +
      '1. 브라우저 주소창 왼쪽 🔒 아이콘 클릭\n' +
      '2. "마이크"를 허용으로 변경\n\n' +
      'Chrome: chrome://settings/content/microphone\n' +
      'Safari(mac): Safari > 설정 > 웹사이트 > 마이크\n' +
      'iOS Safari: 설정 > Safari > 마이크\n' +
      'Android Chrome: 설정 > 앱 > Chrome > 권한 > 마이크\n\n' +
      '권한 설정을 완료한 뒤 "확인"을 눌러주세요.'
    )
    
    if (!userConfirmed) {
      console.log('🎤 사용자가 권한 설정을 취소했습니다.')
      return
    }
    
    console.log('🎤 사용자가 권한 설정을 확인했습니다. 이제 getUserMedia 호출을 시도합니다.')
    
    try {
      console.log('🎤 Requesting microphone access...')
      console.log('🎤 getUserMedia 호출 시작...')
      
      console.log('🎤 navigator.mediaDevices:', navigator.mediaDevices)
      console.log('🎤 getUserMedia 함수:', navigator.mediaDevices.getUserMedia)
      
      // 타임아웃과 함께 getUserMedia 호출
      const streamPromise = navigator.mediaDevices.getUserMedia({ 
        audio: true
      })
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('getUserMedia timeout after 5 seconds')), 5000)
      })
      
      const stream = await Promise.race([streamPromise, timeoutPromise])
      
      console.log('🎤 getUserMedia 성공! 스트림 받음:', stream)
      console.log('🎤 Microphone access granted, stream:', stream)
      console.log('🎤 Stream tracks:', stream.getTracks())
      
      // 오디오 분석 설정
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioAnalyserRef.current = analyser
      
      // 음성 크기 분석 시작
      analyzeAudioLevel(analyser)
      
      // MediaRecorder 지원 형식 확인 (3초 제한 문제 해결을 위해)
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
          console.log('🎤 Using MIME type:', mimeType)
          break
        }
      }
      
      // MIME 타입이 없으면 기본값 사용
      if (!mimeType) {
        mimeType = 'audio/webm'
        console.log('🎤 Using default MIME type:', mimeType)
      }

      // MediaRecorder 생성 (3초 제한 문제 해결을 위한 옵션 추가)
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000, // 적절한 비트레이트 설정
      }
      
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions)
      console.log('🎤 MediaRecorder created with options:', mediaRecorderOptions)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      console.log('🎤 Setting recording states...')

      // 상태를 즉시 업데이트
      setRecordingId(audioId)
      setIsRecording(true)
      setRecordingTime(0)

      console.log('🎤 Recording states set - recordingId:', audioId, 'isRecording:', true)
      
      // 녹음 시간 타이머 시작 (ref로도 추적)
      currentRecordingTimeRef.current = 0
      recordingTimerRef.current = setInterval(() => {
        currentRecordingTimeRef.current += 1
        setRecordingTime(currentRecordingTimeRef.current)
        
        // 5분(300초) 제한
        if (currentRecordingTimeRef.current >= 300) {
          stopRecording()
          toast.error('녹음 시간이 5분을 초과했습니다.')
        }
        
        // 3초마다 수동으로 데이터 요청 (브라우저 호환성을 위해)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          try {
            // requestData를 사용하여 수동으로 데이터 요청
            if (typeof mediaRecorderRef.current.requestData === 'function') {
              mediaRecorderRef.current.requestData()
            }
          } catch (e) {
          }
        }
      }, 1000)
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          
          // timecode가 있으면 더 정확한 시간 사용
          if (event.timecode && event.timecode > 0) {
            const timecodeSeconds = event.timecode / 1000
            const currentTime = currentRecordingTimeRef.current
            
            // timecode와 타이머 시간 중 더 큰 값 사용
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

        // STT 텍스트 생성
        generateSTTText(audioBlob)

        // recordingTime을 ref에서 안전하게 가져오기
        const capturedRecordingTime = currentRecordingTimeRef.current
        const stateRecordingTime = recordingTime

        // 다중 방법으로 duration 설정 (안정성 향상)
        const updateAudioDuration = (duration: number, source: string) => {
          setAudioRecordings(prev => {
            const updated = prev.map(recording => {
              if (recording.id === audioId) {
                // 기존 duration과 비교하여 더 큰 값만 업데이트
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

        // 방법 1: 즉시 더 정확한 시간으로 설정 (백업용)
        const bestDuration = Math.max(capturedRecordingTime, stateRecordingTime)
        updateAudioDuration(bestDuration, 'best captured time')

        // 방법 2: 실제 오디오 duration 가져오기 (비동기)
        const tempAudio = new Audio(audioUrl)
        
        // 여러 이벤트 리스너 등록
        const updateFromAudio = () => {
          const actualDuration = tempAudio.duration
          
          if (actualDuration && isFinite(actualDuration) && !isNaN(actualDuration) && actualDuration > 0) {
            // 실제 duration과 우리가 추적한 시간 중 더 큰 값 사용 (추적된 시간이 더 정확할 수 있음)
            const mostAccurateDuration = Math.max(actualDuration, bestDuration)
            updateAudioDuration(mostAccurateDuration, 'metadata')
          }
        }

        // loadedmetadata 이벤트
        tempAudio.addEventListener('loadedmetadata', updateFromAudio)
        
        // durationchange 이벤트
        tempAudio.addEventListener('durationchange', updateFromAudio)
        
        // canplay 이벤트
        tempAudio.addEventListener('canplay', updateFromAudio)

        // 방법 3: 여러 시점에서 체크 (타임아웃)
        const checkDuration = (delay: number, source: string) => {
          setTimeout(() => {
            if (tempAudio.readyState >= 1) { // HAVE_METADATA
              const actualDuration = tempAudio.duration
              
              if (actualDuration && isFinite(actualDuration) && !isNaN(actualDuration) && actualDuration > 0) {
                // 메타데이터 duration과 추적된 시간 중 더 큰 값 사용 (추적된 시간이 더 정확할 수 있음)
                const finalDuration = Math.max(actualDuration, bestDuration)
                updateAudioDuration(finalDuration, source)
              } else if (bestDuration > 0) {
                // 메타데이터가 없으면 bestDuration 사용
                updateAudioDuration(bestDuration, 'fallback to best captured')
              }
            }
          }, delay)
        }

        // 여러 시점에서 체크
        checkDuration(100, '100ms timeout')
        checkDuration(500, '500ms timeout')
        checkDuration(1000, '1000ms timeout')
        checkDuration(2000, '2000ms timeout')

        // 녹음 시간 리셋은 stopRecording에서 처리됨

        // 스트림 정리
        stream.getTracks().forEach(track => {
          console.log('🎤 Stopping track:', track.kind, track.label)
          track.stop()
        })
        console.log('🎤 Stream tracks stopped')
        toast.success('음성 녹음이 완료되었습니다.')
      }
      
      mediaRecorder.onstart = () => {
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('[ConfirmationPage] MediaRecorder 오류:', event)
        console.error('[ConfirmationPage] 오류 상세:', event.error)
        
        // 3초 제한 관련 오류인지 확인
        if (event.error && event.error.name === 'NotSupportedError') {
          console.error('[ConfirmationPage] NotSupportedError - 3초 제한 관련 가능성')
        }
        
        toast.error('음성 녹음 중 오류가 발생했습니다.')
        setIsRecording(false)
        setRecordingId(null)
      }
      
      console.log('🎤 Starting MediaRecorder...')
      mediaRecorder.start() // timeSlice 없이 시작 - 브라우저 호환성 향상
      console.log('🎤 MediaRecorder.start() called')
      toast('음성 녹음을 시작했습니다.')
      
    } catch (error) {
      console.error('[ConfirmationPage] 음성 녹음 시작 실패:', error)
      console.error('[ConfirmationPage] 오류 이름:', error.name)
      console.error('[ConfirmationPage] 오류 메시지:', error.message)
      console.error('[ConfirmationPage] 오류 스택:', error.stack)
      
      if (error.name === 'NotAllowedError') {
        // 사용자에게 마이크 권한 허용 방법 안내
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
        
        console.log('🎤 마이크 권한 해결 방법:')
        console.log('🎤 1. 브라우저 주소창 왼쪽의 🔒 설정 아이콘 클릭')
        console.log('🎤 2. 마이크 권한을 "허용"으로 변경')
        console.log('🎤 3. 페이지를 새로고침 후 다시 시도')
      } else if (error.name === 'NotFoundError') {
        toast.error('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.')
      } else if (error.name === 'NotSupportedError') {
        toast.error('이 브라우저는 음성 녹음을 지원하지 않습니다.')
      } else if (error.message && error.message.includes('timeout')) {
        toast.error('마이크 권한 요청이 시간 초과되었습니다. 브라우저 설정에서 마이크 권한을 확인해주세요.')
        console.log('🎤 getUserMedia 타임아웃 - 권한 요청이 5초 내에 응답하지 않음')
        
        // 권한 설정 후 다시 시도할지 확인
        const retryConfirmed = window.confirm(
          '마이크 권한이 아직 허용되지 않았습니다.\n\n' +
          '브라우저 설정에서 마이크 권한을 허용한 후\n' +
          '다시 시도하시겠습니까?'
        )
        
        if (retryConfirmed) {
          // 재귀 호출로 다시 시도
          startRecording(audioId)
        }
      } else {
        toast.error('음성 녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.')
      }
    }
  }
  
  // STT 텍스트 생성 함수
  const generateSTTText = (audioBlob: Blob) => {
    // 실제 STT 구현 시:
    // 1. audioBlob을 FormData로 변환
    // 2. STT API 엔드포인트로 전송
    // 3. 응답받은 텍스트를 setSttText에 설정
    
    // 현재는 STT 기능이 구현되지 않았으므로 텍스트를 설정하지 않음
    // "음성을 텍스트로 변환하는 중..." 메시지가 계속 표시됨
  }

  const stopRecording = () => {
    console.log('🛑 stopRecording called')
    
    // 타이머 정리
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    
    // 음성 분석 정리
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingId(null)
      
      // 상태 리셋 (onstop 이벤트에서 duration 설정 후)
      setTimeout(() => {
        setRecordingTime(0)
        setAudioLevel(0)
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
      
      // 재생 시간 추적 시작
      setPlayingTime(0)
      playingTimerRef.current = setInterval(() => {
        if (audio && !audio.paused) {
          setPlayingTime(audio.currentTime)
          // 재생 중에도 파형 데이터 업데이트 (실제 오디오 레벨 대신 랜덤값 사용)
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
          // Immediately save to storage
          saveCanvasesToStorage(updated)
          console.log('💾 Saved to storage immediately')
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
      // Update storage after deletion
      saveCanvasesToStorage(updated)
      return updated
    })
    // Clean up restored state
    restoredCanvases.current.delete(canvasId)
    // Clean up ref
    delete signatureRefs.current[canvasId]
  }

  // 이미지를 350x600 크기로 리사이즈하는 함수
  const resizeImageToFit = (dataUrl: string, maxWidth: number = 335, maxHeight: number = 600, quality: number = 1): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // 원본 이미지 크기
        const originalWidth = img.width
        const originalHeight = img.height
        
        // 비율을 유지하면서 최대 크기에 맞도록 계산
        const scaleX = maxWidth / originalWidth
        const scaleY = maxHeight / originalHeight
        const scale = Math.min(scaleX, scaleY) // 더 작은 스케일 사용
        
        // 리사이즈된 크기 계산
        const resizedWidth = Math.floor(originalWidth * scale)
        const resizedHeight = Math.floor(originalHeight * scale)
        
        // 캔버스 크기 설정
        canvas.width = resizedWidth
        canvas.height = resizedHeight
        
        // 이미지를 캔버스에 그리기
        ctx.drawImage(img, 0, 0, resizedWidth, resizedHeight)
        
        // JPEG로 압축하여 반환
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      img.src = dataUrl
    })
  }

  // 스토리지 저장 함수 (용량 초과 시 localStorage 사용)
  const saveCanvasesToStorage = (canvases: CanvasData[]) => {
    try {
      const data = JSON.stringify(canvases)
      sessionStorage.setItem('confirmationCanvases', data)
    } catch (error) {
      console.warn('SessionStorage 용량 초과, localStorage 사용:', error)
      try {
        localStorage.setItem('confirmationCanvases', JSON.stringify(canvases))
        toast.info('데이터가 localStorage에 저장되었습니다.')
      } catch (localError) {
        console.error('[ConfirmationPage] localStorage 용량 초과:', localError)
        toast.error('저장 공간이 부족합니다. 이미지를 다시 업로드해주세요.')
      }
    }
  }

  // 이미지 업로드 처리
  const handleImageUpload = async (canvasId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 제한 (50MB) - 리사이즈되므로 더 큰 파일도 허용
    if (file.size > 50 * 1024 * 1024) {
      toast.error('이미지 크기가 너무 큽니다. 50MB 이하의 파일을 선택해주세요.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const originalImageData = e.target?.result as string
      if (signatureRefs.current[canvasId]) {
        try {
          // 이미지를 250x400 크기로 미리 리사이즈
          const resizedImageData = await resizeImageToFit(originalImageData, 335, 600, 1)
          
          const canvas = signatureRefs.current[canvasId]
          const img = new window.Image()
          img.onload = () => {
            // 캔버스에 리사이즈된 이미지를 배경으로 그리기
            const canvasElement = canvas.getCanvas()
            const ctx = canvasElement.getContext('2d')
            
            if (ctx) {
              // 캔버스 크기 가져오기
              const canvasWidth = canvasElement.width
              const canvasHeight = canvasElement.height
              
              // 리사이즈된 이미지 크기 가져오기
              const imgWidth = img.width
              const imgHeight = img.height
              
              // 캔버스 좌측 상단에 배치하기 위한 오프셋 계산
              const offsetX = 0  // 좌측 정렬
              const offsetY = 0  // 상단 정렬
              
              // 캔버스 지우기
              ctx.clearRect(0, 0, canvasWidth, canvasHeight)
              
              // 리사이즈된 이미지를 캔버스에 그리기 (좌측 상단 배치)
              ctx.drawImage(img, offsetX, offsetY)
              
              // 캔버스 데이터 저장
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
          console.error('[ConfirmationPage] 이미지 리사이즈 실패:', error)
          toast.error('이미지 처리 중 오류가 발생했습니다.')
        }
      }
    }
    reader.readAsDataURL(file)
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

      // TODO: 백엔드에 동의서 데이터 저장이 필요한 경우 /consent/submit 엔드포인트 구현 필요
      // 현재는 로컬 저장만 수행
      console.log('Consent data prepared for submission:', consentSubmissionData)
      
      toast.success('동의서가 성공적으로 저장되었습니다')

      // 서명 데이터와 캔버스 데이터를 모두 저장 (페이지에서는 사용, PDF에서는 제외)
      const allSignatureData = {
        ...signatures,
        canvases: canvases.map(c => ({
          id: c.id,
          title: c.title,
          imageData: c.imageData
        }))
      }

      console.log('Saving signature data:', Object.keys(allSignatureData))

      // Save to sessionStorage for consent flow persistence
      sessionStorage.setItem('signatureData', JSON.stringify(allSignatureData))
      sessionStorage.setItem('confirmationCompleted', 'true')
      sessionStorage.setItem('canvasDrawings', JSON.stringify(canvases))
      // Also save to localStorage as backup
      localStorage.setItem('signatureData', JSON.stringify(allSignatureData))
      localStorage.setItem('canvasDrawings', JSON.stringify(canvases))
      // Save consent submission data for future use
      sessionStorage.setItem('consentSubmissionData', JSON.stringify(consentSubmissionData))
      localStorage.setItem('consentSubmissionData', JSON.stringify(consentSubmissionData))

      console.log('Data saved to storage')
      onComplete()
    } catch (error) {
      console.error('[ConfirmationPage] 동의서 데이터 제출 오류:', error)
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
                        console.log(`✏️ Drawing started on canvas ${canvas.id}`)
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
                              // 이미 선택된 경우 취소
                              const newMarking = { ...surgerySiteMarking, marking: null }
                              setSurgerySiteMarking(newMarking)
                              sessionStorage.setItem('surgerySiteMarking', JSON.stringify(newMarking))
                            } else {
                              // 선택되지 않은 경우 선택
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
                              // 이미 선택된 경우 취소
                              const newMarking = { ...surgerySiteMarking, marking: null }
                              setSurgerySiteMarking(newMarking)
                              sessionStorage.setItem('surgerySiteMarking', JSON.stringify(newMarking))
                            } else {
                              // 선택되지 않은 경우 선택
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
                                onClick={() => togglePlayback(mediaElement.id)}
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
                        console.log(`✏️ Drawing started on canvas ${canvas.id}`)
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
                      {(formData.medical_team || formData.participants || []).map((doctor: any, index: number) => (
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
                                onClick={() => togglePlayback(mediaElement.id)}
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
                        console.log(`✏️ Drawing started on canvas ${canvas.id}`)
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
                                onClick={() => togglePlayback(mediaElement.id)}
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
                        console.log(`✏️ Drawing started on canvas ${canvas.id}`)
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
                
                // consentData에서도 데이터를 가져와서 병합
                const consentConsents = consentData?.consents || {};
                
                const allItems = [
                  // 1. 환자 상태 및 특이사항은 상단 환자 정보 섹션에서 이미 표시되므로 생략
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
                      // 캔버스 요소인 경우 canvas 변수로 참조
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
                                            console.log('🎤 Display duration for', mediaElement.id, ':', audio.duration, '->', duration)
                                            return duration > 0 ? formatTime(Math.floor(duration)) : '00:00'
                                          })()}
                                        </span>
                                        <span className="text-slate-400 text-xs">/</span>
                                        <span className="text-slate-400 text-xs">
                                          {(() => {
                                            const totalDuration = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
                                            console.log('🎤 Display total duration for', mediaElement.id, ':', audio.duration, '->', totalDuration)
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
                console.error('[ConfirmationPage] 수술 정보 데이터 로드 오류:', e);
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
                                  onClick={() => togglePlayback(mediaElement.id)}
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
                          console.log(`✏️ Drawing started on canvas ${canvas.id}`)
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
    </div>
  )
}