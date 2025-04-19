import React from 'react';
import { Card, CardBody } from '@heroui/card';
import { Clock } from 'lucide-react';

interface NoDataProps {
  isRealtime: boolean;
  hasFilters: boolean;
}

const NoData: React.FC<NoDataProps> = ({ isRealtime, hasFilters }) => {
  return (
    <Card className="w-full">
      <CardBody className="flex items-center justify-center h-60 text-center">
        {isRealtime ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-4 text-blue-500">
              <Clock size={24} className="mr-2" aria-hidden="true" />
              <span className="text-lg font-medium">Waiting for realtime data...</span>
            </div>
            <p className="text-gray-500">
              {hasFilters 
                ? 'No data matching your filter criteria has been received yet.' 
                : 'Data will appear here as it is received.'}
            </p>
          </div>
        ) : (
          <div className="text-gray-500">
            {hasFilters
              ? 'No data matching your filter criteria.'
              : 'No data loaded. Data will be displayed here when available.'}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default NoData;