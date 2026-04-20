---
name: study-workflow
description: 코딩 스터디 파이프라인 전체 워크플로우 가이드. "스터디 만들어줘", "study 제작", "Day 1 시작", "퀴즈 생성", "OSS 분석", "스터디 회고" 등의 키워드가 나오면 이 skill을 사용한다.
---

# 코딩 스터디 파이프라인

## 전체 구조

```
Day 0 → Day 1 → Day 2 → Day 3
```

3일 동안 하나의 주제를 집중적으로 학습하는 구조입니다.

## Agent 목록 및 호출 순서

### Day 0 — Run 초기화 (순차)
**Agent:** `plugin-study-run-initializer`
**입력:** `study_dir` (필수), `topic` (필수)
**출력:** `runs/run-YYYYMMDD-HHMM-N/`, `current-run.md`, `day1/`, `day2/`, `day3/`
**모델:** haiku

### Day 1 — Concept 학습

**1-1. 용어 추출 (순차)**
**Agent:** `plugin-study-term-extractor`
**입력:** `current_run_path`
**출력:** `day1/terms.md`
**모델:** sonnet

**1-2. 퀴즈 생성 (순차)**
**Agent:** `plugin-study-quiz-generator`
**입력:** `current_run_path`
**출력:** `day1/quiz.md`
**모델:** haiku

**1-3. 개념 다이어그램 (선택, 병렬 가능)**
**Agent:** `plugin-study-concept-diagram`
**입력:** `current_run_path`
**출력:** `day1/concept-diagram.md`
**모델:** sonnet

### Day 2 — 실습

**2-1. 튜토리얼 가이드 (순차)**
**Agent:** `plugin-study-tutorial-guide`
**입력:** `current_run_path`
**출력:** `day2/tutorial/`
**모델:** sonnet

**2-2. OSS 분석 (병렬 가능)**
**Agent:** `plugin-study-oss-analyzer`
**입력:** `current_run_path`
**출력:** `day2/oss-analysis.md`
**모델:** sonnet

**2-3. 실습 리뷰 (순차, 2-1·2-2 완료 후)**
**Agent:** `plugin-study-practice-reviewer`
**입력:** `current_run_path`
**출력:** `day2/practice-review.md`
**모델:** haiku

### Day 3 — 프로젝트

**3-1. 프로젝트 설계 (순차)**
**Agent:** `plugin-study-project-designer`
**입력:** `current_run_path`
**출력:** `day3/project-spec.md`
**모델:** sonnet

**3-2. 코드 리뷰 (순차, 직접 구현 후)**
**Agent:** `plugin-study-code-reviewer`
**입력:** `current_run_path`
**출력:** `day3/evaluation.md`
**모델:** sonnet

**3-3. 회고 가이드 (순차)**
**Agent:** `plugin-study-retrospective-guide`
**입력:** `current_run_path`
**출력:** `day3/retrospective.md`
**모델:** sonnet

## 디렉토리 구조

```
{study_dir}/
└── runs/
    └── run-YYYYMMDD-HHMM-N/
        ├── current-run.md
        ├── day1/
        │   ├── terms.md
        │   ├── quiz.md
        │   ├── concept-diagram.md
        │   └── summary.md
        ├── day2/
        │   ├── tutorial/
        │   ├── basic-example/
        │   └── oss-analysis.md
        └── day3/
            ├── project-spec.md
            ├── project/
            ├── code-review.md
            ├── evaluation.md
            └── retrospective.md
```

## 빠른 시작

새 스터디를 시작하려면:

1. `study_dir` 경로를 정한다 (예: `studies/study-01-factory-method`)
2. `plugin-study-run-initializer` 실행 → `study_dir`, `topic` 전달
3. 생성된 `current-run.md` 경로를 이후 모든 agent에 전달
4. Day 1부터 순서대로 실행

## 실행 흐름

```
Day 0: run-initializer
Day 1: term-extractor → quiz-generator → (concept-diagram, 선택)
Day 2: tutorial-guide ∥ oss-analyzer → practice-reviewer
Day 3: project-designer → [직접 구현] → code-reviewer → retrospective-guide
```

## 대화형 Skills

특정 단계에서 단순 파일 생성이 아닌 **대화형 인터랙션**이 필요할 때 사용하는 skill:

| Skill | 시점 | 역할 |
|-------|------|------|
| `quiz-session` | Day 1 완료 후 | 퀴즈를 실시간 Q&A로 진행, 즉시 채점/해설 |
| `retrospective` | Day 3 완료 후 | KPT/4L 대화형 회고 후 evaluation.md + retrospective.md 작성 |

호출 방법:
- "퀴즈 풀어볼게" → `quiz-session` skill 사용
- "회고 시작해줘" → `retrospective` skill 사용

## 파라미터 참조

| 변수 | 설명 | 예시 |
|------|------|------|
| `study_dir` | 스터디 디렉토리 | `studies/study-01-factory-method` |
| `topic` | 학습 주제 | `Factory Method Pattern` |
| `current_run_path` | current-run.md 절대 경로 | `studies/study-01/runs/run-20260421-1430-01/current-run.md` |
