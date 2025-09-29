/* eslint-disable @typescript-eslint/no-explicit-any */
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
  
  // Load audio recordings
  const savedAudioRecordings = sessionStorage.getItem('confirmationAudioRecordings')
  const audioRecordings = savedAudioRecordings ? JSON.parse(savedAudioRecordings) : []
  
  // Load text notes
  const savedTextNotes = sessionStorage.getItem('confirmationTextNotes')
  const textNotes = savedTextNotes ? JSON.parse(savedTextNotes) : []
  
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
    
    ${(() => {
      // 수술 동의서 제목 미디어 요소들
      const titleCanvases = canvasDrawings.filter((canvas: { title?: string; imageData?: string }) => 
        canvas.title && canvas.title.includes("수술 동의서 제목")
      );
      const titleAudios = audioRecordings.filter((audio: { title?: string; audioBlob?: Blob }) => 
        audio.title && audio.title.includes("수술 동의서 제목") && audio.audioBlob
      );
      const titleTexts = textNotes.filter((text: { title?: string; content?: string }) => 
        text.title && text.title.includes("수술 동의서 제목")
      );
      
      let titleMediaHtml = '';
      
      // Canvas drawings
      if (titleCanvases.length > 0) {
        titleMediaHtml += titleCanvases.map((canvas: { title?: string; imageData?: string }) => {
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
                    <!-- 그림 설명 영역 (비어있음) -->
                  </div>
                </div>
              </div>
            `;
          }
        }).join('');
      }
      
      // Audio recordings
      if (titleAudios.length > 0) {
        titleMediaHtml += titleAudios.map((audio: { id?: string; title?: string; duration?: number }) => {
          const duration = audio.duration ? Math.floor(audio.duration) : 0;
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const durationText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          return `
            <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${audio.title}</div>
              <div style="border: 1px solid #e2e8f0; border-radius: 4px; height: 60px; background-color: white; position: relative; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: #64748b; font-size: 12px;">
                  <div style="margin-bottom: 4px; font-weight: 500;">음성 녹음</div>
                  <div>재생 시간: ${durationText}</div>
                  <div style="margin-top: 2px; font-size: 10px; color: #94a3b8;">파일 ID: ${audio.id}</div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      
      // Text notes
      if (titleTexts.length > 0) {
        titleMediaHtml += titleTexts.map((text: { title?: string; content?: string }) => {
          return `
            <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${text.title}</div>
              <div style="border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; background-color: white; position: relative; padding: 0px 8px 0 8px;">
                <div style="color: #0f172a; font-size: 12px; line-height: 1; white-space: pre-line; margin: 0; padding: 0; text-indent: 0;">
                  ${(text.content || '').trim()}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      
      return titleMediaHtml;
    })()}
    
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
    
    ${(() => {
      // 환자 정보 미디어 요소들
      const patientCanvases = canvasDrawings.filter((canvas: { title?: string; imageData?: string }) => 
        canvas.title && canvas.title.includes("환자 정보")
      );
      const patientAudios = audioRecordings.filter((audio: { title?: string; audioBlob?: Blob }) => 
        audio.title && audio.title.includes("환자 정보") && audio.audioBlob
      );
      const patientTexts = textNotes.filter((text: { title?: string; content?: string }) => 
        text.title && text.title.includes("환자 정보")
      );
      
      let patientMediaHtml = '';
      
      // Canvas drawings
      if (patientCanvases.length > 0) {
        patientMediaHtml += patientCanvases.map((canvas: { title?: string; imageData?: string }) => {
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
                    <!-- 그림 설명 영역 (비어있음) -->
                  </div>
                </div>
              </div>
            `;
          }
        }).join('');
      }
      
      // Audio recordings
      if (patientAudios.length > 0) {
        patientMediaHtml += patientAudios.map((audio: { id?: string; title?: string; duration?: number }) => {
          const duration = audio.duration ? Math.floor(audio.duration) : 0;
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const durationText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          return `
            <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${audio.title}</div>
              <div style="border: 1px solid #e2e8f0; border-radius: 4px; height: 60px; background-color: white; position: relative; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: #64748b; font-size: 12px;">
                  <div style="margin-bottom: 4px; font-weight: 500;">음성 녹음</div>
                  <div>재생 시간: ${durationText}</div>
                  <div style="margin-top: 2px; font-size: 10px; color: #94a3b8;">파일 ID: ${audio.id}</div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      
      // Text notes
      if (patientTexts.length > 0) {
        patientMediaHtml += patientTexts.map((text: { title?: string; content?: string }) => {
          return `
            <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${text.title}</div>
              <div style="border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; background-color: white; position: relative; padding: 0px 8px 0 8px;">
                <div style="color: #0f172a; font-size: 12px; line-height: 1; white-space: pre-line; margin: 0; padding: 0; text-indent: 0;">
                  ${(text.content || '').trim()}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      
      return patientMediaHtml;
    })()}
    
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
    
    ${(() => {
      // 참여 의료진 미디어 요소들
      const teamCanvases = canvasDrawings.filter((canvas: { title?: string; imageData?: string }) => 
        canvas.title && canvas.title.includes("참여 의료진")
      );
      const teamAudios = audioRecordings.filter((audio: { title?: string; audioBlob?: Blob }) => 
        audio.title && audio.title.includes("참여 의료진") && audio.audioBlob
      );
      const teamTexts = textNotes.filter((text: { title?: string; content?: string }) => 
        text.title && text.title.includes("참여 의료진")
      );
      
      let teamMediaHtml = '';
      
      // Canvas drawings
      if (teamCanvases.length > 0) {
        teamMediaHtml += teamCanvases.map((canvas: { title?: string; imageData?: string }) => {
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
                    <!-- 그림 설명 영역 (비어있음) -->
                  </div>
                </div>
              </div>
            `;
          }
        }).join('');
      }
      
      // Audio recordings
      if (teamAudios.length > 0) {
        teamMediaHtml += teamAudios.map((audio: { id?: string; title?: string; duration?: number }) => {
          const duration = audio.duration ? Math.floor(audio.duration) : 0;
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const durationText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          return `
            <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${audio.title}</div>
              <div style="border: 1px solid #e2e8f0; border-radius: 4px; height: 60px; background-color: white; position: relative; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: #64748b; font-size: 12px;">
                  <div style="margin-bottom: 4px; font-weight: 500;">음성 녹음</div>
                  <div>재생 시간: ${durationText}</div>
                  <div style="margin-top: 2px; font-size: 10px; color: #94a3b8;">파일 ID: ${audio.id}</div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      
      // Text notes
      if (teamTexts.length > 0) {
        teamMediaHtml += teamTexts.map((text: { title?: string; content?: string }) => {
          return `
            <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${text.title}</div>
              <div style="border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; background-color: white; position: relative; padding: 0px 8px 0 8px;">
                <div style="color: #0f172a; font-size: 12px; line-height: 1; white-space: pre-line; margin: 0; padding: 0; text-indent: 0;">
                  ${(text.content || '').trim()}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      
      return teamMediaHtml;
    })()}
    
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
      // 환자 상태 및 특이사항 미디어 요소들
      const conditionCanvases = canvasDrawings.filter((canvas: { title?: string; imageData?: string }) => 
        canvas.title && canvas.title.includes("1. 환자 상태 및 특이사항")
      );
      const conditionAudios = audioRecordings.filter((audio: { title?: string; audioBlob?: Blob }) => 
        audio.title && audio.title.includes("1. 환자 상태 및 특이사항") && audio.audioBlob
      );
      const conditionTexts = textNotes.filter((text: { title?: string; content?: string }) => 
        text.title && text.title.includes("1. 환자 상태 및 특이사항")
      );
      
      let conditionMediaHtml = '';
      
      // Canvas drawings
      if (conditionCanvases.length > 0) {
        conditionMediaHtml += conditionCanvases.map((canvas: { title?: string; imageData?: string }) => {
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
                    <!-- 그림 설명 영역 (비어있음) -->
                  </div>
                </div>
              </div>
            `;
          }
        }).join('');
      }
      
      // Audio recordings
      if (conditionAudios.length > 0) {
        conditionMediaHtml += conditionAudios.map((audio: { id?: string; title?: string; duration?: number }) => {
          const duration = audio.duration ? Math.floor(audio.duration) : 0;
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const durationText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          return `
            <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${audio.title}</div>
              <div style="border: 1px solid #e2e8f0; border-radius: 4px; height: 60px; background-color: white; position: relative; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: #64748b; font-size: 12px;">
                  <div style="margin-bottom: 4px; font-weight: 500;">음성 녹음</div>
                  <div>재생 시간: ${durationText}</div>
                  <div style="margin-top: 2px; font-size: 10px; color: #94a3b8;">파일 ID: ${audio.id}</div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      
      // Text notes
      if (conditionTexts.length > 0) {
        conditionMediaHtml += conditionTexts.map((text: { title?: string; content?: string }) => {
          return `
            <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${text.title}</div>
              <div style="border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; background-color: white; position: relative; padding: 0px 8px 0 8px;">
                <div style="color: #0f172a; font-size: 12px; line-height: 1; white-space: pre-line; margin: 0; padding: 0; text-indent: 0;">
                  ${(text.content || '').trim()}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      
      return conditionMediaHtml;
    })()}
    
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
        const itemCanvases = canvasDrawings.filter((canvas: { title?: string; imageData?: string }) => 
          canvas.title && canvas.title.includes(`${item.number}. ${item.title}`)
        );
        
        const itemAudios = audioRecordings.filter((audio: { title?: string; audioBlob?: Blob }) => 
          audio.title && audio.title.includes(`${item.number}. ${item.title}`) && audio.audioBlob
        );
        
        const itemTexts = textNotes.filter((text: { title?: string; content?: string }) => 
          text.title && text.title.includes(`${item.number}. ${item.title}`)
        );
        
        let mediaHtml = '';
        
        // Canvas drawings
        if (itemCanvases.length > 0) {
          mediaHtml += itemCanvases.map((canvas: { title?: string; imageData?: string }) => {
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
                      <!-- 그림 설명 영역 (비어있음) -->
                    </div>
                  </div>
                </div>
              `;
            }
          }).join('');
        }
        
        // Audio recordings
        if (itemAudios.length > 0) {
          mediaHtml += itemAudios.map((audio: { id?: string; title?: string; duration?: number }) => {
            const duration = audio.duration ? Math.floor(audio.duration) : 0;
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            return `
              <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${audio.title}</div>
                <div style="border: 1px solid #e2e8f0; border-radius: 4px; height: 60px; background-color: white; position: relative; display: flex; align-items: center; justify-content: center;">
                  <div style="text-align: center; color: #64748b; font-size: 12px;">
                    <div style="margin-bottom: 4px; font-weight: 500;">음성 녹음</div>
                    <div>재생 시간: ${durationText}</div>
                    <div style="margin-top: 2px; font-size: 10px; color: #94a3b8;">파일 ID: ${audio.id}</div>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
        
        // Text notes
        if (itemTexts.length > 0) {
          mediaHtml += itemTexts.map((text: { title?: string; content?: string }) => {
            return `
              <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${text.title}</div>
                <div style="border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; background-color: white; position: relative; padding: 0px 8px 0 8px;">
                  <div style="color: #0f172a; font-size: 12px; line-height: 1.5; white-space: pre-line; margin: 0; padding: 0; text-indent: 0;">
                    ${(text.content || '').trim()}
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
        
        // 5-3, 5-5 섹션에 특별한 동의서 블록 추가
        let specialBlock = '';
        if (item.number === "5-3") {
          specialBlock = `
            <div style="margin: 16px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="color: #374151; font-size: 14px; line-height: 1.6;">
                수술·시술·검사(이하 '수술 등') 과정에서 환자의 상태에 따라 부득이하게 방법이 변경되거나 범위가 추가될 수 있습니다.<br />
                이 경우, 추가 설명이 필요한 사항이 있으면 수술 시행 전에 환자 또는 대리인에게 설명하고 동의를 받아야 합니다.<br />
                다만, 수술 도중 환자의 상태로 인해 사전 설명과 동의가 불가능할 정도로 긴급한 변경 또는 추가가 필요한 경우에는,<br />
                시행 후 가능한 한 신속히 그 사유와 결과를 환자 또는 대리인에게 설명하도록 합니다.
              </div>
            </div>
          `;
        } else if (item.number === "5-5") {
          specialBlock = `
            <div style="margin: 16px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="color: #374151; font-size: 14px; line-height: 1.6;">
                수술·시술·검사 과정에서 환자의 상태나 의료기관의 사정(예: 응급환자 진료, 주치의의 질병·출장 등)에 따라 부득이하게 주치의(집도의)가 변경될 수 있습니다.<br />
                이 경우, 시행 전에 환자 또는 대리인에게 변경 사유를 설명하고 동의를 받습니다.<br />
                다만, 시행 도중 긴급한 상황으로 사전 설명과 동의가 불가능한 경우에는,<br />
                시행 후 지체 없이 변경 사유와 결과를 환자 또는 대리인에게 설명합니다.
              </div>
            </div>
          `;
        }
        
        return `<div class="consent-item"><div class="consent-title">${item.number}. ${item.title}</div>${specialBlock}${item.number !== "5" ? `<div class="consent-desc">${content}</div>` : ''}${mediaHtml}</div>`;
      }).join('');
    })()}
    
    <div class="signature-section">
      <h3>수술 동의서 확인</h3>
      
      ${(() => {
        // 수술 동의서 확인 미디어 요소들
        const confirmationCanvases = canvasDrawings.filter((canvas: { title?: string; imageData?: string }) => 
          canvas.title && canvas.title.includes("수술 동의서 확인")
        );
        const confirmationAudios = audioRecordings.filter((audio: { title?: string; audioBlob?: Blob }) => 
          audio.title && audio.title.includes("수술 동의서 확인") && audio.audioBlob
        );
        const confirmationTexts = textNotes.filter((text: { title?: string; content?: string }) => 
          text.title && text.title.includes("수술 동의서 확인")
        );
        
        let confirmationMediaHtml = '';
        
        // Canvas drawings
        if (confirmationCanvases.length > 0) {
          confirmationMediaHtml += confirmationCanvases.map((canvas: { title?: string; imageData?: string }) => {
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
                      <!-- 그림 설명 영역 (비어있음) -->
                    </div>
                  </div>
                </div>
              `;
            }
          }).join('');
        }
        
        // Audio recordings
        if (confirmationAudios.length > 0) {
          confirmationMediaHtml += confirmationAudios.map((audio: { id?: string; title?: string; duration?: number }) => {
            const duration = audio.duration ? Math.floor(audio.duration) : 0;
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            return `
              <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${audio.title}</div>
                <div style="border: 1px solid #e2e8f0; border-radius: 4px; height: 60px; background-color: white; position: relative; display: flex; align-items: center; justify-content: center;">
                  <div style="text-align: center; color: #64748b; font-size: 12px;">
                    <div style="margin-bottom: 4px; font-weight: 500;">음성 녹음</div>
                    <div>재생 시간: ${durationText}</div>
                    <div style="margin-top: 2px; font-size: 10px; color: #94a3b8;">파일 ID: ${audio.id}</div>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
        
        // Text notes
        if (confirmationTexts.length > 0) {
          confirmationMediaHtml += confirmationTexts.map((text: { title?: string; content?: string }) => {
            return `
              <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${text.title}</div>
                <div style="border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; background-color: white; position: relative; padding: 0px 8px 0 8px;">
                  <div style="color: #0f172a; font-size: 12px; line-height: 1; white-space: pre-line; margin: 0; padding: 0; text-indent: 0;">
                    ${(text.content || '').trim()}
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
        
        return confirmationMediaHtml;
      })()}
      
      <div style="margin-bottom: 20px;">
        <p style="margin-bottom: 12px; margin-top: 24px; color: #374151; font-size: 14px;">아래 내용을 읽고 동의해 주세요.</p>
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
            `<div style="width: 200px; height: 80px; border: 1px solid #cbd5e1; border-radius: 4px; background: white; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px;">서명란</div>`
          }
        </div>
        
        <div class="signature-item" style="flex: 1;">
          <div class="signature-label">의사: ${((formData.medical_team || formData.participants || []) as Array<{ name?: string }>)[0]?.name || '의사'}</div>
          ${signatureData?.doctor ? 
            `<img src="${signatureData.doctor}" alt="Doctor signature" style="border: 1px solid #cbd5e1; border-radius: 4px; max-width: 200px; height: 80px; background: white; padding: 8px;" />` : 
            `<div style="width: 200px; height: 80px; border: 1px solid #cbd5e1; border-radius: 4px; background: white; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px;">서명란</div>`
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
    canvas.toDataURL('image/png', 1.0)
    
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
      console.error('[domPdfGenerator] 표준 blob 생성 실패:', error)
      
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
        console.error('[domPdfGenerator] ArrayBuffer 대체 방법도 실패:', fallbackError)
        throw fallbackError
      }
    }
  } catch (error) {
    console.error('[domPdfGenerator] 한국어 PDF 생성 오류:', error)
    // Clean up container if it exists
    if (container && document.body.contains(container)) {
      document.body.removeChild(container)
    }
    throw error
  }
}