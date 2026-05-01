#!/bin/bash
# TaskCompleted hook — test gate
# Runs project tests before allowing task completion
# Exit 2 = block task completion on test failure

INPUT=$(cat)
TASK=$(echo "$INPUT" | jq -r '.task_subject // "unknown"')

# Detect project ecosystem and run tests
if [ -f "package.json" ]; then
  RESULT=$(npm test 2>&1 | tail -20)
  EXIT_CODE=$?
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  RESULT=$(pytest 2>&1 | tail -20)
  EXIT_CODE=$?
elif [ -f "Cargo.toml" ]; then
  RESULT=$(cargo test 2>&1 | tail -20)
  EXIT_CODE=$?
elif [ -f "go.mod" ]; then
  RESULT=$(go test ./... 2>&1 | tail -20)
  EXIT_CODE=$?
else
  exit 0
fi

if [ $EXIT_CODE -ne 0 ]; then
  echo "태스크 '$TASK' 완료 차단: 테스트 실패." >&2
  echo "$RESULT" >&2
  exit 2
fi

exit 0
