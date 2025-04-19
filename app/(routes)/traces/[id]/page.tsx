"use server";
import { Suspense } from "react";
import { Skeleton } from "@heroui/skeleton";
import TraceDetail from '@/components/traces/TraceDetail';


interface TraceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// 스켈레톤 로딩 컴포넌트
function TraceDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-50 border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-sm" />
            <Skeleton className="h-7 w-40 rounded-sm" />
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <Skeleton className="h-10 w-full rounded-sm mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-8 w-full rounded-sm" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <Skeleton className="h-6 w-32 rounded-sm mb-4" />
          <Skeleton className="h-64 w-full rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export default async function TraceDetailPage(p: TraceDetailPageProps) {
  const params = await p.params;
  const { id } = params;

  return (
    <>
      <div className="mt-4">
        <Suspense fallback={<TraceDetailSkeleton />}>
          <TraceDetail traceId={id} />
        </Suspense>
      </div>
    </>
  );
}
