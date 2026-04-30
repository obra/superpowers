# Sonbbal Superpowers

코딩 에이전트를 위한 팀 기반 병렬 개발 워크플로 스킬 라이브러리입니다.

> **원본 프로젝트:** 이 프로젝트는 [obra/superpowers](https://github.com/obra/superpowers)를 기반으로 제작되었습니다.
> 원본 프로젝트의 전체 스킬 라이브러리와 철학을 포함하며, 팀 기반 병렬 실행, API/EDR 검증, 감사 에이전트, 모델 할당, 컨텍스트 관리 기능이 추가되었습니다.
> 원본 프로젝트에 대한 자세한 내용은 [obra/superpowers README](https://github.com/obra/superpowers/blob/main/README.md)를 참고하세요.

---

## 설치 방법

### Claude Code (플러그인 마켓플레이스)

**1단계:** 마켓플레이스 등록

```bash
/plugin marketplace add Sonbbal/superpowers
```

**2단계:** 플러그인 설치

```bash
/plugin install sonbbal-superpowers@sonbbal-marketplace
```

**3단계:** 설치 확인

새 세션을 시작하고 스킬이 트리거되는 작업을 요청하세요 (예: "이 기능을 설계해줘", "에이전트 팀을 구성해 병렬로 진행해줘"). Claude가 자동으로 관련 스킬을 호출합니다.

### 업데이트

스킬은 플러그인 업데이트 시 자동으로 반영됩니다:

```bash
/plugin update sonbbal-superpowers
```

### Codex / OpenCode

- **Codex:** Sonbbal Codex 전용 패키지는 [plugins/sonbbal-superpowers-codex/README.md](plugins/sonbbal-superpowers-codex/README.md)를 참고하세요.
- **OpenCode:** [docs/README.opencode.md](docs/README.opencode.md)

---

## 추가된 기능

기존 [obra/superpowers](https://github.com/obra/superpowers) 스킬 라이브러리에 다음 기능이 추가되었습니다:

### 팀 기반 병렬 개발 (team-driven-development)

기존의 단일 subagent 방식 대신, **에이전트 팀을 구성**하여 병렬로 작업을 실행합니다.

| 역할 | 모델 | 책임 | 코드 작성 |
|------|------|------|:---------:|
| **Team Lead** | Opus | 오케스트레이션만 담당 — 태스크 할당, 메시지 라우팅, 블로커 해결 | **불가** |
| **API/EDR Manager** | Opus (필수) | API 계약 검증, EDR 문서 관리, 변수 일관성 확인 | 불가 |
| **Audit Agent** | Opus (필수) | 태스크 완료 검증, 스펙 대비 검사, 비준수 작업 차단 | 불가 |
| **Worker(s)** | Opus/Sonnet | TDD 기반 태스크 구현 | **유일하게 가능** |

### API/EDR 검증 (api-edr-validation)

코드를 작성하는 에이전트가 API 엔드포인트, 변수명, 요청/응답 스키마를 **임의로 생성하는 것을 방지**합니다. 모든 API 계약은 API/EDR Manager를 통해 확인 후 사용해야 합니다.

### 감사 검증 (audit-verification)

모든 완료된 태스크는 Audit Agent의 **독립적 검증을 통과**해야 완료로 표시됩니다. 자체 보고만으로는 불충분합니다.

### 모델 할당 (model-assignment)

태스크 난이도에 따라 적절한 모델을 자동 할당합니다:
- **Opus**: 복잡한 로직, 보안 관련, 아키텍처 설계, 다중 시스템 통합
- **Sonnet**: 단순 CRUD, 설정 변경, 보일러플레이트, 패턴 따르기
- **API/EDR Manager, Audit Agent**: 항상 Opus (변경 불가)

### 컨텍스트 윈도우 관리 (context-window-management)

에이전트의 대화가 **160k 토큰을 초과**하면 강제 압축을 실행합니다:
1. 현재 작업 단위 완료
2. 중간 정리 (커밋, 상태 저장)
3. 컨텍스트 압축
4. 압축 완료 후 재개

---

## 워크플로

1. **brainstorming** — 코드 작성 전 활성화. 아이디어를 정제하고 설계 문서를 생성합니다.

2. **using-git-worktrees** — 설계 승인 후 활성화. 격리된 워크트리에서 새 브랜치를 생성합니다.

3. **writing-plans** — 승인된 설계를 기반으로 구체적인 구현 계획을 작성합니다. 각 태스크는 2~5분 단위의 세밀한 단계로 구성됩니다.

4. **team-driven-development** 또는 **executing-plans** — 에이전트 팀을 구성하여 병렬로 실행하거나, 배치 단위로 순차 실행합니다.

5. **test-driven-development** — 구현 중 활성화. RED-GREEN-REFACTOR 사이클을 강제합니다.

6. **requesting-code-review** — 태스크 간 활성화. 계획 대비 코드를 검토합니다.

7. **finishing-a-development-branch** — 모든 태스크 완료 후 활성화. 테스트 검증, 병합/PR 옵션을 제시합니다.

---

## 스킬 목록

### 원본 스킬 (obra/superpowers 기반)

| 카테고리 | 스킬 | 설명 |
|----------|------|------|
| 테스팅 | test-driven-development | RED-GREEN-REFACTOR 사이클 |
| 디버깅 | systematic-debugging | 4단계 근본 원인 분석 |
| | verification-before-completion | 수정 검증 |
| 협업 | brainstorming | 소크라테스식 설계 정제 |
| | writing-plans | 상세 구현 계획 작성 |
| | executing-plans | 배치 실행 + 체크포인트 |
| | requesting-code-review | 코드 리뷰 요청 |
| | receiving-code-review | 코드 리뷰 피드백 대응 |
| | using-git-worktrees | 격리된 개발 환경 |
| | finishing-a-development-branch | 병합/PR 결정 워크플로 |
| 메타 | writing-skills | 새 스킬 작성 가이드 |
| | using-superpowers | 스킬 시스템 소개 |

### 추가 스킬 (sonbbal)

| 카테고리 | 스킬 | 설명 |
|----------|------|------|
| 팀 실행 | team-driven-development | 에이전트 팀 병렬 실행 |
| | model-assignment | 태스크 난이도 기반 모델 할당 |
| 검증 | api-edr-validation | API/EDR 계약 검증 |
| | audit-verification | 태스크 완료 감사 |
| 관리 | context-window-management | 160k 토큰 컨텍스트 압축 |

### 추가 에이전트 역할

| 에이전트 | 파일 | 역할 |
|----------|------|------|
| API/EDR Manager | agents/api-edr-manager.md | API 계약 및 EDR 문서의 단일 진실 공급원 |
| Audit Agent | agents/audit-agent.md | 모든 태스크 완료의 독립적 검증자 |

---

## 원본 프로젝트

이 프로젝트는 Jesse Vincent([@obra](https://github.com/obra))의 [superpowers](https://github.com/obra/superpowers)를 기반으로 합니다.

원본 프로젝트가 도움이 되셨다면 [Jesse의 오픈소스 후원](https://github.com/sponsors/obra)을 고려해 주세요.

원본 프로젝트에 대한 자세한 내용:
- **원본 레포지토리:** https://github.com/obra/superpowers
- **원본 마켓플레이스:** https://github.com/obra/superpowers-marketplace
- **블로그:** [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

---

## 라이선스

MIT License — 자세한 내용은 LICENSE 파일을 참조하세요.
