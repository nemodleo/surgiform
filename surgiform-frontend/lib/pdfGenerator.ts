import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface PatientData {
  patient_name: string
  patient_age: string
  patient_gender: string
  surgery_name?: string
  surgery_date?: string
  diagnosis?: string
  registration_number?: string
  medical_team?: Array<{
    name: string
    is_specialist: boolean
    department: string
  }>
}

interface ConsentData {
  consents?: Array<{
    category: string
    item_title: string
    description: string
  }>
}

interface SignatureData {
  patient?: string
  doctor?: string
  [key: string]: unknown
}

export async function generateHighQualityPDF(
  formData: PatientData,
  consentData: ConsentData,
  signatureData?: SignatureData
): Promise<Blob> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  
  // Embed a standard font that supports more characters
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  // Add first page
  let page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  let yPosition = height - 50
  
  // Helper function to add text
  const drawText = (
    text: string,
    x: number,
    y: number,
    options?: {
      size?: number
      font?: typeof font
      color?: ReturnType<typeof rgb>
    }
  ) => {
    page.drawText(text, {
      x,
      y,
      size: options?.size || 12,
      font: options?.font || font,
      color: options?.color || rgb(0, 0, 0),
    })
    return y - (options?.size || 12) * 1.5
  }
  
  // Title
  yPosition = drawText('SURGICAL CONSENT FORM', width / 2 - 120, yPosition, {
    size: 20,
    font: boldFont,
  })
  
  yPosition = drawText('수술 동의서', width / 2 - 50, yPosition - 10, {
    size: 16,
    font: boldFont,
  })
  
  yPosition -= 30
  
  // Patient Information Section
  yPosition = drawText('PATIENT INFORMATION', 50, yPosition, {
    size: 14,
    font: boldFont,
  })
  
  yPosition -= 10
  
  // Patient details
  const patientInfo = [
    `Registration Number: ${formData.registration_number || 'N/A'}`,
    `Name: ${formData.patient_name || 'N/A'}`,
    `Age: ${formData.patient_age || 'N/A'}`,
    `Gender: ${formData.patient_gender || 'N/A'}`,
    `Surgery Date: ${formData.surgery_date || 'N/A'}`,
    `Diagnosis: ${formData.diagnosis || 'N/A'}`,
  ]
  
  for (const info of patientInfo) {
    yPosition = drawText(info, 50, yPosition, { size: 11 })
    if (yPosition < 100) {
      page = pdfDoc.addPage()
      yPosition = height - 50
    }
  }
  
  yPosition -= 20
  
  // Medical Team Section
  if (formData.medical_team && formData.medical_team.length > 0) {
    yPosition = drawText('MEDICAL TEAM', 50, yPosition, {
      size: 14,
      font: boldFont,
    })
    
    yPosition -= 10
    
    for (const [index, member] of formData.medical_team.entries()) {
      const memberInfo = `${index + 1}. ${member.name} - ${member.department} (${
        member.is_specialist ? 'Specialist' : 'General'
      })`
      yPosition = drawText(memberInfo, 50, yPosition, { size: 11 })
      if (yPosition < 100) {
        page = pdfDoc.addPage()
        yPosition = height - 50
      }
    }
    
    yPosition -= 20
  }
  
  // Consent Details Section
  if (consentData?.consents && consentData.consents.length > 0) {
    yPosition = drawText('CONSENT DETAILS', 50, yPosition, {
      size: 14,
      font: boldFont,
    })
    
    yPosition -= 10
    
    for (const [index, consent] of consentData.consents.entries()) {
      // Check if we need a new page
      if (yPosition < 150) {
        page = pdfDoc.addPage()
        yPosition = height - 50
      }
      
      // Consent item title
      yPosition = drawText(`${index + 1}. ${consent.item_title}`, 50, yPosition, {
        size: 12,
        font: boldFont,
      })
      
      // Consent description - break into lines
      const description = consent.description || ''
      const maxCharsPerLine = 80
      const words = description.split(' ')
      let currentLine = ''
      const lines: string[] = []
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        if (testLine.length > maxCharsPerLine) {
          if (currentLine) {
            lines.push(currentLine)
          }
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      
      if (currentLine) {
        lines.push(currentLine)
      }
      
      // Draw each line
      for (const line of lines) {
        yPosition = drawText(line, 60, yPosition, { size: 10 })
        if (yPosition < 50) {
          page = pdfDoc.addPage()
          yPosition = height - 50
        }
      }
      
      yPosition -= 10
    }
  }
  
  // Signature Section
  if (signatureData) {
    // Add new page for signatures
    page = pdfDoc.addPage()
    yPosition = height - 50
    
    yPosition = drawText('SIGNATURES', 50, yPosition, {
      size: 14,
      font: boldFont,
    })
    
    yPosition -= 20
    
    // Patient signature
    if (signatureData.patient) {
      yPosition = drawText(`Patient: ${formData.patient_name}`, 50, yPosition, {
        size: 12,
      })
      
      try {
        // Convert base64 to image and embed
        const pngImageBytes = await fetch(signatureData.patient).then(res =>
          res.arrayBuffer()
        )
        const pngImage = await pdfDoc.embedPng(pngImageBytes)
        
        page.drawImage(pngImage, {
          x: 50,
          y: yPosition - 60,
          width: 150,
          height: 50,
        })
        
        yPosition -= 80
      } catch (e) {
        console.error('[pdfGenerator] 환자 서명 추가 오류:', e)
        yPosition -= 30
      }
    }
    
    // Doctor signature
    if (signatureData.doctor) {
      yPosition = drawText('Doctor:', 50, yPosition, { size: 12 })
      
      try {
        const pngImageBytes = await fetch(signatureData.doctor).then(res =>
          res.arrayBuffer()
        )
        const pngImage = await pdfDoc.embedPng(pngImageBytes)
        
        page.drawImage(pngImage, {
          x: 50,
          y: yPosition - 60,
          width: 150,
          height: 50,
        })
        
        yPosition -= 80
      } catch (e) {
        console.error('[pdfGenerator] 의사 서명 추가 오류:', e)
        yPosition -= 30
      }
    }
    
    // Date
    const today = new Date().toLocaleDateString('en-US')
    drawText(`Date: ${today}`, 50, yPosition, { size: 11 })
  }
  
  // Save the PDF and return as blob
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}