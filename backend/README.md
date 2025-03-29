# 텔레메트리 시스템

OpenTelemetry로부터 수집된 트레이스와 로그 데이터를 처리하고 시각화하는 시스템입니다.

## 시스템 구성

이 시스템은 다음과 같은 컴포넌트로 구성됩니다:

1. **텔레메트리 백엔드**: Kafka에서 메시지를 수신하여 PostgreSQL에 저장
2. **프론트엔드 애플리케이션**: Next.js로 구현된 대시보드 및 시각화 도구
3. **PostgreSQL**: 트레이스 및 로그 데이터 저장
4. **Kafka**: 메시지 큐잉 및 데이터 스트리밍
5. **Kafdrop**: Kafka 관리 및 모니터링 도구

## 시작하기

### 사전 요구 사항

- Docker 및 Docker Compose
- Git

### 설치 및 실행

1. 저장소 클론

```bash
git clone https://github.com/your-org/telemetry-system.git
cd telemetry-system
```

2. Docker Compose로 시스템 실행

```bash
docker-compose up -d
```

3. 서비스 접속

- 프론트엔드: http://localhost:3000
- Kafdrop (Kafka 관리 도구): http://localhost:9000

## 시스템 구조

### 디렉토리 구조

```
├── backend/               # 텔레메트리 백엔드 애플리케이션
│   ├── src/               # 소스 코드
│   │   ├── db/            # 데이터베이스 연결 및 쿼리
│   │   ├── kafka/         # Kafka 소비자 및 메시지 처리
│   │   ├── services/      # 비즈니스 로직
│   │   └── utils/         # 유틸리티 함수
│   ├── Dockerfile         # 백엔드 Docker 이미지 정의
│   └── package.json       # 백엔드 의존성 정의
│
├── frontend/              # Next.js 프론트엔드 애플리케이션
│   ├── app/               # Next.js App Router
│   ├── components/        # 리액트 컴포넌트
│   ├── lib/               # 유틸리티 및 상태 관리
│   └── Dockerfile         # 프론트엔드 Docker 이미지 정의
│
├── init-scripts/          # PostgreSQL 초기화 스크립트
│
└── docker-compose.yml     # Docker Compose 정의 파일
```

## 데이터 흐름

1. OpenTelemetry 에이전트 → Kafka: 트레이스 및 로그 데이터 전송
2. 텔레메트리 백엔드 → Kafka: 메시지 수신 및 처리
3. 텔레메트리 백엔드 → PostgreSQL: 처리된 데이터 저장
4. 프론트엔드 → PostgreSQL: 데이터 쿼리 및 시각화

## 개발 가이드

### 백엔드 개발

백엔드 디렉토리에서 다음 명령어로 개발 서버 실행:

```bash
cd backend
pnpm install
pnpm run dev
```

### 프론트엔드 개발

프론트엔드 디렉토리에서 다음 명령어로 개발 서버 실행:

```bash
cd frontend
pnpm install
pnpm run dev
```

## API 문서

프론트엔드는 다음과 같은 API 엔드포인트를 사용합니다:

- `GET /api/telemetry/traces`: 트레이스 목록 조회
- `GET /api/telemetry/traces/:traceId`: 특정 트레이스 상세 정보 조회
- `GET /api/telemetry/logs`: 로그 목록 조회
- `GET /api/telemetry/metrics`: 서비스 메트릭 정보 조회

## 모니터링 및 관리

- 시스템 로그: `docker-compose logs -f` 명령으로 확인
- Kafka 모니터링: Kafdrop UI (http://localhost:9000)에서 확인
- 데이터베이스 관리: PostgreSQL 클라이언트 도구 사용 (예: pgAdmin, DBeaver 등)

## 라이선스

MIT
