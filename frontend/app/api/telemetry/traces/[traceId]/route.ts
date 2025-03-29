// frontend/app/api/telemetry/traces/[traceId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres/client';

interface RouteParams {
  params: {
    traceId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { traceId } = params;

  try {
    const pool = getPool();
    
    // 특정 트레이스 ID에 대한 모든 스팬 조회
    const spansQuery = `
      SELECT 
        id,
        trace_id AS "traceId",
        span_id AS "spanId",
        parent_span_id AS "parentSpanId",
        name,
        service_name AS "serviceName",
        start_time AS "startTime",
        end_time AS "endTime",
        duration,
        status,
        attributes
      FROM 
        traces
      WHERE 
        trace_id = $1
      ORDER BY 
        start_time ASC
    `;
    
    const result = await pool.query(spansQuery, [traceId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: '트레이스를 찾을 수 없습니다' }, { status: 404 });
    }
    
    // 서비스 목록 생성
    const serviceSet = new Set<string>();
    result.rows.forEach(span => {
      if (span.serviceName) {
        serviceSet.add(span.serviceName);
      }
    });
    
    // 시작 및 종료 시간 계산
    const startTime = Math.min(...result.rows.map(span => span.startTime));
    const endTime = Math.max(...result.rows.map(span => span.endTime));
    
    // 응답 데이터 구성
    const response = {
      traceId,
      spans: result.rows,
      startTime,
      endTime,
      services: Array.from(serviceSet),
      total: result.rows.length
    };
    
    return NextResponse.json(response);
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