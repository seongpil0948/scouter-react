// src/kafka/consumer.ts
import { Kafka, Consumer, CompressionTypes, CompressionCodecs } from 'kafkajs';
import SnappyCodec from 'kafkajs-snappy';
import * as SnappyJS from 'snappyjs';
import logger from '../utils/logger';
import { saveTraces } from '../services/traceService';
import { processTraceData, processLogData } from './messageProcessor';
import { saveLogs } from '../services/logService';

// Snappy 압축 코덱 등록
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

// 메시지 버퍼
let messageBuffer = {
  traces: [] as any[],
  logs: [] as any[],
  lastFlushTime: Date.now(),
};

// Kafka 인스턴스 및 소비자 인스턴스
let kafkaInstance: Kafka | null = null;
let consumerInstance: Consumer | null = null;
let isConsumerRunning = false;
let flushInterval: NodeJS.Timeout | null = null;

// Kafka 인스턴스 가져오기
// Kafka 인스턴스 가져오기
function getKafkaInstance() {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: 'nextjs-otlp-client',
      brokers: ['10.101.91.181:9092', '10.101.91.181:9093'],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }
  return kafkaInstance;
}
// 메시지 압축 해제
function decompressMessage(buffer: Buffer): Buffer {
  try {
    // Snappy로 압축된 메시지인지 확인
    if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0x06 && buffer[2] === 0x00 && buffer[3] === 0x00) {
      return Buffer.from(SnappyJS.uncompress(buffer));
    }
    
    // 압축되지 않은 메시지로 판단
    return buffer;
  } catch (error) {
    logger.warn({ error }, 'Failed to decompress message, using raw buffer');
    return buffer;
  }
}

// 버퍼에 있는 메시지 처리 및 데이터베이스에 저장
export async function flushBuffer() {
  try {
    const { traces, logs } = messageBuffer;
    
    // 트레이스 데이터 저장
    if (traces.length > 0) {
      logger.info({ count: traces.length }, 'Flushing trace data to database');
      await saveTraces(traces);
      messageBuffer.traces = [];
    }
    
    // 로그 데이터 저장
    if (logs.length > 0) {
      logger.info({ count: logs.length }, 'Flushing log data to database');
      await saveLogs(logs);
      messageBuffer.logs = [];
    }
    
    messageBuffer.lastFlushTime = Date.now();
  } catch (error) {
    logger.error({ error }, 'Error flushing message buffer');
  }
}

// Kafka 소비자 시작
export async function startKafkaConsumer() {
  if (isConsumerRunning) {
    logger.info('Kafka consumer is already running');
    return;
  }

  try {
    const kafka = getKafkaInstance();

    // 소비자 인스턴스 생성
    if (!consumerInstance) {
      consumerInstance = kafka.consumer({
        groupId: process.env.KAFKA_GROUP_ID || 'telemetry-processor-group',
        sessionTimeout: 30000,
        heartbeatInterval: 5000,
      });
    }

    // 소비자 연결
    await consumerInstance.connect();
    logger.info('Kafka consumer connected');

    // 토픽 구독
    const topics = [
      process.env.KAFKA_TRACE_TOPIC || 'onpremise.theshop.oltp.dev.trace',
      process.env.KAFKA_LOG_TOPIC || 'onpremise.theshop.oltp.dev.log',
    ];
    
    await consumerInstance.subscribe({
      topics,
      fromBeginning: false,
    });
    
    logger.info({ topics }, 'Subscribed to Kafka topics');

    // 메시지 소비 시작
    await consumerInstance.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) {
            return;
          }

          // 메시지 압축 해제
          const decompressedValue = decompressMessage(message.value);

          // 토픽에 따른 메시지 처리
          if (topic === (process.env.KAFKA_TRACE_TOPIC || 'onpremise.theshop.oltp.dev.trace')) {
            try {
              // 데이터 구조에 따라 처리
              // 여기서는 JSON으로 가정하지만, 실제로는 Protobuf 등 다른 형식일 수 있음
              const data = JSON.parse(decompressedValue.toString());
              const processedTraces = processTraceData(data);
              
              // 버퍼에 추가
              if (processedTraces.length > 0) {
                messageBuffer.traces.push(...processedTraces);
                logger.debug({ count: processedTraces.length }, 'Processed trace data');
              }
            } catch (error) {
              logger.error({ error, topic }, 'Error processing trace data');
            }
          } else if (topic === (process.env.KAFKA_LOG_TOPIC || 'onpremise.theshop.oltp.dev.log')) {
            try {
              // 데이터 구조에 따라 처리
              const data = JSON.parse(decompressedValue.toString());
              const processedLogs = processLogData(data);
              
              // 버퍼에 추가
              if (processedLogs.length > 0) {
                messageBuffer.logs.push(...processedLogs);
                logger.debug({ count: processedLogs.length }, 'Processed log data');
              }
            } catch (error) {
              logger.error({ error, topic }, 'Error processing log data');
            }
          }

          // 버퍼 크기가 임계값을 초과하거나 마지막 플러시 이후 일정 시간이 지났으면 버퍼 비우기
          const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100');
          const FLUSH_INTERVAL = parseInt(process.env.FLUSH_INTERVAL || '5000');
          
          if (
            messageBuffer.traces.length >= BATCH_SIZE ||
            messageBuffer.logs.length >= BATCH_SIZE ||
            Date.now() - messageBuffer.lastFlushTime >= FLUSH_INTERVAL
          ) {
            await flushBuffer();
          }
        } catch (error) {
          logger.error({ error }, 'Error processing Kafka message');
        }
      },
    });

    isConsumerRunning = true;
    logger.info('Kafka consumer started successfully');

    // 주기적으로 버퍼 비우기 (백업 메커니즘)
    const PERIODIC_FLUSH_INTERVAL = 10000; // 10초
    flushInterval = setInterval(flushBuffer, PERIODIC_FLUSH_INTERVAL);
    
  } catch (error) {
    logger.error({ error }, 'Error starting Kafka consumer');
    isConsumerRunning = false;

    // 연결 실패 시 인스턴스 재설정
    if (consumerInstance) {
      try {
        await consumerInstance.disconnect();
      } catch (e) {
        logger.error({ error: e }, 'Error disconnecting consumer');
      }
      consumerInstance = null;
    }

    // 잠시 후 재연결 시도
    const RECONNECT_TIMEOUT = 5000; // 5초
    setTimeout(() => {
      startKafkaConsumer().catch((error) => {
        logger.error({ error }, 'Error during Kafka consumer reconnect');
      });
    }, RECONNECT_TIMEOUT);
    
    throw error;
  }
}

// Kafka 소비자 중지
export async function stopKafkaConsumer() {
  if (!isConsumerRunning || !consumerInstance) {
    logger.info('Kafka consumer is not running');
    return;
  }

  try {
    // 마지막으로 버퍼 플러시
    await flushBuffer();
    
    // 인터벌 타이머 정리
    if (flushInterval) {
      clearInterval(flushInterval);
      flushInterval = null;
    }
    
    // 소비자 연결 해제
    await consumerInstance.disconnect();
    consumerInstance = null;
    isConsumerRunning = false;
    
    logger.info('Kafka consumer stopped successfully');
  } catch (error) {
    logger.error({ error }, 'Error stopping Kafka consumer');
    throw error;
  }
}