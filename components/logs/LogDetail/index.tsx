// components/logs/LogDetail/index.tsx
"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  AlertTriangle,
  Info,
  Activity,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils/dateFormatter";
import { copyToClipboard } from "@/lib/utils/clipboard";

interface LogDetailProps {
  log: LogItem;
  onBack?: () => void;
  onViewTrace?: (traceId: string) => void;
}

const LogDetail: React.FC<LogDetailProps> = ({ log, onBack, onViewTrace }) => {
  const [activeTab, setActiveTab] = useState<Key>("overview");

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "ERROR":
      case "FATAL":
        return "danger";
      case "WARN":
      case "WARNING":
        return "warning";
      case "INFO":
        return "primary";
      case "DEBUG":
        return "secondary";
      case "TRACE":
        return "default";
      default:
        return "default";
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "ERROR":
      case "FATAL":
        return <AlertTriangle size={16} />;
      case "WARN":
      case "WARNING":
        return <AlertTriangle size={16} />;
      case "INFO":
        return <Info size={16} />;
      case "DEBUG":
      case "TRACE":
        return <Activity size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  // Handle copy
  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text, label);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center">
          {onBack && (
            <Button
              variant="light"
              isIconOnly
              onPress={onBack}
              className="mr-2"
            >
              <ArrowLeft size={18} />
            </Button>
          )}
          <h2 className="text-xl">Log Detail</h2>
        </div>
        {log.traceId && onViewTrace && (
          <Button
            color="primary"
            variant="light"
            onPress={() => onViewTrace(log.traceId!)}
            endContent={<ExternalLink size={16} />}
          >
            View Trace
          </Button>
        )}
      </CardHeader>

      <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
        <Tab key="overview" title="Overview" />
        <Tab key="attributes" title="Attributes" />
        {log.traceId && <Tab key="trace" title="Trace Info" />}
      </Tabs>

      <CardBody>
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="  p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Timestamp</div>
                    <div className="flex items-center">
                      <span>{formatDateTime(log.timestamp)}</span>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        className="ml-2"
                        onPress={() =>
                          handleCopy(formatDateTime(log.timestamp), "Timestamp")
                        }
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Service</div>
                    <Badge color="primary">{log.serviceName}</Badge>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Severity</div>
                    <Badge color={getSeverityColor(log.severity)}>
                      {getSeverityIcon(log.severity)}
                      <span className="ml-1">{log.severity}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  {log.traceId && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-1">Trace ID</div>
                      <div className="flex items-center">
                        <code className="font-mono   px-2 py-1 rounded text-sm">
                          {log.traceId}
                        </code>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          className="ml-2"
                          onPress={() => handleCopy(log.traceId!, "Trace ID")}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                  {log.spanId && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-1">Span ID</div>
                      <div className="flex items-center">
                        <code className="font-mono   px-2 py-1 rounded text-sm">
                          {log.spanId}
                        </code>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          className="ml-2"
                          onPress={() => handleCopy(log.spanId!, "Span ID")}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Log ID</div>
                    <div className="flex items-center">
                      <code className="font-mono   px-2 py-1 rounded text-sm">
                        {log.id}
                      </code>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        className="ml-2"
                        onPress={() => handleCopy(log.id, "Log ID")}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="  p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Message</h3>
              <div className="font-mono text-sm   p-4 rounded whitespace-pre-wrap">
                {log.message}
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => handleCopy(log.message, "Message")}
                  endContent={<Copy size={14} />}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "attributes" && (
          <div className="p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Attributes</h3>
            {log.attributes && Object.keys(log.attributes).length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(log.attributes).map(([key, value]) => (
                  <div key={key} className="border rounded-md p-3 ">
                    <div className="text-sm text-gray-500 mb-1">{key}</div>
                    <div className="font-mono text-sm break-all">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No attributes available
              </div>
            )}
          </div>
        )}

        {activeTab === "trace" && log.traceId && (
          <div className="  p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Trace Information</h3>
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Trace ID</div>
              <div className="flex items-center">
                <code className="font-mono   px-2 py-1 rounded text-sm">
                  {log.traceId}
                </code>
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  className="ml-2"
                  onPress={() => handleCopy(log.traceId!, "Trace ID")}
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>

            {log.spanId && (
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Span ID</div>
                <div className="flex items-center">
                  <code className="font-mono   px-2 py-1 rounded text-sm">
                    {log.spanId}
                  </code>
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    className="ml-2"
                    onPress={() => handleCopy(log.spanId!, "Span ID")}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
            )}

            {onViewTrace && (
              <Button
                color="primary"
                onPress={() => onViewTrace(log.traceId!)}
                endContent={<ExternalLink size={16} />}
                className="mt-2"
              >
                View Trace Details
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default LogDetail;
