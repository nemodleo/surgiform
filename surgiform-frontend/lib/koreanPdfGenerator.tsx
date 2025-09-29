import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf, Font, Image } from '@react-pdf/renderer'

// Skip font registration entirely to avoid errors
// PDF will use default Helvetica font (Korean won't display perfectly but PDF will generate)

// Hyphenation for text wrapping
Font.registerHyphenationCallback(word => {
  // Allow text to break at any character for better wrapping
  if (word.length > 15) {
    return word.split('')
  }
  return [word]
})

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    // Use default font
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
    textAlign: 'center',
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 10,
    color: '#000000',
  },
  text: {
    fontSize: 11,
    marginBottom: 5,
    color: '#333333',
    lineHeight: 1.6,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    width: 100,
    color: '#555555',
  },
  value: {
    fontSize: 11,
    color: '#000000',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  consentItem: {
    marginBottom: 15,
  },
  consentTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 5,
    color: '#000000',
  },
  consentDescription: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.6,
    paddingLeft: 10,
  },
  signature: {
    marginTop: 10,
    marginBottom: 20,
  },
  signatureImage: {
    width: 150,
    height: 50,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  drawingImage: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  drawingLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginVertical: 10,
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  tableHeader: {
    fontSize: 11,
    fontWeight: 700,
    flex: 1,
    color: '#000000',
  },
  tableCell: {
    fontSize: 10,
    flex: 1,
    color: '#333333',
  },
})

interface FormData {
  registration_number?: string
  patient_name?: string
  patient_age?: string
  patient_gender?: string
  surgery_date?: string
  diagnosis?: string
  diagnosis_detail?: string
  surgery_site?: string
  surgery_site_detail?: string
  other_conditions?: string
  medical_team?: Array<{
    name: string
    department: string
    is_specialist: boolean
  }>
}

interface ConsentItem {
  item_title?: string
  category?: string
  description?: string
}

interface ConsentData {
  consents?: ConsentItem[]
}

interface DrawingItem {
  title?: string
  imageData?: string
}

interface SignatureData {
  patient?: string
  doctor?: string
  canvases?: DrawingItem[]
}

interface PDFProps {
  formData: FormData
  consentData: ConsentData
  signatureData: SignatureData
}

