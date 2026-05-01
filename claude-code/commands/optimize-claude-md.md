---
description: "Analyze and optimize CLAUDE.md — detects bloat, splits detailed content into docs/, removes duplicates, and restructures for clarity"
disable-model-invocation: true
---

# /optimize-claude-md

CLAUDE.md 파일을 분석하고 최적화합니다. 200줄 이하로 핵심만 남기고, 상세 내용은 `docs/`로 분리합니다.

## Step 1: 현재 CLAUDE.md 분석

1. **CLAUDE.md 읽기** — 프로젝트 루트의 CLAUDE.md를 읽습니다
2. **줄 수 측정** — 총 줄 수를 기록합니다 (Before 수치)
3. **구조 파악** — 현재 섹션 목록과 각 섹션의 줄 수를 표로 정리합니다

## Step 2: 문제 분석

다음 문제를 식별합니다:

### 2-1. 200줄 초과 여부
- CLAUDE.md가 200줄을 초과하면 경고
- Claude Code는 CLAUDE.md 내용을 시스템 프롬프트에 포함하므로 길면 비효율적

### 2-2. 인라인 상세 내용
다음 패턴을 찾습니다:
- 코드 예시가 10줄 이상인 블록
- 단계별 가이드 (Step 1, Step 2... 패턴이 5단계 이상)
- 긴 테이블 (10행 이상)
- 상세 설명이 달린 목록 (항목당 3줄 이상)

### 2-3. 포인터로 분리 가능한 항목
다음은 docs/로 분리하고 포인터만 남길 수 있는 후보입니다:
- 아키텍처 상세 설명
- 코딩 컨벤션 가이드 상세
- 테스트 전략 상세
- 배포/인프라 가이드
- API 문서
- 트러블슈팅 가이드

### 2-4. 중복 내용
- 같은 규칙이 다른 표현으로 반복되는 경우
- 여러 섹션에 걸쳐 동일 정보가 분산된 경우

## Step 3: 자동 정리 실행

분석 결과를 사용자에게 보여주고 승인을 받은 후 정리합니다:

### 3-1. 상세 내용 → docs/ 분리

각 상세 섹션을 별도 파일로 분리합니다:
```
docs/
├── architecture.md        # 아키텍처 상세
├── coding-conventions.md  # 코딩 컨벤션 상세
├── testing-guide.md       # 테스트 전략 상세
├── deployment.md          # 배포/인프라 가이드
├── troubleshooting.md     # 트러블슈팅
└── ...                    # 필요에 따라 추가
```

**API 문서 분리 규칙:**
API 관련 내용(엔드포인트, 요청/응답 스키마, 이벤트 등)은 `docs/api/[domain].md` 형식으로 분리합니다.
이는 `superpowers:api-edr-validation` 스킬의 표준 위치(`docs/api/`)와 일치시키기 위함입니다.

예시:
- 인증 관련 API → `docs/api/auth.md`
- 사용자 관련 API → `docs/api/users.md`
- 결제 관련 API → `docs/api/payments.md`

일반 `docs/api.md` (단일 파일)가 아닌 `docs/api/` (디렉토리) 구조를 사용하세요.

### 3-2. CLAUDE.md에 포인터만 남기기

분리된 내용은 한 줄 포인터로 대체:
```markdown
## Architecture
See `docs/architecture.md` for detailed architecture documentation.
```

### 3-3. 중복 제거

중복된 내용은 가장 적절한 위치에 한 번만 남깁니다.

### 3-4. 권장 구조로 재정렬

CLAUDE.md를 다음 권장 구조로 재정렬합니다:

```markdown
# Project Name

## Overview
<!-- 프로젝트 설명 1-2문장 -->

## Workflow Protocol
<!-- 코드 변경 전 계획 제시 및 승인 규칙 -->
Always present a modification plan and get explicit user approval BEFORE implementing any code changes.

## Tech Stack
<!-- 기술 스택 bullet list -->

## Project Structure
<!-- 핵심 디렉토리만, 상세는 docs/architecture.md 포인터 -->

## Development Commands
<!-- 자주 쓰는 명령어만 (build, test, lint, dev) -->

## Key Conventions
<!-- 핵심 규칙만 bullet로, 상세는 docs/coding-conventions.md 포인터 -->

## Architecture Decisions
<!-- ADR 요약만, 상세는 docs/architecture.md 포인터 -->

## Testing
<!-- 테스트 실행법만, 전략 상세는 docs/testing-guide.md 포인터 -->

## Common Patterns
<!-- 이 프로젝트에서 자주 쓰는 패턴 요약 -->

## Troubleshooting
<!-- 자주 발생하는 문제 1-2개, 상세는 docs/troubleshooting.md 포인터 -->
```

## Step 4: 결과 보고

정리 완료 후 다음을 보고합니다:

```markdown
## CLAUDE.md 최적화 결과

| 항목 | Before | After |
|------|--------|-------|
| 총 줄 수 | N줄 | N줄 |
| 섹션 수 | N개 | N개 |
| 인라인 상세 | N개 | 0개 |
| 중복 항목 | N개 | 0개 |

### 분리된 파일
- `docs/architecture.md` — 아키텍처 상세 (N줄)
- `docs/coding-conventions.md` — 코딩 컨벤션 (N줄)
- ...

### 변경 요약
- [구체적 변경 bullet list]
```

## 주의사항

- 분리 전 반드시 사용자 승인을 받습니다
- 기존 docs/ 파일이 있으면 덮어쓰지 않고 merge 여부를 묻습니다
- CLAUDE.md의 의미를 변경하지 않습니다 — 구조만 정리합니다
- 프로젝트별 특수 섹션은 보존합니다 (삭제하지 않음)
- `.claude/` 디렉토리의 CLAUDE.md도 같은 방식으로 처리 가능
