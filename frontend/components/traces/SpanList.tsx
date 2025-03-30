"use client";
import React, { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { EyeIcon, FilterIcon, SearchIcon } from "lucide-react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

interface Span {
  id: string;
  name: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  duration: number;
  parentSpanId?: string;
  attributes?: Record<string, any>;
  status?: string;
  traceId: string;
  spanId: string;
}

interface SpanListProps {
  spans: Span[];
  formatDuration: (duration: number) => string;
  setSelectedSpanId: (spanId: string) => void;
}

export const SpanList: React.FC<SpanListProps> = React.memo(({
  spans,
  formatDuration,
  setSelectedSpanId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("duration");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 서비스 목록 추출
  const services = useMemo(() => {
    const serviceSet = new Set<string>();
    spans.forEach(span => serviceSet.add(span.serviceName));
    return Array.from(serviceSet).sort();
  }, [spans]);

  // 필터링된 스팬 목록
  const filteredSpans = useMemo(() => {
    let result = spans;
    
    // 검색어 필터링
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(span => 
        span.name.toLowerCase().includes(lowerSearchTerm) || 
        span.serviceName.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // 상태 필터링
    if (statusFilter !== "all") {
      result = result.filter(span => span.status === statusFilter);
    }
    
    // 서비스 필터링
    if (serviceFilter !== "all") {
      result = result.filter(span => span.serviceName === serviceFilter);
    }
    
    // 정렬
    result = [...result].sort((a, b) => {
      let compareResult = 0;
      
      switch (sortBy) {
        case "name":
          compareResult = a.name.localeCompare(b.name);
          break;
        case "service":
          compareResult = a.serviceName.localeCompare(b.serviceName);
          break;
        case "status":
          compareResult = (a.status || "").localeCompare(b.status || "");
          break;
        case "duration":
        default:
          compareResult = a.duration - b.duration;
          break;
      }
      
      return sortOrder === "asc" ? compareResult : -compareResult;
    });
    
    return result;
  }, [spans, searchTerm, statusFilter, serviceFilter, sortBy, sortOrder]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIndicator = (field: string) => {
    if (sortBy === field) {
      return sortOrder === "asc" ? " ↑" : " ↓";
    }
    return "";
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">스팬 목록</h3>
      
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="스팬 이름 또는 서비스 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="w-auto">
          <Select 
            aria-label="상태 필터" 
            value={statusFilter}
            onSelectionChange={(key) => setStatusFilter(key as string)}
          >
            <SelectItem key="all">모든 상태</SelectItem>
            <SelectItem key="OK">성공</SelectItem>
            <SelectItem key="ERROR">오류</SelectItem>
            <SelectItem key="UNSET">미설정</SelectItem>
          </Select>
        </div>
        
        <div className="w-auto">
          <Select 
            aria-label="서비스 필터" 
            value={serviceFilter}
            onSelectionChange={(key) => setServiceFilter(key as string)}
          >
            <SelectItem key="all">모든 서비스</SelectItem>
            {services.map(service => (
              <SelectItem key={service}>{service}</SelectItem>
            )) as any}
          </Select>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-96">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th 
                className="border px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort("name")}
              >
                이름{getSortIndicator("name")}
              </th>
              <th 
                className="border px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort("service")}
              >
                서비스{getSortIndicator("service")}
              </th>
              <th 
                className="border px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort("status")}
              >
                상태{getSortIndicator("status")}
              </th>
              <th 
                className="border px-4 py-2 text-right cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort("duration")}
              >
                지연 시간{getSortIndicator("duration")}
              </th>
              <th className="border px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredSpans.length === 0 ? (
              <tr>
                <td colSpan={5} className="border px-4 py-8 text-center text-gray-500">
                  검색 조건에 맞는 스팬이 없습니다
                </td>
              </tr>
            ) : (
              filteredSpans.map((span) => (
                <tr key={span.spanId} className="hover:bg-gray-50">
                  <td className="border px-4 py-2 font-mono text-sm">
                    {span.name}
                  </td>
                  <td className="border px-4 py-2">{span.serviceName}</td>
                  <td className="border px-4 py-2">
                    <Badge
                      className={
                        span.status === "ERROR"
                          ? "bg-red-500"
                          : span.status === "OK"
                            ? "bg-green-500"
                            : "bg-gray-500"
                      }
                    >
                      {span.status || "UNSET"}
                    </Badge>
                  </td>
                  <td className="border px-4 py-2 text-right font-mono">
                    {formatDuration(span.duration)}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setSelectedSpanId(span.spanId)}
                      title="스팬 상세 보기"
                    >
                      <EyeIcon size={16} />
                      <span className="sr-only">상세 보기</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

SpanList.displayName = "SpanList";