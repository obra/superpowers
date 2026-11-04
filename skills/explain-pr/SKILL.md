---
name: explain-pr
description: Use when finishing a development branch and creating a PR/MR, or when asked to document/explain an existing PR ("이해문서 만들어줘", "이 PR 설명 문서", "/explain-pr") - produces a developer-facing understanding doc for a PR so a developer who did not do the work can understand and reproduce it.
---

# explain-pr — 개발자용 PR 이해문서

## 독자
이 문서의 독자는 **이 대화/작업 과정을 보지 못한 개발자**다(리뷰어·미래의 나·팀원).
그들이 PR 링크만 보고 "왜 · 무엇을 · 어떻게 · 조심할 점"을 이해·재현할 수 있게 쓴다.

## 언제 쓰나
- **warm 경로**: superpowers:finishing-a-development-branch Step 4.5 — PR/MR을 만들기 직전, 작업을 수행한 바로 그 세션에서.
- **cold 경로**: 과거·남의 PR 번호를 지정받았을 때.

## 절차

### 1. 재료 수집 (기계적)
`scripts/gather.sh --base <branch> [--pr <n>] --out <bundle.md>` 실행 → 번들 1개 생성.
base 미지정 시 스크립트가 자동 결정(인자 > PR target > dev > 기본브랜치). 번들을 한 번 읽는다.

### 2. 문맥 소스 판별 (warm vs cold)
- **같은 세션에서 이 작업을 방금 수행함(finishing-a-development-branch Step 4.5)** → **warm**.
  "왜 / 버린 대안 / 시도했다 실패한 것 / 함정"을 세션 문맥에서 직접 가져온다. 번들만 요약하지 말 것 — warm의 존재 이유는 diff에 안 남는 문맥이다.
- **과거·남의 PR을 지정받음, 세션 문맥 없음** → **cold**.
  번들만으로 의도를 재구성하고, 추정한 문장에는 반드시 `⚠️ 추정`을 붙인다.

### 3. 문서 작성
`template.md`를 복사해 7개 섹션을 채운다.
1. TL;DR — 3줄  2. 왜 — 배경/문제/목표/제약  3. 무엇을 바꿨나 — 변경+핵심파일
4. 설계 — mermaid 1~2개(이해에 기여하는 것만, 장식 금지)  5. 결정과 버린 대안
6. 동작 확인 방법 — 재현 커맨드/테스트  7. 후속·리스크·함정

### 4. 저장 + PR 통합
- 파일: `docs/work/<slug>/understanding.md`로 저장. `<slug>`는 브랜치 slug로 같은 기능의 spec/plan/dod와 동일 키다. PR 번호는 파일명이 아니라 문서 헤더와 PR 본문 링크에만 쓴다. (한 기능에 PR이 여럿이면 `understanding-PR<n>.md`로 폴백.)
- 폴더 랜딩: `docs/work/<slug>/README.md`가 없거나 오래됐으면 한 줄 설명 + 존재하는 문서(design/plan/dod/understanding) 링크로 생성·갱신한다. **상위 `docs/work/README.md` 같은 목록 파일에 행을 추가하지 않는다** — 모든 브랜치가 같은 자리를 고쳐 병렬 MR 충돌의 주범이 된다. 목록은 `ls docs/work/` 가 대신한다.
- **문서를 커밋한다** — push 전에 커밋해야 PR에 포함된다.
- PR/MR 본문: 상단에 아래 블록을 삽입한다. **링크는 호스트까지 포함한 절대 URL이다.**

  ```
  ## 개발자 이해문서
  <요약 3줄>

  📄 **[개발자 이해문서 전문 보기 →](<PERMALINK>)**
  <sub>`docs/work/<slug>/understanding.md` · 커밋 고정 링크라 브랜치 삭제 후에도 열립니다</sub>
  ```

  `<PERMALINK>`는 **브랜치명이 아니라 head 커밋 SHA**로 만든다. 브랜치 링크는 머지 후 브랜치가
  지워지면 404가 된다. 경로 세그먼트는 호스트마다 다르다 — GitHub은 `/blob/`, GitLab은 `/-/blob/`.

  ```bash
  # 문서를 커밋한 뒤 실행한다 — SHA가 그 커밋을 가리켜야 한다
  SHA=$(git rev-parse HEAD)
  BASE=$(git remote get-url origin | sed -E 's#(git@|https://)([^:/]+)[:/]#https://\2/#; s#\.git$##')
  case "$BASE" in *github.*) SEG="/blob" ;; *) SEG="/-/blob" ;; esac
  echo "${BASE}${SEG}/${SHA}/docs/work/<slug>/understanding.md"
  ```

  - **상대 경로를 쓰지 않는다.** GitLab은 본문의 상대 링크 앞에 `<project>/-/blob/`을 붙여 다시 써서
    `/-/blob/-/blob/...`처럼 겹치고, 저장소 상대 경로는 기본 브랜치를 가리켜 머지 전에는 404다.
  - finishing의 base 동기화(병합 커밋)가 생기면 head SHA가 바뀐다. 문서가 그 커밋에도 그대로
    있으므로 링크는 계속 열린다 — 다시 만들 필요는 없다.

  - finishing-a-development-branch Option 2 경로: `gh pr create` / `glab mr create` **전에** 본문에 포함.
  - 기존 PR: `gh pr edit <n> --body-file` / `glab mr update <n> --description` 로 주입.
  - `gh`/`glab`이 없는 환경: 문서를 커밋하고 push 한 뒤, 위 블록을 본문에 넣어 forge REST API 로 PR/MR 을 직접 만든다(finishing-a-development-branch Option 2 의 API 절차). API 도 실패할 때만 블록과 compare URL 을 사용자에게 준다.

## 완료 판정 (exit checklist)
아래를 모두 만족해야 완료다.
- [ ] "왜" 섹션이 비어있지 않다
- [ ] 모든 mermaid 블록이 문법상 렌더 가능하다
- [ ] 미해결 TODO/TBD가 없다
- [ ] cold 경로면 추정 부분에 `⚠️ 추정`이 표기됐다
- [ ] 문서가 커밋됐다(warm 경로: push 전)
- [ ] **PR/MR 본문의 이해문서 링크가 클릭 가능한 절대 URL이고, 브랜치명이 아닌 커밋 SHA를 쓴다**
- [ ] 자문 통과: "이 PR 링크만 보고 개발자가 이해·재현 가능한가?"

## 비목표
- 별도 documenter 에이전트를 만들지 않는다(문맥 소실 방지가 목적).
- gather.sh에 판단을 넣지 않는다(순수 수집).
- HTML/Artifact 리치 시각화는 지금 도입하지 않는다(markdown+mermaid로 충분).
