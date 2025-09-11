"use client"

import React from 'react'

interface DocumentViewerProps {
  formData: {
    patient_name?: string
    patient_age?: string
    patient_gender?: string
    registration_number?: string
    surgery_date?: string
    diagnosis?: string
    surgery_site?: string
    medical_team?: Array<{ name: string }>
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
    [key: string]: unknown
  }
}

export default function DocumentViewer({ formData, consentData, signatureData }: DocumentViewerProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      {/* Document Title */}
      <h1 className="text-2xl font-semibold text-center mb-8 text-slate-900">수술 동의서</h1>
      
      {/* Patient Info Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-slate-200 text-slate-900">환자 정보</h2>
        <div className="space-y-2 text-slate-700">
          <p><span className="font-medium text-slate-900">이름:</span> {formData.patient_name || '미입력'}</p>
          <p><span className="font-medium text-slate-900">나이:</span> {formData.patient_age || '미입력'}세</p>
          <p><span className="font-medium text-slate-900">성별:</span> {formData.patient_gender || '미입력'}</p>
          <p><span className="font-medium text-slate-900">등록번호:</span> {formData.registration_number || '미입력'}</p>
        </div>
      </div>
      
      {/* Surgery Info Section */}
      {consentData?.consents && consentData.consents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-slate-200 text-slate-900">수술 정보</h2>
          <div className="space-y-4">
            {consentData.consents.map((item, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium mb-2 text-slate-900">
                  {index + 1}. {item.category || item.item_title || ''}
                </h3>
                <div className="pl-5 text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">
                  {item.description || ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Signature Section */}
      <div className="mt-12 pt-8 border-t-2 border-slate-200">
        <h2 className="text-lg font-semibold mb-6 text-slate-900">서명</h2>
        
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
            <p className="font-medium mb-3 text-slate-900">의사: {formData.medical_team?.[0]?.name || '의사'}</p>
            <img 
              src={signatureData.doctor} 
              alt="Doctor signature" 
              className="border border-slate-300 rounded max-w-[200px] h-20 bg-white p-2"
            />
          </div>
        ) : (
          <div className="mb-6">
            <p className="font-medium mb-3 text-slate-900">의사: {formData.medical_team?.[0]?.name || '의사'}</p>
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