// components/logs/LogFilter/index.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Filter, X, RefreshCw, ArrowDownUp, Search } from "lucide-react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";

interface LogFilterProps {
  services: string[];
  severities: string[];
  filters: LogFilter;
  updateFilters: (filters: Partial<LogFilter>) => void;
  onFilterChange?: () => void;
  onRefresh?: () => void;
  isRealtime?: boolean;
  onToggleRealtime?: (enabled: boolean) => void;
}

const LogFilter: React.FC<LogFilterProps> = ({
  services,
  severities,
  filters,
  updateFilters,
  onFilterChange,
  onRefresh,
  isRealtime = false,
  onToggleRealtime,
}) => {
  // Local state
  const [searchText, setSearchText] = useState(filters.query || "");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle service change
  const handleServiceChange = useCallback(
    (keys: any) => {
      if (typeof keys === "string") return;
      const key = Array.from(keys)[0] as string;
      updateFilters({ serviceName: key === "all" ? null : key });
      onFilterChange?.();
    },
    [updateFilters, onFilterChange]
  );

  // Handle severity change
  const handleSeverityChange = useCallback(
    (keys: any) => {
      if (typeof keys === "string") return;
      const key = Array.from(keys)[0] as string;
      updateFilters({ severity: key === "all" ? null : key });
      onFilterChange?.();
    },
    [updateFilters, onFilterChange]
  );

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== filters.query) {
        updateFilters({ query: searchText || undefined });
        onFilterChange?.();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText, filters.query, updateFilters, onFilterChange]);

  // Handle has trace toggle
  const handleHasTraceToggle = useCallback(
    (checked: boolean) => {
      updateFilters({ hasTrace: checked });
      onFilterChange?.();
    },
    [updateFilters, onFilterChange]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [onRefresh, isRefreshing]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSearchText("");
    updateFilters({
      serviceName: null,
      severity: null,
      query: undefined,
      hasTrace: false,
    });
    onFilterChange?.();
  }, [updateFilters, onFilterChange]);

  // Check if any filter is active
  const hasActiveFilters =
    filters.serviceName ||
    filters.severity ||
    filters.query ||
    filters.hasTrace;

  return (
    <Card className="w-full mb-4">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Search input */}
            <div className="relative">
              <Input
                placeholder="Search in logs..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                startContent={<Search size={16} className="text-gray-400" />}
                endContent={
                  searchText ? (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => setSearchText("")}
                    >
                      <X size={14} />
                    </Button>
                  ) : null
                }
              />
            </div>

            {/* Service filter */}
            <Select
              label="Service"
              placeholder="All services"
              selectedKeys={
                filters.serviceName ? [filters.serviceName] : ["all"]
              }
              onSelectionChange={handleServiceChange}
            >
              <SelectItem key="all">All services</SelectItem>
              {
                services.map((service) => (
                  <SelectItem key={service}>{service}</SelectItem>
                )) as any
              }
            </Select>

            {/* Severity filter */}
            <Select
              label="Severity"
              placeholder="All severities"
              selectedKeys={filters.severity ? [filters.severity] : ["all"]}
              onSelectionChange={handleSeverityChange}
            >
              <SelectItem key="all">All severities</SelectItem>
              {
                severities.map((severity) => (
                  <SelectItem key={severity}>{severity}</SelectItem>
                )) as any
              }
            </Select>

            {/* Has trace toggle */}
            <div className="flex items-center">
              <Switch
                isSelected={filters.hasTrace}
                onValueChange={handleHasTraceToggle}
              />
              <span className="ml-2">Only logs with trace ID</span>
            </div>
          </div>

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.serviceName && (
                <Chip
                  onClose={() => {
                    updateFilters({ serviceName: null });
                    onFilterChange?.();
                  }}
                >
                  Service: {filters.serviceName}
                </Chip>
              )}
              {filters.severity && (
                <Chip
                  onClose={() => {
                    updateFilters({ severity: null });
                    onFilterChange?.();
                  }}
                >
                  Severity: {filters.severity}
                </Chip>
              )}
              {filters.query && (
                <Chip
                  onClose={() => {
                    setSearchText("");
                    updateFilters({ query: undefined });
                    onFilterChange?.();
                  }}
                >
                  Search: {filters.query}
                </Chip>
              )}
              {filters.hasTrace && (
                <Chip
                  onClose={() => {
                    updateFilters({ hasTrace: false });
                    onFilterChange?.();
                  }}
                >
                  With Trace ID
                </Chip>
              )}
              <Button
                size="sm"
                variant="ghost"
                onPress={handleClearFilters}
                startContent={<X size={14} />}
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Control buttons */}
          <div className="flex justify-between mt-2">
            <div className="flex gap-2">
              {onToggleRealtime && (
                <div className="flex items-center gap-2">
                  <Switch
                    isSelected={isRealtime}
                    onValueChange={onToggleRealtime}
                  />
                  <span>Realtime updates</span>
                </div>
              )}
            </div>
            <Button
              variant="light"
              onPress={handleRefresh}
              isDisabled={isRealtime}
              startContent={<RefreshCw size={16} />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default LogFilter;
