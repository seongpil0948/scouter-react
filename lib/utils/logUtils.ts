import { formatRelativeTime } from "@/lib/utils/dateFormatter";

export interface LogStatistics {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  serviceCount: number;
  errorPercentage: number;
  lastLogTime: number;
  services: Set<string>;
}

export function computeLogStatistics(logs: LogItem[]): LogStatistics {
  const stats = {
    totalLogs: logs.length,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    serviceCount: 0,
    errorPercentage: 0,
    lastLogTime: 0,
    services: new Set<string>(),
  };

  logs.forEach((log) => {
    stats.services.add(log.serviceName);
    const sev = log.severity.toUpperCase();
    if (sev === "ERROR" || sev === "FATAL") stats.errorCount++;
    else if (sev === "WARN" || sev === "WARNING") stats.warningCount++;
    else if (sev === "INFO") stats.infoCount++;
    if (log.timestamp > stats.lastLogTime) stats.lastLogTime = log.timestamp;
  });

  stats.serviceCount = stats.services.size;
  stats.errorPercentage = stats.totalLogs
    ? (stats.errorCount / stats.totalLogs) * 100
    : 0;

  return stats;
}

export function getRecentErrorLogs(logs: LogItem[], limit = 5): LogItem[] {
  return logs
    .filter((l) => ["ERROR", "FATAL"].includes(l.severity.toUpperCase()))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}
