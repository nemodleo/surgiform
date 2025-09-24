import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://surgiform-backend-wxk3fcve3q-an.a.run.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('API Route: 백엔드로 요청 전달 중...', { 
      url: `${BACKEND_URL}/consent`,
      bodyKeys: Object.keys(body)
    });

    const response = await fetch(`${BACKEND_URL}/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // 3분 타임아웃 (Vercel의 최대 실행 시간 고려)
      signal: AbortSignal.timeout(180000),
    });

    if (!response.ok) {
      console.error('백엔드 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('API Route: 백엔드 응답 성공', {
      consentCount: data.consents?.length || 0,
      referenceCount: data.references?.length || 0,
    });

    return NextResponse.json(data);
    
  } catch (error) {
    console.error('API Route 오류:', error);
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return NextResponse.json(
          { error: '요청 시간이 초과되었습니다. 다시 시도해주세요.' },
          { status: 408 }
        );
      }
      
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { error: '백엔드 서버에 연결할 수 없습니다.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Consent API Route is working',
    backend: BACKEND_URL
  });
}
