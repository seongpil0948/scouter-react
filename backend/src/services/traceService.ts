// src/services/traceService.ts
import { getPool } from '../db/setup';
import logger from '../utils/logger';

/**
 * Uint8Array를 16진수 문자열로 변환하는 헬퍼 함수
 */
function bufferToHex(buffer: Uint8Array | any): string {
  if (buffer instanceof Uint8Array) {
    // Explicitly assert the type to number[]
    return Array.from(buffer as Uint8Array)
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  if (buffer && typeof buffer === 'object' && buffer.type === 'Buffer') {
    return Array.from(buffer.data || [] as number[])
      .map((b: any) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  return buffer;
}

/**
 * 트레이스 데이터를 데이터베이스에 저장
 */
export async function saveTraces(traces: any[]): Promise<void> {
  if (traces.length === 0) {
    return;
  }

  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const trace of traces) {
      // Uint8Array를 16진수 문자열로 변환
      const traceIdHex = bufferToHex(trace.traceId);
      const spanIdHex = bufferToHex(trace.spanId);
      const parentSpanIdHex = trace.parentSpanId ? bufferToHex(trace.parentSpanId) : null;

      // 타임스탬프 값들을 정수로 변환 (부동 소수점 제거)
      const startTime = Math.floor(Number(trace.startTime));
      const endTime = Math.floor(Number(trace.endTime));
      
      // duration은 문자열로 변환하기 전에 숫자로 확실히 변환
      const duration = Number(trace.duration).toString();

      await client.query(
        `INSERT INTO traces(
          id, trace_id, span_id, parent_span_id, name, service_name, 
          start_time, end_time, duration, status, attributes
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          service_name = EXCLUDED.service_name,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          duration = EXCLUDED.duration,
          status = EXCLUDED.status,
          attributes = EXCLUDED.attributes`,
        [
          trace.id,
          traceIdHex,
          spanIdHex,
          parentSpanIdHex,
          trace.name,
          trace.serviceName,
          startTime,
          endTime,
          duration,
          trace.status,
          JSON.stringify(trace.attributes)
        ]
      );
    }
    
    await client.query('COMMIT');
    logger.info({ count: traces.length }, 'Successfully saved traces to database');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, count: traces.length }, 'Error saving traces to database');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 트레이스 ID로 전체 트레이스 가져오기
 */
export async function getTraceById(traceId: string): Promise<any> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT 
        id, trace_id as "traceId", span_id as "spanId", parent_span_id as "parentSpanId",
        name, service_name as "serviceName", start_time as "startTime", 
        end_time as "endTime", duration, status, attributes
      FROM traces
      WHERE trace_id = $1
      ORDER BY start_time ASC`,
      [traceId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // 서비스 목록 생성
    const services = new Set<string>();
    result.rows.forEach(span => {
      if (span.serviceName) {
        services.add(span.serviceName);
      }
    });
    
    // 시작 및 종료 시간 계산
    const startTime = Math.min(...result.rows.map(span => span.startTime));
    const endTime = Math.max(...result.rows.map(span => span.endTime));
    
    return {
      traceId,
      spans: result.rows.map(row => ({
        ...row,
        attributes: row.attributes || {}
      })),
      startTime,
      endTime,
      services: Array.from(services),
      total: result.rows.length
    };
  } catch (error) {
    logger.error({ error, traceId }, 'Error getting trace by ID');
    throw error;
  }
}