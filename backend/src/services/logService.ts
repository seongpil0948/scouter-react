// src/services/logService.ts
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
 * 로그 데이터를 데이터베이스에 저장
 */
export async function saveLogs(logs: any[]): Promise<void> {
  if (logs.length === 0) {
    return;
  }

  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const log of logs) {
      // Uint8Array를 16진수 문자열로 변환
      const traceIdHex = log.traceId ? bufferToHex(log.traceId) : null;
      const spanIdHex = log.spanId ? bufferToHex(log.spanId) : null;

      await client.query(
        `INSERT INTO logs(
          id, timestamp, service_name, message, severity, 
          trace_id, span_id, attributes
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          service_name = EXCLUDED.service_name,
          message = EXCLUDED.message,
          severity = EXCLUDED.severity,
          trace_id = EXCLUDED.trace_id,
          span_id = EXCLUDED.span_id,
          attributes = EXCLUDED.attributes`,
        [
          log.id,
          Math.floor(log.timestamp), // 부동 소수점을 정수로 변환
          log.serviceName,
          log.message,
          log.severity,
          traceIdHex,
          spanIdHex,
          JSON.stringify(log.attributes)
        ]
      );
    }
    
    await client.query('COMMIT');
    logger.info({ count: logs.length }, 'Successfully saved logs to database');
  } catch (error) {
    await client.query('ROLLBACK');
    console.log("logs", logs[0]);
    logger.error({ error, count: logs.length }, 'Error saving logs to database');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 서비스 이름 집계 가져오기
 */
export async function getServiceAggregation(startTime: number, endTime: number): Promise<any[]> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT 
        service_name as name,
        COUNT(*) as count
      FROM logs
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY service_name
      ORDER BY count DESC
      LIMIT 20`,
      [startTime, endTime]
    );
    
    return result.rows;
  } catch (error) {
    logger.error({ error, startTime, endTime }, 'Error getting service aggregation');
    throw error;
  }
}

/**
 * 심각도 수준 집계 가져오기
 */
export async function getSeverityAggregation(startTime: number, endTime: number): Promise<any[]> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT 
        severity as name,
        COUNT(*) as count
      FROM logs
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY severity
      ORDER BY 
        CASE 
          WHEN severity = 'FATAL' THEN 1
          WHEN severity = 'ERROR' THEN 2
          WHEN severity = 'WARN' THEN 3
          WHEN severity = 'INFO' THEN 4
          WHEN severity = 'DEBUG' THEN 5
          WHEN severity = 'TRACE' THEN 6
          ELSE 7
        END`,
      [startTime, endTime]
    );
    
    return result.rows;
  } catch (error) {
    logger.error({ error, startTime, endTime }, 'Error getting severity aggregation');
    throw error;
  }
}