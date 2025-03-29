// backend/src/index.ts
import { config } from 'dotenv';
import logger from './utils/logger';
import { startKafkaConsumer } from './kafka/consumer';
import { setupDatabase } from './db/setup';
import { initializeDatabase, isDatabaseInitialized } from './db/init';

// 환경 변수 로드
config();

async function main() {
  try {
    // 1. 데이터베이스 연결 설정
    logger.info('데이터베이스 연결 초기화 중...');
    await setupDatabase();
    logger.info('데이터베이스 연결 성공');
    
    // 2. 데이터베이스 스키마 확인 및 초기화
    const isInitialized = await isDatabaseInitialized();
    if (!isInitialized) {
      logger.info('데이터베이스 스키마가 존재하지 않음, 초기화 시작...');
      await initializeDatabase();
      logger.info('데이터베이스 스키마 초기화 완료');
    } else {
      logger.info('데이터베이스 스키마가 이미 초기화되어 있음');
    }
    
    // 3. Kafka 소비자 시작
    logger.info('Kafka 소비자 시작 중...');
    await startKafkaConsumer();
    logger.info('Kafka 소비자가 실행 중입니다');
    
    // 4. 애플리케이션 상태 로깅
    logger.info('텔레메트리 백엔드가 정상적으로 실행 중입니다');
    
    // 프로세스 종료 이벤트 처리
    setupGracefulShutdown();
  } catch (error) {
    logger.error({ error }, '텔레메트리 백엔드 시작 실패');
    process.exit(1);
  }
}

// 정상 종료 처리
function setupGracefulShutdown() {
  // SIGTERM 시그널 처리 (Docker에서 주로 사용)
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM 신호 수신, 정상 종료를 시작합니다');
    await shutdownApplication();
    process.exit(0);
  });
  
  // SIGINT 시그널 처리 (Ctrl+C)
  process.on('SIGINT', async () => {
    logger.info('SIGINT 신호 수신, 정상 종료를 시작합니다');
    await shutdownApplication();
    process.exit(0);
  });
  
  // 처리되지 않은 예외 처리
  process.on('uncaughtException', async (error) => {
    logger.error({ error }, '처리되지 않은 예외 발생');
    await shutdownApplication();
    process.exit(1);
  });
  
  // 처리되지 않은 프로미스 거부 처리
  process.on('unhandledRejection', async (reason) => {
    logger.error({ reason }, '처리되지 않은 프로미스 거부');
    await shutdownApplication();
    process.exit(1);
  });
}

// 애플리케이션 종료 처리
async function shutdownApplication() {
  try {
    // 여기에 정리 작업 추가 (연결 종료 등)
    logger.info('애플리케이션 종료 완료');
  } catch (error) {
    logger.error({ error }, '종료 중 오류 발생');
  }
}

// 애플리케이션 시작
main().catch((error) => {
  logger.error({ error }, '애플리케이션 시작 중 오류 발생');
  process.exit(1);
});