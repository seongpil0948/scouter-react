"use server";
import Header from "@/components/layout/Header";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@heroui/skeleton";
import TraceDetail from '@/components/traces/TraceDetail';


interface TraceDetailPageProps {
  params: {
    id: string;
  };
}

// 스켈레톤 로딩 컴포넌트
function TraceDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-50 border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-7 w-40 rounded" />
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <Skeleton className="h-10 w-full rounded mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <Skeleton className="h-6 w-32 rounded mb-4" />
          <Skeleton className="h-64 w-full rounded" />
        </div>
      </div>
    </div>
  );
}

export default async function TraceDetailPage({ params }: TraceDetailPageProps) {
  const { id } = params;
  
  return (
    <>
      <Header title="트레이스 상세 정보" />
      <div className="mt-4">
        <Suspense fallback={<TraceDetailSkeleton />}>
          <TraceDetail traceId={id} />
        </Suspense>
      </div>
    </>
  );
}