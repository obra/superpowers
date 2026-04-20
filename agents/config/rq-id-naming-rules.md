---
name: rq-id-naming-rules
description: RQ-ID 네이밍 규칙 중앙 설정
version: 1.0.0
updated: 2026-01-02
---

# RQ-ID 네이밍 규칙

이 파일은 모든 RQ 관련 agent에서 사용하는 RQ-ID 네이밍 규칙을 정의합니다.

## RQ-ID 형식

```
{prefix}-{NN}
```

- **prefix**: rq_type에 따른 의미 있는 접두사 (아래 매핑 참조)
- **NN**: 2자리 숫자 (01, 02, 03, ..., 99)

## rq_type → prefix 매핑

| rq_type | prefix | 설명 | 예시 |
|---------|--------|------|------|
| `concept` | `CONCEPT` | 개념/이론/정의/배경/메커니즘 중심 | `CONCEPT-01` |
| `implementation` | `IMPL` | 구현/OSS 사례/진화 포인트 중심 | `IMPL-01` |
| `OPS` | `TRADEOFF` 또는 `OPS` | 트레이드오프/운영/테스트 중심 (하위 규칙 참조) | `TRADEOFF-01` 또는 `OPS-01` |

### OPS 타입 세부 규칙

OPS 타입은 **내용에 따라** agent가 다음과 같이 판단합니다:

- **TRADEOFF**:
  - 트레이드오프 분석
  - 대안 비교
  - 설계 결정 (A vs B)
  - 장단점 분석

- **OPS**:
  - 운영 이슈
  - 진단/모니터링
  - 테스트/검증
  - 실패 모드
  - 성능 분석

**판단 기준**: 질문이 "어떤 선택을 할 것인가"에 초점이 있으면 TRADEOFF, "어떻게 운영/테스트할 것인가"에 초점이 있으면 OPS

## 파일명 규칙 (RQ 개별 파일)

```
{prefix}-{NN}-{slug}.md
```

- **prefix**: 위 매핑 테이블 참조
- **NN**: 2자리 숫자
- **slug**: 제목을 kebab-case로 변환 (영문/숫자/하이픈만, 공백은 `-`로)

예시:
- `CONCEPT-01-singleton-definition.md`
- `IMPL-01-spring-singleton-implementation.md`
- `TRADEOFF-01-eager-vs-lazy-initialization.md`
- `OPS-01-thread-safety-testing.md`

## 관점별 매핑 요약

| 관점 (Set) | rq_type | prefix | 출력 파일 |
|-----------|---------|--------|----------|
| Set A (Concept/Theory) | `concept` | `CONCEPT` | `rq-set-a.md` |
| Set B (Implementation/OSS) | `OSS` | `IMPL` | `rq-set-b.md` |
| Set C (Trade-off/Ops) | `OPS` | `TRADEOFF` 또는 `OPS` | `rq-set-c.md` |

## 사용 예시

### plugin-rq-list-generator 출력 예시

```markdown
## 1) RQ List
### CONCEPT-01
- slug-name: singleton-pattern-definition
- Question: 싱글톤 패턴의 핵심 정의는 무엇인가?
...

### CONCEPT-02
- slug-name: singleton-use-cases
- Question: 싱글톤 패턴이 적합한 사용 사례는 무엇인가?
...
```

### rq-set.md 예시

```markdown
## RQ List

1. CONCEPT-01: 싱글톤 패턴의 핵심 정의는 무엇인가?
2. CONCEPT-02: 싱글톤 패턴이 적합한 사용 사례는 무엇인가?
3. IMPL-01: Spring Framework는 싱글톤을 어떻게 구현하는가?
4. IMPL-02: Apache Kafka는 어떤 싱글톤 패턴을 사용하는가?
5. TRADEOFF-01: Eager vs Lazy 초기화의 트레이드오프는?
6. OPS-01: 멀티스레드 환경에서 싱글톤을 테스트하는 방법은?
```

## 사용하는 Agent 목록

이 설정 파일을 참조하는 agent들:

1. **plugin-rq-list-generator**: RQ 목록 생성 시 prefix 결정
2. **plugin-rq-fanout-orchestrator**: 3개 관점별 RQ 생성 오케스트레이션
3. **rq-set-merger**: 관점별 RQ 병합 시 prefix 이해
4. **agent-rq-split-file**: RQ 개별 파일 생성 시 파일명 결정

## 변경 이력

- 2026-01-02: v1.0.0 - 초기 중앙 설정 파일 생성
  - RQ-{rq_type}-NN 형식에서 {prefix}-NN 형식으로 변경
  - concept → CONCEPT, OSS → IMPL, OPS → TRADEOFF/OPS 매핑 정의
