// app/lib/aws/opensearch.ts
import { Client } from "@opensearch-project/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";

// OpenSearch 설정
const REGION = process.env.AWS_REGION!;
const DOMAIN_ENDPOINT = process.env.AWS_OPEN_SEARCH_ENDPOINT!;

// 인덱스 이름
const TRACES_INDEX = "otel-v1-apm-span-000001";
const LOGS_INDEX = "logs";
const SERVICES_INDEX = "otel-v1-apm-service-map";

// interval 변수 정의
const interval = "1m";

// OpenSearch 클라이언트 생성
const client = new Client({
  ...AwsSigv4Signer({
    region: REGION,
    service: "es",
    getCredentials: () => defaultProvider()(),
  }),
  node: DOMAIN_ENDPOINT,
});

// Aggregate 타입을 위한 인터페이스 정의
interface BucketAggregate extends Record<string, any> {
  buckets: Array<Record<string, any>>;
}

// 트레이스 검색
export async function searchTraces(params: {
  query?: string;
  startTime?: number;
  endTime?: number;
  serviceName?: string;
  minDuration?: number;
  maxDuration?: number;
  status?: string;
  limit?: number;
  from?: number;
}) {
  const {
    query = "*",
    startTime = Date.now() - 3600000, // 기본값: 1시간 전
    endTime = Date.now(),
    serviceName,
    minDuration,
    maxDuration,
    status,
    limit = 20,
    from = 0,
  } = params;

  // 쿼리 구성
  const must: any[] = [
    {
      range: {
        startTime: {
          gte: startTime,
          lte: endTime,
        },
      },
    },
  ];

  // 검색어가 '*'가 아니면 쿼리 추가
  if (query !== "*") {
    must.push({
      multi_match: {
        query,
        fields: ["name^3", "serviceName^2", "attributes.*"],
      },
    });
  }

  // 필터 조건 추가
  if (serviceName) {
    must.push({
      term: {
        serviceName: serviceName,
      },
    });
  }

  if (minDuration !== undefined) {
    must.push({
      range: {
        duration: {
          gte: minDuration,
        },
      },
    });
  }

  if (maxDuration !== undefined) {
    must.push({
      range: {
        duration: {
          lte: maxDuration,
        },
      },
    });
  }

  if (status) {
    must.push({
      term: {
        status: status,
      },
    });
  }

  try {
    // @ts-ignore - 클라이언트 타입 문제 무시
    const response = await client.search({
      index: TRACES_INDEX,
      body: {
        size: limit,
        from,
        sort: [{ startTime: { order: "desc" } }],
        query: {
          bool: {
            must,
          },
        },
        aggs: {
          trace_groups: {
            terms: {
              field: "traceId.keyword",
              size: 100,
              order: {
                max_start_time: "desc",
              },
            },
            aggs: {
              max_start_time: {
                max: {
                  field: "startTime",
                },
              },
              min_start_time: {
                min: {
                  field: "startTime",
                },
              },
              total_spans: {
                value_count: {
                  field: "spanId.keyword",
                },
              },
              service_names: {
                terms: {
                  field: "serviceName.keyword",
                  size: 10,
                },
              },
            },
          },
        },
      },
    });

    let total = 0;

    if (response.body?.hits?.total) {
      total =
        typeof response.body.hits.total === "number"
          ? response.body.hits.total
          : response.body.hits.total.value || 0;
    }

    const traceGroups = [] as any[];

    if (response.body?.aggregations?.trace_groups) {
      const buckets = (
        response.body.aggregations.trace_groups as BucketAggregate
      ).buckets;

      buckets.forEach((bucket: any) => {
        traceGroups.push({
          traceId: bucket.key,
          spanCount: bucket.total_spans.value,
          startTime: bucket.max_start_time.value,
          duration: bucket.max_start_time.value - bucket.min_start_time.value,
          services: (bucket.service_names as BucketAggregate).buckets.map(
            (service: any) => service.key,
          ),
        });
      });
    }

    return {
      traces: response.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        id: hit._id,
      })),
      traceGroups,
      total,
      took: response.body.took,
    };
  } catch (error) {
    console.error("트레이스 검색 오류:", error);
    throw error;
  }
}

