/**
 * 트레이스 및 스팬 처리를 위한 유틸리티 함수
 */

import { formatDuration } from "./dateFormatter";

// 스팬 인터페이스
export interface Span {
  id: string;
  name: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  duration: number;
  parentSpanId?: string;
  traceId: string;
  spanId: string;
  status?: string;
  attributes?: Record<string, any>;
}

// 트레이스 인터페이스
export interface Trace {
  traceId: string;
  spans: Span[];
  startTime: number;
  endTime: number;
  services: string[];
  total: number;
}

// 스팬 노드 인터페이스 (계층 구조 표현용)
export interface SpanNode {
  span: Span;
  children: SpanNode[];
  depth: number;
}

/**
 * 트레이스 내 스팬들의 계층 구조 생성
 */
export function buildSpanTree(spans: Span[]): SpanNode[] {
  const nodeMap: Record<string, SpanNode> = {};
  const rootNodes: SpanNode[] = [];

  // 먼저 모든 스팬에 대한 노드 생성
  spans.forEach((span) => {
    nodeMap[span.spanId] = {
      span,
      children: [],
      depth: 0,
    };
  });

  // 부모-자식 관계 설정
  spans.forEach((span) => {
    const node = nodeMap[span.spanId];

    if (span.parentSpanId && nodeMap[span.parentSpanId]) {
      // 부모가 있으면 자식으로 추가
      const parentNode = nodeMap[span.parentSpanId];

      parentNode.children.push(node);
      node.depth = parentNode.depth + 1;
    } else {
      // 부모가 없으면 루트 노드
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

/**
 * 스팬 계층 구조 상에서 각 스팬의 자식 스팬 수 계산
 */
export function countDescendants(node: SpanNode): number {
  let count = 0;

  for (const child of node.children) {
    count += 1 + countDescendants(child);
  }

  return count;
}

/**
 * 트레이스 내 스팬들에 대한 타임라인 항목 생성
 */
export interface TimelineItem {
  id: string;
  spanId: string;
  name: string;
  serviceName: string;
  start: number; // 전체 타임라인 기준 시작 위치 (0-100%)
  width: number; // 전체 타임라인 기준 너비 (0-100%)
  duration: string; // 포맷팅된 지연 시간
  status: string;
  depth: number;
  hasChildren: boolean;
}

/**
 * 타임라인 항목 생성
 */
export function generateTimelineItems(
  trace: Trace,
  rootNodes: SpanNode[],
): TimelineItem[] {
  const items: TimelineItem[] = [];
  const traceDuration = trace.endTime - trace.startTime;

  function processNode(node: SpanNode) {
    const { span, depth, children } = node;
    const start = ((span.startTime - trace.startTime) / traceDuration) * 100;
    const width = (span.duration / traceDuration) * 100;

    items.push({
      id: span.id,
      spanId: span.spanId,
      name: span.name,
      serviceName: span.serviceName,
      start,
      width,
      duration: formatDuration(span.duration),
      status: span.status || "UNSET",
      depth,
      hasChildren: children.length > 0,
    });

    children.forEach(processNode);
  }

  rootNodes.forEach(processNode);

  return items;
}

/**
 * 트레이스 내 여러 스팬에 걸친 속성값 병합
 */
export function mergeSpanAttributes(spans: Span[]): Record<string, any> {
  const mergedAttributes: Record<string, any> = {};

  // 모든 스팬의 속성 수집
  spans.forEach((span) => {
    if (span.attributes) {
      Object.entries(span.attributes).forEach(([key, value]) => {
        if (!mergedAttributes[key]) {
          mergedAttributes[key] = [];
        }

        if (!mergedAttributes[key].includes(value)) {
          mergedAttributes[key].push(value);
        }
      });
    }
  });

  // 각 속성별로 값이 하나면 그대로 반환, 여러 개면 배열로 반환
  Object.keys(mergedAttributes).forEach((key) => {
    if (mergedAttributes[key].length === 1) {
      mergedAttributes[key] = mergedAttributes[key][0];
    }
  });

  return mergedAttributes;
}

/**
 * 특정 서비스에 속하는 스팬 추출
 */
export function filterSpansByService(
  spans: Span[],
  serviceName: string,
): Span[] {
  return spans.filter((span) => span.serviceName === serviceName);
}

/**
 * 특정 상태에 속하는 스팬 추출
 */
export function filterSpansByStatus(spans: Span[], status: string): Span[] {
  return spans.filter((span) => span.status === status);
}

/**
 * 스팬 상태에 따른 색상 반환
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "ERROR":
      return "#ff4d4f";
    case "OK":
      return "#52c41a";
    case "UNSET":
    default:
      return "#1890ff";
  }
}

/**
 * 지연 시간에 따른 색상 반환
 */
export function getLatencyColor(duration: number): string {
  if (duration < 50) return "#52c41a";
  if (duration < 200) return "#1890ff";
  if (duration < 500) return "#faad14";

  return "#ff4d4f";
}

export default {
  buildSpanTree,
  countDescendants,
  generateTimelineItems,
  mergeSpanAttributes,
  filterSpansByService,
  filterSpansByStatus,
  getStatusColor,
  getLatencyColor,
};
