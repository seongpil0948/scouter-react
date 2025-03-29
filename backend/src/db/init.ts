// backend/src/db/init.ts
import fs from 'fs';
import path from 'path';
import { getPool } from './setup';
import logger from '../utils/logger';

/**
 * 데이터베이스 스키마 초기화
 */
export async function initializeDatabase(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    logger.info('데이터베이스 스키마 초기화 시작');
    
    // 스키마 SQL 파일 읽기
    // const schemaPath = path.join(__dirname, 'schema.sql');
    // const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // 트랜잭션 시작
    await client.query('BEGIN');
    
    // SQL 실행
    await client.query(`
-- 테이블이 이미 존재하면 삭제
DROP TABLE IF EXISTS traces CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS service_metrics CASCADE;

CREATE TABLE traces (
  id VARCHAR(255) PRIMARY KEY,
  trace_id VARCHAR(64) NOT NULL,
  span_id VARCHAR(64) NOT NULL,
  parent_span_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  service_name VARCHAR(128) NOT NULL,
  start_time BIGINT NOT NULL,  -- 타임스탬프 (밀리초)
  end_time BIGINT NOT NULL,    -- 타임스탬프 (밀리초)
  duration FLOAT NOT NULL,     -- 지속 시간 (밀리초)
  status VARCHAR(32),          -- OK, ERROR 등
  attributes JSONB,            -- 속성 (JSON)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 검색 성능 향상을 위한 인덱스
  CONSTRAINT traces_trace_id_span_id_unique UNIQUE (trace_id, span_id)
);

CREATE INDEX idx_traces_trace_id ON traces(trace_id);
CREATE INDEX idx_traces_service_name ON traces(service_name);
CREATE INDEX idx_traces_start_time ON traces(start_time);
CREATE INDEX idx_traces_status ON traces(status);

CREATE TABLE logs (
  id VARCHAR(255) PRIMARY KEY,
  timestamp BIGINT NOT NULL,   -- 타임스탬프 (밀리초)
  service_name VARCHAR(128) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(32) NOT NULL, -- FATAL, ERROR, WARN, INFO, DEBUG, TRACE
  trace_id VARCHAR(64),
  span_id VARCHAR(64),
  attributes JSONB,            -- 속성 (JSON)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_service_name ON logs(service_name);
CREATE INDEX idx_logs_severity ON logs(severity);
CREATE INDEX idx_logs_trace_id ON logs(trace_id);

-- 서비스 메트릭 집계 테이블 (성능 향상용)
CREATE TABLE service_metrics (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(128) NOT NULL,
  time_bucket BIGINT NOT NULL,  -- 집계 시간대 (밀리초, 5분 간격 등)
  request_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  total_duration FLOAT NOT NULL DEFAULT 0,
  min_duration FLOAT,
  max_duration FLOAT,
  p95_duration FLOAT,
  p99_duration FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT service_metrics_service_time_unique UNIQUE (service_name, time_bucket)
);

-- 서비스 메트릭 인덱스
CREATE INDEX idx_service_metrics_time_bucket ON service_metrics(time_bucket);
CREATE INDEX idx_service_metrics_service_name ON service_metrics(service_name);

-- 트레이스와 로그 관계 활용을 위한 뷰
CREATE OR REPLACE VIEW traces_with_logs AS
SELECT 
  t.id as trace_id,
  t.name as trace_name,
  t.service_name,
  t.start_time,
  t.end_time,
  t.duration,
  t.status,
  COUNT(l.id) as log_count
FROM 
  traces t
LEFT JOIN 
  logs l ON t.trace_id = l.trace_id
GROUP BY 
  t.id, t.name, t.service_name, t.start_time, t.end_time, t.duration, t.status;      
      `);
    
    // 트랜잭션 커밋
    await client.query('COMMIT');
    
    logger.info('데이터베이스 스키마 초기화 완료');
  } catch (error) {
    // 오류 발생 시 롤백
    await client.query('ROLLBACK');
    logger.error({ error }, '데이터베이스 스키마 초기화 실패');
    throw error;
  } finally {
    client.release();
  }
}

// 데이터베이스 초기화 확인 함수
export async function isDatabaseInitialized(): Promise<boolean> {
  const pool = getPool();
  
  try {
    // traces 테이블이 존재하는지 확인
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'traces'
      );
    `);
    
    return result.rows[0].exists;
  } catch (error) {
    logger.error({ error }, '데이터베이스 초기화 확인 실패');
    return false;
  }
}