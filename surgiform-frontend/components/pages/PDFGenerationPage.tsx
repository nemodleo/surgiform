"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Loader2, Check, Home, ChevronLeft } from "lucide-react"
import { generateKoreanPDF } from "@/lib/koreanPdfGenerator"

interface PDFGenerationPageProps {
  formData: any
  consentData: any
  onHome?: () => void
  onBack?: () => void
}

export default function PDFGenerationPage({ formData, consentData, onHome, onBack }: PDFGenerationPageProps) {
  const [generating, setGenerating] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [signatureData, setSignatureData] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const savedSignatures = localStorage.getItem('signatureData')
    const canvasDrawings = localStorage.getItem('canvasDrawings')
    
    if (savedSignatures) {
      const sigData = JSON.parse(savedSignatures)
      console.log('Loaded signature data:', sigData)
      
      // Include canvas drawings in signature data
      if (canvasDrawings) {
        const drawings = JSON.parse(canvasDrawings)
        console.log('Loaded canvas drawings:', drawings)
        sigData.canvases = drawings
      }
      
      setSignatureData(sigData)
    }
    
    // Auto-generate PDF on mount
    setTimeout(() => {
      generatePDF()
    }, 500)
  }, [])

  const generatePDF = async () => {
    setGenerating(true)
    
    try {
      console.log('Generating PDF with data:', {
        formData,
        consentData,
        signatureData
      })
      
      // Use the Korean PDF generator with proper font support
      const pdfBlob = await generateKoreanPDF(
        formData,
        consentData,
        signatureData
      )
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
      setPdfGenerated(true)
      setShowPreview(true)
      
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    }
    
    setGenerating(false)
  }

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
            <div className="bg-slate-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-slate-700" />
                  <div>
                    <h3 className="font-semibold text-slate-900">수술 동의서</h3>
                    <p className="text-sm text-slate-600">
                      환자: {formData.patient_name || "지정되지 않음"} | 수술명: {formData.surgery_name || "지정되지 않음"}
                    </p>
                  </div>
                </div>
                {pdfGenerated && (
                  <Check className="h-6 w-6 text-emerald-500" />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>환자 정보 포함</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>수술 상세 정보 포함</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>전자 서명 포함</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>작성 날짜 자동 기록</span>
                </div>
              </div>
            </div>

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