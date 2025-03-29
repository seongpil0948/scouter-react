// src/kafka/messageProcessor.ts
import logger from '../utils/logger';

// 속성 배열을 키-값 객체로 변환
export function mapAttributes(attributes: any[]) {
  const result: Record<string, any> = {};

  if (!Array.isArray(attributes)) {
    return result;
  }

  attributes.forEach((attr) => {
    if (!attr.key) return;

    const key = attr.key;
    let value = null;

    // value 필드 중 하나로 설정
    if (attr.value?.stringValue !== undefined) value = attr.value.stringValue;
    else if (attr.value?.boolValue !== undefined) value = attr.value.boolValue;
    else if (attr.value?.intValue !== undefined) value = attr.value.intValue;
    else if (attr.value?.doubleValue !== undefined) value = attr.value.doubleValue;
    else if (attr.value?.arrayValue !== undefined) value = attr.value.arrayValue;
    else if (attr.value?.kvlistValue !== undefined) value = attr.value.kvlistValue;
    // 다른 타입은 필요에 따라 추가

    result[key] = value;
  });

  return result;
}

// 심각도 번호를 텍스트로 변환
export function mapSeverityNumberToText(severityNumber: number): string {
  const severityMap: Record<number, string> = {
    1: 'TRACE',
    5: 'DEBUG',
    9: 'INFO',
    13: 'WARN',
    17: 'ERROR',
    21: 'FATAL',
  };

  return severityMap[severityNumber] || 'INFO';
}

// 트레이스 데이터 처리 함수
export function processTraceData(data: any) {
  const traces: any[] = [];

  try {
    // resourceSpans 배열 처리
    if (data && data.resourceSpans) {
      data.resourceSpans.forEach((resourceSpan: any) => {
        const resource = resourceSpan.resource || {};
        const resourceAttrs = mapAttributes(resource.attributes || []);

        // 서비스 이름 추출
        const serviceName = resourceAttrs['service.name'] || 'unknown';

        // scopeSpans 배열 처리
        if (resourceSpan.scopeSpans) {
          resourceSpan.scopeSpans.forEach((scopeSpan: any) => {
            const scope = scopeSpan.scope || {};

            // spans 배열 처리
            if (scopeSpan.spans) {
              scopeSpan.spans.forEach((span: any) => {
                try {
                  // TraceItem 형식으로 변환
                  const traceItem = {
                    id: `${span.traceId}-${span.spanId}`,
                    traceId: span.traceId,
                    spanId: span.spanId,
                    parentSpanId: span.parentSpanId,
                    name: span.name,
                    kind: span.kind,
                    startTime: Number(span.startTimeUnixNano) / 1000000, // 나노초 -> 밀리초
                    endTime: Number(span.endTimeUnixNano) / 1000000, // 나노초 -> 밀리초
                    duration: (Number(span.endTimeUnixNano) - Number(span.startTimeUnixNano)) / 1000000,
                    status: span.status?.code || 'UNSET',
                    serviceName,
                    scopeName: scope.name || '',
                    attributes: {
                      ...mapAttributes(span.attributes || []),
                      ...resourceAttrs,
                    },
                  };
                  
                  traces.push(traceItem);
                } catch (spanError) {
                  logger.warn({ error: spanError, span }, 'Error processing individual span');
                }
              });
            }
          });
        }
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error in processTraceData');
  }

  return traces;
}

// 로그 데이터 처리 함수
export function processLogData(data: any) {
  const logs: any[] = [];

  try {
    // resourceLogs 배열 처리
    if (data && data.resourceLogs) {
      data.resourceLogs.forEach((resourceLog: any) => {
        const resource = resourceLog.resource || {};
        const resourceAttrs = mapAttributes(resource.attributes || []);

        // 서비스 이름 추출
        const serviceName = resourceAttrs['service.name'] || 'unknown';

        // scopeLogs 배열 처리
        if (resourceLog.scopeLogs) {
          resourceLog.scopeLogs.forEach((scopeLog: any) => {
            const scope = scopeLog.scope || {};

            // logRecords 배열 처리
            if (scopeLog.logRecords) {
              scopeLog.logRecords.forEach((logRecord: any) => {
                try {
                  const timestamp = Number(logRecord.timeUnixNano) / 1000000; // 나노초 -> 밀리초
                  const body = logRecord.body?.stringValue || JSON.stringify(logRecord.body) || '';

                  // 속성 매핑
                  const attributes = mapAttributes(logRecord.attributes || []);

                  // LogItem 형식으로 변환
                  const logItem = {
                    id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp,
                    severity: logRecord.severityText || mapSeverityNumberToText(logRecord.severityNumber),
                    message: body,
                    traceId: logRecord.traceId || attributes['trace_id'],
                    spanId: logRecord.spanId || attributes['span_id'],
                    serviceName,
                    scopeName: scope.name || '',
                    attributes: {
                      ...attributes,
                      ...resourceAttrs,
                    },
                  };
                  
                  logs.push(logItem);
                } catch (logError) {
                  logger.warn({ error: logError, logRecord }, 'Error processing individual log record');
                }
              });
            }
          });
        }
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error in processLogData');
  }

  return logs;
}