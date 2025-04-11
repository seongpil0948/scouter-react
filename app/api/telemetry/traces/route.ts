// app/api/telemetry/traces/route.ts
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
    : 100; // 기본값 100개
    
  const sortField = searchParams.get("sortField") || "start_time";
  const sortDirection = searchParams.get("sortDirection") || "DESC";
  
  const offset = searchParams.get("offset")
    ? parseInt(searchParams.get("offset")!)
    : 0;
  const attributeKey = searchParams.get("attributeKey") || null;
  
  // 새로 추가: 루트 스팬만 조회할지 여부 (기본값 true)
  const rootSpansOnly = searchParams.get("rootSpansOnly") !== "false";

  try {
    const pool = getPool();

    const queryParams: any[] = [startTime, endTime];

    // 기본 WHERE 조건
    let whereClause = "start_time >= $1 AND start_time <= $2";
    
    // 루트 스팬만 조회하는 조건 추가 (parent_span_id가 NULL 또는 빈 문자열)
    if (rootSpansOnly) {
      whereClause += " AND (parent_span_id IS NULL OR parent_span_id = '')";
    }
    
    let paramIndex = 3;

    // 서비스명 필터 (복수 선택 지원)
    if (serviceNames.length > 0) {
      const placeholders = serviceNames.map((_, i) => `$${paramIndex + i}`).join(", ");
      whereClause += ` AND service_name IN (${placeholders})`;
      queryParams.push(...serviceNames);
      paramIndex += serviceNames.length;
    }

    // 상태 필터 (복수 선택 지원)
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

    if (attributeKey) {
      whereClause += ` AND attributes ? $${paramIndex}`;
      queryParams.push(attributeKey);
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

    // 정렬 필드 및 방향 생성 (SQL Injection 방지)
    const validSortFields: {[key: string]: string} = {
      "startTime": "start_time",
      "duration": "duration",
      "serviceName": "service_name",
      "status": "status",
      "name": "name"
    };
    
    const validSortField = validSortFields[sortField] || "start_time";
    const validSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

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
        attributes,
        parent_span_id IS NULL OR parent_span_id = '' AS "isRootSpan" -- 루트 스팬 여부 플래그 추가
      FROM 
        traces
      WHERE 
        ${whereClause}
      ORDER BY 
        ${validSortField} ${validSortDirection}
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // 총 카운트 쿼리 (페이지네이션 정보용)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM traces
      WHERE ${whereClause}
    `;

    console.debug("Trace query:", tracesQuery);
    console.debug("Query params:", queryParams);

    // 중요: countQuery에는 limit/offset 파라미터가 필요하지 않으므로
    // 쿼리에 실제로 사용된 파라미터만 전달합니다
    const countParams = queryParams.slice(0, paramIndex - 1);
    
    // 쿼리 병렬 실행
    const [tracesResult, countResult] = await Promise.all([
      pool.query(tracesQuery, queryParams),
      pool.query(countQuery, countParams),
    ]);

    const traces = tracesResult.rows.filter(isTraceItem);
    const totalCount = parseInt(countResult.rows[0].total);
    
    const response = {
      traces,
      total: totalCount,
      limit,
      offset,
      timeRange: {
        startTime,
        endTime
      },
      rootSpansOnly // 응답에 루트 스팬 필터링 정보 포함
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