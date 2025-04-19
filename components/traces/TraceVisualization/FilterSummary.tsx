import React from 'react';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { formatDuration } from '@/lib/utils/dateFormatter';
import { isSelectionSet } from './utils';

interface FilterSummaryProps {
  filteredDataLength: number;
  dataFilters: any;
  hasFilters: boolean;
  onResetFilters: () => void;
}

const FilterSummary: React.FC<FilterSummaryProps> = ({ 
  filteredDataLength, 
  dataFilters, 
  hasFilters, 
  onResetFilters 
}) => {
  return (
    <Card className="mt-4">
      <CardBody className="py-2 px-4">
        <div className="flex flex-wrap justify-between gap-2 items-center">
          <Chip color="primary" variant="flat">
            Displaying {filteredDataLength} traces
          </Chip>

          {dataFilters.serviceFilter !== 'all' && isSelectionSet(dataFilters.serviceFilter) && (
            <Chip color="primary" variant="bordered">
              Services: {Array.from(dataFilters.serviceFilter).join(', ')}
            </Chip>
          )}

          {dataFilters.statusFilter !== 'all' && isSelectionSet(dataFilters.statusFilter) && (
            <Chip
              color={dataFilters.statusFilter.has('ERROR') ? 'danger' : 'success'}
              variant="bordered"
            >
              Status: {Array.from(dataFilters.statusFilter).join(', ')}
            </Chip>
          )}

          {(dataFilters.minDuration !== undefined || dataFilters.maxDuration !== undefined) && (
            <Chip color="warning" variant="bordered">
              Latency: {dataFilters.minDuration !== undefined ? formatDuration(dataFilters.minDuration) : '0ms'} ~
              {dataFilters.maxDuration !== undefined ? formatDuration(dataFilters.maxDuration) : 'unlimited'}
            </Chip>
          )}

          {/* Reset Filters Button */}
          {hasFilters && (
            <Button
              size="sm"
              color="primary"
              variant="light"
              onPress={onResetFilters}
              aria-label="Reset filters"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default FilterSummary;