// frontend/app/(routes)/traces/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import Header from "@/components/layout/Header";
import TraceDetail from "@/components/traces/TraceDetail";

interface TraceDetailPageProps {
  params: {
    id: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TraceDetailPage({ params }: TraceDetailPageProps) {
  const router = useRouter();
  const { id } = params;
  const [traceData, setTraceData] = useState<any | null>(null);

  // 트레이스 상세 데이터 가져오기
  const { data, error, isLoading } = useSWR(
    `/api/telemetry/traces/${id}`,
    fetcher,
  );

  // 트레이스 상세 데이터 처리
  useEffect(() => {
    if (data) {
      setTraceData(data);
    }
  }, [data]);

  // 뒤로 가기 핸들러
  const handleBack = () => {
    router.push("/traces");
  };

  if (isLoading) {
    return (
      <>
        <Header title="트레이스 상세 정보" />
        <div className="mt-4 flex items-center justify-center h-64 bg-white rounded-lg shadow-lg">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <p className="mt-4 text-gray-500">
              트레이스 데이터를 불러오는 중...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header title="트레이스 상세 정보" />
        <div className="mt-4">
          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
            <p className="text-red-500 mb-4">
              트레이스 데이터를 불러오는 중 오류가 발생했습니다.
            </p>
            <Button onClick={handleBack}>목록으로 돌아가기</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="트레이스 상세 정보" />
      <div className="mt-4">
        <TraceDetail traceData={traceData} onBack={handleBack} />
      </div>
    </>
  );
}