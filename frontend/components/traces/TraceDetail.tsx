"use client";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import React, { useCallback, useState, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { CopyIcon, ArrowLeft, EyeIcon } from "lucide-react";
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from "react-error-boundary";
import { SpanTree } from "./SpanTree";
import { SpanDetail } from "./SpanDetail";
import { TraceSummary } from "./TraceSummary";
import { SpanList } from "./SpanList";
import { addToast, useToast } from "@heroui/toast";
import { useTraceData } from './hook/useTraceData';

interface TraceDetailProps {
  traceId: string;
}

const TraceDetail: React.FC<TraceDetailProps> = ({ traceId }) => {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | number>("timeline");
  const router = useRouter();;

  const {
    traceData,
    error,
    isLoading,
    formatTime,
    formatDuration,
    spanHierarchy
  } = useTraceData(traceId);

  // 선택된 스팬 정보
  const selectedSpan = useMemo(() => {
    if (!selectedSpanId || !traceData) return null;
    return traceData.spans.find((span) => span.spanId === selectedSpanId);
  }, [selectedSpanId, traceData]);

  // 뒤로 가기
  const handleBack = useCallback(() => {
    router.push("/traces");
  }, [router]);

  // 클립보드 복사
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        addToast({
          title: "복사 완료",
          description: "클립보드에 복사되었습니다",
          color: "success",
        });
      })
      .catch(() => {
        addToast({
          title: "복사 실패",
          description: "클립보드 접근에 실패했습니다",
          color: "danger",
        });
      });
  }, []);

  // 오류 발생 시
  if (error) {
    return (
      <Card className="bg-white rounded-lg shadow-lg overflow-hidden">
        <CardBody className="p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <h3 className="text-xl font-medium text-red-600 mb-2">데이터를 불러오는 중 오류가 발생했습니다</h3>
            <p className="text-gray-500 mb-4">{error.message}</p>
            <Button variant='ghost' onPress={handleBack}>
              트레이스 목록으로 돌아가기
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-lg overflow-hidden">
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-lg text-gray-600">트레이스 데이터를 불러오는 중...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // 데이터가 없는 경우
  if (!traceData) {
    return (
      <Card className="bg-white rounded-lg shadow-lg overflow-hidden">
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-64 bg-white rounded-lg">
            <p className="text-gray-500">트레이스를 찾을 수 없습니다</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const { rootSpans, childrenMap } = spanHierarchy;

  return (
    <Card className="bg-white rounded-lg shadow-lg overflow-hidden">
      <h2 className="bg-gray-50 border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button title="뒤로 가기" variant="ghost" onPress={handleBack}>
              <ArrowLeft size={18} />
              <span className="sr-only">뒤로 가기</span>
            </Button>
            <h2 className="text-xl">트레이스 상세</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => copyToClipboard(traceData.traceId)}
            >
              <CopyIcon className="mr-1" size={16} />
              트레이스 ID 복사
            </Button>
          </div>
        </div>
      </h2>

      <Tabs
        className="w-full"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
      >
        <Tab key="timeline" title="타임라인" />
        <Tab key="details" title="상세 정보" />
        {selectedSpan && <Tab key="span" title="선택된 스팬" />}
      </Tabs>

      <CardBody className="p-6">
        <ErrorBoundary 
          fallback={
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              컴포넌트 렌더링 중 오류가 발생했습니다.
            </div>
          }
        >
          {activeTab === "timeline" && (
            <div className="mt-4">
              <TraceSummary traceData={traceData} formatTime={formatTime} formatDuration={formatDuration} />
              
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* 타임라인 헤더 */}
                  <div className="flex items-center pb-2 border-b font-semibold text-sm">
                    <div className="w-3/12">이름</div>
                    <div className="w-2/12">서비스</div>
                    <div className="w-5/12">타임라인</div>
                    <div className="w-2/12 text-right">지연 시간</div>
                  </div>

                  {/* 스팬 타임라인 */}
                  <div className="mt-2">
                    <SpanTree 
                      rootSpans={rootSpans} 
                      childrenMap={childrenMap}
                      selectedSpanId={selectedSpanId}
                      setSelectedSpanId={setSelectedSpanId}
                      traceData={traceData}
                      formatDuration={formatDuration}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">트레이스 정보</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">트레이스 ID</td>
                      <td className="py-2 px-4 font-mono flex items-center">
                        {traceData.traceId}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="ml-2"
                          onPress={() => copyToClipboard(traceData.traceId)}
                        >
                          <CopyIcon size={14} />
                          <span className="sr-only">복사</span>
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">시작 시간</td>
                      <td className="py-2 px-4">{formatTime(traceData.startTime)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">종료 시간</td>
                      <td className="py-2 px-4">{formatTime(traceData.endTime)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">총 지연 시간</td>
                      <td className="py-2 px-4">{formatDuration(traceData.endTime - traceData.startTime)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">스팬 수</td>
                      <td className="py-2 px-4">{traceData.spans.length}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 bg-gray-50 font-medium">서비스</td>
                      <td className="py-2 px-4">
                        {traceData.services.map((service) => (
                          <Badge
                            key={service}
                            className="mr-1 bg-blue-100 text-blue-800"
                          >
                            {service}
                          </Badge>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SpanList 
                spans={traceData.spans} 
                formatDuration={formatDuration} 
                setSelectedSpanId={setSelectedSpanId} 
              />
            </div>
          )}

          {activeTab === "span" && selectedSpan && (
            <SpanDetail 
              span={selectedSpan} 
              formatTime={formatTime} 
              formatDuration={formatDuration}
            />
          )}
        </ErrorBoundary>
      </CardBody>
    </Card>
  );
};

export default React.memo(TraceDetail);