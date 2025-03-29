#!/bin/bash

# 디렉토리 구조 생성
mkdir -p app/api/telemetry/logs
mkdir -p app/api/telemetry/services
mkdir -p app/api/telemetry/traces/\[traceId\]
mkdir -p app/api/telemetry/metrics
mkdir -p app/\(routes\)/logs/\[id\]
mkdir -p app/\(routes\)/traces/\[id\]
mkdir -p app/\(routes\)/services/\[name\]
mkdir -p app/components/layout
mkdir -p app/components/dashboard
mkdir -p app/components/logs
mkdir -p app/components/traces
mkdir -p app/components/services
mkdir -p app/components/shared
mkdir -p app/lib/aws
mkdir -p app/lib/store
mkdir -p app/lib/utils

# API 라우트 파일 생성
touch app/api/telemetry/logs/route.ts
touch app/api/telemetry/services/route.ts
touch app/api/telemetry/traces/route.ts
touch app/api/telemetry/traces/\[traceId\]/route.ts
touch app/api/telemetry/metrics/route.ts

# 페이지 파일 생성
touch app/page.tsx
touch app/layout.tsx
touch app/globals.css
touch app/\(routes\)/logs/page.tsx
touch app/\(routes\)/logs/\[id\]/page.tsx
touch app/\(routes\)/traces/page.tsx
touch app/\(routes\)/traces/\[id\]/page.tsx
touch app/\(routes\)/services/page.tsx
touch app/\(routes\)/services/\[name\]/page.tsx

# 컴포넌트 파일 생성
touch app/components/layout/Sidebar.tsx
touch app/components/layout/Header.tsx
touch app/components/layout/Navigation.tsx

touch app/components/dashboard/ServiceHealthWidget.tsx
touch app/components/dashboard/TopLatencyWidget.tsx
touch app/components/dashboard/ErrorRateWidget.tsx

touch app/components/logs/LogList.tsx
touch app/components/logs/LogDetail.tsx
touch app/components/logs/LogFilters.tsx

touch app/components/traces/TraceList.tsx
touch app/components/traces/TraceDetail.tsx
touch app/components/traces/TraceSummary.tsx
touch app/components/traces/TraceVisualization.tsx

touch app/components/services/ServiceMap.tsx
touch app/components/services/ServiceList.tsx
touch app/components/services/ServiceMetrics.tsx

touch app/components/shared/DateRangePicker.tsx
touch app/components/shared/SearchBar.tsx
touch app/components/shared/FilterGroup.tsx

# 라이브러리 파일 생성
touch app/lib/aws/opensearch.ts
touch app/lib/store/telemetryStore.ts
touch app/lib/store/uiStore.ts
touch app/lib/utils/dateFormatter.ts
touch app/lib/utils/tracingUtils.ts

echo "모든 파일 생성 완료"