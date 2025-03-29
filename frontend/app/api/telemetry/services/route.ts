// frontend/app/api/telemetry/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres/client';

export async function GET(request: NextRequest) {
  // URL에서 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const startTime = searchParams.get('startTime') ? parseInt(searchParams.get('startTime')!) : Date.now() - 3600000; // 기본값: 1시간 전
  const endTime = searchParams.get('endTime') ? parseInt(searchParams.get('endTime')!) : Date.now();
  const serviceName = searchParams.get('serviceName') || undefined;

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
    
    // 서비스별 지표 쿼리
    const servicesQuery = `
      SELECT 
        service_name AS "name",
        COUNT(*) AS "requestCount",
        SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) AS "errorCount",
        AVG(duration) AS "avgLatency",
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration) AS "p95Latency",
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration) AS "p99Latency"
      FROM 
        traces
      WHERE 
        ${whereClause}
      GROUP BY 
        service_name
      ORDER BY 
        COUNT(*) DESC
    `;
    
    // 시계열 데이터를 위한 시간 간격 (예: 5분)
    const timeInterval = 300000; // 5분 (밀리초)
    
    // 서비스별 시계열 데이터 쿼리
    const timeSeriesQuery = `
      SELECT 
        service_name,
        ${timeInterval} * (start_time / ${timeInterval}) AS time_bucket,
        COUNT(*) AS request_count,
        AVG(duration) AS avg_latency,
        SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) AS error_count
      FROM 
        traces
      WHERE 
        ${whereClause}
      GROUP BY 
        service_name, time_bucket
      ORDER BY 
        service_name, time_bucket
    `;
    
    // 병렬로 쿼리 실행
    const [servicesResult, timeSeriesResult] = await Promise.all([
      pool.query(servicesQuery, queryParams),
      pool.query(timeSeriesQuery, queryParams)
    ]);
    
    // 시계열 데이터 처리
    const timeSeriesMap = new Map<string, any[]>();
    
    timeSeriesResult.rows.forEach(row => {
      const serviceName = row.service_name;
      const timeBucket = row.time_bucket;
      
      if (!timeSeriesMap.has(serviceName)) {
        timeSeriesMap.set(serviceName, []);
      }
      
      const serviceData = timeSeriesMap.get(serviceName)!;
      serviceData.push({
        timestamp: timeBucket,
        requestCount: row.request_count,
        avgLatency: row.avg_latency,
        errorCount: row.error_count,
        errorRate: row.request_count > 0 ? (row.error_count / row.request_count) * 100 : 0
      });
    });
    
    // 서비스 데이터에 시계열 데이터 추가
    const services = servicesResult.rows.map(service => {
      const timeSeriesData = timeSeriesMap.get(service.name) || [];
      
      return {
        ...service,
        errorRate: service.requestCount > 0 ? (service.errorCount / service.requestCount) * 100 : 0,
        timeSeriesData
      };
    });
    
    // 응답 데이터 구성
    const response = {
      services,
      total: services.length,
      took: 0 // PostgreSQL에서는 실행 시간 측정이 다름
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('서비스 API 오류:', error);
    
    return NextResponse.json(
      {
        error: '서비스 정보를 가져오는 중 오류가 발생했습니다',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}