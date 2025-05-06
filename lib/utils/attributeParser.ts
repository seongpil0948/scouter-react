/**
 * 속성(Attributes) 처리를 위한 유틸리티 함수
 */

// 속성 유형 정의
export type AttributeType = 'sql' | 'http' | 'error' | 'db' | 'network' | 'user' | 'general';

/**
 * 속성 키(key)를 기반으로 속성 유형 분류
 */
export function getAttributeType(key: string): AttributeType {
  const lowerKey = key.toLowerCase();
  
  if (lowerKey.startsWith('sql.') || lowerKey.startsWith('db.')) {
    return 'sql';
  }
  
  if (lowerKey.startsWith('http.') || lowerKey.startsWith('url.') || lowerKey.includes('request') || lowerKey.includes('response')) {
    return 'http';
  }
  
  if (lowerKey.includes('error') || lowerKey.includes('exception')) {
    return 'error';
  }
  
  if (lowerKey.includes('network') || lowerKey.includes('connection')) {
    return 'network';
  }
  
  if (lowerKey.startsWith('user.') || lowerKey.includes('user_id') || lowerKey.includes('username')) {
    return 'user';
  }
  
  return 'general';
}

/**
 * 속성 데이터 파싱 및 포맷팅
 * 일부 값 유형에 대한 특별 처리 포함
 */
export function formatAttributeValue(value: any): string {
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  return String(value);
}

/**
 * 주어진 속성 키/값 쌍에 대한 표시 이름 가져오기
 */
export function getAttributeDisplayName(key: string): string {
  // 네임스페이스(점 이후) 부분만 추출
  const parts = key.split('.');
  
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  
  return key;
}

/**
 * 속성 정렬
 * 중요도에 따른 정렬 (에러 > SQL > HTTP > 기타)
 */
export function sortAttributes(attributes: Record<string, any>): [string, any][] {
  return Object.entries(attributes).sort((a, b) => {
    const typeA = getAttributeType(a[0]);
    const typeB = getAttributeType(b[0]);
    
    // 유형별 우선순위
    const priority: Record<AttributeType, number> = {
      'error': 0,
      'sql': 1,
      'http': 2,
      'db': 3,
      'network': 4,
      'user': 5,
      'general': 6
    };
    
    return priority[typeA] - priority[typeB];
  });
}

/**
 * 키워드로 속성 필터링
 */
export function filterAttributesByKeyword(attributes: Record<string, any>, keyword: string): Record<string, any> {
  if (!keyword) {
    return attributes;
  }
  
  const filtered: Record<string, any> = {};
  const lowerKeyword = keyword.toLowerCase();
  
  Object.entries(attributes).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    const stringValue = formatAttributeValue(value).toLowerCase();
    
    if (lowerKey.includes(lowerKeyword) || stringValue.includes(lowerKeyword)) {
      filtered[key] = value;
    }
  });
  
  return filtered;
}

/**
 * 속성 유형별 필터링
 */
export function filterAttributesByType(attributes: Record<string, any>, types: AttributeType[]): Record<string, any> {
  if (!types || types.length === 0) {
    return attributes;
  }
  
  const filtered: Record<string, any> = {};
  
  Object.entries(attributes).forEach(([key, value]) => {
    const type = getAttributeType(key);
    
    if (types.includes(type)) {
      filtered[key] = value;
    }
  });
  
  return filtered;
}

/**
 * SQL 관련 속성 추출 및 정리
 * SQL 쿼리 포맷팅 및 관련 속성 정리
 */
export function extractSqlAttributes(attributes: Record<string, any>): {
  statement?: string;
  operation?: string;
  database?: string;
  elapsed?: number;
  rows?: number;
  error?: string;
} {
  const result: Record<string, any> = {};
  
  // 가능한 SQL 속성 매핑
  const mappings: Record<string, string> = {
    'db.statement': 'statement',
    'sql.query': 'statement',
    'db.operation': 'operation',
    'sql.operation': 'operation',
    'db.name': 'database',
    'sql.db': 'database',
    'sql.elapsed': 'elapsed',
    'db.elapsed': 'elapsed',
    'sql.rows': 'rows',
    'db.rows': 'rows',
    'sql.error': 'error',
    'db.error': 'error'
  };
  
  Object.entries(attributes).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    
    // 매핑된 속성 키 확인
    Object.entries(mappings).forEach(([srcKey, destKey]) => {
      if (lowerKey === srcKey || lowerKey.endsWith(`.${srcKey}`)) {
        result[destKey] = value;
      }
    });
  });
  
  return result as any;
}

/**
 * HTTP 관련 속성 추출 및 정리
 */
export function extractHttpAttributes(attributes: Record<string, any>): {
  method?: string;
  url?: string;
  status?: number;
  size?: number;
  userAgent?: string;
  elapsed?: number;
} {
  const result: Record<string, any> = {};
  
  // 가능한 HTTP 속성 매핑
  const mappings: Record<string, string> = {
    'http.method': 'method',
    'http.url': 'url',
    'url.full': 'url',
    'http.status_code': 'status',
    'http.status': 'status',
    'http.response_size': 'size',
    'http.user_agent': 'userAgent',
    'http.elapsed': 'elapsed',
    'http.duration': 'elapsed'
  };
  
  Object.entries(attributes).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    
    // 매핑된 속성 키 확인
    Object.entries(mappings).forEach(([srcKey, destKey]) => {
      if (lowerKey === srcKey || lowerKey.endsWith(`.${srcKey}`)) {
        result[destKey] = value;
      }
    });
  });
  
  return result as any;
}

export default {
  getAttributeType,
  formatAttributeValue,
  getAttributeDisplayName,
  sortAttributes,
  filterAttributesByKeyword,
  filterAttributesByType,
  extractSqlAttributes,
  extractHttpAttributes
};
