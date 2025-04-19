// lib/utils/spanAnalyzer.ts
/**
 * Span 데이터 분석 유틸리티
 * 트레이스에서 유의미한 데이터를 추출하고 집계합니다.
 */

interface SpanAnalysisResult {
  // SQL 관련 통계
  sql: {
    count: number; // SQL 쿼리 개수
    totalTime: number; // 총 SQL 실행 시간
    avgTime: number; // 평균 SQL 실행 시간
    maxTime: number; // 최대 SQL 실행 시간
    queries: Array<{spanId: string, query: string, time: number}>; // SQL 쿼리 목록
  };
  
  // HTTP/URL 관련 통계
  http: {
    count: number; // HTTP 요청 개수
    byMethod: Record<string, number>; // HTTP 메서드별 요청 수
    byStatusCode: Record<string, number>; // 상태 코드별 요청 수
    urls: Array<{spanId: string, url: string, method: string, statusCode?: string}>; // URL 목록
  };
  
  // 오류 관련 통계
  errors: {
    count: number; // 오류 발생 개수
    messages: Array<{spanId: string, message: string}>; // 오류 메시지 목록
  };
  
  // 서비스별 통계
  byService: Record<string, {
    count: number;
    avgDuration: number;
    errorCount: number;
  }>;
  
  // 상위 지연 시간 스팬
  topLatencySpans: Array<{
    spanId: string;
    name: string;
    serviceName: string;
    duration: number;
  }>;
}

/**
 * 트레이스의 모든 스팬을 분석하여 유용한 정보 추출
 * @param spans 분석할 스팬 배열
 * @returns 분석 결과 객체
 */
export function analyzeTraceSpans(spans: Span[]): SpanAnalysisResult {
  if (!spans || spans.length === 0) {
    return {
      sql: { count: 0, totalTime: 0, avgTime: 0, maxTime: 0, queries: [] },
      http: { count: 0, byMethod: {}, byStatusCode: {}, urls: [] },
      errors: { count: 0, messages: [] },
      byService: {},
      topLatencySpans: []
    };
  }
  
  // 기본값으로 초기화
  const result: SpanAnalysisResult = {
    sql: { count: 0, totalTime: 0, avgTime: 0, maxTime: 0, queries: [] },
    http: { count: 0, byMethod: {}, byStatusCode: {}, urls: [] },
    errors: { count: 0, messages: [] },
    byService: {},
    topLatencySpans: []
  };
  
  // 서비스별 통계 누적을 위한 맵
  const serviceMap: Record<string, { count: number, totalDuration: number, errorCount: number }> = {};
  
  // 각 스팬 분석
  spans.forEach(span => {
    const { attributes = {}, serviceName = 'unknown', duration = 0, status, spanId, name } = span;
    
    // 서비스별 통계 업데이트
    if (!serviceMap[serviceName]) {
      serviceMap[serviceName] = { count: 0, totalDuration: 0, errorCount: 0 };
    }
    serviceMap[serviceName].count++;
    serviceMap[serviceName].totalDuration += duration;
    
    if (status === 'ERROR') {
      serviceMap[serviceName].errorCount++;
      result.errors.count++;
      
      // 오류 메시지 추출
      const errorMsg = attributes['error.message'] || attributes['error'] || 'Unknown error';
      result.errors.messages.push({ spanId, message: String(errorMsg) });
    }
    
    // SQL 관련 속성 검사
    const sqlKeys = Object.keys(attributes).filter(key => 
      key.startsWith('sql.') || key === 'db.statement' || key === 'db.operation'
    );
    
    if (sqlKeys.length > 0) {
      result.sql.count++;
      
      // SQL 실행 시간 추출
      const sqlTime = Number(attributes['sql.elapsed'] || attributes['db.elapsed'] || 0);
      if (sqlTime > 0) {
        result.sql.totalTime += sqlTime;
        result.sql.maxTime = Math.max(result.sql.maxTime, sqlTime);
      }
      
      // SQL 쿼리 추출
      const sqlQuery = attributes['sql.query'] || attributes['db.statement'];
      if (sqlQuery) {
        result.sql.queries.push({
          spanId,
          query: String(sqlQuery),
          time: sqlTime
        });
      }
    }
    
    // HTTP/URL 관련 속성 검사
    const httpKeys = Object.keys(attributes).filter(key => 
      key.startsWith('http.') || key.startsWith('url.')
    );
    
    if (httpKeys.length > 0) {
      result.http.count++;
      
      // HTTP 메서드 추출
      const method = String(attributes['http.method'] || 'UNKNOWN');
      result.http.byMethod[method] = (result.http.byMethod[method] || 0) + 1;
      
      // 상태 코드 추출
      const statusCode = attributes['http.status_code'];
      if (statusCode) {
        const code = String(statusCode);
        result.http.byStatusCode[code] = (result.http.byStatusCode[code] || 0) + 1;
      }
      
      // URL 추출
      const url = attributes['http.url'] || attributes['url.path'] || attributes['http.path'];
      if (url) {
        result.http.urls.push({
          spanId,
          url: String(url),
          method,
          statusCode: statusCode ? String(statusCode) : undefined
        });
      }
    }
    
    // 상위 지연 시간 스팬 추가
    result.topLatencySpans.push({
      spanId,
      name,
      serviceName,
      duration
    });
  });
  
  // 서비스별 평균 지연 시간 계산
  Object.entries(serviceMap).forEach(([service, stats]) => {
    result.byService[service] = {
      count: stats.count,
      avgDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
      errorCount: stats.errorCount
    };
  });
  
  // SQL 평균 실행 시간 계산
  result.sql.avgTime = result.sql.count > 0 ? result.sql.totalTime / result.sql.count : 0;
  
  // 상위 지연 시간 스팬 정렬 (상위 10개만 유지)
  result.topLatencySpans.sort((a, b) => b.duration - a.duration);
  result.topLatencySpans = result.topLatencySpans.slice(0, 10);
  
  return result;
}

