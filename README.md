# Rinoedu Epic Workflow Skills

Bộ skill mở rộng cho **Superpowers framework** ([obra/superpowers](https://github.com/obra/superpowers)), phục vụ quy trình spec Epic → User Story → sub-task của Rinoedu.

Skill chạy được trên **Claude Code, Cursor, Codex, OpenCode** — bất kỳ platform nào hỗ trợ Superpowers.

---

## Skill có gì

Bộ 4 skill bao trùm Pass 1 (discovery) và đầu Pass 2 (sub-task) của workflow:

| Skill | Pass | Khi nào chạy |
|---|---|---|
| `creating-epic-context` | Pass 1 | Đầu Epic — pull Epic từ Jira, sinh Epic Context Document |
| `mapping-us-dependencies` | Pass 1 | Sau Epic context — phân tích phụ thuộc giữa các US, ra thứ tự brainstorm |
| `speccing-story` | Pass 1 | Lặp, từng US — brainstorm spec + T-shirt size + risk |
| `creating-jira-subtasks` | Pass 2 | Sau `writing-plans` của Superpowers, trước khi code |

Chi tiết workflow xem [Workflow Overview](#workflow-overview) ở cuối README.

---

## Cài đặt

### Yêu cầu trước

- Một trong các coding agent: **Claude Code**, **Cursor**, **Codex**, hoặc **OpenCode**
- **Git** cấu hình sẵn (`user.name`, `user.email`)
- **Quyền truy cập Atlassian** (Jira + Confluence) của Rinoedu

### Bước 1 — Cài Superpowers framework

Chọn theo platform anh dùng:

#### Claude Code

Trong session Claude Code đang mở:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

#### Cursor

1. Mở Cursor → mục Plugins/Extensions
2. Tìm "Superpowers" trong marketplace → Install

#### Codex

```bash
mkdir -p ~/.codex/superpowers
cd ~/.codex/superpowers
git clone https://github.com/obra/superpowers.git .
mkdir -p ~/.codex/skills
```

Thêm vào `~/.codex/AGENTS.md`:

```markdown
## Superpowers System
You have superpowers. RIGHT NOW run:
`~/.codex/superpowers/.codex/superpowers-codex bootstrap`
and follow the instructions it returns.
```

#### OpenCode

Thêm vào `opencode.json`:

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
}
```

Khởi động lại OpenCode.

**Verify Superpowers đã cài đúng:** mở session mới, gõ "Help me plan a new feature". Nếu agent hỏi clarify requirement thay vì nhảy thẳng vào code → cài đúng.

### Bước 2 — Cài skill Rinoedu

Skill Rinoedu được đặt vào `~/.claude/skills/` để Superpowers tự discover. Cơ chế này dùng được cho cả Claude Code, Cursor, Codex, OpenCode.

```bash
# Clone repo skill vào đúng vị trí Superpowers quét
git clone https://github.com/<rinoedu-org>/claude-skills.git ~/.claude/skills

# Nếu folder ~/.claude/skills đã tồn tại với skill khác:
cd ~/.claude/skills
git clone https://github.com/<rinoedu-org>/claude-skills.git rinoedu
# Hoặc copy thủ công từng thư mục skill vào ~/.claude/skills/
```

**Cấu trúc sau khi cài:**

```
~/.claude/skills/
├── creating-epic-context/
│   └── SKILL.md
├── mapping-us-dependencies/
│   └── SKILL.md
├── speccing-story/
│   └── SKILL.md
└── creating-jira-subtasks/
    └── SKILL.md
```

### Bước 3 — Kết nối Atlassian MCP

4 skill này gọi Jira/Confluence qua Atlassian MCP server. Anh cần Claude Code (hoặc platform tương ứng) nối được Atlassian MCP của Rinoedu.

**Cloud ID:** `1b3f06bb-40bc-43b5-abb8-f0b0eb04c3db`
**Jira project:** `IL` (Innovation Lab)

**Claude Code** — thêm vào `.mcp.json` của project hoặc cấu hình MCP cá nhân:

```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

Lần đầu chạy skill, sẽ có prompt OAuth Atlassian — đăng nhập bằng tài khoản công ty.

**Cursor/Codex/OpenCode:** xem tài liệu MCP của từng platform để thêm Atlassian server tương đương.

### Bước 4 — Verify cài đặt

Mở session mới trong agent, gõ:

```
Set up epic context for IL-XX
```

(thay `IL-XX` bằng key của một Epic thật anh có quyền đọc)

Nếu agent:
- Báo "I'm using the creating-epic-context skill..." → skill load đúng ✓
- Pull được Epic từ Jira → MCP nối đúng ✓
- Bắt đầu sinh Epic Context Document → workflow chạy ✓

Nếu skill không trigger:

1. Check file path: `ls ~/.claude/skills/creating-epic-context/SKILL.md` phải tồn tại
2. Check frontmatter: file SKILL.md phải bắt đầu bằng `---` rồi tới `name:` và `description:`
3. Restart session (Superpowers chỉ load skill khi session start)
4. Thử gọi tường minh: "Use the creating-epic-context skill to set up epic IL-XX"

---

## Cập nhật skill

Khi repo skill có update:

```bash
cd ~/.claude/skills
git pull
```

Restart session để Superpowers load lại.

---

## Workflow Overview

3 Pass — quy ước nội bộ Rinoedu:

```
PASS 1: Discovery (đầu Epic, 1-2 ngày)
  ├─ creating-epic-context        ← chạy 1 lần
  ├─ mapping-us-dependencies      ← chạy 1 lần, ra thứ tự brainstorm
  └─ speccing-story               ← lặp từng US theo thứ tự
                                    output: spec + size + risk
                                    KHÔNG viết Plan ở Pass này

⏸ Stakeholder xem estimate → approve timeline (margin ±40-50%, là honest)

PASS 2: Sprint preparation (trước mỗi sprint)
  ├─ writing-plans (Superpowers)  ← plan cho US sắp code
  └─ creating-jira-subtasks       ← tạo sub-task từ plan
                                    → confirm → tạo trên Jira

PASS 3: Execution (trong sprint)
  └─ TDD + subagent-driven-development (Superpowers)
                                    code, review, merge
```

### Nguyên tắc xuyên suốt

- **Pass 1 không viết Plan** — Plan bind vào codebase tại thời điểm viết, để Pass 2 sát sprint mới fresh.
- **Pass 2 không viết Plan cả lượt cho Epic** — chỉ cho 4-5 US của sprint sắp tới, tránh Plan outdated.
- **Sub-task tạo sau Plan, trước Code** — không trước Plan (chưa biết breakdown), không sau Code (đã tạo rồi).
- **Mọi action ghi vào Jira (tạo sub-task, write Confluence) đều cần confirm tường minh** trong chat trước khi gọi MCP.

---

## Tài liệu liên quan

- Superpowers framework: https://github.com/obra/superpowers
- Atlassian MCP: https://www.atlassian.com/platform/remote-mcp-server
- Rinoedu Cloud ID: `1b3f06bb-40bc-43b5-abb8-f0b0eb04c3db`
- Jira project IL: Innovation Lab — nơi PoC các initiative AI/workflow

## Hỗ trợ

Vướng mắc khi cài hoặc dùng skill: mở issue trong repo này hoặc liên hệ team AI nội bộ.