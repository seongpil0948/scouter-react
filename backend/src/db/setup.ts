// src/db/setup.ts
import { Pool } from 'pg';
import logger from '../utils/logger';

// PostgreSQL 연결 풀
let pgPool: Pool | null = null;

// PostgreSQL 풀 인스턴스 가져오기
export function getPool(): Pool {
  if (!pgPool) {
    throw new Error('Database pool not initialized');
  }
  return pgPool;
}

// 데이터베이스 연결 설정
export async function setupDatabase(): Promise<void> {
  if (pgPool) {
    logger.info('Database pool already initialized');
    return;
  }

  // 연결 설정
  pgPool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'telemetry',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // 연결 테스트
  try {
    const client = await pgPool.connect();
    const result = await client.query('SELECT NOW()');
    const now = result.rows[0].now;
    
    logger.info({ timestamp: now }, 'Database connection successful');
    client.release();
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    throw error;
  }

  // 이벤트 리스너 등록
  pgPool.on('error', (err) => {
    logger.error({ error: err }, 'Unexpected database pool error');
  });
}

// 데이터베이스 연결 종료
export async function closeDatabase(): Promise<void> {
  if (pgPool) {
    logger.info('Closing database connection pool');
    await pgPool.end();
    pgPool = null;
    logger.info('Database connection pool closed');
  }
}