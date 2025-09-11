import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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

export const generateKoreanPDFFromDOM = async (
  formData: FormData,
  consentData: ConsentData,
  signatureData: SignatureData
) => {
  console.log('=== PDF Generation Debug ===')
  console.log('FormData:', formData)
  console.log('ConsentData:', consentData)
  console.log('SignatureData:', signatureData)
  console.log('Patient signature exists:', !!signatureData?.patient)
  console.log('Doctor signature exists:', !!signatureData?.doctor)
  
  // Create a div to render the content (visible but behind)
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = '210mm'
  container.style.padding = '20mm'
  container.style.backgroundColor = 'white'
  container.style.fontFamily = '"Noto Sans KR", sans-serif'
  container.style.zIndex = '-9999'
  container.style.opacity = '1' // Keep visible for rendering
  document.body.appendChild(container)

  // Build HTML content
  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
      * {
        font-family: 'Noto Sans KR', sans-serif;
      }
      h1 { font-size: 24px; text-align: center; margin-bottom: 30px; }
      h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
      .info-row { margin: 8px 0; }
      .label { font-weight: bold; display: inline-block; width: 100px; }
      .consent-item { margin: 15px 0; }
      .consent-title { font-weight: bold; margin-bottom: 5px; }
      .consent-desc { padding-left: 20px; color: #333; }
      .signature-section { 
        margin-top: 40px; 
        page-break-inside: avoid;
      }
      .signature-img { 
        max-width: 200px; 
        max-height: 100px;
        border: 1px solid #ddd; 
        margin: 10px 0; 
        display: block;
      }
      .signature-item {
        margin-bottom: 20px;
      }
      .signature-label {
        font-weight: bold;
        margin-bottom: 5px;
      }
    </style>
    
    <h1>수술 동의서</h1>
    
    <h2>환자 정보</h2>
    <div class="info-row">
      <span class="label">등록번호:</span>
      <span>${formData.registration_number || '-'}</span>
    </div>
    <div class="info-row">
      <span class="label">환자명:</span>
      <span>${formData.patient_name || '-'}</span>
    </div>
    <div class="info-row">
      <span class="label">나이/성별:</span>
      <span>${formData.patient_age || '-'}세 / ${formData.patient_gender || '-'}</span>
    </div>
    <div class="info-row">
      <span class="label">수술예정일:</span>
      <span>${formData.surgery_date || '-'}</span>
    </div>
    <div class="info-row">
      <span class="label">진단명:</span>
      <span>${formData.diagnosis || '-'}</span>
    </div>
    <div class="info-row">
      <span class="label">수술부위:</span>
      <span>${formData.surgery_site || '-'}</span>
    </div>
    
    ${consentData?.consents && consentData.consents.length > 0 ? `
      <h2>수술 동의 내용</h2>
      ${consentData.consents.map((consent, index) => `
        <div class="consent-item">
          <div class="consent-title">${index + 1}. ${consent.item_title || consent.category || ''}</div>
          <div class="consent-desc">${consent.description || ''}</div>
        </div>
      `).join('')}
    ` : ''}
    
    <div class="signature-section">
      <h2>서명</h2>
      ${signatureData?.patient ? `
        <div class="signature-item">
          <div class="signature-label">환자: ${formData.patient_name || '환자'}</div>
          <img src="${signatureData.patient}" class="signature-img" alt="Patient signature" />
        </div>
      ` : '<div class="signature-item"><div class="signature-label">환자 서명: (서명 없음)</div></div>'}
      ${signatureData?.doctor ? `
        <div class="signature-item">
          <div class="signature-label">의사: ${formData.medical_team?.[0]?.name || '의사'}</div>
          <img src="${signatureData.doctor}" class="signature-img" alt="Doctor signature" />
        </div>
      ` : '<div class="signature-item"><div class="signature-label">의사 서명: (서명 없음)</div></div>'}
      <div style="margin-top: 20px">
        <strong>작성일:</strong> ${new Date().toLocaleDateString('ko-KR')}
      </div>
    </div>
  `

  try {
    // Wait for fonts to load
    await document.fonts.ready
    
    // Wait a bit for images to load
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('Container HTML:', container.innerHTML)
    console.log('Container dimensions:', {
      width: container.offsetWidth,
      height: container.offsetHeight
    })
    
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true, // Enable logging to debug
      backgroundColor: '#ffffff',
      foreignObjectRendering: false, // Change to false for better compatibility
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const clonedContainer = clonedDoc.querySelector('div')
        if (clonedContainer) {
          console.log('Cloned container exists')
        }
      }
    })
    
    console.log('Canvas dimensions:', {
      width: canvas.width,
      height: canvas.height
    })
    
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas is empty - no content rendered')
    }
    
    // Create PDF from canvas
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    const pdf = new jsPDF('p', 'mm', 'a4')
    let position = 0
    
    const imgData = canvas.toDataURL('image/png')
    console.log('Image data length:', imgData.length)
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    // Clean up
    document.body.removeChild(container)
    
    return pdf.output('blob')
  } catch (error) {
    document.body.removeChild(container)
    throw error
  }
}