// app/api/telemetry/traces/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { searchTraces } from '@/lib/aws/opensearch';

export async function GET(request: NextRequest) {
  // URL에서 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '*';
  const startTime = searchParams.get('startTime') ? parseInt(searchParams.get('startTime')!) : Date.now() - 3600000; // 기본값: 1시간 전
  const endTime = searchParams.get('endTime') ? parseInt(searchParams.get('endTime')!) : Date.now();
  const serviceName = searchParams.get('serviceName') || undefined;
  const minDuration = searchParams.get('minDuration') ? parseInt(searchParams.get('minDuration')!) : undefined;
  const maxDuration = searchParams.get('maxDuration') ? parseInt(searchParams.get('maxDuration')!) : undefined;
  const status = searchParams.get('status') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
  const from = searchParams.get('from') ? parseInt(searchParams.get('from')!) : 0;

  try {
    // 트레이스 검색
    const result = await searchTraces({
      query,
      startTime,
      endTime,
      serviceName,
      minDuration,
      maxDuration,
      status,
      limit,
      from,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('트레이스 검색 API 오류:', error);

    return NextResponse.json(
      {
        error: '트레이스를 검색하는 중 오류가 발생했습니다',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
