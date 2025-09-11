"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, Home, ChevronLeft } from "lucide-react"
// import { generateKoreanPDF } from "@/lib/koreanPdfGenerator"
// import { generateKoreanPDFWithJsPDF } from "@/lib/jsPdfKoreanGenerator"
// import { generateKoreanPDFFromDOM } from "@/lib/domPdfGenerator"
import { generateSimplePDF } from "@/lib/simplePdfGenerator"

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
    setGenerating(true)
    
    try {
      console.log('Generating PDF with data:', {
        formData,
        consentData,
        signatureData
      })
      
      // Add timeout for PDF generation using DOM approach
      const pdfGenerationPromise = generateSimplePDF(
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
      
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
      setPdfGenerated(true)
      setShowPreview(true)
      
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
      const sigData = JSON.parse(savedSignatures)
      console.log('Parsed signature data:', sigData)
      finalSignatureData = { ...sigData }
    }
    
    // Include canvas drawings in signature data
    if (canvasDrawings) {
      const drawings = JSON.parse(canvasDrawings)
      console.log('Parsed canvas drawings:', drawings)
      // If canvases not already in signatureData, add them
      if (!finalSignatureData.canvases) {
        finalSignatureData.canvases = drawings
      }
    }
    
    console.log('Final signature data to use:', finalSignatureData)
    setSignatureData(finalSignatureData)
    setDataLoaded(true)
  }, [])

  useEffect(() => {
    // Generate PDF only once when data is loaded
    if (dataLoaded && !pdfGenerated && !generating) {
      console.log('Data loaded, generating PDF with signature data:', signatureData)
      const timer = setTimeout(() => {
        generatePDF()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [dataLoaded, signatureData]) // Watch for data loading

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
                  <span className="text-xs text-slate-600">수술동의서_{formData.patient_name || '환자'}_{new Date().toISOString().split('T')[0]}.pdf</span>
                </div>
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full"
                    title="PDF Preview"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => {
                    if (pdfUrl) {
                      const link = document.createElement('a')
                      link.href = pdfUrl
                      link.download = `수술동의서_${formData.patient_name || '환자'}_${new Date().toISOString().split('T')[0]}.pdf`
                      link.click()
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 h-auto font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  PDF 다운로드
                </Button>
              </div>
            </>
          ) : null}

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">참고사항</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• PDF 파일은 자동으로 다운로드 폴더에 저장됩니다</li>
                <li>• 파일명: 수술동의서_{formData.patient_name || '환자'}_{new Date().toISOString().split('T')[0]}.pdf</li>
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