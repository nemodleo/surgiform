import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

export const generatePlatePDF = async (
  formData: FormData,
  consentData: ConsentData,
  signatureData: SignatureData
) => {
  
  // Create a hidden container to render the document
  const container = document.createElement('div')
  container.id = 'pdf-export-container'
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 794px;
    padding: 40px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    z-index: -1;
    overflow: visible;
    box-sizing: border-box;
  `
  
  // Build HTML content matching the DocumentViewer style
  let html = `
    <div style="padding: 20px; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h1 style="text-align: center; font-size: 28px; margin-bottom: 30px; font-weight: 600; color: #0f172a;">수술 동의서</h1>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #0f172a; font-weight: 600;">환자 정보</h2>
        <div style="line-height: 1.8; color: #475569;">
          <p style="margin: 10px 0;"><span style="font-weight: 500; color: #0f172a;">이름:</span> ${formData.patient_name || '미입력'}</p>
          <p style="margin: 10px 0;"><span style="font-weight: 500; color: #0f172a;">나이:</span> ${formData.patient_age || '미입력'}세</p>
          <p style="margin: 10px 0;"><span style="font-weight: 500; color: #0f172a;">성별:</span> ${formData.patient_gender || '미입력'}</p>
          <p style="margin: 10px 0;"><span style="font-weight: 500; color: #0f172a;">등록번호:</span> ${formData.registration_number || '미입력'}</p>
        </div>
      </div>
  `
  
  // Add consent items
  if (consentData?.consents && consentData.consents.length > 0) {
    html += `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #0f172a; font-weight: 600;">수술 정보</h2>
    `
    
    consentData.consents.forEach((item, index) => {
      // Convert line breaks to <br> tags and tabs to spaces
      const description = (item.description || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      
      html += `
        <div style="margin: 15px 0; padding: 16px; background: #f8fafc; border-radius: 8px;">
          <h3 style="font-size: 16px; margin-bottom: 8px; color: #0f172a; font-weight: 500;">
            ${index + 1}. ${item.category || item.item_title || ''}
          </h3>
          <div style="margin: 5px 0; padding-left: 20px; line-height: 1.8; color: #64748b; font-size: 14px;">
            ${description}
          </div>
        </div>
      `
    })
    
    html += '</div>'
  }
  
  // Add signatures
  html += `
    <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #e2e8f0;">
      <h2 style="font-size: 20px; margin-bottom: 20px; color: #0f172a; font-weight: 600;">서명</h2>
  `
  
  // Patient signature
  if (signatureData?.patient) {
    html += `
      <div style="margin-bottom: 30px;">
        <p style="font-weight: 500; margin-bottom: 10px; color: #0f172a;">환자: ${formData.patient_name || '환자'}</p>
        <img src="${signatureData.patient}" style="border: 1px solid #e2e8f0; max-width: 200px; height: 80px; display: block; background: white; padding: 8px; border-radius: 4px;" />
      </div>
    `
  } else {
    html += `
      <div style="margin-bottom: 30px;">
        <p style="font-weight: 500; margin-bottom: 10px; color: #0f172a;">환자: ${formData.patient_name || '환자'}</p>
        <div style="border: 1px solid #e2e8f0; width: 200px; height: 80px; display: flex; align-items: center; justify-content: center; color: #94a3b8; background: #f8fafc; border-radius: 4px;">
          서명 없음
        </div>
      </div>
    `
  }
  
  // Doctor signature
  if (signatureData?.doctor) {
    html += `
      <div style="margin-bottom: 30px;">
        <p style="font-weight: 500; margin-bottom: 10px; color: #0f172a;">의사: ${formData.medical_team?.[0]?.name || '의사'}</p>
        <img src="${signatureData.doctor}" style="border: 1px solid #e2e8f0; max-width: 200px; height: 80px; display: block; background: white; padding: 8px; border-radius: 4px;" />
      </div>
    `
  } else {
    html += `
      <div style="margin-bottom: 30px;">
        <p style="font-weight: 500; margin-bottom: 10px; color: #0f172a;">의사: ${formData.medical_team?.[0]?.name || '의사'}</p>
        <div style="border: 1px solid #e2e8f0; width: 200px; height: 80px; display: flex; align-items: center; justify-content: center; color: #94a3b8; background: #f8fafc; border-radius: 4px;">
          서명 없음
        </div>
      </div>
    `
  }
  
  html += `
      <p style="margin-top: 20px; color: #475569;"><span style="font-weight: 500; color: #0f172a;">작성일:</span> ${new Date().toLocaleDateString('ko-KR')}</p>
    </div>
  </div>
  `
  
  container.innerHTML = html
  document.body.appendChild(container)
  
  try {
    // Wait for images to load
    const images = container.getElementsByTagName('img')
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true)
        } else {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
        }
      })
    })
    
    await Promise.all(imagePromises)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
      windowHeight: container.scrollHeight
    })
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // A4 dimensions
    const pageWidth = 210
    const pageHeight = 297
    const marginTop = 10
    const marginBottom = 20
    const marginLeft = 10
    const marginRight = 10
    
    const contentWidth = pageWidth - marginLeft - marginRight
    const imgRatio = canvas.height / canvas.width
    const contentHeight = contentWidth * imgRatio
    
    const usablePageHeight = pageHeight - marginTop - marginBottom
    const totalPages = Math.ceil(contentHeight / usablePageHeight)
    
    // Add pages
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      if (pageIndex > 0) {
        pdf.addPage()
      }
      
      const sourceY = (pageIndex * usablePageHeight * canvas.width) / contentWidth
      const sourceHeight = (usablePageHeight * canvas.width) / contentWidth
      const actualSourceHeight = Math.min(sourceHeight, canvas.height - sourceY)
      const actualContentHeight = (actualSourceHeight * contentWidth) / canvas.width
      
      // Create temporary canvas for this page
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = actualSourceHeight
      
      const ctx = pageCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, sourceY,
          canvas.width, actualSourceHeight,
          0, 0,
          canvas.width, actualSourceHeight
        )
        
        const pageImgData = pageCanvas.toDataURL('image/png')
        pdf.addImage(pageImgData, 'PNG', marginLeft, marginTop, contentWidth, actualContentHeight)
      }
    }
    
    // Clean up
    document.body.removeChild(container)
    
    return pdf.output('blob')
    
  } catch (error) {
    console.error('[platePdfGenerator] PDF 생성 오류:', error)
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
    throw error
  }
}