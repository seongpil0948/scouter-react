// src/index.ts
import { config } from 'dotenv';
import logger from './utils/logger';
import { startKafkaConsumer } from './kafka/consumer';
import { setupDatabase } from './db/setup';

// 환경 변수 로드
config();

async function main() {
  try {
    // 1. 데이터베이스 연결 설정
    logger.info('Initializing database connection...');
    await setupDatabase();
    logger.info('Database connection established');
    
    // 2. Kafka 소비자 시작
    logger.info('Starting Kafka consumer...');
    await startKafkaConsumer();
    logger.info('Kafka consumer is running');
    
    // 3. 애플리케이션 상태 로깅
    logger.info('Telemetry backend is up and running');
    
    // 프로세스 종료 이벤트 처리
    setupGracefulShutdown();
  } catch (error) {
    logger.error({ error }, 'Failed to start telemetry backend');
    process.exit(1);
  }
}

// 정상 종료 처리
function setupGracefulShutdown() {
  // SIGTERM 시그널 처리 (Docker에서 주로 사용)
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await shutdownApplication();
    process.exit(0);
  });
  
  // SIGINT 시그널 처리 (Ctrl+C)
  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await shutdownApplication();
    process.exit(0);
  });
  
  // 처리되지 않은 예외 처리
  process.on('uncaughtException', async (error) => {
    logger.error({ error }, 'Uncaught exception');
    await shutdownApplication();
    process.exit(1);
  });
  
  // 처리되지 않은 프로미스 거부 처리
  process.on('unhandledRejection', async (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    await shutdownApplication();
    process.exit(1);
  });
}

// 애플리케이션 종료 처리
async function shutdownApplication() {
  try {
    // 여기에 정리 작업 추가 (연결 종료 등)
    logger.info('Application shutdown complete');
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
  }
}

// 애플리케이션 시작
main().catch((error) => {
  logger.error({ error }, 'Error starting application');
  process.exit(1);
});