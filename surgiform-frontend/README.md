# SurgiForm Frontend

AI 기반 수술 동의서 생성 시스템의 TypeScript/Next.js 프론트엔드입니다.

## 기술 스택

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **PDF Generation**: jsPDF, html2canvas
- **Signature**: react-signature-canvas
- **API Client**: Axios

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 http://localhost:3000 에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
npm run start
```

## 주요 기능

1. **메인 페이지**: 서비스 소개 및 시작
2. **기본 정보 입력**: 환자/수술 정보, POSSUM Score 계산
3. **수술 정보 생성**: AI 기반 자동 생성 및 편집
4. **확인 및 서명**: 전자 서명 및 그림 추가
5. **PDF 생성**: 최종 동의서 PDF 다운로드

## Backend 연동

Backend API 서버가 `http://localhost:8000`에서 실행되어야 합니다.
`.env.local` 파일에서 API URL을 설정할 수 있습니다:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
