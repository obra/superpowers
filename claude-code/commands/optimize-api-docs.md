---
description: "Analyze and optimize docs/api/ — bootstraps from scratch, detects format violations, duplicates, orphaned docs, and missing documentation"
disable-model-invocation: true
---

# /optimize-api-docs

`docs/api/` 디렉토리의 API 문서를 분석하고 최적화합니다. 디렉토리가 없으면 초기 생성합니다.

## Step 1: 프로젝트 스캔

### 1-1. docs/api/ 상태 확인

`docs/api/` 디렉토리의 현재 상태를 확인합니다:

- **디렉토리 없음 또는 파일 0개** → Bootstrap 모드 (Step 2로 이동)
- **파일 존재** → 기존 문서 분석 모드 (Step 3으로 이동)

### 1-2. 소스 코드 API 엔드포인트 스캔

양쪽 모드 모두에서 사용됩니다. 소스 코드에서 API 엔드포인트를 탐지합니다:

| 생태계 | 탐지 패턴 |
|--------|----------|
| Node.js (Express) | `app.get/post/put/delete(`, `router.get/post/put/delete(` |
| Node.js (Fastify) | `fastify.get/post/put/delete(` |
| Python (FastAPI) | `@app.get/post/put/delete(`, `@router.get/post/put/delete(` |
| Python (Django) | `urlpatterns`, `path(` |
| Go (net/http) | `http.HandleFunc(`, `mux.HandleFunc(` |
| Go (Gin) | `r.GET/POST/PUT/DELETE(` |
| C# (ASP.NET) | `[HttpGet]`, `[HttpPost]`, `[Route(` |
| Rails | `resources :`, `get '`, `post '` in routes.rb |
| General | OpenAPI/Swagger spec 파일 (`openapi.yaml`, `swagger.json`) |

**OpenAPI/Swagger spec이 존재하면:**
- spec 파일을 파싱하여 도메인별로 `docs/api/[domain].md`를 자동 생성
- 이것이 가장 정확한 소스이므로 우선 사용
- **spec과 소스 코드 양쪽 존재 시:** 불일치 항목을 경고로 표시

**spec이 없으면:**
- 위 패턴으로 소스 코드를 grep하여 엔드포인트 목록 추출
- 경로의 첫 번째 세그먼트 기준으로 도메인 그룹화 (예: `/users/*` → users, `/auth/*` → auth)

**엔드포인트가 0개 탐지된 경우:**
- 지원되지 않는 프레임워크이거나 비표준 라우팅 구조일 수 있음
- 사용자에게 수동으로 API 엔드포인트를 입력하거나, 대상 소스 파일을 지정하도록 안내
- 수동 입력이 없으면 빈 `docs/api/` 디렉토리만 생성하고 종료

## Step 2: 초기 생성 (Bootstrap)

`docs/api/`가 존재하지 않거나 비어있는 경우 — 프로젝트 초기 또는 플러그인 설치 직후.

### 2-1. 도메인 분류 확인

Step 1-2에서 탐지된 엔드포인트를 도메인별로 그룹화하여 사용자에게 표시:

```
탐지된 API 엔드포인트:

| 도메인 | 엔드포인트 | 소스 파일 |
|--------|-----------|----------|
| auth   | POST /auth/login | src/routes/auth.ts:15 |
| auth   | POST /auth/register | src/routes/auth.ts:42 |
| users  | GET /users/:id | src/routes/users.ts:8 |
| ...    | ...       | ...      |

이 도메인 분류로 진행할까요? (수정 가능)
```

### 2-2. docs/api/ 디렉토리 및 파일 생성

사용자 승인 후:
1. `docs/api/` 디렉토리 생성
2. 도메인별 `docs/api/[domain].md` 파일 생성 (표준 포맷)
3. 탐지된 엔드포인트의 Method, Path를 채우고 나머지는 TODO 마커
4. 공통 타입이 보이면 `docs/api/shared-types.md`도 생성
5. 각 파일 메타: `> Last updated: [오늘 날짜]`, `> Updated by: /optimize-api-docs (bootstrap)`

→ Step 6 (결과 보고)로 이동

## Step 3: 기존 문서 분석

`docs/api/`에 파일이 이미 존재하는 경우.

1. 파일 목록과 각 파일의 줄 수를 표로 정리 (Step 6 Before 데이터로 기록)
2. 각 파일이 표준 포맷을 따르는지 체크

**표준 포맷 체크리스트** (`api-edr-validation` 기준):
- [ ] 헤더: `# [Domain] API`
- [ ] 메타: `> Last updated:` + `> Updated by:`
- [ ] `## Changelog` 섹션 존재
- [ ] `## Endpoints` 섹션: 각 엔드포인트에 Method, Path, Description, `**Request:**` (필드 테이블 `| Field | Type | Required | Description |`), `**Response (상태코드):**` (JSON 코드블록), Error Responses
- [ ] `## Events` 섹션 (해당시): Trigger, Payload
- [ ] `## Shared Types` 섹션 (해당시): TypeScript interface, Used by

## Step 4: 변경 제안 및 승인

Step 3의 분석 결과와 Step 1-2의 소스 코드 스캔 결과를 종합하여 변경 제안을 사용자에게 표시합니다:

```
분석 결과:

| 항목 | 발견 수 | 상세 |
|------|---------|------|
| 포맷 위반 | N개 | [파일별 누락 섹션 목록] |
| 중복 엔드포인트 | N개 | [중복 목록] |
| 고아 문서 | N개 | [후보 목록] |
| 미문서화 API | N개 | [엔드포인트 목록] |
| 분산된 Shared Types | N개 | [타입 목록] |

위 항목들을 정리할까요? (항목별 선택 가능)
```

사용자 승인 후 Step 5로 진행.

## Step 5: 최적화 실행

승인된 항목에 대해 다음 순서로 실행합니다:

### 5-1. 미문서화 API 스캐폴딩
- 소스 코드에 존재하지만 `docs/api/`에 문서화되지 않은 엔드포인트
- 표준 포맷 빈 템플릿으로 스캐폴딩 (TODO 마커 포함)

### 5-2. 중복 감지 및 Shared Types 통합
- 같은 엔드포인트(METHOD + path)가 여러 도메인 파일에 존재 → 적합한 도메인에만 남김
- 여러 도메인 파일에 인라인으로 정의된 공통 타입 및 중복 Shared Type → `shared-types.md`로 통합

### 5-3. 고아 문서 처리
- 소스 코드에서 **엔드포인트 정의가 더 이상 존재하지 않는** 문서 (Step 1-2의 탐지 패턴 기반으로 판정)
- 사용자에게 후보 목록 보여주고 삭제/보존 결정 요청

### 5-4. 포맷 위반 수정
- 표준 포맷에서 벗어난 파일과 누락 섹션 → 누락된 섹션 헤더 및 메타 추가
- **마지막에 실행하여 새로 생성/수정된 파일도 포맷 검증을 통과하도록 합니다**

## Step 6: 결과 보고

| 항목 | Before | After |
|------|--------|-------|
| 총 파일 수 | N개 | N개 |
| 포맷 위반 | N개 | 0개 |
| 중복 엔드포인트 | N개 | 0개 |
| 고아 문서 | N개 | N개 (사용자 결정) |
| 미문서화 API | N개 | N개 (스캐폴딩됨) |

### 변경 요약
- [구체적 변경 bullet list]

## 주의사항

- `docs/api/` 파일의 의미(API 계약)를 변경하지 않습니다 — 구조와 포맷만 정리
- 삭제 전 반드시 사용자 승인
- `superpowers:api-edr-validation`의 표준 포맷을 기준으로 검증
