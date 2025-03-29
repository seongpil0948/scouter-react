// frontend/app/api/telemetry/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres/client';

export async function GET(request: NextRequest) {
  // URL에서 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '*';
  const startTime = searchParams.get('startTime') ? parseInt(searchParams.get('startTime')!) : Date.now() - 3600000; // 기본값: 1시간 전
  const endTime = searchParams.get('endTime') ? parseInt(searchParams.get('endTime')!) : Date.now();
  const serviceName = searchParams.get('serviceName') || undefined;
  const severity = searchParams.get('severity') || undefined;
  const hasTrace = searchParams.get('hasTrace') === 'true';
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
  const offset = searchParams.get('from') ? parseInt(searchParams.get('from')!) : 0;

  try {
    const pool = getPool();
    
    // 쿼리 파라미터 배열
    const queryParams: any[] = [startTime, endTime];
    
    // 기본 WHERE 조건
    let whereClause = 'timestamp >= $1 AND timestamp <= $2';
    let paramIndex = 3;
    
    // 서비스명 필터
    if (serviceName) {
      whereClause += ` AND service_name = $${paramIndex}`;
      queryParams.push(serviceName);
      paramIndex++;
    }
    
    // 심각도 필터
    if (severity) {
      whereClause += ` AND severity = $${paramIndex}`;
      queryParams.push(severity);
      paramIndex++;
    }
    
    // 트레이스 연결 필터
    if (hasTrace) {
      whereClause += ' AND trace_id IS NOT NULL AND trace_id != \'\'';
    }
    
    // 검색어 필터 (message, serviceName에 검색어 포함)
    if (query !== '*') {
      whereClause += ` AND (
        message ILIKE $${paramIndex} OR
        service_name ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${query}%`);
      paramIndex++;
    }
    
    // 로그 조회 쿼리
    const logsQuery = `
      SELECT 
        id,
        timestamp,
        service_name AS "serviceName",
        message,
        severity,
        trace_id AS "traceId",
        span_id AS "spanId",
        attributes
      FROM 
        logs
      WHERE 
        ${whereClause}
      ORDER BY 
        timestamp DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    
    // 서비스 집계 쿼리
    const servicesQuery = `
      SELECT 
        service_name AS name,
        COUNT(*) AS count
      FROM 
        logs
      WHERE 
        ${whereClause}
      GROUP BY 
        service_name
      ORDER BY 
        count DESC
      LIMIT 20
    `;
    
    // 심각도 집계 쿼리
    const severitiesQuery = `
      SELECT 
        severity AS name,
        COUNT(*) AS count
      FROM 
        logs
      WHERE 
        ${whereClause}
      GROUP BY 
        severity
      ORDER BY 
        CASE 
          WHEN severity = 'FATAL' THEN 1
          WHEN severity = 'ERROR' THEN 2
          WHEN severity = 'WARN' THEN 3
          WHEN severity = 'INFO' THEN 4
          WHEN severity = 'DEBUG' THEN 5
          WHEN severity = 'TRACE' THEN 6
          ELSE 7
        END
    `;
    
    // 총 개수 카운트 쿼리
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM logs
      WHERE ${whereClause}
    `;
    
    // 병렬로 모든 쿼리 실행
    const [logsResult, servicesResult, severitiesResult, countResult] = await Promise.all([
      pool.query(logsQuery, queryParams),
      pool.query(servicesQuery, queryParams.slice(0, -2)), // limit, offset 제외
      pool.query(severitiesQuery, queryParams.slice(0, -2)), // limit, offset 제외
      pool.query(countQuery, queryParams.slice(0, -2)) // limit, offset 제외
    ]);
    
    // 응답 데이터 구성
    const response = {
      logs: logsResult.rows,
      services: servicesResult.rows,
      severities: severitiesResult.rows,
      total: parseInt(countResult.rows[0].total),
      took: 0 // PostgreSQL에서는 실행 시간 측정이 다름
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('로그 검색 API 오류:', error);
    
    return NextResponse.json(
      {
        error: '로그를 검색하는 중 오류가 발생했습니다',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}