// frontend/app/api/telemetry/traces/route.ts
import { NextRequest, NextResponse } from "next/server";

import { getPool } from "@/lib/postgres/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || "*";
  const startTime = searchParams.get("startTime")
    ? parseInt(searchParams.get("startTime")!)
    : Date.now() - 3600000; // 기본값: 1시간 전
  const endTime = searchParams.get("endTime")
    ? parseInt(searchParams.get("endTime")!)
    : Date.now();
  
  // 단일 값이 아닌 배열 형태로 서비스 및 상태 필터 처리
  const serviceNames = searchParams.getAll("serviceName") || [];
  const statuses = searchParams.getAll("status") || [];
  
  const minDuration = searchParams.get("minDuration")
    ? parseInt(searchParams.get("minDuration")!)
    : undefined;
  const maxDuration = searchParams.get("maxDuration")
    ? parseInt(searchParams.get("maxDuration")!)
    : undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 100;
  const offset = searchParams.get("from")
    ? parseInt(searchParams.get("from")!)
    : 0;

  try {
    const pool = getPool();

    const queryParams: any[] = [startTime, endTime];

    // 기본 WHERE 조건
    let whereClause = "start_time >= $1 AND start_time <= $2";
    let paramIndex = 3;

    if (serviceNames.length > 0) {
      const placeholders = serviceNames.map((_, i) => `$${paramIndex + i}`).join(", ");
      whereClause += ` AND service_name IN (${placeholders})`;
      queryParams.push(...serviceNames);
      paramIndex += serviceNames.length;
    }

    if (statuses.length > 0) {
      const placeholders = statuses.map((_, i) => `$${paramIndex + i}`).join(", ");
      whereClause += ` AND status IN (${placeholders})`;
      queryParams.push(...statuses);
      paramIndex += statuses.length;
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
    if (query !== "*") {
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

    console.debug("Trace query:", tracesQuery);
    console.debug("Query params:", queryParams);

    // 쿼리 실행
    const [tracesResult] = await Promise.all([
      pool.query(tracesQuery, queryParams),
    ]);

    const traces = tracesResult.rows.filter(isTraceItem);
    const response: DtoTrace = {
      traces,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("트레이스 검색 API 오류:", error);

    return NextResponse.json(
      {
        error: "트레이스를 검색하는 중 오류가 발생했습니다",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

function isTraceItem(item: any): item is TraceItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "traceId" in item &&
    "name" in item &&
    "startTime" in item &&
    "duration" in item &&
    "serviceName" in item
  );
}