// frontend/lib/postgres/client.ts
import { Pool } from "pg";

// PostgreSQL 연결 풀 인스턴스
let pgPool: Pool | null = null;

/**
 * PostgreSQL 연결 풀 가져오기 (싱글톤 패턴)
 */
export function getPool(): Pool {
  if (pgPool === null) {
    pgPool = new Pool({
      user: process.env.POSTGRES_USER || "postgres",
      host: process.env.POSTGRES_HOST || "localhost",
      database: process.env.POSTGRES_DB || "telemetry",
      password: process.env.POSTGRES_PASSWORD || "postgres",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      max: 20, // 최대 연결 수
      idleTimeoutMillis: 30000, // 유휴 연결 타임아웃 (30초)
      connectionTimeoutMillis: 5000, // 연결 타임아웃 (5초)
      ssl:
        process.env.POSTGRES_SSL === "true"
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    });

    // 예상치 못한 연결 오류 처리
    pgPool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
      process.exit(-1);
    });

    console.log("PostgreSQL 연결 풀이 초기화되었습니다");
  }

  return pgPool;
}

/**
 * PostgreSQL 연결 종료
 */
export async function closePool(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
    console.log("PostgreSQL 연결 풀이 종료되었습니다");
  }
}

/**
 * 환경 변수가 제대로 설정되었는지 확인
 */
export function checkPostgresEnvVars(): boolean {
  const required = [
    "POSTGRES_HOST",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `다음 PostgreSQL 환경 변수가 설정되지 않았습니다: ${missing.join(", ")}`,
    );
    return false;
  }

  return true;
}
