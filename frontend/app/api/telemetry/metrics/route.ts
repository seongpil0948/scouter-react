// frontend/app/api/telemetry/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/postgres/client";

export async function GET(request: NextRequest) {
  // URL에서 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const startTime = searchParams.get("startTime")
    ? parseInt(searchParams.get("startTime")!)
    : Date.now() - 3600000; // 기본값: 1시간 전
  const endTime = searchParams.get("endTime")
    ? parseInt(searchParams.get("endTime")!)
    : Date.now();
  const serviceName = searchParams.get("serviceName") || undefined;

  try {
    const pool = getPool();

    // 쿼리 파라미터 배열
    const queryParams: any[] = [startTime, endTime];

    // 기본 WHERE 조건
    let whereClause = "start_time >= $1 AND start_time <= $2";
    let paramIndex = 3;

    // 서비스명 필터
    if (serviceName) {
      whereClause += ` AND service_name = $${paramIndex}`;
      queryParams.push(serviceName);
      paramIndex++;
    }

    // 서비스별 요약 통계 쿼리
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
        "avgLatency" DESC
      LIMIT 20
    `;

    // 최근 트레이스 쿼리
    const recentTracesQuery = `
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
      LIMIT 100
    `;

    // 전체 요약 통계 쿼리
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT service_name) AS "serviceCount",
        SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) AS "totalErrors",
        AVG(duration) AS "averageLatency"
      FROM 
        traces
      WHERE 
        ${whereClause}
    `;

    // 오류 발생 서비스 쿼리
    const errorServicesQuery = `
      SELECT 
        service_name AS "name",
        COUNT(*) AS "errorCount"
      FROM 
        traces
      WHERE 
        ${whereClause} AND status = 'ERROR'
      GROUP BY 
        service_name
      ORDER BY 
        "errorCount" DESC
      LIMIT 5
    `;

    // 병렬로 모든 쿼리 실행
    const [
      servicesResult,
      recentTracesResult,
      summaryResult,
      errorServicesResult,
    ] = await Promise.all([
      pool.query(servicesQuery, queryParams),
      pool.query(recentTracesQuery, queryParams),
      pool.query(summaryQuery, queryParams),
      pool.query(errorServicesQuery, queryParams),
    ]);

    // 시계열 데이터 생성 (PostgreSQL에서는 복잡한 집계를 위해 추가 쿼리 필요)
    const timeSeriesData = [] as any[];

    // 응답 데이터 구성
    const response = {
      topLatencyServices: servicesResult.rows.map((service) => ({
        ...service,
        errorRate:
          service.requestCount > 0
            ? (service.errorCount / service.requestCount) * 100
            : 0,
        timeSeriesData: [], // 각 서비스별 시계열 데이터는 추가 쿼리 필요
      })),
      recentTraces: recentTracesResult.rows,
      summary: summaryResult.rows[0],
      topErrorServices: errorServicesResult.rows,
      timeRange: {
        startTime,
        endTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("메트릭 API 오류:", error);

    return NextResponse.json(
      {
        error: "메트릭을 가져오는 중 오류가 발생했습니다",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
