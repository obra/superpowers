---
description: "Set up Claude Code hooks for your project — auto-detects ecosystem, configures formatting, build checks, notifications, and quality gates"
disable-model-invocation: true
---

# /setup-hooks

프로젝트의 생태계를 감지하고, 적절한 Claude Code hooks를 `.claude/settings.json`에 설정합니다.

## 주의사항

- 기존 `.claude/settings.json`에 사용자가 직접 설정한 hooks가 있을 수 있습니다. 기존 hooks를 덮어쓰지 않도록 merge 규칙을 반드시 따르세요
- 이 커맨드는 독립적인 유틸리티로, 스킬 구성 시스템에 참여하지 않습니다

## Step 1: 프로젝트 생태계 감지

프로젝트 루트에서 다음 파일들을 확인하여 생태계를 감지합니다:

| 파일 | 생태계 |
|------|--------|
| `package.json` | Node.js |
| `pyproject.toml` 또는 `requirements.txt` | Python |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `*.csproj` 또는 `*.sln` | C# (.NET) |

복수 생태계가 감지되면 모두 포함합니다. 감지된 생태계를 사용자에게 보고합니다.

## Step 2: 생태계별 Hook 템플릿 생성

감지된 생태계에 맞는 hook 설정을 생성합니다. 아래 템플릿에서 해당하는 것을 선택합니다.

### Node.js

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Stop",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsc --noEmit 2>&1 | head -20; npm run lint 2>&1 | tail -5; npm test 2>&1 | tail -10"
          }
        ]
      }
    ]
  }
}
```

### Python

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "black \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Stop",
        "hooks": [
          {
            "type": "command",
            "command": "ruff check . 2>&1 | tail -10; pytest --tb=short 2>&1 | tail -15"
          }
        ]
      }
    ]
  }
}
```

### Rust

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "rustfmt \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Stop",
        "hooks": [
          {
            "type": "command",
            "command": "cargo check 2>&1 | tail -15; cargo test 2>&1 | tail -15"
          }
        ]
      }
    ]
  }
}
```

### Go

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "gofmt -w \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Stop",
        "hooks": [
          {
            "type": "command",
            "command": "go build ./... 2>&1 | tail -10; go test ./... 2>&1 | tail -15"
          }
        ]
      }
    ]
  }
}
```

### C# (.NET)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "dotnet format --include \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Stop",
        "hooks": [
          {
            "type": "command",
            "command": "dotnet build --no-restore 2>&1 | tail -15; dotnet test --no-build 2>&1 | tail -15"
          }
        ]
      }
    ]
  }
}
```

## Step 3: `.claude/settings.json` Hooks 블록 삽입

1. `.claude/settings.json`이 존재하는지 확인
2. 존재하면 기존 내용을 읽고, `hooks` 블록을 **merge** (기존 hooks 보존, 새 hooks 추가)
3. 존재하지 않으면 새로 생성
4. 적용 전에 사용자에게 변경 내용을 보여주고 승인 요청

**Merge 규칙:**
- 같은 event (PostToolUse, PreToolUse)의 같은 matcher가 이미 있으면 → 건너뜀 (덮어쓰지 않음)
- 새 matcher만 추가
- 기존 설정의 다른 키들은 절대 건드리지 않음

## Step 4: 알림 설정 (선택적)

사용자에게 알림 설정 여부를 물어봅니다:

### Desktop 알림 (macOS)

TaskCompleted 이벤트에 macOS 알림:

```json
{
  "matcher": "Stop",
  "hooks": [
    {
      "type": "command",
      "command": "osascript -e 'display notification \"Task completed\" with title \"Claude Code\"' 2>/dev/null || true"
    }
  ]
}
```

### ntfy 알림 (선택적)

ntfy.sh를 통한 푸시 알림:

```json
{
  "matcher": "Stop",
  "hooks": [
    {
      "type": "command",
      "command": "curl -s -d \"Claude Code task completed: $(pwd | xargs basename)\" ntfy.sh/YOUR_TOPIC 2>/dev/null || true"
    }
  ]
}
```

ntfy를 선택한 경우 토픽명을 사용자에게 물어봅니다.

## 팀 워크플로 호환성 참고

**주의:** `PreToolUse: Stop` 매처의 hook은 에이전트가 Stop할 때마다 실행됩니다.
`team-driven-development`에서는 Worker shutdown 시에도 트리거될 수 있습니다.

**권장 사항:**
- 팀 워크플로 사용 시 Stop hook의 실행 시간을 짧게 유지
- 긴 테스트 스위트는 Stop hook 대신 Worker의 TDD 프로세스에서 실행 권장
- 포맷팅(PostToolUse) hook은 영향 작으므로 유지 가능

## Step 5: 선택적 품질 게이트 Hook 제안

사용자에게 추가 hook을 제안합니다:

### Stop 셀프체크 Hook

에이전트가 Stop하기 전에 자동으로 품질 검증:

```json
{
  "matcher": "Stop",
  "hooks": [
    {
      "type": "command",
      "command": "echo '⚠️ Self-check: Did you run tests? Did you verify the fix? Review your changes before stopping.'"
    }
  ]
}
```

### TaskCompleted 게이트 Hook

팀 워크플로에서 태스크 완료 시 자동 검증:

```json
{
  "matcher": "TaskUpdate",
  "hooks": [
    {
      "type": "command",
      "command": "echo '🔍 Task completion gate: Verify all acceptance criteria are met before marking complete.'"
    }
  ]
}
```

## Step 6: 결과 보고

설정 완료 후 다음을 보고합니다:

1. 감지된 생태계 목록
2. 추가된 hooks 목록 (event + matcher 별로)
3. `.claude/settings.json` 파일 경로
4. 알림 설정 여부
5. 선택적 hooks 설정 여부

**사용 팁도 안내합니다:**
- `hooks.json`과 `.claude/settings.json`의 차이 (플러그인 vs 프로젝트)
- Hook 디버깅 방법: `CLAUDE_DEBUG=1` 환경변수
- Hook 비활성화 방법: 해당 hook 항목을 settings.json에서 제거
