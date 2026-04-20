# Superpowers Lecture & Study Pipeline

Superpowers fork with two AI-driven pipelines — a full **lecture production pipeline** for creating technical lectures, and a **3-day study pipeline** for deep-diving into coding concepts.

## How it works

## Installation

### Claude Code — 로컬 디렉토리로 직접 로드

1. 이 저장소를 클론한다:

```bash
git clone https://github.com/soyotime0118/superpowers.git
```

2. Claude Code에서 로컬 마켓플레이스로 등록한다:

```bash
/plugin marketplace add /path/to/superpowers
```

3. 플러그인을 설치한다:

```bash
/plugin install superpowers-lecture-pipeline@local
```

또는 `~/.claude/settings.json`에 직접 추가:

```json
{
  "extraKnownMarketplaces": {
    "lecture-pipeline": {
      "source": {
        "source": "directory",
        "path": "/path/to/superpowers"
      }
    }
  }
}
```

## The Basic Workflow

0. **brainstorming** (선택, 권장) — 강의 주제/목표/범위를 대화로 정리. `current-run.md`의 Keywords/Topics 초안 도출.

1. **plugin-phase0-run-initializer** — `lecture_dir`을 전달하여 run 디렉토리 구조 생성 (`runs/run-YYYYMMDD-HHMM-N/`).

2. **plugin-rq-fanout-orchestrator** — `current_run_path` 전달. Concept/Implementation/Trade-off 3개 관점으로 RQ를 병렬 생성.

3. **plugin-rq-set-merger** — 3개 관점의 RQ 후보를 통합·중복제거·우선순위화하여 `phase1/merge/rq-set.md` 생성.

4. **rq-review skill** ⛔ Gate 1 — `rq-set.md`를 대화형으로 검토·수정·확정. "RQ 검토해줘"로 시작.

5. **plugin-rq-set-a-to-rq-files** — 확정된 RQ를 관점별 개별 파일로 분리 생성.

6. **plugin-evidence-master** — RQ별 Evidence-Collector 실행 계획 수립 (Invocation Block 파일 생성).

7. **plugin-evidence-collector** — RQ별로 실행. 순차(Y) / 병렬(P, 위험 고지 포함) / 건너뜀(N) 선택.

8. **plugin-evidence-summary** ⛔ Gate 2 — RQ↔Evidence 매핑 생성. `rq-evidence-map.md` 검토 후 진행.

9. **plugin-outline-architect** — 강의 구성(outline) 설계. `mode: create`로 실행.

10. **plugin-example-designer** ⛔ Gate 3 — 예제 설계. outline + examples 검토 후 진행.

11. **plugin-script-maker** — Marp 슬라이드 형식 스크립트 작성.

12. **plugin-script-reviewer** — 스크립트 품질 검토 (DONE/PARTIAL/MISSING/MISALIGNED 평가).

## What's Inside

### Lecture Pipeline Agents

**Phase 0**
- **plugin-phase0-run-initializer** — Run 디렉토리 초기화 및 `current-run.md` 생성

**Phase 1 — RQ 세트 생성**
- **rq-fanout-orchestrator** — 3개 관점 병렬 RQ 생성 오케스트레이션
- **plugin-rq-list-generator** — 관점별 RQ 목록 생성 (Concept / Implementation / Trade-off)
- **plugin-rq-set-merger** — RQ 통합·정규화·우선순위화

**Phase 2 — Evidence 수집**
- **plugin-evidence-master** — Evidence 수집 Invocation Block 생성
- **plugin-evidence-collector** — RQ별 코드/문서/PR 증거 수집
- **plugin-evidence-summary** — RQ↔Evidence 매핑 문서 생성

**Phase 3 — 구성 설계**
- **plugin-outline-architect** — 강의 outline 설계 (CREATE/REVIEW 모드)
- **example-designer** — 예제 코드 설계

**Phase 4 — 스크립트**
- **plugin-script-maker** — Marp 형식 강의 스크립트 작성
- **plugin-script-reviewer** — 스크립트 품질 검토

### Study Pipeline Agents (3-Day Study Workflow)

**Day 0**
- **plugin-study-run-initializer** — 스터디 Run 디렉토리 초기화 (`day1/`, `day2/`, `day3/` 구조 생성)

**Day 1 — Concept 학습**
- **plugin-study-term-extractor** — 학습 주제에서 핵심 용어 추출 및 정의 수집
- **plugin-study-quiz-generator** — terms.md 기반 Checkpoint 1 퀴즈 생성
- **plugin-study-concept-diagram** — 핵심 개념 간 관계를 Mermaid 다이어그램으로 시각화 (선택)

**Day 2 — 실습**
- **plugin-study-tutorial-guide** — 단계별 튜토리얼 가이드 생성
- **plugin-study-oss-analyzer** — 관련 OSS 코드 분석 (Best Practice / Anti-pattern 도출)
- **plugin-study-practice-reviewer** — 실습 코드 리뷰 및 Checkpoint 2 점검

**Day 3 — 프로젝트**
- **plugin-study-project-designer** — 학습 개념을 적용한 미니 프로젝트 명세 설계
- **plugin-study-code-reviewer** — 구현된 프로젝트 코드 리뷰 및 Checkpoint 3 평가
- **plugin-study-retrospective-guide** — 3일 학습 회고 문서 작성 가이드

### Skills Library

