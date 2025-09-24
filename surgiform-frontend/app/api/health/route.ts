import { NextResponse } from 'next/server';

const BACKEND_URL = 'https://surgiform-backend-wxk3fcve3q-an.a.run.app';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      status: 'ok',
      frontend: 'healthy',
      backend: data,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('헬스체크 오류:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        frontend: 'healthy',
        backend: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
