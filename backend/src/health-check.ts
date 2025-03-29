// src/health-check.ts
import { Pool } from 'pg';

/**
 * 헬스 체크 스크립트
 * 
 * Docker 컨테이너의 헬스 체크로 사용
 * 데이터베이스 연결과 애플리케이션 상태를 확인
 */
async function healthCheck() {
  try {
    // 데이터베이스 연결 확인
    const pool = new Pool({
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'telemetry',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      connectionTimeoutMillis: 3000, // 3초 제한
    });

    // 데이터베이스 쿼리 실행
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }

    // 풀 종료
    await pool.end();

    // 정상 종료
    process.exit(0);
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

// 헬스 체크 실행
healthCheck().catch((error) => {
  console.error('Unexpected error during health check:', error);
  process.exit(1);
});