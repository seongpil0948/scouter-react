/**
 * 유틸리티 함수 중앙 관리 모듈
 * 모든 유틸리티 함수를 하나의 위치에서 내보냄
 */

// 날짜/시간 관련 유틸리티
export * from "./dateFormatter";

// 클립보드 관련 유틸리티
export * from "./clipboard";

// 로깅 관련 유틸리티
export * from "./logUtils";

// 트레이싱 관련 유틸리티
export * from "./tracingUtils";

// 필터링 관련 유틸리티
export * from "./filterUtils";

// 스팬 분석 유틸리티
export * from "./spanAnalyzer";

// UI 관련 유틸리티
export * from "./ui/statusUtils";

/**
 * 공통 타입 검사 유틸리티 
 */

// 객체인지 확인
export function isObject(value: any): boolean {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// 배열인지 확인
export function isArray(value: any): boolean {
  return Array.isArray(value);
}

// 문자열인지 확인
export function isString(value: any): boolean {
  return typeof value === "string";
}

// 숫자인지 확인
export function isNumber(value: any): boolean {
  return typeof value === "number" && !isNaN(value);
}

// 불리언인지 확인
export function isBoolean(value: any): boolean {
  return typeof value === "boolean";
}

// 함수인지 확인
export function isFunction(value: any): boolean {
  return typeof value === "function";
}

// 날짜인지 확인
export function isDate(value: any): boolean {
  return value instanceof Date && !isNaN(value.getTime());
}

// null 또는 undefined인지 확인
export function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined;
}

/**
 * 데이터 처리 유틸리티
 */

// 객체 깊은 복사
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as any;
  }

  const copy: Record<string, any> = {};
  Object.keys(obj as Record<string, any>).forEach((key) => {
    copy[key] = deepClone((obj as Record<string, any>)[key]);
  });

  return copy as T;
}

// 객체 깊은 병합
export function deepMerge<T>(target: T, source: Partial<T>): T {
  if (!isObject(target) || !isObject(source)) {
    return source as T;
  }

  const output = { ...target } as Record<string, any>;

  Object.keys(source as Record<string, any>).forEach((key) => {
    const targetValue = (target as Record<string, any>)[key];
    const sourceValue = (source as Record<string, any>)[key];

    if (isObject(targetValue) && isObject(sourceValue)) {
      output[key] = deepMerge(targetValue, sourceValue);
    } else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      output[key] = [...sourceValue];
    } else {
      output[key] = sourceValue;
    }
  });

  return output as T;
}

// 객체 깊은 동등 비교
export function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

// 문자열 트림, null 안전
export function safeStringTrim(str: string | null | undefined): string {
  if (str === null || str === undefined) {
    return "";
  }
  return String(str).trim();
}

// 안전하게 숫자로 변환
export function safeParseNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const num = Number(value);
  return isNaN(num) ? null : num;
}

// 문자열 필터링 검색 (대소문자 구분 없음)
export function stringSearch(text: string, search: string): boolean {
  if (!search) return true;
  if (!text) return false;

  return text.toLowerCase().includes(search.toLowerCase());
}
