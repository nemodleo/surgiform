"use client"

import React, { useEffect, useState } from 'react'

interface DocumentViewerProps {
  formData: {
    patient_name?: string
    patient_age?: string
    patient_gender?: string
    registration_number?: string
    surgery_name?: string
    surgery_date?: string
    diagnosis?: string
    surgery_site?: string
    surgery_site_detail?: string
    medical_team?: Array<{ name: string; is_specialist?: boolean; department?: string }>
    participants?: Array<{ name: string; is_specialist?: boolean; department?: string }>
    medical_history?: boolean
    diabetes?: boolean
    smoking?: boolean
    hypertension?: boolean
    allergy?: boolean
    hypotension?: boolean
    airway_abnormal?: boolean
    cardiovascular?: boolean
    respiratory_disease?: boolean
    blood_coagulation?: boolean
    medication?: boolean
    kidney_disease?: boolean
    drug_abuse?: boolean
    other_conditions?: string
    [key: string]: unknown
  }
  consentData: {
    consents?: Array<{
      item_title?: string
      category?: string
      description?: string
    }>
    [key: string]: unknown
  }
  signatureData: {
    patient?: string
    doctor?: string
    canvases?: Array<{ title: string; imageData: string }>
    [key: string]: unknown
  }
}

export default function DocumentViewer({ formData, consentData, signatureData }: DocumentViewerProps) {
  const [surgeryData, setSurgeryData] = useState<Record<string, string>>({})
  const [canvasDrawings, setCanvasDrawings] = useState<Array<{ title: string; imageData: string }>>([])

  useEffect(() => {
    // Load surgery data from sessionStorage
    const savedSurgeryData = sessionStorage.getItem('surgeryInfoTextareas')
    if (savedSurgeryData) {
      setSurgeryData(JSON.parse(savedSurgeryData))
    }

    // Load canvas drawings
    const savedCanvases = localStorage.getItem('canvasDrawings') || sessionStorage.getItem('canvasDrawings')
    if (savedCanvases) {
      setCanvasDrawings(JSON.parse(savedCanvases))
    } else if (signatureData?.canvases) {
      setCanvasDrawings(signatureData.canvases)
    }
  }, [signatureData])

  const allItems = [
    { number: "2", title: "예정된 수술/시술/검사를 하지 않을 경우의 예후", key: "2" },
    { number: "3", title: "예정된 수술 이외의 시행 가능한 다른 방법", key: "3" },
    { number: "4", title: "수술 목적/필요/효과", key: "4" },
    { number: "5-1", title: "수술 과정 전반에 대한 설명", key: "5-1" },
    { number: "5-2", title: "수술 추정 소요시간", key: "5-2" },
    { number: "5-3", title: "수술 방법 변경 및 수술 추가 가능성", key: "5-3" },
    { number: "5-4", title: "수혈 가능성", key: "5-4" },
    { number: "5-5", title: "집도의 변경 가능성", key: "5-5" },
    { number: "6", title: "발생 가능한 합병증/후유증/부작용", key: "6" },
    { number: "7", title: "문제 발생시 조치사항", key: "7" },
    { number: "8", title: "진단/수술 관련 사망 위험성", key: "8" }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
      {/* Document Title */}
      <h1 className="text-2xl font-semibold text-center mb-8 text-slate-900">수술 동의서</h1>
      
      {/* 환자 정보 */}
      <div className="mb-8">
        <h3 className="text-base font-semibold text-slate-900 mb-6">환자 정보</h3>
        <div className="space-y-6">
          {/* 기본 정보 테이블 */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">등록번호</th>
                  <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.registration_number || ""}</td>
                  <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">환자명</th>
                  <td className="px-4 py-3 text-sm text-slate-900">{formData.patient_name}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">수술명</th>
                  <td className="px-4 py-3 text-sm text-slate-900" colSpan={3}>{formData.surgery_name || ""}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">나이/성별</th>
                  <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.patient_age}세 / {formData.patient_gender === "MALE" ? "남성" : "여성"}</td>
                  <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">시행예정일</th>
                  <td className="px-4 py-3 text-sm text-slate-900">{formData.surgery_date || ""}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">진단명</th>
                  <td className="px-4 py-3 text-sm text-slate-900" colSpan={3}>{formData.diagnosis || ""}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">수술부위표시</th>
                  <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.surgery_site_detail || ""}</td>
                  <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">수술부위</th>
                  <td className="px-4 py-3 text-sm text-slate-900">{formData.surgery_site || ""}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 참여 의료진 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">※ 참여 의료진</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">집도의</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200">전문의여부</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">진료과목</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(formData.medical_team || formData.participants || []).map((doctor: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{doctor.name || ""}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{doctor.is_specialist ? "전문의" : "일반의"}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{doctor.department || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          </div>

          {/* 환자 상태 및 특이사항 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">1. 환자 상태 및 특이사항</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">과거병력</th>
                    <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.medical_history ? "있음" : "없음"}</td>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">당뇨병</th>
                    <td className="px-4 py-3 text-sm text-slate-900">{formData.diabetes ? "있음" : "없음"}</td>
                  </tr>
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">흡연유무</th>
                    <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.smoking ? "흡연" : "비흡연"}</td>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">고혈압</th>
                    <td className="px-4 py-3 text-sm text-slate-900">{formData.hypertension ? "있음" : "없음"}</td>
                  </tr>
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">알레르기</th>
                    <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.allergy ? "있음" : "없음"}</td>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">저혈압</th>
                    <td className="px-4 py-3 text-sm text-slate-900">{formData.hypotension ? "있음" : "없음"}</td>
                  </tr>
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">기도이상</th>
                    <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.airway_abnormal ? "있음" : "없음"}</td>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">심혈관질환</th>
                    <td className="px-4 py-3 text-sm text-slate-900">{formData.cardiovascular ? "있음" : "없음"}</td>
                  </tr>
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">호흡기질환</th>
                    <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.respiratory_disease ? "있음" : "없음"}</td>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">혈액응고 관련 질환</th>
                    <td className="px-4 py-3 text-sm text-slate-900">{formData.blood_coagulation ? "있음" : "없음"}</td>
                  </tr>
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">복용약물</th>
                    <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.medication ? "있음" : "없음"}</td>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">신장질환</th>
                    <td className="px-4 py-3 text-sm text-slate-900">{formData.kidney_disease ? "있음" : "없음"}</td>
                  </tr>
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">마약복용 혹은 약물사고</th>
                    <td className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200">{formData.drug_abuse ? "있음" : "없음"}</td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 border-r border-slate-200 w-1/4">기타</th>
                    <td className="px-4 py-3 text-sm text-slate-900" colSpan={3}>{formData.other_conditions || ""}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 수술 동의 내용 */}
      <div className="mb-8">
        <h3 className="text-base font-semibold text-slate-900 mb-6">수술 동의 내용</h3>
        <div className="space-y-8">
          {allItems.map((item) => {
            const content = surgeryData[item.key] || '내용이 입력되지 않았습니다.'
            const itemCanvases = canvasDrawings.filter(canvas => 
              canvas.title && canvas.title.includes(`${item.number}. ${item.title}`) && canvas.imageData
            )

            return (
              <div key={item.key} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-900">{item.number}. {item.title}</h4>
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {content}
                </div>
                {itemCanvases.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {itemCanvases.map((canvas, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-2">{canvas.title}</div>
                        <img 
                          src={canvas.imageData} 
                          alt={`Canvas drawing for ${item.title}`}
                          className="max-w-full h-auto border border-slate-200 rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 전자 서명 */}
      <div className="mt-12 pt-8 border-t-2 border-slate-200">
        <h3 className="text-base font-semibold text-slate-900 mb-6">전자 서명</h3>
        
        {signatureData?.patient ? (
          <div className="mb-6">
            <p className="font-medium mb-3 text-slate-900">환자: {formData.patient_name || '환자'}</p>
            <img 
              src={signatureData.patient} 
              alt="Patient signature" 
              className="border border-slate-300 rounded max-w-[200px] h-20 bg-white p-2"
            />
          </div>
        ) : (
          <div className="mb-6">
            <p className="font-medium mb-3 text-slate-900">환자: {formData.patient_name || '환자'}</p>
            <div className="border border-slate-300 rounded max-w-[200px] h-20 bg-slate-50 flex items-center justify-center text-slate-400">
              서명 없음
            </div>
          </div>
        )}
        
        {signatureData?.doctor ? (
          <div className="mb-6">
            <p className="font-medium mb-3 text-slate-900">의사: {(formData.medical_team || formData.participants || [])[0]?.name || '의사'}</p>
            <img 
              src={signatureData.doctor} 
              alt="Doctor signature" 
              className="border border-slate-300 rounded max-w-[200px] h-20 bg-white p-2"
            />
          </div>
        ) : (
          <div className="mb-6">
            <p className="font-medium mb-3 text-slate-900">의사: {(formData.medical_team || formData.participants || [])[0]?.name || '의사'}</p>
            <div className="border border-slate-300 rounded max-w-[200px] h-20 bg-slate-50 flex items-center justify-center text-slate-400">
              서명 없음
            </div>
          </div>
        )}
        
        <p className="mt-6 text-slate-700">
          <span className="font-medium text-slate-900">작성일:</span> {new Date().toLocaleDateString('ko-KR')}
        </p>
      </div>
    </div>
  )
}