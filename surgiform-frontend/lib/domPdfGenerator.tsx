// PDF 생성 라이브러리는 함수 내에서 동적 import로 로드

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
  
  // 동적 import로 라이브러리 로드
  const html2canvasModule = await import('html2canvas')
  const jsPDFModule = await import('jspdf')
  
  const html2canvas = html2canvasModule.default
  const jsPDF = jsPDFModule.default
  
  // Load saved data from sessionStorage to include all consent content
  const savedSurgeryData = sessionStorage.getItem('surgeryInfoTextareas')
  const surgeryData = savedSurgeryData ? JSON.parse(savedSurgeryData) : {}
  
  // Load canvas drawings
  const savedCanvases = localStorage.getItem('canvasDrawings') || sessionStorage.getItem('canvasDrawings')
  const canvasDrawings = savedCanvases ? JSON.parse(savedCanvases) : []
  
  // Load surgery site marking data
  const savedSurgerySiteMarking = sessionStorage.getItem('surgerySiteMarking')
  const surgerySiteMarking = savedSurgerySiteMarking ? JSON.parse(savedSurgerySiteMarking) : { marking: null, reason: '' }

  // Create HTML container for Korean text support
  let container: HTMLDivElement | null = null
  
  try {
    container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 190mm;
      min-height: 277mm;
      background: white;
      z-index: 10000;
      font-family: 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #0f172a;
      padding: 10mm;
      box-sizing: border-box;
    `
    document.body.appendChild(container)

    // Build HTML content with Korean text
    container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap');
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif;
      }
      h1 { font-size: 24px; font-weight: 600; text-align: center; margin-bottom: 32px; color: #0f172a; page-break-after: avoid; }
      h3 { font-size: 16px; font-weight: 600; margin: 32px 0 24px 0; color: #0f172a; page-break-after: avoid; }
      h4 { font-size: 14px; font-weight: 600; margin: 24px 0 12px 0; color: #0f172a; page-break-after: avoid; }
      .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0; page-break-inside: avoid; table-layout: fixed; }
      .info-table th { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 11px; font-weight: 500; color: #334155; text-align: left; word-wrap: break-word; }
      .info-table td { border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 12px; color: #0f172a; word-wrap: break-word; }
      .consent-item { margin-bottom: 32px; page-break-inside: avoid; }
      .consent-title { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
      .consent-desc { line-height: 1.625; white-space: pre-wrap; font-size: 14px; color: #334155; }
      .signature-section { margin-top: 48px; padding-top: 32px; border-top: 2px solid #e2e8f0; }
      .signature-item { margin-bottom: 24px; }
      .signature-label { font-weight: 500; margin-bottom: 12px; color: #0f172a; }
      .signature-placeholder { border: 1px solid #cbd5e1; border-radius: 4px; max-width: 200px; height: 80px; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
    </style>
    
    <h1>수술 동의서</h1>
    
    <h4>환자 정보</h4>
    <table class="info-table">
      <colgroup>
        <col style="width: 20%;">
        <col style="width: 30%;">
        <col style="width: 20%;">
        <col style="width: 30%;">
      </colgroup>
      <tbody>
        <tr><th>등록번호</th><td>${formData.registration_number || ""}</td><th>환자명</th><td>${formData.patient_name || ""}</td></tr>
        <tr><th>수술명</th><td colspan="3">${formData.surgery_name || ""}</td></tr>
        <tr><th>나이/성별</th><td>${formData.patient_age || ""}세 / ${formData.patient_gender === "MALE" ? "남성" : "여성"}</td><th>시행예정일</th><td>${formData.surgery_date || ""}</td></tr>
        <tr><th>진단명</th><td colspan="3">${formData.diagnosis || ""}</td></tr>
        <tr><th>수술부위</th><td>${formData.surgery_site_detail || ""}</td><th>수술부위표시</th><td>${surgerySiteMarking.marking === 'yes' ? '☑ 예' : '□ 예'} &nbsp;&nbsp; ${surgerySiteMarking.marking === 'no' ? '☑ 아니오' : '□ 아니오'} </br>(사유: _________)</td></tr>
      </tbody>
    </table>
    
    <h4>참여 의료진</h4>
    <table class="info-table">
      <colgroup>
        <col style="width: 40%;">
        <col style="width: 30%;">
        <col style="width: 30%;">
      </colgroup>
      <thead><tr><th>성명</th><th>전문의여부</th><th>진료과목</th></tr></thead>
      <tbody>
        ${((formData.medical_team || formData.participants || []) as any[]).map((doctor: any) => `
          <tr><td>${doctor.name || ""}${doctor.is_specialist ? ' (집도의)' : ''}</td><td>${doctor.is_specialist ? '전문의' : '일반의'}</td><td>${doctor.department || ""}</td></tr>
      `).join('')}
      </tbody>
    </table>
    
    <h4>1. 환자 상태 및 특이사항</h4>
    <table class="info-table">
      <colgroup>
        <col style="width: 25%;">
        <col style="width: 20%;">
        <col style="width: 25%;">
        <col style="width: 30%;">
      </colgroup>
      <tbody>
        <tr><th>과거병력</th><td>${formData.medical_history ? '있음' : '없음'}</td><th>당뇨병</th><td>${formData.diabetes ? '있음' : '없음'}</td></tr>
        <tr><th>흡연유무</th><td>${formData.smoking ? '흡연' : '비흡연'}</td><th>고혈압</th><td>${formData.hypertension ? '있음' : '없음'}</td></tr>
        <tr><th>알레르기</th><td>${formData.allergy ? '있음' : '없음'}</td><th>저혈압</th><td>${formData.hypotension ? '있음' : '없음'}</td></tr>
        <tr><th>기도이상</th><td>${formData.airway_abnormal ? '있음' : '없음'}</td><th>심혈관질환</th><td>${formData.cardiovascular ? '있음' : '없음'}</td></tr>
        <tr><th>호흡기질환</th><td>${formData.respiratory_disease ? '있음' : '없음'}</td><th>혈액응고 관련 질환</th><td>${formData.blood_coagulation ? '있음' : '없음'}</td></tr>
        <tr><th>복용약물</th><td>${formData.medication ? '있음' : '없음'}</td><th>신장질환</th><td>${formData.kidney_disease ? '있음' : '없음'}</td></tr>
        <tr><th>마약복용 혹은 약물사고</th><td>${formData.drug_abuse ? '있음' : '없음'}</td><td colspan="2"></td></tr>
        <tr><th>기타</th><td colspan="3">${formData.other_conditions || ""}</td></tr>
      </tbody>
    </table>
    
    ${(() => {
      const allItems = [
        { number: "2", title: "예정된 수술/시술/검사를 하지 않을 경우의 예후", key: "2" },
        { number: "3", title: "예정된 수술 이외의 시행 가능한 다른 방법", key: "3" },
        { number: "4", title: "수술 목적/필요/효과", key: "4" },
        { number: "5", title: "수술 방법 및 내용", key: "5" },
        { number: "5-1", title: "수술 과정 전반에 대한 설명", key: "5-1" },
        { number: "5-2", title: "수술 추정 소요시간", key: "5-2" },
        { number: "5-3", title: "수술 방법 변경 및 수술 추가 가능성", key: "5-3" },
        { number: "5-4", title: "수혈 가능성", key: "5-4" },
        { number: "5-5", title: "집도의 변경 가능성", key: "5-5" },
        { number: "6", title: "발생 가능한 합병증/후유증/부작용", key: "6" },
        { number: "7", title: "문제 발생시 조치사항", key: "7" },
        { number: "8", title: "진단/수술 관련 사망 위험성", key: "8" }
      ];
      return allItems.map(item => {
        const content = item.number === "5" ? "" : (surgeryData[item.key] || '내용이 입력되지 않았습니다.');
        const itemCanvases = canvasDrawings.filter((canvas: any) => 
          canvas.title && canvas.title.includes(`${item.number}. ${item.title}`)
        );
        
        let canvasHtml = '';
        if (itemCanvases.length > 0) {
          canvasHtml = itemCanvases.map((canvas: any) => {
            if (canvas.imageData) {
              return `
                <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                  <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${canvas.title}</div>
                  <img src="${canvas.imageData}" alt="Canvas drawing" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 4px;" />
                </div>
              `;
            } else {
              return `
                <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                  <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${canvas.title}</div>
                  <div style="border: 1px solid #e2e8f0; border-radius: 4px; height: 200px; background-color: white; position: relative;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #cbd5e1; font-size: 12px;">
                      <!-- 설명 그림 영역 (비어있음) -->
                    </div>
                  </div>
                </div>
              `;
            }
          }).join('');
        }
        
        return `<div class="consent-item"><div class="consent-title">${item.number}. ${item.title}</div>${item.number !== "5" ? `<div class="consent-desc">${content}</div>` : ''}${canvasHtml}</div>`;
      }).join('');
    })()}
    
    <div class="signature-section">
      <h3>수술 동의서 확인</h3>
      
      <div style="margin-bottom: 20px;">
        <p style="margin-bottom: 12px; color: #374151; font-size: 14px;">아래 내용을 읽고 동의해 주세요.</p>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc; padding: 16px;">
          <ol style="margin: 0; padding-left: 0; list-style: none; color: #374151; font-size: 14px; line-height: 1.6;">
            <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #475569; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">1</span>
              <span>나는 수술/시술/검사의 목적, 효과, 과정, 예상되는 위험에 대해 설명을 들었습니다.</span>
            </li>
            <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #475569; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">2</span>
              <span>궁금한 점을 의료진에게 질문할 수 있었고, 충분히 생각할 시간을 가졌습니다.</span>
            </li>
            <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #475569; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">3</span>
              <span>예상치 못한 합병증이나 사고가 생길 수 있음을 이해합니다.</span>
            </li>
            <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #475569; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">4</span>
              <span>수술/시술/검사에 협조하고, 내 상태를 정확히 알릴 것을 약속합니다.</span>
            </li>
            <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #475569; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">5</span>
              <span>수술 방법이나 범위가 바뀔 수 있다는 설명을 들었습니다.</span>
            </li>
            <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #475569; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">6</span>
              <span>담당의사가 바뀔 수 있다는 설명을 들었습니다.</span>
            </li>
            <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
              <span style="display: inline-block; width: 20px; height: 20px; background-color: #475569; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: 600; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">7</span>
              <span>일정이 바뀔 수 있음을 이해합니다.</span>
            </li>
          </ol>
        </div>
      </div>
      
      <div style="display: flex; gap: 40px; margin-bottom: 24px;">
        <div class="signature-item" style="flex: 1;">
          <div class="signature-label">환자: ${formData.patient_name || '환자'}</div>
          ${signatureData?.patient ? 
            `<img src="${signatureData.patient}" alt="Patient signature" style="border: 1px solid #cbd5e1; border-radius: 4px; max-width: 200px; height: 80px; background: white; padding: 8px;" />` : 
            `<div class="signature-placeholder">서명란</div>`
          }
        </div>
        
        <div class="signature-item" style="flex: 1;">
          <div class="signature-label">의사: ${((formData.medical_team || formData.participants || []) as any[])[0]?.name || '의사'}</div>
          ${signatureData?.doctor ? 
            `<img src="${signatureData.doctor}" alt="Doctor signature" style="border: 1px solid #cbd5e1; border-radius: 4px; max-width: 200px; height: 80px; background: white; padding: 8px;" />` : 
            `<div class="signature-placeholder">서명란</div>`
          }
        </div>
      </div>
      
      <div style="margin-top: 24px; color: #334155;">
        <span style="font-weight: 500; color: #0f172a;">작성일:</span> ${new Date().toLocaleDateString('ko-KR')}
      </div>
    </div>
  `

    console.log('Starting Korean PDF generation with HTML rendering...')
    
    // Wait for fonts to load
    if (document.fonts) {
      await document.fonts.ready
      console.log('Korean fonts loaded successfully')
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create PDF with better Korean font support
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false
    })
    
    // Convert HTML to canvas for Korean text support
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: container.offsetWidth,
      height: container.offsetHeight,
      windowWidth: container.offsetWidth,
      windowHeight: container.offsetHeight,
      foreignObjectRendering: true
    })
    
    console.log('Canvas created with Korean text:', {
      width: canvas.width,
      height: canvas.height
    })
    
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas is empty - Korean text not rendered properly')
    }
    
    // Convert canvas to image and split into multiple pages
    const imgData = canvas.toDataURL('image/png', 1.0)
    
    // PDF page dimensions (A4)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const contentWidth = pdfWidth - (margin * 2)
    const contentHeight = pdfHeight - (margin * 2)
    
    // Calculate how to split the canvas across multiple pages
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    
    // Scale canvas to fit page width
    const scale = contentWidth / canvasWidth
    const scaledCanvasHeight = canvasHeight * scale
    
    console.log('Multi-page PDF calculation:', {
      canvasSize: { width: canvasWidth, height: canvasHeight },
      pdfPageSize: { width: pdfWidth, height: pdfHeight },
      contentSize: { width: contentWidth, height: contentHeight },
      scale: scale,
      scaledCanvasHeight: scaledCanvasHeight
    })
    
    // Calculate number of pages needed
    const pagesNeeded = Math.ceil(scaledCanvasHeight / contentHeight)
    console.log('Pages needed:', pagesNeeded)
    
    // Add content to multiple pages
    for (let i = 0; i < pagesNeeded; i++) {
      if (i > 0) {
        pdf.addPage()
      }
      
      // Calculate the portion of canvas for this page
      const yOffset = i * contentHeight / scale
      const remainingHeight = Math.min(contentHeight / scale, canvasHeight - yOffset)
      
      // Create a temporary canvas for this page portion
      const pageCanvas = document.createElement('canvas')
      const pageCtx = pageCanvas.getContext('2d')!
      
      // Set canvas size for this page
      pageCanvas.width = canvasWidth
      pageCanvas.height = remainingHeight
      
      // Draw the portion of the original canvas for this page
      pageCtx.drawImage(
        canvas,
        0, yOffset,           // source x, y
        canvasWidth, remainingHeight,  // source width, height
        0, 0,                 // dest x, y
        canvasWidth, remainingHeight   // dest width, height
      )
      
      // Convert page canvas to image and add to PDF
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
      const pageImgHeight = remainingHeight * scale
      
      console.log(`Adding page ${i + 1}:`, {
        yOffset: yOffset,
        remainingHeight: remainingHeight,
        pageImgHeight: pageImgHeight
      })
      
      pdf.addImage(
        pageImgData, 
        'PNG', 
        margin, 
        margin, 
        contentWidth, 
        pageImgHeight
      )
    }
    
    // Clean up
    document.body.removeChild(container)
    
    // Try different output methods for better browser compatibility
    console.log('Creating PDF blob with better compatibility...')
    
    // Method 1: Standard blob
    try {
      const blob = pdf.output('blob')
      console.log('Standard blob created successfully:', {
        size: blob.size,
        type: blob.type
      })
      return blob
    } catch (error) {
      console.error('Standard blob creation failed:', error)
      
      // Method 2: ArrayBuffer fallback
      try {
        console.log('Trying ArrayBuffer fallback...')
        const arrayBuffer = pdf.output('arraybuffer')
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
        console.log('ArrayBuffer blob created successfully:', {
          size: blob.size,
          type: blob.type
        })
        return blob
      } catch (fallbackError) {
        console.error('ArrayBuffer fallback also failed:', fallbackError)
        throw fallbackError
      }
    }
  } catch (error) {
    console.error('Korean PDF generation error:', error)
    // Clean up container if it exists
    if (container && document.body.contains(container)) {
      document.body.removeChild(container)
    }
    throw error
  }
}