/**
 * 스팬 속성에서 SQL 관련 정보 추출
 * @param attributes 스팬 속성 객체
 * @returns SQL 관련 정보 또는 null
 */
export function extractSqlInfo(attributes?: Record<string, any>) {
  if (!attributes) return null;
  
  // SQL 관련 키 찾기
  const sqlKeys = Object.keys(attributes).filter(key => 
    key.startsWith('sql.') || key === 'db.statement' || key === 'db.operation'
  );
  
  if (sqlKeys.length === 0) return null;
  
  return {
    query: attributes['sql.query'] || attributes['db.statement'] || null,
    elapsed: Number(attributes['sql.elapsed'] || attributes['db.elapsed'] || 0),
    operation: attributes['db.operation'] || null,
  };
}

/**
 * 스팬 속성에서 HTTP/URL 관련 정보 추출
 * @param attributes 스팬 속성 객체
 * @returns HTTP/URL 관련 정보 또는 null
 */
export function extractHttpInfo(attributes?: Record<string, any>) {
  if (!attributes) return null;
  
  // HTTP 관련 키 찾기
  const httpKeys = Object.keys(attributes).filter(key => 
    key.startsWith('http.') || key.startsWith('url.')
  );
  
  if (httpKeys.length === 0) return null;
  
  // 전체 URL 구성
  let fullUrl = attributes['http.url'];
  if (!fullUrl) {
    const scheme = attributes['http.scheme'] || 'https';
    const host = attributes['http.host'] || '';
    const path = attributes['url.path'] || attributes['http.path'] || '';
    const query = attributes['url.query'] ? `?${attributes['url.query']}` : '';
    
    if (host) {
      fullUrl = `${scheme}://${host}${path}${query}`;
    } else if (path) {
      fullUrl = `${path}${query}`;
    }
  }
  
  return {
    url: fullUrl || null,
    method: attributes['http.method'] || null,
    statusCode: attributes['http.status_code'] || null,
    path: attributes['url.path'] || attributes['http.path'] || null,
    query: attributes['url.query'] || null,
  };
}

/**
 * 에러 정보 추출
 * @param span 스팬 객체
 * @returns 에러 정보 또는 null
 */
export function extractErrorInfo(span: Span) {
  if (!span) return null;
  if (span.status !== 'ERROR') return null;
  
  const { attributes = {} } = span;
  
  return {
    message: attributes['error.message'] || attributes['error'] || 'Unknown error',
    stack: attributes['error.stack'] || null,
    type: attributes['error.type'] || null,
    spanId: span.spanId,
    spanName: span.name,
    serviceName: span.serviceName,
  };
}

/**
 * 속성에서 주요 정보만 추출
 * @param attributes 스팬 속성
 * @returns 주요 속성 객체
 */
export function extractImportantAttributes(attributes?: Record<string, any>) {
  if (!attributes) return {};
  
  // 중요한 속성 키 우선순위
  const priorityKeys = [
    'sql.query',
    'sql.elapsed',
    'db.statement',
    'db.operation',
    'http.method',
    'http.url',
    'http.status_code',
    'url.path',
    'url.query',
    'error.message',
    'error.type',
  ];
  
  const important: Record<string, any> = {};
  
  // 우선 순위가 높은 키 먼저 추가
  priorityKeys.forEach(key => {
    if (key in attributes) {
      important[key] = attributes[key];
    }
  });
  
  // 데이터 크기를 제한하기 위해 최대 10개만 반환
  if (Object.keys(important).length < 10) {
    // 다른 속성 중 일부 추가
    Object.keys(attributes)
      .filter(key => !priorityKeys.includes(key))
      .slice(0, 10 - Object.keys(important).length)
      .forEach(key => {
        important[key] = attributes[key];
      });
  }
  
  return important;
}

export default {
  analyzeTraceSpans,
  extractSqlInfo,
  extractHttpInfo,
  extractErrorInfo,
  extractImportantAttributes
};