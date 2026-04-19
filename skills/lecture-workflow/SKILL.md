---
name: lecture-workflow
description: 강의 제작 파이프라인 전체 워크플로우 가이드. "강의 만들어줘", "lecture 제작", "RQ 생성", "Phase 0", "강의 스크립트" 등의 키워드가 나오면 이 skill을 사용한다.
---

# 강의 제작 파이프라인

## 전체 구조

```
Phase 0 → Phase 1 → [Gate 1] → Phase 2 → [Gate 2] → Phase 3 → [Gate 3] → Phase 4
```

## Agent 목록 및 호출 순서

### Phase 0 — Run 초기화 (순차)
**Agent:** `phase0-run-initializer`
**입력:** `lecture_dir` (필수)
**출력:** `runs/run-YYYYMMDD-HHMM-N/`, `current-run.md`, `phase0~5/`, `phase0/invocation-rq-fanout.md`
**모델:** haiku

### Phase 1 — RQ 세트 생성

**1-1. RQ 관점 분리 (순차)**
**Agent:** `agent-rq-fanout-orchestrator`
**입력:** `current_run_path` (current-run.md 절대 경로, 필수)
**출력:** `phase1/set/fanout/_agent_rq_fanout.md`, `phase1/set/rq-set-a/b/c.md` (병렬 실행 후)
**모델:** sonnet

**1-2. RQ 생성 (병렬 ×3, fanout-orchestrator가 자동 실행)**
**Agent:** `agent-rq-list-generator`
- Set A: Concept/Theory → `phase1/set/rq-set-a.md`
- Set B: Implementation/OSS → `phase1/set/rq-set-b.md`
- Set C: Trade-off/Ops → `phase1/set/rq-set-c.md`
**모델:** sonnet

**1-3. RQ 통합 (순차)**
**Agent:** `rq-set-merger`
**입력:** `current_run_path`
**출력:** `phase1/merge/rq-set.md`, `phase1/merge/rq-set-merge-report.md`, `next-step-invocation.md`, `rerun-merge-invocation.md`
**모델:** sonnet
⛔ **Manual Gate 1**: `phase1/merge/rq-set.md` 검토 후 진행

**1-4. RQ 파일 분리 (순차)**
**Agent:** `rq-set-a-to-rq-files`
**입력:** `current_run_path`
**출력:** `phase1/{PREFIX}-NN-{slug}.md` (RQ 개별 파일들), `phase1/phase2-evidence-master-invocation-plan.md`
**모델:** haiku

### Phase 2 — Evidence 수집

**2-1. Invocation 계획 수립 (순차)**
**Agent:** `evidence-master`
**입력:** `current_run_path`
**출력:** `phase2/invocation/evidence-collector-{RQ-ID}.md` (RQ별 개별 파일), `phase2/invocation/evidence-collection-invocations.md`, `phase2/summary/README.md`
**모델:** sonnet
※ 직접 실행하지 않고 Invocation Block 파일만 생성

**2-2. Evidence 수집 (RQ별 개별 실행 또는 병렬)**
**Agent:** `evidence-collector`
**입력:** `current_run_path`, `rq_file` (RQ 문서 경로)
**출력:** `phase2/E-NN-{slug}.md`, `phase2/summary/evidence-summary-{RQ-ID}.md`
**모델:** sonnet

**2-3. 매핑 생성 (순차)**
**Agent:** `evidence-summary`
**입력:** `current_run_path`
**출력:** `phase2/rq-evidence-map.md`, `phase2/summary/README.md`
**모델:** sonnet
⛔ **Manual Gate 2**: `phase2/rq-evidence-map.md` 검토 후 진행

### Phase 3 — Outline & Example 설계 (병렬)

**Agent:** `outline-architect`
**입력:** `current_run_path`, `mode` (create/review)
**출력:** `phase3/outline/draft-NN/lecture-outline.md`, `outline-rq-evidence-mapping.md`, `outline-review-notes.md`, `outline-architect-log.md`
**모델:** inherit