**Lecture Pipeline**
- **lecture-workflow** — 전체 강의 파이프라인 가이드
- **rq-review** — Gate 1: RQ 목록 대화형 검토·수정·확정

**Study Pipeline**
- **study-workflow** — 전체 스터디 파이프라인 가이드
- **quiz-session** — Checkpoint 1: 퀴즈 대화형 Q&A 진행 및 즉시 채점
- **retrospective** — Day 3: KPT/4L 대화형 회고 → evaluation.md + retrospective.md 자동 작성

**General (Superpowers 기본 제공)**
- **brainstorming** — 아이디어를 구조화된 설계로 정리
- **dispatching-parallel-agents** — 독립 작업 병렬 실행
- **systematic-debugging** — 체계적 디버깅 4단계 프로세스
- **test-driven-development** — RED-GREEN-REFACTOR 사이클
- **writing-plans** — 구현 계획 작성

## Lecture Production Pipeline

```
Phase 0 → Phase 1 → [Gate 1] → Phase 2 → [Gate 2] → Phase 3 → [Gate 3] → Phase 4
```

| Phase | 역할 | Agent/Skill |
|-------|------|-------------|
| Phase 0 | Run 초기화, 디렉토리 구조 생성 | `plugin-phase0-run-initializer` |
| Phase 1-1 | RQ 관점 분리 (fanout) | `plugin-rq-fanout-orchestrator` |
| Phase 1-2 | 관점별 RQ 생성 (병렬 ×3) | `plugin-rq-list-generator` |
| Phase 1-3 | RQ 병합 및 통합 | `plugin-rq-set-merger` |
| **Gate 1** | **RQ 목록 대화형 검토·수정·확정** | **`rq-review` skill** |
| Phase 1-4 | RQ 개별 파일 분리 생성 | `plugin-rq-set-a-to-rq-files` |
| Phase 2-1 | Evidence 수집 계획 수립 | `plugin-evidence-master` |
| Phase 2-2 | RQ별 Evidence 수집 | `plugin-evidence-collector` |
| Phase 2-3 | RQ↔Evidence 매핑 생성 | `plugin-evidence-summary` |
| **Gate 2** | **Evidence 커버리지 검토** | 수동 |
| Phase 3 | 강의 구성(outline) 및 예제 설계 | `plugin-outline-architect`, `example-designer` |
| **Gate 3** | **Outline + 예제 검토** | 수동 |
| Phase 4 | 스크립트 작성 및 리뷰 | `plugin-script-maker`, `plugin-script-reviewer` |

### 주요 설계 원칙

- **current_run_path 패턴**: 모든 agent가 `current-run.md` 경로 하나를 받아 `run_dir`, `lecture_dir`을 추출
- **Agent vs Skill 분리**: 대량 파일 처리·병렬 작업 → Agent / 사용자 상호작용·반복 수정 → Skill
- **Manual Gate**: 각 단계 전 사용자 검토 및 확인 단계 포함
- **plugin-evidence-collector 실행 모드**: 순차(Y) / 병렬(P, Rate Limit 위험 고지 포함) / 건너뜀(N) 선택 가능

## Study Pipeline

```
Day 0 → Day 1 → Day 2 → Day 3
```

| Day | 역할 | Agent/Skill |
|-----|------|-------------|
| Day 0 | Run 초기화 | `plugin-study-run-initializer` |
| Day 1 | 용어 추출 | `plugin-study-term-extractor` |
| Day 1 | 퀴즈 생성 | `plugin-study-quiz-generator` |
| Day 1 (선택) | 개념 다이어그램 | `plugin-study-concept-diagram` |
| **Checkpoint 1** | **대화형 퀴즈 세션** | **`quiz-session` skill** |
| Day 2 | 튜토리얼 생성 | `plugin-study-tutorial-guide` |
| Day 2 | OSS 분석 | `plugin-study-oss-analyzer` |
| Day 2 | 실습 코드 리뷰 | `plugin-study-practice-reviewer` |
| Day 3 | 미니 프로젝트 설계 | `plugin-study-project-designer` |
| Day 3 | 코드 리뷰 | `plugin-study-code-reviewer` |
| **Day 3 완료** | **대화형 회고** | **`retrospective` skill** |

### Study 빠른 시작

```
1. plugin-study-run-initializer 실행
   → study_dir: studies/study-01-factory-method
   → topic: "Factory Method Pattern"

2. current-run.md 경로를 복사하여 이후 agent에 전달

3. Day 1 순서대로 실행:
   term-extractor → quiz-generator → (concept-diagram 선택)

4. "퀴즈 풀어볼게" → quiz-session skill로 Checkpoint 1 진행

5. Day 2: tutorial-guide ∥ oss-analyzer → practice-reviewer

6. Day 3: project-designer → [직접 구현] → code-reviewer

7. "회고 시작해줘" → retrospective skill로 마무리
```

### 주요 설계 원칙 (Study)

- **current_run_path 패턴**: 강의 파이프라인과 동일. `current-run.md` 경로 하나로 모든 agent 연결
- **Checkpoint**: 학습 단계별 자가 점검 (1: 용어/개념, 2: 실습, 3: 프로젝트)
- **대화형 Skill**: 퀴즈(즉시 채점·해설)와 회고(KPT/4L 대화 → 문서 자동 작성)는 컨텍스트 유지가 필요하여 skill로 구현

## License

MIT License - see LICENSE file for details
