"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Loader2, Check, Home } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface PDFGenerationPageProps {
  formData: any
  consentData: any
  onHome?: () => void
}

export default function PDFGenerationPage({ formData, consentData, onHome }: PDFGenerationPageProps) {
  const [generating, setGenerating] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [signatureData, setSignatureData] = useState<any>(null)

  useEffect(() => {
    const savedSignatures = localStorage.getItem('signatureData')
    if (savedSignatures) {
      setSignatureData(JSON.parse(savedSignatures))
    }
  }, [])

  const generatePDF = async () => {
    setGenerating(true)
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20
      
      // 한글 텍스트를 이미지로 변환하는 헬퍼 함수
      const addKoreanText = async (text: string, x: number, y: number, options?: any) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return y
        
        const fontSize = options?.fontSize || 12
        const isBold = options?.bold || false
        const align = options?.align || 'left'
        
        ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize * 3}px sans-serif`
        const metrics = ctx.measureText(text)
        
        canvas.width = metrics.width + 20
        canvas.height = fontSize * 4
        
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize * 3}px sans-serif`
        ctx.fillStyle = 'black'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, 10, canvas.height / 2)
        
        let xPos = x
        if (align === 'center') {
          xPos = (pageWidth - (canvas.width / 10)) / 2
        }
        
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', xPos, y - (fontSize / 2), canvas.width / 10, fontSize * 1.2)
        
        return y + fontSize * 1.5
      }
      
      // 제목
      yPosition = await addKoreanText('수술 동의서', pageWidth / 2, yPosition, { fontSize: 20, bold: true, align: 'center' })
      yPosition += 10
      
      // 환자 정보
      yPosition = await addKoreanText('환자 정보', 20, yPosition, { fontSize: 14, bold: true })
      yPosition += 5
      
      const patientInfo = [
        `이름: ${formData.patient_name}`,
        `나이: ${formData.patient_age}세`,
        `성별: ${formData.patient_gender === 'MALE' ? '남성' : '여성'}`,
        `수술명: ${formData.surgery_name}`,
        `증상: ${formData.symptoms}`,
        `수술 목적: ${formData.surgery_objective}`
      ]
      
      for (const info of patientInfo) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = 20
        }
        yPosition = await addKoreanText(info, 20, yPosition, { fontSize: 11 })
      }
      
      yPosition += 10
      
      // 수술 동의 내용
      yPosition = await addKoreanText('수술 동의 내용', 20, yPosition, { fontSize: 14, bold: true })
      yPosition += 5
      
      if (consentData?.consents) {
        for (const [index, consent] of consentData.consents.entries()) {
          if (yPosition > pageHeight - 50) {
            pdf.addPage()
            yPosition = 20
          }
          
          // 제목
          yPosition = await addKoreanText(`${index + 1}. ${consent.item_title}`, 20, yPosition, { fontSize: 12, bold: true })
          
          // 설명 - 긴 텍스트를 여러 줄로 나눔
          const maxCharsPerLine = 45
          const descText = consent.description || ''
          const words = descText.split(' ')
          let currentLine = ''
          
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word
            if (testLine.length > maxCharsPerLine) {
              if (currentLine) {
                if (yPosition > pageHeight - 30) {
                  pdf.addPage()
                  yPosition = 20
                }
                yPosition = await addKoreanText(currentLine, 20, yPosition, { fontSize: 11 })
              }
              currentLine = word
            } else {
              currentLine = testLine
            }
          }
          
          if (currentLine) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage()
              yPosition = 20
            }
            yPosition = await addKoreanText(currentLine, 20, yPosition, { fontSize: 11 })
          }
          
          yPosition += 5
        }
      }
      
      // 서명 섹션
      if (signatureData) {
        pdf.addPage()
        yPosition = 20
        
        yPosition = await addKoreanText('서명', 20, yPosition, { fontSize: 14, bold: true })
        yPosition += 10
        
        // 환자 서명
        if (signatureData.patient) {
          yPosition = await addKoreanText(`환자 ${formData.patient_name} 서명:`, 20, yPosition, { fontSize: 12 })
          
          try {
            const imgData = signatureData.patient
            pdf.addImage(imgData, 'PNG', 20, yPosition, 60, 30)
            yPosition += 35
          } catch (e) {
            console.error('Error adding patient signature:', e)
            yPosition += 30
          }
        }
        
        // 의사 서명
        if (signatureData.doctor) {
          yPosition = await addKoreanText('의사 서명:', 20, yPosition, { fontSize: 12 })
          
          try {
            const imgData = signatureData.doctor
            pdf.addImage(imgData, 'PNG', 20, yPosition, 60, 30)
            yPosition += 35
          } catch (e) {
            console.error('Error adding doctor signature:', e)
            yPosition += 30
          }
        }
        
        // 날짜
        const today = new Date().toLocaleDateString('ko-KR')
        await addKoreanText(`작성일: ${today}`, 20, yPosition, { fontSize: 11 })
      }
      
      // PDF 저장
      const pdfBlob = pdf.output('blob')
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
      setPdfGenerated(true)
      
      // 자동 다운로드
      const link = document.createElement('a')
      link.href = url
      link.download = `수술동의서_${formData.patient_name}_${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    }
    
    setGenerating(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>수술 동의서 PDF 생성</CardTitle>
          <CardDescription>
            작성된 수술 동의서를 PDF 파일로 저장합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-dark" />
                <div>
                  <h3 className="font-semibold">수술 동의서</h3>
                  <p className="text-sm text-gray-600">
                    환자: {formData.patient_name} | 수술명: {formData.surgery_name}
                  </p>
                </div>
              </div>
              {pdfGenerated && (
                <Check className="h-6 w-6 text-green-dark" />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-dark" />
                <span>환자 정보 포함</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-dark" />
                <span>수술 상세 정보 포함</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-dark" />
                <span>전자 서명 포함</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-dark" />
                <span>작성 날짜 자동 기록</span>
              </div>
            </div>
          </div>

          {!pdfGenerated ? (
            <div className="text-center py-8">
              <Button 
                onClick={generatePDF} 
                disabled={generating}
                size="lg"
                className="gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    PDF 생성 중...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    PDF 생성 및 다운로드
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center gap-2 text-white bg-green-dark px-4 py-2 rounded-lg">
                <Check className="h-5 w-5" />
                <span className="font-medium">PDF가 성공적으로 생성되었습니다!</span>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={() => {
                    if (pdfUrl) {
                      const link = document.createElement('a')
                      link.href = pdfUrl
                      link.download = `수술동의서_${formData.patient_name}_${new Date().toISOString().split('T')[0]}.pdf`
                      link.click()
                    }
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  다시 다운로드
                </Button>
                
                <Button 
                  onClick={generatePDF}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  새 PDF 생성
                </Button>
              </div>
            </div>
          )}

          <div className="bg-gray-100 rounded-lg p-4">
            <h4 className="font-medium mb-2">참고사항</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• PDF 파일은 자동으로 다운로드 폴더에 저장됩니다</li>
              <li>• 파일명: 수술동의서_{formData.patient_name}_{new Date().toISOString().split('T')[0]}.pdf</li>
              <li>• 생성된 PDF는 법적 효력을 가지는 정식 문서로 사용 가능합니다</li>
              <li>• 필요시 인쇄하여 보관하시기 바랍니다</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {onHome && (
        <div className="text-center">
          <Button
            onClick={onHome}
            variant="outline"
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            홈으로 돌아가기
          </Button>
        </div>
      )}
    </div>
  )
}