**Agent:** `agent-example-designer` ×N (병렬)
**입력:** `current_run_path`, `rq_evidence_mapping_path`, `example_id` (또는 `examples` 배열)
**출력:** `phase3/examples/{example_id}-example-plan.md`, `phase3/invocation/example-designer-{example_id}.md`
**모델:** sonnet
⛔ **Manual Gate 3**: outline + examples 검토 후 진행

### Phase 4 — 스크립트 작성 & 리뷰

**Agent:** `script-maker`
**입력:** `current_run_path`
**출력:** `phase4/script/section-NN-*.md` (Marp 형식)
**모델:** sonnet

**Agent:** `script-reviewer`
**입력:** `current_run_path`
**출력:** `phase4/review/YYYY_MM_DD_ver_N_script_review.md`
**모델:** sonnet

## 디렉토리 구조

```
{lecture_dir}/
└── runs/
    └── run-YYYYMMDD-HHMM-N/
        ├── current-run.md
        ├── phase0/
        │   └── invocation-rq-fanout.md
        ├── phase1/
        │   ├── set/
        │   │   ├── fanout/_agent_rq_fanout.md
        │   │   ├── rq-set-a.md
        │   │   ├── rq-set-b.md
        │   │   └── rq-set-c.md
        │   ├── merge/
        │   │   ├── rq-set.md
        │   │   ├── rq-set-merge-report.md
        │   │   ├── next-step-invocation.md
        │   │   └── rerun-merge-invocation.md
        │   ├── CONCEPT-01-{slug}.md
        │   ├── IMPL-01-{slug}.md
        │   ├── TRADEOFF-01-{slug}.md
        │   └── phase2-evidence-master-invocation-plan.md
        ├── phase2/
        │   ├── invocation/
        │   │   ├── evidence-collection-invocations.md
        │   │   └── evidence-collector-{RQ-ID}.md ...
        │   ├── summary/
        │   │   ├── README.md
        │   │   └── evidence-summary-{RQ-ID}.md ...
        │   ├── E-01-{slug}.md
        │   ├── E-02-{slug}.md
        │   └── rq-evidence-map.md
        ├── phase3/
        │   ├── outline/
        │   │   └── draft-NN/
        │   │       ├── lecture-outline.md
        │   │       ├── outline-rq-evidence-mapping.md
        │   │       ├── outline-review-notes.md
        │   │       └── outline-architect-log.md
        │   ├── invocation/
        │   │   └── example-designer-{example_id}.md ...
        │   └── examples/
        │       └── {example_id}-example-plan.md ...
        └── phase4/
            ├── script/section-01-*.md ...
            └── review/YYYY_MM_DD_ver_N_script_review.md
```

## 빠른 시작

새 강의를 만들려면:

1. `lecture_dir` 경로를 정한다 (예: `lectures/lecture-02`)
2. `phase0-run-initializer` 실행 → `lecture_dir` 전달
3. 생성된 `current-run.md`의 `Suggested Keywords`, `Suggested Topics` 섹션을 작성
4. `phase0/invocation-rq-fanout.md` 내용을 `agent-rq-fanout-orchestrator`에 전달
5. Phase 1 순서대로 실행 (fanout → merger → rq-files)
6. 각 Manual Gate에서 검토 후 승인

## Manual Gate 요약

| Gate | 위치 | 검토 대상 | 승인 후 |
|------|------|----------|--------|
| Gate 1 | Phase 1-3 완료 후 | `phase1/merge/rq-set.md` | rq-set-a-to-rq-files 실행 |
| Gate 2 | Phase 2 완료 후 | `phase2/rq-evidence-map.md` | Phase 3 실행 |
| Gate 3 | Phase 3 완료 후 | `phase3/outline/draft-NN/lecture-outline.md`, examples | Phase 4 실행 |
