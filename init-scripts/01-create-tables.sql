-- 01-create-tables.sql

-- 트레이스 테이블
CREATE TABLE IF NOT EXISTS traces (
  id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  parent_span_id TEXT,
  name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  duration BIGINT NOT NULL,
  status TEXT,
  attributes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_traces_trace_id ON traces(trace_id);
CREATE INDEX IF NOT EXISTS idx_traces_service_name ON traces(service_name);
CREATE INDEX IF NOT EXISTS idx_traces_start_time ON traces(start_time);
CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);

-- 로그 테이블
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  service_name TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,
  trace_id TEXT,
  span_id TEXT,
  attributes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_service_name ON logs(service_name);
CREATE INDEX IF NOT EXISTS idx_logs_severity ON logs(severity);
CREATE INDEX IF NOT EXISTS idx_logs_trace_id ON logs(trace_id);

-- 서비스 메트릭 저장용 테이블
CREATE TABLE IF NOT EXISTS service_metrics (
  id SERIAL PRIMARY KEY,
  service_name TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  avg_latency REAL NOT NULL DEFAULT 0,
  p95_latency REAL,
  p99_latency REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_metrics_service_name ON service_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_service_metrics_timestamp ON service_metrics(timestamp);

-- 샘플 데이터 추가 (선택적)
INSERT INTO traces (id, trace_id, span_id, parent_span_id, name, service_name, start_time, end_time, duration, status, attributes)
VALUES 
  ('sample-trace-1', '11111111111111111111111111111111', 'span1', NULL, 'GET /api/users', 'user-service', 1677721600000, 1677721600050, 50, 'OK', '{"http.method": "GET", "http.url": "/api/users"}'),
  ('sample-trace-2', '22222222222222222222222222222222', 'span2', NULL, 'POST /api/auth/login', 'auth-service', 1677721700000, 1677721700150, 150, 'OK', '{"http.method": "POST", "http.url": "/api/auth/login"}'),
  ('sample-trace-3', '33333333333333333333333333333333', 'span3', NULL, 'GET /api/products', 'product-service', 1677721800000, 1677721800250, 250, 'ERROR', '{"http.method": "GET", "http.url": "/api/products", "error.message": "Database connection failed"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO logs (id, timestamp, service_name, message, severity, trace_id, span_id, attributes)
VALUES
  ('sample-log-1', 1677721600000, 'user-service', 'User request received', 'INFO', '11111111111111111111111111111111', 'span1', '{"user_id": "123", "ip": "192.168.1.1"}'),
  ('sample-log-2', 1677721700100, 'auth-service', 'User login successful', 'INFO', '22222222222222222222222222222222', 'span2', '{"user_id": "123", "login_method": "password"}'),
  ('sample-log-3', 1677721800200, 'product-service', 'Database connection failed', 'ERROR', '33333333333333333333333333333333', 'span3', '{"error": "Connection timeout", "db_host": "db-server"}')
ON CONFLICT (id) DO NOTHING;

-- 샘플 서비스 메트릭 추가
INSERT INTO service_metrics (service_name, timestamp, request_count, error_count, avg_latency, p95_latency, p99_latency)
VALUES
  ('user-service', 1677721600000, 100, 5, 45.5, 95.2, 120.1),
  ('auth-service', 1677721600000, 80, 2, 120.3, 180.5, 220.7),
  ('product-service', 1677721600000, 150, 15, 85.2, 140.3, 180.5);