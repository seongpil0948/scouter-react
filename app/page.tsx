// frontend/app/page.tsx
"use client";
import useSWR from "swr";
import { useRouter } from "next/navigation";

import TraceVisualization from "@/components/traces/TraceVisualization";
import { useFilterStore } from "@/lib/store/telemetryStore";
import DateRangePicker from "@/components/shared/DateRangePicker";
import { ThemeSwitch } from "@/components/shared/theme-switch";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  // 메트릭 데이터 가져오기
  const { data } = useSWR<DtoTrace>(
    `/api/telemetry/traces?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}`,
    fetcher,
    { refreshInterval: 30000 }, // 30초마다 자동 갱신
  );

  const traceVisualizationConfig = {
    height: 400,
    title: "실시간 요청 지연 시간",
    latencyThreshold: 300,
    maxDataPoints: 100,
    autoUpdate: false,
    colors: {
      low: "#52c41a", // 낮은 지연시간
      medium: "#1890ff", // 보통 지연시간
      high: "#faad14", // 높은 지연시간
      critical: "#ff4d4f", // 임계치 초과 지연시간
      effectScatter: "#ff4d4f", // 고지연 요청 색상
    },
  };
  const handleTraceClick = (trace: TraceItem) => {
    router.push(`/traces/${trace.traceId}`);
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">hi</div>
      <ThemeSwitch className="absolute top-4 right-4" />
      <DateRangePicker />
      <TraceVisualization
        config={traceVisualizationConfig}
        traceData={data?.traces ?? []}
        onDataPointClick={handleTraceClick}
      />
    </section>
  );
}