// PDF Document Component
const SurgicalConsentPDF = ({ formData = {}, consentData = {}, signatureData = {} }: PDFProps) => {
  // Parse canvas drawings if they exist
  const canvasDrawings = Array.isArray(signatureData?.canvases) ? signatureData.canvases : []
  
  console.log('PDF Component received signatureData:', signatureData)
  console.log('Canvas drawings count:', canvasDrawings.length)
  console.log('Patient signature exists:', !!signatureData?.patient)
  console.log('Doctor signature exists:', !!signatureData?.doctor)
  
  return (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Title */}
      <Text style={styles.title}>수술 동의서</Text>
      
      {/* Patient Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>환자 정보</Text>
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>등록번호:</Text>
          <Text style={styles.value}>{formData.registration_number || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>환자명:</Text>
          <Text style={styles.value}>{formData.patient_name || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>나이/성별:</Text>
          <Text style={styles.value}>
            {formData.patient_age || '-'}세 / {formData.patient_gender || '-'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>수술예정일:</Text>
          <Text style={styles.value}>{formData.surgery_date || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>진단명:</Text>
          <Text style={styles.value}>
            {formData.diagnosis || '-'} {formData.diagnosis_detail ? `(${formData.diagnosis_detail})` : ''}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>수술부위:</Text>
          <Text style={styles.value}>
            {formData.surgery_site || '-'} {formData.surgery_site_detail ? `- ${formData.surgery_site_detail}` : ''}
          </Text>
        </View>
      </View>

      {/* Medical Team */}
      {formData.medical_team && formData.medical_team.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>참여 의료진</Text>
          <View style={styles.divider} />
          
          <View style={styles.table}>
            {formData.medical_team.map((member, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>
                  {index + 1}. {member.name} - {member.department} ({member.is_specialist ? '전문의' : '일반의'})
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Consent Details */}
      {consentData?.consents && consentData.consents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수술 동의 내용</Text>
          <View style={styles.divider} />
          
          {consentData.consents.map((consent, index: number) => {
            // Find drawings related to this consent item
            const relatedDrawings = canvasDrawings.filter((drawing) => 
              drawing.title && drawing.title.includes(consent.item_title || consent.category || '')
            )
            
            return (
              <View key={index} style={styles.consentItem}>
                <Text style={styles.consentTitle}>
                  {index + 1}. {consent.item_title || consent.category}
                </Text>
                <Text style={styles.consentDescription}>
                  {consent.description}
                </Text>
                
                {/* Add related drawings */}
                {relatedDrawings.map((drawing, drawIndex: number) => (
                  drawing.imageData && (
                    <View key={drawIndex} style={{ marginTop: 10 }}>
                      <Text style={styles.drawingLabel}>
                        설명 그림 {drawIndex + 1}
                      </Text>
                      <Image 
                        style={[styles.drawingImage, { width: 200, height: 150 }]} 
                        src={drawing.imageData}
                      />
                    </View>
                  )
                ))}
              </View>
            )
          })}
        </View>
      )}

      {/* Special Conditions */}
      {formData.other_conditions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>특이사항</Text>
          <View style={styles.divider} />
          <Text style={styles.text}>{formData.other_conditions}</Text>
        </View>
      )}

      {/* Additional Drawings not related to specific sections */}
      {Array.isArray(canvasDrawings) && canvasDrawings.length > 0 && (
        <View style={styles.section}>
          {canvasDrawings.filter((d) => {
            if (!d || !d.imageData) return false
            // Show only drawings that weren't already shown with consent items
            const isRelatedToConsent = consentData?.consents?.some((consent) => 
              d.title && d.title.includes(consent.item_title || consent.category || '')
            )
            return !isRelatedToConsent
          }).map((drawing, index: number) => (
            drawing?.imageData && (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 5, color: '#333333' }}>
                  {drawing.title || `추가 설명 그림 ${index + 1}`}
                </Text>
                <Image 
                  style={{ width: 250, height: 180, borderWidth: 1, borderColor: '#e0e0e0' }} 
                  src={drawing.imageData}
                />
              </View>
            )
          ))}
        </View>
      )}

      {/* Signatures */}
      {signatureData && (
        <View style={styles.footer}>
          <Text style={styles.sectionTitle}>서명</Text>
          <View style={styles.divider} />
          
          {signatureData.patient && typeof signatureData.patient === 'string' && (
            <View style={styles.signature}>
              <Text style={styles.text}>환자: {formData.patient_name || '환자'}</Text>
              <Image 
                style={styles.signatureImage} 
                src={signatureData.patient}
              />
            </View>
          )}
          
          {signatureData.doctor && typeof signatureData.doctor === 'string' && (
            <View style={styles.signature}>
              <Text style={styles.text}>의사: {formData.medical_team?.[0]?.name || '의사'}</Text>
              <Image 
                style={styles.signatureImage} 
                src={signatureData.doctor}
              />
            </View>
          )}
          
          <Text style={styles.text}>
            작성일: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>
      )}
    </Page>
  </Document>
  )
}

// Export function to generate PDF blob
export const generateKoreanPDF = async (formData: FormData, consentData: ConsentData, signatureData: SignatureData) => {
  try {
    // Validate input data
    if (!formData) {
      throw new Error('formData is required for PDF generation')
    }
    if (!consentData) {
      throw new Error('consentData is required for PDF generation')
    }
    
    console.log('Starting PDF generation with data:', {
      formData,
      consentData,
      signatureData
    })
    
    const doc = <SurgicalConsentPDF formData={formData} consentData={consentData} signatureData={signatureData} />
    const asPdf = pdf()
    asPdf.updateContainer(doc)
    const blob = await asPdf.toBlob()
    
    console.log('PDF generated successfully, blob size:', blob.size)
    return blob
  } catch (error) {
    console.error('[koreanPdfGenerator] PDF 생성 오류:', error)
    console.error('[koreanPdfGenerator] 오류 스택:', error instanceof Error ? error.stack : '스택 추적 없음')
    throw error
  }
}

export default SurgicalConsentPDF