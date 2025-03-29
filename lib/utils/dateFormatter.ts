/**
 * 유틸리티 함수: 타임스탬프를 사람이 읽기 쉬운 날짜/시간 형식으로 변환
 */

// 타임스탬프를 날짜 및 시간 문자열로 변환
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// 타임스탬프를 날짜 문자열로 변환
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 타임스탬프를 시간 문자열로 변환
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// 밀리초를 사람이 읽기 쉬운 형식으로 변환
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return "<1ms";
  }

  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);

  return `${minutes}m ${seconds}s`;
}

// 현재 시간으로부터의 상대 시간 표시
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 0) {
    return "미래";
  }

  // 1분 이내
  if (diff < 60000) {
    return "방금 전";
  }

  // 1시간 이내
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);

    return `${minutes}분 전`;
  }

  // 1일 이내
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);

    return `${hours}시간 전`;
  }

  // 30일 이내
  if (diff < 2592000000) {
    const days = Math.floor(diff / 86400000);

    return `${days}일 전`;
  }

  // 그 이상은 날짜 표시
  return formatDate(timestamp);
}

// ISO 타임스탬프를 밀리초로 변환
export function isoToTimestamp(isoString: string): number {
  return new Date(isoString).getTime();
}

// 타임스탬프를 ISO 문자열로 변환
export function timestampToIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

// 시간 범위 문자열 생성 (시작 시간 ~ 종료 시간)
export function formatTimeRange(startTime: number, endTime: number): string {
  return `${formatDateTime(startTime)} ~ ${formatDateTime(endTime)}`;
}

// 오늘, 어제, 이번 주 등 상대적인 날짜 반환
export function getRelativeDateRange(
  range:
    | "today"
    | "yesterday"
    | "this_week"
    | "last_week"
    | "this_month"
    | "last_month",
): {
  start: number;
  end: number;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = now.getTime();

  let start: number;

  switch (range) {
    case "today":
      start = today.getTime();
      break;
    case "yesterday":
      start = today.getTime() - 86400000;
      break;
    case "this_week": {
      const dayOfWeek = now.getDay() || 7; // 일요일이 0이므로 7로 변경

      start = today.getTime() - (dayOfWeek - 1) * 86400000; // 월요일부터 시작
      break;
    }
    case "last_week": {
      const dayOfWeek = now.getDay() || 7;
      const thisWeekStart = today.getTime() - (dayOfWeek - 1) * 86400000;

      start = thisWeekStart - 7 * 86400000;
      break;
    }
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      break;
    default:
      start = today.getTime();
  }

  return { start, end };
}

export default {
  formatDateTime,
  formatDate,
  formatTime,
  formatDuration,
  formatRelativeTime,
  isoToTimestamp,
  timestampToIso,
  formatTimeRange,
  getRelativeDateRange,
};
