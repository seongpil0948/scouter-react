import React from 'react';
import { Clock } from 'lucide-react';

interface NoDataProps {
  isRealtime: boolean;
  hasFilters: boolean;
}

const NoData: React.FC<NoDataProps> = ({ isRealtime, hasFilters }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
      {isRealtime ? (
        <div className="flex flex-col items-center">
          <div className="animate-pulse flex items-center justify-center mb-4">
            <Clock size={24} className="mr-2 text-blue-500" aria-hidden="true" />
            <span className="text-blue-500">실시간 데이터 대기 중...</span>
          </div>
          <p>{hasFilters ? '필터 조건에 맞는 데이터가 아직 수신되지 않았습니다.' : '데이터가 수신되면 여기에 표시됩니다.'}</p>
        </div>
      ) : (
        <p>
          {hasFilters
            ? '필터 조건에 맞는 데이터가 없습니다.'
            : '데이터가 로드되지 않았습니다. 데이터가 수신되면 여기에 표시됩니다.'}
        </p>
      )}
    </div>
  );
};

export default NoData;
