// app/api/telemetry/traces/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/postgres/client";

/**
 * 트레이스 서비스 목록 조회 API
 * 지정된 시간 범위 내에 있는 모든 고유 서비스 이름을 반환합니다.
 */
export async function GET(request: NextRequest) {
  // URL에서 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const startTime = searchParams.get("startTime")
    ? parseInt(searchParams.get("startTime")!)
    : Date.now() - 3600000; // 기본값: 1시간 전
  const endTime = searchParams.get("endTime")
    ? parseInt(searchParams.get("endTime")!)
    : Date.now();

  try {
    const pool = getPool();

    // 서비스 목록 쿼리 - 지정된 시간 범위 내에서 고유한 서비스 이름과 각 서비스의 트레이스 수 조회
    const servicesQuery = `
      SELECT 
        service_name AS "name",
        COUNT(*) AS "count",
        COUNT(CASE WHEN status = 'ERROR' THEN 1 END) AS "errorCount",
        AVG(duration) AS "avgLatency"
      FROM 
        traces
      WHERE 
        start_time >= $1 AND start_time <= $2
        AND service_name IS NOT NULL
      GROUP BY 
        service_name
      ORDER BY 
        "count" DESC
    `;

    const result = await pool.query(servicesQuery, [startTime, endTime]);

    // 응답 구성
    const services = result.rows.map(service => ({
      name: service.name,
      count: parseInt(service.count),
      errorCount: parseInt(service.errorCount) || 0,
      errorRate: service.count > 0 ? ((service.errorCount || 0) / service.count) * 100 : 0,
      avgLatency: parseFloat(service.avgLatency) || 0
    }));

    return NextResponse.json({
      services,
      total: services.length,
      timeRange: {
        startTime,
        endTime
      }
    });
  } catch (error) {
    console.error("서비스 목록 조회 API 오류:", error);

    return NextResponse.json(
      {
        error: "서비스 목록을 가져오는 중 오류가 발생했습니다",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}