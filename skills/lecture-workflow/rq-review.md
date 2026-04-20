---
name: rq-review
description: Phase 1 Gate 1 — rq-set-merger가 생성한 rq-set.md를 대화형으로 검토·수정하고 확정한다. "RQ 검토", "RQ 수정", "Gate 1", "rq-set 검토" 등의 키워드가 나오면 이 skill을 사용한다.
---

# RQ 검토 및 확정 (Gate 1)

## 역할

rq-set-merger가 생성한 `rq-set.md`를 사용자와 대화형으로 검토·수정하여 최종 확정하는 인터랙티브 루프다.

## 시작 절차

1. `current_run_path`가 없으면 사용자에게 요청한다.
2. `current-run.md`를 Read하여 `run_dir`을 추출한다.
3. `{run_dir}/phase1/merge/rq-set.md`를 Read하여 RQ 목록을 컨텍스트에 로드한다.
4. 아래 형식으로 RQ 목록을 출력한다:

```
📋 현재 RQ 목록 ({N}개)

[CONCEPT]
- CONCEPT-01: {제목}
- CONCEPT-02: {제목}

[IMPL]
- IMPL-01: {제목}

[TRADEOFF/OPS]
- TRADEOFF-01: {제목}

총 {N}개 | CONCEPT {n}개 / IMPL {n}개 / TRADEOFF {n}개

수정하려면 요청해주세요. 확정하려면 "확정" 또는 "OK"라고 말해주세요.
```

## 인터랙티브 수정 루프

사용자 요청을 받아 즉시 `rq-set.md`를 수정한다. 수정 후 변경된 항목만 요약 출력하고 루프를 유지한다.

### 지원하는 수정 명령

| 사용자 요청 예시 | 처리 방식 |
|---|---|
| "CONCEPT-02 빼줘" | 해당 항목 삭제, 이후 번호 재정렬 |
| "IMPL-03 제목 바꿔줘: {새 제목}" | 제목만 수정, 내용 보존 |
| "{새 RQ} 추가해줘" | merge-report에서 미선정 후보 탐색 후 추가. 없으면 사용자에게 알림 |
| "CONCEPT 1개 더 늘려줘" | merge-report 미선정 후보 제시 후 사용자가 선택 |
| "IMPL-02 ↔ IMPL-03 순서 바꿔줘" | 순서 교환 |
| "전체 다시 보여줘" | 현재 목록 재출력 |

### 수정 규칙 (강제)

1. `{run_dir}/phase1/merge/rq-set-merge-report.md`에 없는 RQ를 임의로 창작하지 않는다.
2. 삭제/추가 후 NN 번호를 재정렬한다 (gaps 없이).
3. 수정할 때마다 `rq-set.md`를 즉시 Write로 덮어쓴다.

## 확정 및 다음 단계

사용자가 "확정", "다음으로", "OK", "좋아" 등 승인 의사를 표현하면:

```
✅ RQ 목록 확정 ({N}개)

❓ 지금 rq-set-a-to-rq-files를 실행하여 RQ 개별 파일을 생성할까요? (Y/N)
```

- **Y**: Task 도구로 `rq-set-a-to-rq-files` agent 실행
  - 전달 파라미터: `current_run_path: {current_run_path}`
- **N**: 파일 경로만 안내하고 종료
