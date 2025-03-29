// src/utils/logger.ts
import pino from 'pino';

// 기본 로그 레벨 설정
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// 개발 환경에서는 예쁘게 출력, 프로덕션에서는 JSON 형식으로 출력
const isDevelopment = process.env.NODE_ENV !== 'production';

// 로거 인스턴스 생성
const logger = pino({
  level: LOG_LEVEL,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // 프로덕션에서는 기본 전송 사용
  base: undefined, // pid와 hostname 제거
});

// 커스텀 로거 내보내기
export default logger;