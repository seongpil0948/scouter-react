'use client';

import React, { useMemo } from 'react';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { ExternalLink, Copy } from 'lucide-react';
import { addToast } from '@heroui/toast';

interface UrlAttributesViewerProps {
  attributes: Record<string, any> | undefined;
  className?: string;
}

const UrlAttributesViewer: React.FC<UrlAttributesViewerProps> = ({ attributes, className = '' }) => {
  // URL 관련 속성 추출
  const urlAttributes = useMemo(() => {
    if (!attributes) return null;
    
    // URL 관련 키들을 찾아서 모음
    const urlKeys = Object.keys(attributes).filter(key => 
      key.startsWith('url.') || 
      key.startsWith('http.') || 
      key.includes('path') || 
      key.includes('request')
    );
    
    if (urlKeys.length === 0) return null;
    
    // 결과 객체 생성
    const result: Record<string, any> = {};
    urlKeys.forEach(key => {
      result[key] = attributes[key];
    });
    
    return result;
  }, [attributes]);

  // URL 경로
  const urlPath = useMemo(() => {
    if (!attributes) return null;
    return attributes['url.path'] || attributes['http.path'] || attributes['http.url'] || null;
  }, [attributes]);

  // URL 쿼리
  const urlQuery = useMemo(() => {
    if (!attributes) return null;
    return attributes['url.query'] || attributes['http.query'] || null;
  }, [attributes]);

  // HTTP 메서드
  const httpMethod = useMemo(() => {
    if (!attributes) return null;
    return attributes['http.method'] || null;
  }, [attributes]);

  // 전체 URL 추출 또는 구성
  const fullUrl = useMemo(() => {
    if (!attributes) return null;
    
    if (attributes['http.url']) return attributes['http.url'];
    
    let baseUrl = attributes['http.host'] || '';
    const scheme = attributes['http.scheme'] || 'https';
    const path = urlPath || '';
    const query = urlQuery ? `?${urlQuery}` : '';
    
    if (baseUrl && !baseUrl.startsWith('http')) {
      baseUrl = `${scheme}://${baseUrl}`;
    }
    
    return `${baseUrl}${path}${query}`;
  }, [attributes, urlPath, urlQuery]);

  // URL 복사
  const handleCopyUrl = () => {
    if (!fullUrl) return;

    navigator.clipboard.writeText(String(fullUrl))
      .then(() => {
        addToast({
          title: 'URL 복사 완료',
          description: 'URL이 클립보드에 복사되었습니다',
          color: 'success',
        });
      })
      .catch(() => {
        addToast({
          title: '복사 실패',
          description: '클립보드 접근에 실패했습니다',
          color: 'danger',
        });
      });
  };

  // URL 속성이 없는 경우
  if (!urlAttributes || Object.keys(urlAttributes).length === 0) {
    return (
      <div className={`${className} p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-md`}>
        <p className="text-gray-500">이 스팬에는 URL 관련 속성이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white dark:bg-gray-800 rounded-lg overflow-hidden`}>
      <div className="border-b dark:border-gray-700">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 flex justify-between items-center">
          <div className="font-medium flex items-center">
            <span>URL 정보</span>
            {httpMethod && (
              <Badge color={getMethodColor(httpMethod)} className="ml-2">
                {httpMethod}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {fullUrl && (
              <>
                <Button size="sm" variant="ghost" onPress={handleCopyUrl}>
                  <Copy size={16} className="mr-1" />
                  복사
                </Button>
                
                <Button 
                  as="a" 
                  href={fullUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  size="sm" 
                  variant="ghost"
                >
                  <ExternalLink size={16} className="mr-1" />
                  열기
                </Button>
              </>
            )}
          </div>
        </div>
        
        {fullUrl && (
          <div className="p-4">
            <div className="font-mono text-sm break-all bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700">
              {fullUrl}
            </div>
          </div>
        )}
      </div>

      {/* URL 경로 정보 */}
      {urlPath && (
        <div className="p-4 border-b dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">경로 (Path)</h4>
          <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            {urlPath}
          </div>
        </div>
      )}

      {/* URL 쿼리 정보 */}
      {urlQuery && (
        <div className="p-4 border-b dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">쿼리 파라미터 (Query)</h4>
          <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            {formatQuery(urlQuery)}
          </div>
        </div>
      )}

      {/* 기타 URL 관련 속성 표시 */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          기타 HTTP/URL 정보
        </h4>
        <div className="space-y-2">
          {Object.entries(urlAttributes)
            .filter(([key]) => 
              key !== 'url.path' && 
              key !== 'url.query' && 
              key !== 'http.method' && 
              key !== 'http.url'
            )
            .map(([key, value]) => (
              <div key={key} className="flex items-start border-b dark:border-gray-700 pb-2">
                <div className="w-1/3 text-sm text-gray-600 dark:text-gray-400">{key}:</div>
                <div className="w-2/3 font-mono text-sm break-all">
                  {typeof value === 'object' 
                    ? JSON.stringify(value) 
                    : String(value)
                  }
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// HTTP 메서드별 색상
function getMethodColor(method: string): "primary" | "secondary" | "success" | "warning" | "danger" {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'success';
    case 'POST':
      return 'primary';
    case 'PUT':
      return 'secondary';
    case 'DELETE':
      return 'danger';
    case 'PATCH':
      return 'warning';
    default:
      return 'primary';
  }
}

// URL 쿼리 문자열 포맷팅
function formatQuery(queryString: string): React.ReactNode {
  try {
    // 쿼리 파라미터 파싱
    const params = new URLSearchParams(queryString);
    const entries = Array.from(params.entries());
    
    if (entries.length === 0) return queryString;
    
    // 파라미터를 테이블 형태로 표시
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-1 pr-2">파라미터</th>
            <th className="text-left py-1">값</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value], index) => (
            <tr key={index} className="border-b dark:border-gray-700">
              <td className="py-1 pr-2 font-medium">{key}</td>
              <td className="py-1 break-all">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } catch (e) {
    // 파싱 실패 시 원본 문자열 표시
    return queryString;
  }
}

export default UrlAttributesViewer;