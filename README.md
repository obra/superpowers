# Sonbbal Superpowers

코딩 에이전트를 위한 팀 기반 병렬 개발 워크플로 스킬 라이브러리입니다.

> **원본 프로젝트:** 이 프로젝트는 [obra/superpowers](https://github.com/obra/superpowers)를 기반으로 제작되었습니다.

## 패키지 구조

이 저장소는 하나의 repo 안에서 플랫폼별 패키지를 분리합니다.

| 플랫폼 | 패키지 | 설명 |
| --- | --- | --- |
| Claude Code | `claude-code/` | Claude Code skills, agents, commands, hooks |
| Codex | `codex/` | Codex-native skills and plugin metadata |
| OpenCode | `docs/README.opencode.md` | 기존 OpenCode 설치 문서 |

저장소 루트는 더 이상 Claude Code 런타임 패키지가 아닙니다. 루트는 프로젝트 소개, release notes, marketplace entry, 공통 문서만 담당합니다.

## 빠른 설치

### Claude Code

Claude Code에서 실행:

```text
/plugin marketplace add Sonbbal/superpowers
/plugin install sonbbal-superpowers@sonbbal-marketplace
```

자세한 내용:

- [claude-code/README.md](claude-code/README.md)
- [claude-code/INSTALL.md](claude-code/INSTALL.md)

### Codex

Codex용 패키지는 `codex/`에 있습니다.

```bash
git clone https://github.com/Sonbbal/superpowers.git ~/.codex/superpowers
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers/codex/skills ~/.agents/skills/sonbbal-superpowers-codex
```

자세한 내용:

- [codex/README.md](codex/README.md)
- [codex/INSTALL.md](codex/INSTALL.md)

## 붙여넣기 설치 프롬프트

Claude Code나 Codex에 직접 붙여 넣어 설치/업데이트를 맡기는 프롬프트는 [docs/prompts.md](docs/prompts.md)에 있습니다.

## 공통 설치 문서

플랫폼별 설치, 업데이트, 제거, 마이그레이션은 [docs/installation.md](docs/installation.md)를 참고하세요.

## 추가된 기능

기존 [obra/superpowers](https://github.com/obra/superpowers) 스킬 라이브러리에 다음 기능이 추가되었습니다.

### 팀 기반 병렬 개발

기존 단일 subagent 방식 대신 에이전트 팀을 구성하여 병렬로 작업을 실행합니다.

| 역할 | 책임 | 코드 작성 |
| --- | --- | :---: |
| Team Lead | 오케스트레이션, 태스크 할당, 블로커 해결 | 불가 |
| Audit Agent | 태스크 완료 검증, 스펙 대비 검사, 비준수 작업 차단 | 불가 |
| Worker | TDD 기반 태스크 구현 | 가능 |

### API/EDR 검증

API 엔드포인트, 변수명, 요청/응답 스키마를 임의로 생성하는 것을 방지합니다. 모든 API 계약은 프로젝트 문서를 직접 참조해 확인합니다.

### 감사 검증

완료된 태스크는 독립적 검증을 통과해야 완료로 표시합니다. 자체 보고만으로는 충분하지 않습니다.

### 모델 할당

태스크 난이도와 위험도에 따라 적절한 모델과 reasoning 설정을 선택하는 지침을 제공합니다.

### 컨텍스트 윈도우 관리

긴 세션에서 작업 단위 완료, 상태 저장, 압축, 재개 절차를 명확히 합니다.

### Wiki 지식 베이스

Andrej Karpathy의 LLM Wiki 패턴을 스킬로 통합합니다. 매 세션마다 코드베이스를 새로 탐색하는 대신 사전 편찬된 위키를 캐시로 활용합니다.

## 기본 워크플로

1. `brainstorming`: 코드 작성 전 설계 정제.
2. `writing-plans`: 승인된 설계를 구현 계획으로 분해.
3. `executing-plans` 또는 `team-driven-development`: 계획 실행.
4. `test-driven-development`: RED-GREEN-REFACTOR 구현.
5. `requesting-code-review`: 계획 대비 코드 검토.
6. `verification-before-completion`: 완료 전 증거 기반 검증.
7. `finishing-a-development-branch`: 병합, PR, 정리 선택.

## 테스트

Claude Code 패키지 경계:

```bash
bash tests/claude-code/test-plugin-package.sh
```

Codex 패키지 경계:

```bash
bash tests/codex/test-plugin-package.sh
```

Codex 스킬 언어 호환성:

```bash
bash tests/codex/test-codex-skill-language.sh
```

## 원본 프로젝트

- 원본 레포지토리: https://github.com/obra/superpowers
- 원본 마켓플레이스: https://github.com/obra/superpowers-marketplace
- 블로그: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## 라이선스

MIT License. 자세한 내용은 [LICENSE](LICENSE)를 참고하세요.
