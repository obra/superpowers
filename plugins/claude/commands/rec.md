---
description: Terminal Session Recorder
---

# /rec - Terminal Session Recorder

录制当前 tmux 会话（多窗口/多 pane 全视口），支持本地保存和上传到 asciinema.org。参数：`$ARGUMENTS`

## 解析参数

- `start [session]` → 开始录制（自动检测 tmux session，或用指定名称）
- `stop` → 停止录制，保存文件，询问是否上传
- `status` → 查看当前录制状态
- 无参数 → 显示状态，若未在录制则提示开始

---

## Action: start

### 1. 检查 asciinema 是否安装

```bash
which asciinema || pip install asciinema 2>/dev/null || pip3 install asciinema 2>/dev/null || (echo "ERROR: asciinema 未安装，请先运行: pip install asciinema" && exit 1)
asciinema --version
```

### 2. 检查是否已在录制

```bash
PID_FILE="$HOME/.ace/rec.pid"
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    CAST_FILE=$(cat "$HOME/.ace/rec.cast_path" 2>/dev/null || echo "unknown")
    echo "已有录制正在进行 (PID: $PID, 文件: $CAST_FILE)"
    echo "请先运行 /rec stop 停止当前录制"
    exit 0
  fi
fi
```

### 3. 检测 tmux session

若 `$ARGUMENTS` 提供了 session 名则使用，否则自动检测：

```bash
# 自动检测当前 tmux session
SESSION_ARG="<从 $ARGUMENTS 解析的 session 名，若无则留空>"
if [ -z "$SESSION_ARG" ]; then
  if [ -n "$TMUX" ]; then
    SESSION=$(tmux display-message -p '#S')
  else
    SESSION=$(tmux list-sessions -F '#S' 2>/dev/null | head -1)
  fi
else
  SESSION="$SESSION_ARG"
fi

if [ -z "$SESSION" ]; then
  echo "ERROR: 未找到 tmux session，请先启动 tmux 或指定 session 名"
  echo "用法: /rec start [session_name]"
  exit 1
fi
echo "将录制 tmux session: $SESSION"
```

### 4. 启动录制

```bash
mkdir -p "$HOME/.ace/recordings"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CAST_FILE="$HOME/.ace/recordings/${TIMESTAMP}.cast"

# 保存路径信息
echo "$CAST_FILE" > "$HOME/.ace/rec.cast_path"

# 后台启动 asciinema，录制整个 tmux session 视口
# -c "tmux attach -t SESSION": asciinema 作为宿主进程 attach 到 tmux，捕获完整视口（所有 pane + status bar）
nohup asciinema rec --stdin "$CAST_FILE" -c "tmux attach -t $SESSION" > "$HOME/.ace/rec.log" 2>&1 &
ASCIINEMA_PID=$!
echo "$ASCIINEMA_PID" > "$HOME/.ace/rec.pid"

sleep 1
if kill -0 "$ASCIINEMA_PID" 2>/dev/null; then
  echo "✓ 录制已开始"
  echo "  Session : $SESSION"
  echo "  PID     : $ASCIINEMA_PID"
  echo "  保存至  : $CAST_FILE"
  echo ""
  echo "运行 /rec stop 停止录制"
else
  echo "✗ 录制启动失败，查看日志: $HOME/.ace/rec.log"
  cat "$HOME/.ace/rec.log" 2>/dev/null | tail -20
fi
```

---

## Action: stop

### 1. 检查是否在录制

```bash
PID_FILE="$HOME/.ace/rec.pid"
if [ ! -f "$PID_FILE" ]; then
  echo "当前没有进行中的录制"
  exit 0
fi

PID=$(cat "$PID_FILE")
CAST_FILE=$(cat "$HOME/.ace/rec.cast_path" 2>/dev/null || echo "")

if ! kill -0 "$PID" 2>/dev/null; then
  echo "录制进程已退出 (PID: $PID)"
  rm -f "$PID_FILE"
  [ -f "$CAST_FILE" ] && echo "本地文件: $CAST_FILE"
  exit 0
fi
```

### 2. 停止录制进程

