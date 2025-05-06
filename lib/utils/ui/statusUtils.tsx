/**
 * 상태 및 심각도 관련 유틸리티 함수
 */
import React from "react";
import { ChipProps } from "@heroui/chip";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
  Check,
  HelpCircle,
} from "lucide-react";

// 심각도 색상 결정 함수
export function getSeverityColor(severity?: string): ChipProps["color"] {
  switch (severity?.toUpperCase()) {
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
}

// 상태 색상 결정 함수
export function getStatusColor(status?: string): ChipProps["color"] {
  switch (status?.toUpperCase()) {
    case "ERROR":
      return "danger";
    case "OK":
      return "success";
    default:
      return "default";
  }
}

// 심각도 아이콘 렌더링 함수
export function renderSeverityIcon(severity?: string): React.ReactNode {
  switch (severity?.toUpperCase()) {
    case "ERROR":
    case "FATAL":
      return <AlertTriangle className="mr-1" size={14} />;
    case "WARN":
    case "WARNING":
      return <AlertTriangle className="mr-1" size={14} />;
    case "INFO":
      return <Info className="mr-1" size={14} />;
    case "DEBUG":
      return <Activity className="mr-1" size={14} />;
    case "TRACE":
      return <CheckCircle className="mr-1" size={14} />;
    default:
      return <Info className="mr-1" size={14} />;
  }
}

// 상태 아이콘 렌더링 함수
export function renderStatusIcon(status?: string): React.ReactNode {
  switch (status?.toUpperCase()) {
    case "ERROR":
      return <AlertTriangle className="mr-1" size={14} />;
    case "OK":
      return <Check className="mr-1" size={14} />;
    default:
      return <HelpCircle className="mr-1" size={14} />;
  }
}

// 지연 시간에 따른 색상 반환
export function getLatencyColor(duration: number): string {
  if (duration < 50) return "success";
  if (duration < 200) return "primary";
  if (duration < 500) return "warning";
  return "danger";
}

export default {
  getSeverityColor,
  getStatusColor,
  renderSeverityIcon,
  renderStatusIcon,
  getLatencyColor,
};
