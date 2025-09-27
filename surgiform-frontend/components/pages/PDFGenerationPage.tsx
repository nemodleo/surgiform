"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, Home, ChevronLeft } from "lucide-react"
import { generateKoreanPDFFromDOM } from "@/lib/domPdfGenerator"

interface FormData {
  patient_name?: string
  surgery_name?: string
  [key: string]: unknown
}

interface ConsentData {
  [key: string]: unknown
}

interface DrawingItem {
  title?: string
  imageData?: string
}

interface SignatureData {
  patient?: string
  doctor?: string
  canvases?: DrawingItem[]
  [key: string]: unknown
}

interface PDFGenerationPageProps {
  formData: FormData
  consentData: ConsentData
  onHome?: () => void
  onBack?: () => void
}

export default function PDFGenerationPage({ formData, consentData, onHome, onBack }: PDFGenerationPageProps) {
  const [generating, setGenerating] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null)
  const [, setShowPreview] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  const generatePDF = async () => {
    console.log('=== PDF Generation Started ===')
    setGenerating(true)
    
    try {
      console.log('Generating PDF with data:', {
        formData,
        consentData,
        signatureData
      })
      
      // Generate PDF using DOM-based approach
      const pdfGenerationPromise = generateKoreanPDFFromDOM(
        formData || {},
        consentData || {},
        signatureData || {}
      )
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF 생성 시간 초과 (30초)')), 30000)
      )
      
      // Use the Korean PDF generator with proper font support
      const pdfBlob = await Promise.race([
        pdfGenerationPromise,
        timeoutPromise
      ]) as Blob
      
      console.log('PDF blob created:', {
        size: pdfBlob.size,
        type: pdfBlob.type
      })
      
      const url = URL.createObjectURL(pdfBlob)
      console.log('PDF URL created:', url)
      
      setPdfUrl(url)
      setPdfGenerated(true)
      setShowPreview(true)
      
      console.log('=== PDF Generation Completed Successfully ===')
      
    } catch (error) {
      console.error('PDF generation error:', error)
      console.error('Error details:', {
        formData,
        consentData,
        signatureData,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      })
      alert(`PDF 생성 중 오류가 발생했습니다.\n\n오류 내용: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n브라우저 콘솔에서 자세한 내용을 확인하세요.`)
    }
    
    setGenerating(false)
  }

  useEffect(() => {
    console.log('PDFGenerationPage - Starting data loading...')
    console.log('formData:', formData)
    console.log('consentData:', consentData)
    
    // Try sessionStorage first (for consent flow), then localStorage
    const savedSignatures = sessionStorage.getItem('signatureData') || localStorage.getItem('signatureData')
    const canvasDrawings = sessionStorage.getItem('canvasDrawings') || localStorage.getItem('canvasDrawings')
    
    console.log('Loading signature data from storage...')
    console.log('Session signatureData:', sessionStorage.getItem('signatureData'))
    console.log('Session canvasDrawings:', sessionStorage.getItem('canvasDrawings'))
    console.log('Local signatureData:', localStorage.getItem('signatureData'))
    console.log('Local canvasDrawings:', localStorage.getItem('canvasDrawings'))
    
    let finalSignatureData: SignatureData = {}
    
    if (savedSignatures) {
      try {
        const sigData = JSON.parse(savedSignatures)
        console.log('Parsed signature data:', sigData)
        finalSignatureData = { ...sigData }
      } catch (error) {
        console.error('Error parsing signature data:', error)
      }
    }
    
    // Include canvas drawings in signature data
    if (canvasDrawings) {
      try {
        const drawings = JSON.parse(canvasDrawings)
        console.log('Parsed canvas drawings:', drawings)
        // If canvases not already in signatureData, add them
        if (!finalSignatureData.canvases) {
          finalSignatureData.canvases = drawings
        }
      } catch (error) {
        console.error('Error parsing canvas drawings:', error)
      }
    }
    
    console.log('Final signature data to use:', finalSignatureData)
    setSignatureData(finalSignatureData)
    setDataLoaded(true)
  }, [formData, consentData])

  useEffect(() => {
    console.log('PDF Generation useEffect triggered:', {
      dataLoaded,
      hasPatientName: !!formData.patient_name,
      pdfGenerated,
      generating,
      formData: formData,
      signatureData: signatureData
    })
    
    // Generate PDF only once when data is loaded and formData is available
    if (dataLoaded && formData.patient_name && !pdfGenerated && !generating) {
      console.log('Data loaded, generating PDF with signature data:', signatureData)
      console.log('formData available:', !!formData.patient_name)
      const timer = setTimeout(() => {
        generatePDF()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [dataLoaded, formData, signatureData]) // Watch for data loading

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            수술 동의서 PDF 생성
          </h2>
          <p className="text-sm text-slate-600">
            작성된 수술 동의서를 PDF 파일로 저장합니다
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="p-6 space-y-6">
            {generating ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
                <span className="text-slate-700">PDF 생성 중...</span>
              </div>
            </div>
          ) : pdfGenerated && pdfUrl ? (
            <>
              {/* PDF Preview */}
              <div className="bg-slate-100 p-4 rounded-lg">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">PDF 미리보기</h3>
                  <span className="text-xs text-slate-600">PDF 생성 완료</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    width="100%"
                    height="600"
                    style={{
                      border: 'none',
                      display: 'block'
                    }}
                    title="PDF 미리보기"
                    onError={() => {
                      console.error('PDF iframe 로딩 실패')
                    }}
                  />
                  <div className="p-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                    PDF 미리보기가 표시되지 않으면 직접 다운로드 버튼을 클릭하세요.
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col items-center gap-3 pt-4">
                <Button 
                  onClick={async () => {
                    console.log('=== PDF Download Button Clicked ===')
                    console.log('pdfUrl:', pdfUrl)
                    
                    if (pdfUrl) {
                      try {
                        console.log('Creating download link with better compatibility...')
                        
                        // Create a more compatible filename (ASCII only)
                        const now = new Date()
                        const year = now.getFullYear()
                        const month = String(now.getMonth() + 1).padStart(2, '0')
                        const day = String(now.getDate()).padStart(2, '0')
                        const hour = String(now.getHours()).padStart(2, '0')
                        const minute = String(now.getMinutes()).padStart(2, '0')
                        const second = String(now.getSeconds()).padStart(2, '0')
                        const timestamp = `${year}${month}${day}${hour}${minute}${second}`
                        const patientName = (formData.patient_name || 'patient').replace(/[^a-zA-Z0-9가-힣]/g, '_')
                        const filename = `${patientName}_consent_${timestamp}.pdf`
                        
                        console.log('Download filename (ASCII):', filename)
                        
                        // Method 1: Try direct download with better browser compatibility
                        const link = document.createElement('a')
                        link.style.display = 'none'
                        link.href = pdfUrl
                        link.download = filename
                        
                        // Add to DOM, click, then remove
                        document.body.appendChild(link)
                        console.log('Triggering download...')
                        link.click()
                        document.body.removeChild(link)
                        
                        console.log('Download triggered successfully')
                        
                        // Alternative method: If direct download fails, open in new tab
                        setTimeout(() => {
                          console.log('Opening PDF in new tab as fallback...')
                          window.open(pdfUrl, '_blank')
                        }, 1000)
                        
                      } catch (error) {
                        console.error('Download error:', error)
                        // Fallback: open in new tab
                        console.log('Fallback: Opening PDF in new tab...')
                        window.open(pdfUrl, '_blank')
                      }
                    } else {
                      console.error('No PDF URL available for download')
                      alert('PDF 파일이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.')
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 h-auto font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  PDF 다운로드
                </Button>
                <span className="text-xs text-slate-500">
                  {(() => {
                    const now = new Date()
                    const year = now.getFullYear()
                    const month = String(now.getMonth() + 1).padStart(2, '0')
                    const day = String(now.getDate()).padStart(2, '0')
                    const hour = String(now.getHours()).padStart(2, '0')
                    const minute = String(now.getMinutes()).padStart(2, '0')
                    const second = String(now.getSeconds()).padStart(2, '0')
                    const timestamp = `${year}${month}${day}${hour}${minute}${second}`
                    const patientName = (formData.patient_name || 'patient').replace(/[^a-zA-Z0-9가-힣]/g, '_')
                    return `${patientName}_consent_${timestamp}.pdf`
                  })()}
                </span>
              </div>
            </>
          ) : null}

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">참고사항</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• PDF 파일은 자동으로 다운로드 폴더에 저장됩니다</li>
                <li>• 브라우저에서 다운로드가 차단된 경우, 새 탭에서 PDF가 열립니다</li>
                <li>• 파일명: {(() => {
                    const now = new Date()
                    const year = now.getFullYear()
                    const month = String(now.getMonth() + 1).padStart(2, '0')
                    const day = String(now.getDate()).padStart(2, '0')
                    const hour = String(now.getHours()).padStart(2, '0')
                    const minute = String(now.getMinutes()).padStart(2, '0')
                    const second = String(now.getSeconds()).padStart(2, '0')
                    const timestamp = `${year}${month}${day}${hour}${minute}${second}`
                    const patientName = (formData.patient_name || 'patient').replace(/[^a-zA-Z0-9가-힣]/g, '_')
                    return `${patientName}_consent_${timestamp}.pdf`
                  })()}</li>
                <li>• 생성된 PDF는 법적 효력을 가지는 정식 문서로 사용 가능합니다</li>
                <li>• 필요시 인쇄하여 보관하시기 바랍니다</li>
              </ul>
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
          
          {onHome && (
            <Button
              onClick={onHome}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 h-auto font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              홈으로 돌아가기
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}