// 트레이스 저장
export async function indexTraces(traces: any[]) {
  if (!traces.length) return { success: true, indexed: 0 };

  try {
    // 벌크 인덱싱 요청 작성
    const body = traces.flatMap((trace) => [
      {
        index: {
          _index: TRACES_INDEX,
          _id: trace.id || `${trace.traceId}-${trace.spanId}`,
        },
      },
      trace,
    ]);

    const response = await client.bulk({ body });

    // 결과 확인
    const indexed = response.body.items.filter(
      (item: any) => !item.index.error,
    ).length;
    const errors = response.body.items.filter((item: any) => item.index.error);

    if (errors.length > 0) {
      console.warn(`${errors.length}개의 트레이스 인덱싱 오류 발생`);
    }

    return {
      success: response.body.errors === false,
      indexed,
      errors: errors.length,
      took: response.body.took,
    };
  } catch (error) {
    console.error("트레이스 인덱싱 오류:", error);
    throw error;
  }
}

// 로그 검색
export async function searchLogs(params: {
  query?: string;
  startTime?: number;
  endTime?: number;
  serviceName?: string;
  severity?: string;
  hasTrace?: boolean;
  limit?: number;
  from?: number;
}) {
  const {
    query = "*",
    startTime = Date.now() - 3600000, // 기본값: 1시간 전
    endTime = Date.now(),
    serviceName,
    severity,
    hasTrace,
    limit = 20,
    from = 0,
  } = params;

  // 쿼리 구성
  const must: any[] = [
    {
      range: {
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
    },
  ];

  // 검색어가 '*'가 아니면 쿼리 추가
  if (query !== "*") {
    must.push({
      multi_match: {
        query,
        fields: ["message^3", "serviceName^2", "attributes.*"],
      },
    });
  }

  // 필터 조건 추가
  if (serviceName) {
    must.push({
      term: {
        serviceName: serviceName,
      },
    });
  }

  if (severity) {
    must.push({
      term: {
        severity: severity,
      },
    });
  }

  if (hasTrace) {
    must.push({
      exists: {
        field: "traceId",
      },
    });
  }

  try {
    // @ts-ignore - 클라이언트 타입 문제 무시
    const response = await client.search({
      index: LOGS_INDEX,
      body: {
        size: limit,
        from,
        sort: [{ timestamp: { order: "desc" } }],
        query: {
          bool: {
            must,
          },
        },
        aggs: {
          services: {
            terms: {
              field: "serviceName.keyword",
              size: 20,
            },
          },
          severities: {
            terms: {
              field: "severity.keyword",
              size: 10,
            },
          },
        },
      },
    });

    const services = [] as any[];
    const severities = [] as any[];

    if (response.body?.aggregations?.services) {
      (response.body.aggregations.services as BucketAggregate).buckets.forEach(
        (bucket: any) => {
          services.push({
            name: bucket.key,
            count: bucket.doc_count,
          });
        },
      );
    }

    if (response.body?.aggregations?.severities) {
      (
        response.body.aggregations.severities as BucketAggregate
      ).buckets.forEach((bucket: any) => {
        severities.push({
          name: bucket.key,
          count: bucket.doc_count,
        });
      });
    }

    let total = 0;

    if (response.body?.hits?.total) {
      total =
        typeof response.body.hits.total === "number"
          ? response.body.hits.total
          : response.body.hits.total.value || 0;
    }

    // 검색 결과 매핑
    return {
      logs: response.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        id: hit._id,
      })),
      services,
      severities,
      total,
      took: response.body.took,
    };
  } catch (error) {
    console.error("로그 검색 오류:", error);
    throw error;
  }
}

// 로그 저장
export async function indexLogs(logs: any[]) {
  if (!logs.length) return { success: true, indexed: 0 };

  try {
    // 벌크 인덱싱 요청 작성
    const body = logs.flatMap((log) => [
      { index: { _index: LOGS_INDEX, _id: log.id } },
      log,
    ]);

    const response = await client.bulk({ body });

    // 결과 확인
    const indexed = response.body.items.filter(
      (item: any) => !item.index.error,
    ).length;
    const errors = response.body.items.filter((item: any) => item.index.error);

    if (errors.length > 0) {
      console.warn(`${errors.length}개의 로그 인덱싱 오류 발생`);
    }

    return {
      success: response.body.errors === false,
      indexed,
      errors: errors.length,
      took: response.body.took,
    };
  } catch (error) {
    console.error("로그 인덱싱 오류:", error);
    throw error;
  }
}

