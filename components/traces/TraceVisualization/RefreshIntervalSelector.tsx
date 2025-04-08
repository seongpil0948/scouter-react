'use client';

import React from 'react';
import { Switch } from '@heroui/switch';
import { Select, SelectItem } from '@heroui/select';
import { RefreshCw } from 'lucide-react';
import { Tooltip } from '@heroui/tooltip';

import { useChartStore } from '@/lib/store/chartStore';
import { SharedSelection } from '@heroui/system';

interface RefreshIntervalSelectorProps {
  className?: string;
}

const RefreshIntervalSelector: React.FC<RefreshIntervalSelectorProps> = ({ className = '' }) => {
  const { refreshInterval, setRefreshInterval, autoRefreshEnabled, toggleAutoRefresh } = useChartStore();

  // Interval options with labels
  const intervalOptions: { value: RefreshIntervalOption; label: string }[] = [
    { value: 1000, label: '1초' },
    { value: 5000, label: '5초' },
    { value: 10000, label: '10초' },
  ];

  // Handle interval change
  const handleIntervalChange = (key: SharedSelection) => {
    setRefreshInterval(Number(key) as RefreshIntervalOption);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Tooltip content={autoRefreshEnabled ? '자동 새로고침 켜짐' : '자동 새로고침 꺼짐'}>
          <RefreshCw className={`${autoRefreshEnabled ? 'text-blue-500' : 'text-gray-400'}`} size={18} />
        </Tooltip>

        <Switch isSelected={autoRefreshEnabled} size="sm" color="primary" onChange={toggleAutoRefresh} />
      </div>

      <Select
        label="새로고침 간격"
        placeholder="새로고침 간격"
        selectedKeys={[refreshInterval.toString()]}
        onSelectionChange={handleIntervalChange}
        isDisabled={!autoRefreshEnabled}
        size="sm"
        className="w-24"
      >
        {intervalOptions.map((option) => (
          <SelectItem key={option.value.toString()} textValue={option.label}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
};

export default RefreshIntervalSelector;