```bash
# SIGINT 让 asciinema 优雅退出并写完文件
kill -SIGINT "$PID"
echo "已发送停止信号，等待 asciinema 写完文件..."

# 最多等 10 秒
for i in $(seq 1 10); do
  sleep 1
  if ! kill -0 "$PID" 2>/dev/null; then
    break
  fi
done

# 若还未退出则强制杀
if kill -0 "$PID" 2>/dev/null; then
  kill -SIGTERM "$PID"
  sleep 1
fi

rm -f "$PID_FILE"
```

### 3. 确认文件已保存

```bash
if [ -f "$CAST_FILE" ]; then
  SIZE=$(du -sh "$CAST_FILE" | cut -f1)
  echo "✓ 录制已保存"
  echo "  本地路径 : $CAST_FILE"
  echo "  文件大小 : $SIZE"
else
  echo "✗ 文件未找到: $CAST_FILE"
  echo "查看日志: $HOME/.ace/rec.log"
  exit 1
fi
```

### 4. 询问是否上传到 asciinema.org

**询问用户**：是否上传到 asciinema.org 获取在线分享链接？（上传免费，需要有网络，不需要账号）

- 若用户说**上传/是/yes**：执行上传步骤
- 若用户说**不/no/本地保存**：仅告知本地路径，结束

### 5. 上传（可选）

```bash
echo "正在上传到 asciinema.org..."
UPLOAD_OUTPUT=$(asciinema upload "$CAST_FILE" 2>&1)
echo "$UPLOAD_OUTPUT"

# 解析上传 URL
UPLOAD_URL=$(echo "$UPLOAD_OUTPUT" | grep -oE 'https://asciinema\.org/a/[a-zA-Z0-9]+')
if [ -n "$UPLOAD_URL" ]; then
  echo ""
  echo "✓ 上传成功！"
  echo "  在线地址 : $UPLOAD_URL"
  echo "  本地备份 : $CAST_FILE"
else
  echo "上传结果已显示，请从上方输出中找到链接"
  echo "本地备份 : $CAST_FILE"
fi
```

---

## Action: status

```bash
PID_FILE="$HOME/.ace/rec.pid"
CAST_PATH_FILE="$HOME/.ace/rec.cast_path"

if [ ! -f "$PID_FILE" ]; then
  echo "状态: 未在录制"
  echo ""
  # 列出最近的录制文件
  echo "最近录制文件:"
  ls -lt "$HOME/.ace/recordings/"*.cast 2>/dev/null | head -5 | awk '{print "  " $NF, $5, $6, $7, $8}'
  exit 0
fi

PID=$(cat "$PID_FILE")
CAST_FILE=$(cat "$CAST_PATH_FILE" 2>/dev/null || echo "unknown")

if kill -0 "$PID" 2>/dev/null; then
  SIZE=$(du -sh "$CAST_FILE" 2>/dev/null | cut -f1 || echo "?")
  SESSION=$(tmux display-message -p '#S' 2>/dev/null || echo "unknown")
  echo "状态: 录制中 🔴"
  echo "  PID      : $PID"
  echo "  Session  : $SESSION"
  echo "  文件     : $CAST_FILE"
  echo "  当前大小 : $SIZE"
else
  echo "状态: 进程已退出 (PID: $PID)"
  rm -f "$PID_FILE"
  [ -f "$CAST_FILE" ] && echo "上次保存: $CAST_FILE"
fi
```

---

## 无参数 / 帮助

显示当前状态，并提示：

```
/rec start          # 录制当前 tmux session
/rec start mysess   # 录制指定 session
/rec stop           # 停止录制
/rec status         # 查看录制状态
```

---

## 注意事项

- 录制原理：`asciinema` 作为宿主进程 attach 到 tmux session，捕获整个终端视口，包含当前窗口所有 pane 和 status bar；切换 tmux window 时，录制内容随之更新
- 文件格式：`.cast`（asciinema v2 格式），可用 `asciinema play <file>` 本地回放，或上传到 asciinema.org 在线播放
- 文件大小：长时间录制文件较大（活跃会话约 1-50 MB/小时），注意磁盘空间
- iTerm2 bug：在 macOS iTerm2 通过 SSH 连接时，录制结束后 iTerm2 可能出现渲染异常（空白帧），开新 tab 即可恢复，不影响录制文件内容
