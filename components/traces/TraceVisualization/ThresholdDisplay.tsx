import React from "react";
import { Tooltip } from "@heroui/tooltip";
import { Chip } from "@heroui/chip";
import { Card, CardBody } from "@heroui/card";
import { formatDuration } from "@/lib/utils/dateFormatter";

interface ThresholdDisplayProps {
  serviceThresholds: Map<string, number>;
  serviceStats: Map<
    string,
    { total: number; exceeded: number; errorCount: number }
  >;
}

const ThresholdDisplay: React.FC<ThresholdDisplayProps> = ({
  serviceThresholds,
  serviceStats,
}) => {
  if (serviceThresholds.size === 0) return null;

  return (
    <Card className="mb-4">
      <CardBody className="py-2 px-4">
        <div className="flex items-center mb-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Service Thresholds:
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.from(serviceThresholds.entries()).map(
            ([service, threshold]) => {
              const stats = serviceStats.get(service);
              const tooltip = stats
                ? `${stats.total} total, ${stats.exceeded} exceeded threshold`
                : "No data";

              return (
                <Tooltip key={service} content={tooltip}>
                  <Chip
                    color="default"
                    variant="flat"
                    className=" text-gray-700  dark:text-gray-300"
                  >
                    {service}: {formatDuration(threshold)}
                  </Chip>
                </Tooltip>
              );
            }
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default ThresholdDisplay;
