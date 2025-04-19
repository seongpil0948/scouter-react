'use client';

import { useRouter } from 'next/navigation';
import TraceDetail from '@/components/traces/TraceDetail';
import { Button } from '@heroui/button';
import { ArrowLeft } from 'lucide-react';

export default function TraceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const traceId = params.id;
  
  // 트레이스 목록으로 돌아가기
  const handleBack = () => {
    router.push('/traces');
  };

  return (
    <div className="py-8 md:py-10 px-4 max-w-7xl mx-auto">
      <div className="flex items-center mb-4">
        <Button variant="light" onPress={handleBack} className="mr-2">
          <ArrowLeft size={18} className="mr-1" />
          목록으로 돌아가기
        </Button>
      </div>
      
      <TraceDetail traceId={traceId} onBack={handleBack} />
    </div>
  );
}