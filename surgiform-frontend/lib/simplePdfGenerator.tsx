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

export const generateSimplePDF = async (
  formData: FormData,
  consentData: ConsentData,
  signatureData: SignatureData
) => {
  
  
  // Check for canvas signatures
  
  // Create a visible temporary container with A4 width
  const container = document.createElement('div')
  container.id = 'pdf-container'
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 794px;
    padding: 40px;
    background: white;
    font-family: 'Malgun Gothic', Arial, sans-serif;
    z-index: -1;
    overflow: visible;
    box-sizing: border-box;
  `
  
  // HTML content with Korean text
  let html = `
    <div style="padding: 20px; background: white; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;">
      <h1 style="text-align: center; font-size: 28px; margin-bottom: 30px; font-weight: bold;">수술 동의서</h1>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px;">환자 정보</h2>
        <p style="margin: 10px 0;"><strong>이름:</strong> ${formData.patient_name || '미입력'}</p>
        <p style="margin: 10px 0;"><strong>나이:</strong> ${formData.patient_age || '미입력'}세</p>
        <p style="margin: 10px 0;"><strong>성별:</strong> ${formData.patient_gender || '미입력'}</p>
        <p style="margin: 10px 0;"><strong>등록번호:</strong> ${formData.registration_number || '미입력'}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px;">수술 정보</h2>
  `
  
  // Add consent items
  if (consentData?.consents) {
    consentData.consents.forEach((item, index) => {
      
      // Preserve original formatting including line breaks and tabs
      // Convert line breaks to <br> tags for HTML rendering
      const description = (item.description || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      
      html += `
        <div style="margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
          <h3 style="font-size: 16px; margin-bottom: 8px; color: #333;">
            ${index + 1}. ${item.category || item.item_title || ''}
          </h3>
          <div style="margin: 5px 0; padding-left: 20px; line-height: 1.6; font-family: 'Malgun Gothic', Arial, sans-serif;">
            ${description}
          </div>
        </div>
      `
    })
  }
  
  html += `
      </div>
      
      <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #333;">
        <h2 style="font-size: 20px; margin-bottom: 20px;">서명</h2>
  `
  
  
  // Skip canvas drawings - they are not included in PDF
  // Only include patient and doctor signatures
  
  // Add patient signature
  if (signatureData?.patient) {
    html += `
      <div style="margin-bottom: 30px;">
        <p style="font-weight: bold; margin-bottom: 10px;">환자: ${formData.patient_name || '환자'}</p>
        <img src="${signatureData.patient}" style="border: 1px solid #ddd; max-width: 200px; height: 80px; display: block;" />
      </div>
    `
  } else {
    html += `
      <div style="margin-bottom: 30px;">
        <p style="font-weight: bold; margin-bottom: 10px;">환자: ${formData.patient_name || '환자'}</p>
        <div style="border: 1px solid #ddd; width: 200px; height: 80px; display: flex; align-items: center; justify-content: center; color: #999;">
          서명 없음
        </div>
      </div>
    `
  }
  
  // Add doctor signature
  if (signatureData?.doctor) {
    html += `
      <div style="margin-bottom: 30px;">
        <p style="font-weight: bold; margin-bottom: 10px;">의사: ${formData.medical_team?.[0]?.name || '의사'}</p>
        <img src="${signatureData.doctor}" style="border: 1px solid #ddd; max-width: 200px; height: 80px; display: block;" />
      </div>
    `
  } else {
    html += `
      <div style="margin-bottom: 30px;">
        <p style="font-weight: bold; margin-bottom: 10px;">의사: ${formData.medical_team?.[0]?.name || '의사'}</p>
        <div style="border: 1px solid #ddd; width: 200px; height: 80px; display: flex; align-items: center; justify-content: center; color: #999;">
          서명 없음
        </div>
      </div>
    `
  }
  
  html += `
        <p style="margin-top: 20px;"><strong>작성일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
      </div>
    </div>
  `
  
  container.innerHTML = html
  document.body.appendChild(container)
  
  try {
    // Wait for images to load
    const images = container.getElementsByTagName('img')
    
    // Wait for all images to load
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true)
        } else {
          img.onload = () => resolve(true)
          img.onerror = () => {
            console.error('[simplePdfGenerator] 이미지 로드 실패:', img.src.substring(0, 50))
            resolve(false)
          }
        }
      })
    })
    
    await Promise.all(imagePromises)
    
    // Additional wait for rendering
    await new Promise(resolve => setTimeout(resolve, 500))
    
    
    // Convert to canvas with proper settings
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false, // Reduce console noise
      imageTimeout: 0, // Disable timeout
      windowWidth: 794, // Match container width
      windowHeight: container.scrollHeight, // Capture full height
      onclone: (_document, element) => {
        // Ensure the cloned element has the same dimensions
        element.style.position = 'relative'
        element.style.width = '794px'
        element.style.height = 'auto'
        element.style.overflow = 'visible'
      }
    })
    
    
    // Create PDF with proper page handling
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // A4 dimensions in mm
    const pageWidth = 210
    const pageHeight = 297
    const marginTop = 10
    const marginBottom = 20  // 하단 패딩을 더 크게 설정
    const marginLeft = 10
    const marginRight = 10
    
    // Calculate image dimensions to fit page width with margins
    const contentWidth = pageWidth - marginLeft - marginRight
    const imgRatio = canvas.height / canvas.width
    const contentHeight = contentWidth * imgRatio
    
    
    // Calculate usable height per page
    const usablePageHeight = pageHeight - marginTop - marginBottom
    
    // Calculate how many pages we need
    const totalPages = Math.ceil(contentHeight / usablePageHeight)
    
    // Add pages without overlap
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      if (pageIndex > 0) {
        pdf.addPage()
      }
      
      // Calculate the source rectangle from the canvas
      const sourceY = (pageIndex * usablePageHeight * canvas.width) / contentWidth
      const sourceHeight = (usablePageHeight * canvas.width) / contentWidth
      
      // Make sure we don't exceed canvas height
      const actualSourceHeight = Math.min(sourceHeight, canvas.height - sourceY)
      const actualContentHeight = (actualSourceHeight * contentWidth) / canvas.width
      
      
      // Create a temporary canvas for this page's content
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = actualSourceHeight
      
      const ctx = pageCanvas.getContext('2d')
      if (ctx) {
        // Copy the relevant portion of the original canvas
        ctx.drawImage(
          canvas,
          0, sourceY,           // source x, y
          canvas.width, actualSourceHeight,  // source width, height
          0, 0,                 // destination x, y
          canvas.width, actualSourceHeight   // destination width, height
        )
        
        const pageImgData = pageCanvas.toDataURL('image/png')
        pdf.addImage(pageImgData, 'PNG', marginLeft, marginTop, contentWidth, actualContentHeight)
      }
    }
    
    // Remove container
    document.body.removeChild(container)
    
    // Return as blob
    return pdf.output('blob')
    
  } catch (error) {
    console.error('[simplePdfGenerator] PDF 생성 오류:', error)
    // Clean up on error
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
    throw error
  }
}