// app/api/telemetry/traces/[traceId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getTraceById } from '@/lib/aws/opensearch';

interface RouteParams {
  params: {
    traceId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { traceId } = params;

  try {
    // 특정 트레이스 ID에 해당하는 전체 트레이스 데이터 가져오기
    const traceData = await getTraceById(traceId);

    if (!traceData) {
      return NextResponse.json({ error: '트레이스를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json(traceData);
  } catch (error) {
    console.error('트레이스 상세 조회 API 오류:', error);

    return NextResponse.json(
      {
        error: '트레이스 상세 정보를 가져오는 중 오류가 발생했습니다',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
