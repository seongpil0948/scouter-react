// frontend/app/api/telemetry/traces/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres/client';

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
  const offset = searchParams.get('from') ? parseInt(searchParams.get('from')!) : 0;

  try {
    const pool = getPool();
    
    // 쿼리 파라미터 배열
    const queryParams: any[] = [startTime, endTime];
    
    // 기본 WHERE 조건
    let whereClause = 'start_time >= $1 AND start_time <= $2';
    let paramIndex = 3;
    
    // 서비스명 필터
    if (serviceName) {
      whereClause += ` AND service_name = $${paramIndex}`;
      queryParams.push(serviceName);
      paramIndex++;
    }
    
    // 상태 필터
    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    // 지속 시간 필터
    if (minDuration !== undefined) {
      whereClause += ` AND duration >= $${paramIndex}`;
      queryParams.push(minDuration);
      paramIndex++;
    }
    
    if (maxDuration !== undefined) {
      whereClause += ` AND duration <= $${paramIndex}`;
      queryParams.push(maxDuration);
      paramIndex++;
    }
    
    // 검색어 필터 (name, serviceName 또는 traceId에 검색어 포함)
    if (query !== '*') {
      whereClause += ` AND (
        name ILIKE $${paramIndex} OR
        service_name ILIKE $${paramIndex} OR
        trace_id ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${query}%`);
      paramIndex++;
    }
    
    // 트레이스 조회 쿼리
    const tracesQuery = `
      SELECT 
        id,
        trace_id AS "traceId",
        span_id AS "spanId",
        name,
        service_name AS "serviceName",
        start_time AS "startTime",
        duration,
        status,
        attributes
      FROM 
        traces
      WHERE 
        ${whereClause}
      ORDER BY 
        start_time DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    
    // 트레이스 그룹 쿼리 (trace_id로 그룹화)
    const traceGroupsQuery = `
      SELECT 
        trace_id AS "traceId",
        MIN(start_time) AS "startTime",
        MAX(end_time) - MIN(start_time) AS "duration",
        COUNT(*) AS "spanCount",
        json_agg(DISTINCT service_name) AS "services"
      FROM 
        traces
      WHERE 
        ${whereClause}
      GROUP BY 
        trace_id
      ORDER BY 
        MIN(start_time) DESC
      LIMIT 100
    `;
    
    // 총 개수 카운트 쿼리
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM traces
      WHERE ${whereClause}
    `;
    
    // 병렬로 모든 쿼리 실행
    const [tracesResult, traceGroupsResult, countResult] = await Promise.all([
      pool.query(tracesQuery, queryParams),
      pool.query(traceGroupsQuery, queryParams.slice(0, -2)), // limit, offset 제외
      pool.query(countQuery, queryParams.slice(0, -2)) // limit, offset 제외
    ]);
    
    // 응답 데이터 구성
    const response = {
      traces: tracesResult.rows,
      traceGroups: traceGroupsResult.rows,
      total: parseInt(countResult.rows[0].total),
      took: 0 // PostgreSQL에서는 실행 시간 측정이 다름
    };
    
    return NextResponse.json(response);
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