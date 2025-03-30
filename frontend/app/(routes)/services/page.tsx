"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Tabs, Tab } from "@heroui/tabs";

import { useFilterStore, ServiceMetric } from "@/lib/store/telemetryStore";
import Header from "@/components/layout/Header";
import ServiceList from "@/components/services/ServiceList";
import ServiceMap from "@/components/services/ServiceMap";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ServicesPage() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const [services, setServices] = useState<ServiceMetric[]>([]);

  // 서비스 메트릭 데이터 가져오기
  const { data, error, isLoading } = useSWR(
    `/api/telemetry/services?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}`,
    fetcher,
    { refreshInterval: 30000 }, // 30초마다 자동 갱신
  );

  // 데이터 처리
  useEffect(() => {
    if (data && data.services) {
      setServices(data.services);
    }
  }, [data]);

  // 서비스 선택 핸들러
  const handleSelectService = (service: ServiceMetric) => {
    router.push(`/services/${encodeURIComponent(service.name)}`);
  };

  // 서비스 맵에서 서비스 선택 핸들러
  const handleMapSelectService = (serviceName: string) => {
    router.push(`/services/${encodeURIComponent(serviceName)}`);
  };

  return (
    <>
      <Header title="서비스 모니터링" />

      <div className="mt-4">
        <Tabs className="w-full mb-4">
          <Tab key="map" title="서비스 맵">
            <ServiceMap
              height={600}
              services={services}
              onSelectService={handleMapSelectService}
            />
          </Tab>
          <Tab key="list" title="서비스 목록">
            <ServiceList
              isLoading={isLoading}
              services={services}
              onSelectService={handleSelectService}
            />
          </Tab>
        </Tabs>
      </div>
    </>
  );
}
