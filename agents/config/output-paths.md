# 산출물 파일 경로 규칙

이 문서는 각 Phase별 산출물 파일의 저장 위치를 정의합니다.
모든 agent는 이 규칙을 따라야 합니다.

## 경로 기준

- `{runDir}`: current-run.md의 run_dir 필드 값
- `{lectureDir}`: current-run.md의 lecture_dir 필드 값

## Phase 1: Research Question (RQ) 파일

### RQ 파일 위치
- **경로**: `{runDir}/phase1/`
- **파일명 패턴**: `{prefix}-{NN}-{slug}.md`
  - prefix: rq_type에 따른 접두사 (rq-id-naming-rules.md 참조)
  - NN: 2자리 숫자 (01, 02, ...)
  - slug: kebab-case 형식의 제목

### 관련 파일
- RQ 병합 결과: `{runDir}/phase1/merge/rq-set.md`
- RQ 병합 리포트: `{runDir}/phase1/merge/rq-set-merge-report.md`

### 기존 경로 (deprecated)
- ~~`{runDir}/phase1/RQ-files/`~~ (더 이상 사용하지 않음)

## Phase 2: Evidence 수집 및 요약

### Evidence 파일 위치
- **경로**: `{runDir}/phase2/E-*.md`
- **파일명 패턴**: `E-{NN}-{slug-5-words}.md`
  - NN: 2자리 숫자 (01, 02, ...)
  - slug: 5단어 이하의 kebab-case 형식

### Evidence Summary 위치
- **경로**: `{runDir}/phase2/summary/`
- **파일명 패턴(기본)**: `evidence-summary-{RQ-ID}.md`
  - RQ-ID는 Phase 1 RQ 파일의 식별자 사용
  - 예: `evidence-summary-CONCEPT-01.md`, `evidence-summary-IMPL-02.md`
- **파일명 패턴(보조, 필요한 경우)**: `E-{NN}-{slug-5-words}.md`
  - 대응하는 Evidence 파일과 동일한 파일명 사용

### RQ-Evidence 매핑
- **경로**: `{runDir}/phase2/rq-evidence-map.md`

### 기존 경로 (deprecated)
- ~~`{runDir}/phase2/evidence/E-*.md`~~ (더 이상 사용하지 않음)
- ~~`{runDir}/phase2/evidence/summary/`~~ (더 이상 사용하지 않음)

## Phase 3: Outline 생성

### Outline 파일 위치
- **경로**: `{runDir}/phase3/outline/`

## Phase 4: Script 생성

### Script 파일 위치
- **경로**: `{runDir}/phase4/`

## 경로 사용 규칙

1. **절대 경로 사용**: 모든 agent는 current-run.md에서 runDir을 읽어 절대 경로를 구성합니다.
2. **디렉토리 자동 생성**: 출력 디렉토리가 없으면 agent가 자동으로 생성합니다.
3. **하위 디렉토리 금지**: Phase 1과 Phase 2는 지정된 경로의 바로 하위에 파일을 생성합니다.
   - 예: `{runDir}/phase1/RQ-files/` ❌
   - 예: `{runDir}/phase1/CONCEPT-01-xxx.md` ✅
   - 예: `{runDir}/phase2/evidence/E-01-xxx.md` ❌
   - 예: `{runDir}/phase2/E-01-xxx.md` ✅

4. **Summary 전용 디렉토리**: Phase 2의 summary만 별도 하위 디렉토리를 사용합니다.
   - `{runDir}/phase2/summary/` ✅

5. **파일/디렉토리 제외 규칙**: 파일 스캔 시 아래 패턴을 포함하는 파일/디렉토리는 **무시**합니다.
   - `backup` - 백업 파일/디렉토리
   - `archive` - 아카이브 파일/디렉토리
   - `temp` - 임시 파일/디렉토리
   - `tmp` - 임시 파일/디렉토리
   - 예: `rq-files-archive-20260123/`, `backup-E-01.md`, `temp-notes.md` 등은 모두 제외

## Agent별 출력 경로 매핑

| Agent | Phase | 출력 경로 |
|-------|-------|----------|
| rq-set-merger | 1 | `{runDir}/phase1/merge/` |
| agent-rq-split-file | 1 | `{runDir}/phase1/` |
| evidence-collector | 2 | `{runDir}/phase2/` |
| evidence-summary | 2 | `{runDir}/phase2/summary/` |
| outline-architect | 3 | `{runDir}/phase3/outline/` |
| script-maker | 4 | `{runDir}/phase4/` |
