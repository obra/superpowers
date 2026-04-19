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
**출력:** `runs/run-YYYYMMDD-HHMM-N/`, `current-run.md`, `phase1~5/`
**모델:** haiku

### Phase 1 — RQ 세트 생성

**1-1. RQ 관점 분리 (순차)**
**Agent:** `rq-fanout-orchestrator`
**입력:** `rq-input.md` (topic, audience, keywords, rq_per_set, constraints)
**출력:** `fanout-invocations.md` (3개 Invocation 블록)
**모델:** sonnet

**1-2. RQ 생성 (병렬 ×3)**
**Agent:** `rq-list-generator`
- Set A: Concept/Theory → `rq-set-a.md`
- Set B: Implementation/OSS → `rq-set-b.md`
- Set C: Trade-off/Ops → `rq-set-c.md`
**모델:** sonnet

**1-3. RQ 통합 (순차)**
**Agent:** `rq-set-merger`
**출력:** `rq-set.md`, `rq-set-merge-report.md`, invocation plans
**모델:** sonnet
⛔ **Manual Gate 1**: rq-set.md 검토 후 진행

**1-4. RQ 파일 분리 (순차)**
**Agent:** `rq-set-to-rq-files`
**출력:** `RQ-files/*.md`, `phase2-evidence-master-invocation-plan.md`
**모델:** haiku

### Phase 2 — Evidence 수집

**Agent:** `evidence-master` (오케스트레이터)
→ `evidence-collector` ×N (RQ별 병렬)
→ `evidence-summary` (자동 실행)
**입력:** `lecture_dir`
**출력:** `evidence/*.md`, `rq-evidence-map.md`, `evidence/README.md`
**모델:** sonnet (master/summary), haiku (collector)
⛔ **Manual Gate 2**: rq-evidence-map.md 검토 후 진행

### Phase 3 — Outline & Example 설계 (병렬)

**Agent:** `outline-architect`
**출력:** `lecture-outline.md`, `outline-rq-evidence-mapping.md`
**모델:** inherit

**Agent:** `example-designer` ×N (병렬)
**입력:** `current_run_path`, `example_id`, `target_rqs`
**출력:** `examples/{example_id}-example-plan.md`
**모델:** sonnet
⛔ **Manual Gate 3**: outline + examples 검토 후 진행

### Phase 4 — 스크립트 작성 & 리뷰

**Agent:** `script-maker`
**입력:** `current_run_path`
**출력:** `phase4/script/section-NN-*.md` (Marp 형식)
**모델:** sonnet

**Agent:** `script-reviewer`
**입력:** `lecture_dir`
**출력:** `phase4/review/YYYY_MM_DD_ver_N_script_review.md`
**모델:** sonnet

## 디렉토리 구조

```
{lecture_dir}/
└── runs/
    └── run-YYYYMMDD-HHMM-N/
        ├── current-run.md
        ├── phase1/
        │   ├── rq-set-a.md, rq-set-b.md, rq-set-c.md
        │   ├── rq-set.md
        │   └── RQ-files/RQ-001-*.md ...
        ├── phase2/
        │   ├── evidence/E-01-*.md ...
        │   └── rq-evidence-map.md
        ├── phase3/
        │   ├── outline/lecture-outline.md
        │   └── examples/Example-01-example-plan.md ...
        └── phase4/
            ├── script/section-01-*.md ...
            └── review/YYYY_MM_DD_ver_N_script_review.md
```

## 빠른 시작

새 강의를 만들려면:

1. `lecture_dir` 경로를 정한다 (예: `lectures/lecture-02`)
2. `phase0-run-initializer` 실행 → `lecture_dir` 전달
3. `rq-input.md` 작성 (topic, audience, keywords, rq_count)
4. Phase 1 순서대로 실행
5. 각 Manual Gate에서 검토 후 승인

## Manual Gate 요약

| Gate | 위치 | 검토 대상 | 승인 후 |
|------|------|----------|--------|
| Gate 1 | Phase 1-3 완료 후 | `rq-set.md` | rq-set-to-rq-files 실행 |
| Gate 2 | Phase 2 완료 후 | `rq-evidence-map.md` | Phase 3 실행 |
| Gate 3 | Phase 3 완료 후 | `lecture-outline.md`, examples | Phase 4 실행 |
