import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { NotoSansKRRegularBase64 } from './NotoSansKR-Regular.base64'

// Add Korean font to jsPDF
const addKoreanFont = (doc: jsPDF) => {
  // Add the font to jsPDF
  doc.addFileToVFS('NotoSansKR-Regular.ttf', NotoSansKRRegularBase64)
  doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal')
  
  // Set the Korean font as default
  doc.setFont('NotoSansKR', 'normal')
}

interface FormData {
  registration_number?: string
  patient_name?: string
  patient_age?: string
  patient_gender?: string
  surgery_date?: string
  diagnosis?: string
  surgery_site?: string
  medical_team?: Array<{ name: string }>
  [key: string]: unknown
}

interface ConsentItem {
  item_title?: string
  category?: string
  description?: string
}

interface ConsentData {
  consents?: ConsentItem[]
  [key: string]: unknown
}

interface SignatureData {
  patient?: string
  doctor?: string
  [key: string]: unknown
}

export const generateKoreanPDFWithJsPDF = async (
  formData: FormData,
  consentData: ConsentData,
  signatureData: SignatureData
) => {
  const doc = new jsPDF('p', 'mm', 'a4')
  
  // Set font
  addKoreanFont(doc)
  
  // Title
  doc.setFontSize(20)
  doc.text('수술 동의서', 105, 20, { align: 'center' })
  
  // Patient Information Section
  doc.setFontSize(14)
  doc.text('환자 정보', 20, 40)
  
  doc.setFontSize(11)
  let yPos = 50
  
  // Patient details
  const patientInfo = [
    ['등록번호', formData.registration_number || '-'],
    ['환자명', formData.patient_name || '-'],
    ['나이/성별', `${formData.patient_age || '-'}세 / ${formData.patient_gender || '-'}`],
    ['수술예정일', formData.surgery_date || '-'],
    ['진단명', formData.diagnosis || '-'],
    ['수술부위', formData.surgery_site || '-']
  ]
  
  patientInfo.forEach(([label, value]) => {
    doc.setFontSize(11)
    doc.setFont('NotoSansKR', 'normal')
    doc.text(`${label}:`, 20, yPos)
    doc.setFont('NotoSansKR', 'normal')
    doc.text(String(value), 60, yPos)
    yPos += 8
  })
  
  // Surgery Information Section
  yPos += 10
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('수술 정보', 20, yPos)
  
  yPos += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  // Add consent items
  if (consentData?.consents && Array.isArray(consentData.consents)) {
    consentData.consents.forEach((consent, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(11)
    doc.setFont('NotoSansKR', 'normal')
      doc.text(`${index + 1}. ${consent.item_title || consent.category || ''}`, 20, yPos)
      yPos += 7
      
      doc.setFont('NotoSansKR', 'normal')
      const description = consent.description || ''
      const lines = doc.splitTextToSize(description, 170)
      lines.forEach((line: string) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(line, 25, yPos)
        yPos += 6
      })
      yPos += 5
    })
  }
  
  // Signatures Section
  if (signatureData) {
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setFontSize(11)
    doc.setFont('NotoSansKR', 'normal')
    doc.text('서명', 20, yPos)
    yPos += 15
    
    // Patient signature
    if (signatureData.patient) {
      doc.setFontSize(11)
      doc.text(`환자: ${formData.patient_name || '환자'}`, 20, yPos)
      try {
        doc.addImage(signatureData.patient, 'PNG', 20, yPos + 5, 60, 20)
        yPos += 35
      } catch (e) {
        console.error('[jsPdfKoreanGenerator] 환자 서명 추가 실패:', e)
        yPos += 10
      }
    }
    
    // Doctor signature
    if (signatureData.doctor) {
      doc.setFontSize(11)
      doc.text(`의사: ${formData.medical_team?.[0]?.name || '의사'}`, 20, yPos)
      try {
        doc.addImage(signatureData.doctor, 'PNG', 20, yPos + 5, 60, 20)
        yPos += 35
      } catch (e) {
        console.error('[jsPdfKoreanGenerator] 의사 서명 추가 실패:', e)
        yPos += 10
      }
    }
  }
  
  // Date
  doc.setFontSize(11)
  doc.text(`작성일: ${new Date().toLocaleDateString('ko-KR')}`, 20, yPos)
  
  // Return as blob
  return doc.output('blob')
}