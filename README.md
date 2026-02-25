# Blog-Auto-Bot

BlogArmy 자동화 MVP(초기 버전)입니다.

목표는 WordPress 기반으로 콘텐츠 자동생성/발행 후 다중 계정을 점진 확장하고 수익화를 실험하는 것입니다.

## 핵심
- WordPress REST API 기반 즉시 발행
- 스케줄러: cron + Prisma 영속화
- 안전장치: 실패 횟수 기반 중지, 구조화 로그
- 오늘 현황 API(`/api/today`)와 대시보드(`/dashboard`) 제공
- API 보안: `X-API-KEY` 또는 `Authorization: Bearer ...` 검증 + 요청 제한
- DDoS/봇완화: 초당/분당 폭주 탐지 + 임시 IP 차단

## 실행
1. `npm install`
2. `cp .env.example .env`
3. `npx prisma migrate dev --name init`
4. `npm run dev`

## API

### WordPress
- `POST /api/wordpress/publish`
  - `{ siteUrl?, username?, appPassword?, title, content, status?, slug?, excerpt?, categories?, tags?, featuredMedia?, date? }`

### Scheduler
- `GET /api/scheduler/jobs`
- `POST /api/scheduler/jobs`
  - `{ jobId?, taskType, cronExpression, timezone?, maxFailureCount?, payload }`
  - taskType: `wordpress_publish`
- `POST /api/scheduler/jobs/:jobId/pause`
- `POST /api/scheduler/jobs/:jobId/resume`
- `DELETE /api/scheduler/jobs/:jobId`

### Monitoring
- `GET /api/monitoring`
  - 스케줄 상태/실패 카운트/마지막 실행 결과

### Today
- `GET /api/today`
  - 선택일자 기준으로 오늘/특정일 포스팅+잡 현황 리포트 반환
  - 조회 파라미터: `date=YYYY-MM-DD`

### Dashboard
- `GET /dashboard`
  - 오늘 현황 카드, 포스팅 히스토리, 스케줄 목록을 한 화면에 보여주는 운영 화면
  - API 토큰 입력 후 `today` 조회/`wordpress` 임시 발행 테스트 가능

## .env
- `WORDPRESS_DEFAULT_SITE_URL`
- `WORDPRESS_DEFAULT_USERNAME`
- `WORDPRESS_DEFAULT_APP_PASSWORD`
- `APP_TIMEZONE`
- `TRUST_PROXY`
- `API_KEYS` (쉼표 구분), 예: `key1,key2`
- `API_RATE_LIMIT_PER_MINUTE`
- `API_DDOS_WINDOW_MS` (API 기본 단기 윈도우 ms)
- `API_DDOS_MAX_REQUESTS` (단기 윈도우 최대 요청 수)
- `API_DDOS_PUBLISH_WINDOW_MS` (WordPress 발행 경로 전용 윈도우 ms)
- `API_DDOS_PUBLISH_MAX_REQUESTS` (발행 경로 전용 허용 요청 수)
- `API_DDOS_BLOCK_MS` (초과 탐지 시 기본 차단 시간 ms)
- `REQUEST_TIMEOUT_MS`, `RESPONSE_TIMEOUT_MS`
# blogAuto