// 서비스 지표 가져오기
export async function getServiceMetrics(params: {
  startTime?: number;
  endTime?: number;
  serviceName?: string;
}) {
  const {
    startTime = Date.now() - 3600000, // 기본값: 1시간 전
    endTime = Date.now(),
    serviceName,
  } = params;

  // 서비스별 지표를 가져오기 위한 집계 쿼리
  const must: any[] = [
    {
      range: {
        startTime: {
          gte: startTime,
          lte: endTime,
        },
      },
    },
  ];

  if (serviceName) {
    must.push({
      term: {
        serviceName: serviceName,
      },
    });
  }

  try {
    // @ts-ignore - 클라이언트 타입 문제 무시
    const response = await client.search({
      index: TRACES_INDEX,
      body: {
        size: 0, // 문서 결과는 필요 없음
        query: {
          bool: {
            must,
          },
        },
        aggs: {
          services: {
            terms: {
              field: "serviceName.keyword",
              size: 100,
              order: {
                avg_latency: "desc",
              },
            },
            aggs: {
              avg_latency: {
                avg: {
                  field: "duration",
                },
              },
              p95_latency: {
                percentiles: {
                  field: "duration",
                  percents: [95],
                },
              },
              p99_latency: {
                percentiles: {
                  field: "duration",
                  percents: [99],
                },
              },
              error_count: {
                filter: {
                  term: {
                    status: "ERROR",
                  },
                },
              },
              time_histogram: {
                date_histogram: {
                  field: "startTime",
                  calendar_interval: interval,
                  min_doc_count: 0,
                  extended_bounds: {
                    min: startTime,
                    max: endTime,
                  },
                },
                aggs: {
                  avg_latency: {
                    avg: {
                      field: "duration",
                    },
                  },
                  error_count: {
                    filter: {
                      term: {
                        status: "ERROR",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const services = [] as any[];

    if (response.body?.aggregations?.services) {
      (response.body.aggregations.services as BucketAggregate).buckets.forEach(
        (bucket: any) => {
          const totalRequests = bucket.doc_count;
          const errorCount = bucket.error_count.doc_count;

          // 시계열 데이터 구성
          const timeSeriesData = [] as any[];

          if (bucket.time_histogram) {
            (bucket.time_histogram as BucketAggregate).buckets.forEach(
              (timeBucket: any) => {
                timeSeriesData.push({
                  timestamp: timeBucket.key,
                  requestCount: timeBucket.doc_count,
                  avgLatency: timeBucket.avg_latency?.value || 0,
                  errorCount: timeBucket.error_count.doc_count,
                  errorRate:
                    timeBucket.doc_count > 0
                      ? (timeBucket.error_count.doc_count /
                          timeBucket.doc_count) *
                        100
                      : 0,
                });
              },
            );
          }

          services.push({
            name: bucket.key,
            requestCount: totalRequests,
            errorCount,
            errorRate:
              totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
            avgLatency: bucket.avg_latency?.value || 0,
            p95Latency: bucket.p95_latency?.values?.["95.0"] || 0,
            p99Latency: bucket.p99_latency?.values?.["99.0"] || 0,
            timeSeriesData,
          });
        },
      );
    }

    let total = 0;

    if (response.body?.hits?.total) {
      total =
        typeof response.body.hits.total === "number"
          ? response.body.hits.total
          : response.body.hits.total.value || 0;
    }

    return {
      services,
      total,
      took: response.body.took,
    };
  } catch (error) {
    console.error("서비스 지표 가져오기 오류:", error);
    throw error;
  }
}

// 특정 트레이스 ID에 대한 전체 트레이스 가져오기
export async function getTraceById(traceId: string) {
  try {
    // @ts-ignore - 클라이언트 타입 문제 무시
    const response = await client.search({
      index: TRACES_INDEX,
      body: {
        size: 1000, // 충분히 큰 수
        query: {
          term: {
            traceId: traceId,
          },
        },
        sort: [{ startTime: { order: "asc" } }],
      },
    });

    // 검색 결과에서 스팬 추출
    const spans = response.body.hits.hits.map((hit: any) => ({
      ...hit._source,
      id: hit._id,
    }));

    // 서비스 목록 생성
    const serviceSet = new Set<string>();

    spans.forEach((span: any) => {
      if (span.serviceName) {
        serviceSet.add(span.serviceName);
      }
    });
    const services = Array.from(serviceSet);

    let total = 0;

    if (response.body?.hits?.total) {
      total =
        typeof response.body.hits.total === "number"
          ? response.body.hits.total
          : response.body.hits.total.value || 0;
    }

    // 트레이스 구조화
    return {
      traceId,
      spans,
      startTime:
        spans.length > 0
          ? Math.min(...spans.map((span: any) => span.startTime))
          : 0,
      endTime:
        spans.length > 0
          ? Math.max(...spans.map((span: any) => span.endTime))
          : 0,
      services,
      total,
    };
  } catch (error) {
    console.error("트레이스 가져오기 오류:", error);
    throw error;
  }
}
