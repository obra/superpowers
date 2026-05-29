# Rinoedu Epic Workflow Skills (rino-s9s)

Bản fork nội bộ của **Superpowers framework** ([obra/superpowers](https://github.com/obra/superpowers)), bổ sung bộ skill chuẩn hoá quy trình spec Epic → User Story → sub-task của Rinoedu.

Tài liệu này dành cho các kỹ sư trong team. Đọc kỹ trước khi cài đặt.

---

## 1. Tổng quan

`rino-s9s` giữ nguyên toàn bộ năng lực của Superpowers (brainstorming, writing-plans, subagent-driven-development, TDD…) và bổ sung 4 skill phục vụ quy trình nội bộ.

| Skill | Pass | Vai trò |
|---|---|---|
| `creating-epic-context` | 1 | Pull Epic từ Jira, sinh Epic Context Document |
| `mapping-us-dependencies` | 1 | Phân tích phụ thuộc giữa các US, xuất thứ tự brainstorm |
| `speccing-story` | 1 | Brainstorm spec từng US, kèm T-shirt size và đánh giá rủi ro |
| `creating-jira-subtasks` | 2 | Sinh sub-task trên Jira từ implementation plan |

Bộ skill chạy được trên **Claude Code, Cursor, Codex, OpenCode** — bất kỳ platform nào hỗ trợ Superpowers.

Chi tiết workflow xem mục [Workflow Overview](#5-workflow-overview).

---

## 2. Yêu cầu trước khi cài

- Một trong các coding agent: Claude Code, Cursor, Codex, OpenCode
- Git đã cấu hình `user.name` và `user.email`
- Quyền truy cập Atlassian (Jira và Confluence) của Rinoedu

---

## 3. Cài đặt

`rino-s9s` là fork đầy đủ của Superpowers, **cài trực tiếp từ repo này** thay vì cài Superpowers gốc rồi thả skill riêng. Không cần repo phụ.

### 3.1. Claude Code

Cài qua git URL trực tiếp:

```
/plugin marketplace add huynq-blip/rino-s9s
/plugin install rino-s9s@rino-s9s-dev
```

Nếu lệnh trên không nhận git URL, dùng cách thủ công:

```bash
git clone https://github.com/huynq-blip/rino-s9s.git ~/.claude/plugins/rino-s9s
```

Sau đó khởi động lại Claude Code.

### 3.2. Cursor

```bash
git clone https://github.com/huynq-blip/rino-s9s.git ~/.cursor/plugins/rino-s9s
```

Cursor sẽ phát hiện plugin trong thư mục `.cursor-plugin/` của fork. Khởi động lại Cursor.

### 3.3. Codex

```bash
mkdir -p ~/.codex/superpowers
cd ~/.codex/superpowers
git clone https://github.com/huynq-blip/rino-s9s.git .
mkdir -p ~/.codex/skills
```

Thêm vào `~/.codex/AGENTS.md`:

```markdown
## Superpowers System
You have superpowers. RIGHT NOW run:
`~/.codex/superpowers/.codex/superpowers-codex bootstrap`
and follow the instructions it returns.
```

### 3.4. OpenCode

Thêm vào `opencode.json`:

```json
{
  "plugin": ["superpowers@git+https://github.com/huynq-blip/rino-s9s.git"]
}
```

Khởi động lại OpenCode.

### 3.5. Kết nối Atlassian MCP

4 skill nội bộ gọi Jira và Confluence qua Atlassian MCP server.

| Thông số | Giá trị |
|---|---|
| Cloud ID | `1b3f06bb-40bc-43b5-abb8-f0b0eb04c3db` |
| Jira project key | `IL` (Innovation Lab) |

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

Lần đầu chạy skill sẽ kích hoạt OAuth Atlassian, đăng nhập bằng tài khoản công ty.

Cursor, Codex, OpenCode: tham khảo tài liệu MCP riêng của từng platform để thêm Atlassian server tương đương.

### 3.6. Kiểm tra cài đặt

Mở session mới, gửi:

```
Set up epic context for IL-XX
```

Thay `IL-XX` bằng key của một Epic thực tế có quyền đọc.

Kết quả mong đợi:
1. Agent announce: `I'm using the creating-epic-context skill...`
2. Agent pull được Epic từ Jira qua MCP
3. Agent bắt đầu sinh Epic Context Document

Nếu skill không trigger:

- Kiểm tra skill tồn tại trong repo đã clone: `ls skills/creating-epic-context/SKILL.md`
- Kiểm tra frontmatter: file `SKILL.md` phải bắt đầu bằng `---` rồi tới `name:` và `description:`
- Khởi động lại session — skill chỉ được nạp khi bắt đầu session mới
- Thử gọi tường minh: `Use the creating-epic-context skill to set up epic IL-XX`

---

## 4. Cập nhật

Khi `rino-s9s` có phiên bản mới:

```bash
cd <thư mục đã clone>     # ví dụ ~/.claude/plugins/rino-s9s
git pull
```

Khởi động lại session để nạp lại skill và bản cập nhật core.

### Đồng bộ với upstream `obra/superpowers`

Maintainer của repo thực hiện định kỳ:

```bash
git remote add upstream https://github.com/obra/superpowers.git
git fetch upstream
git merge upstream/main
# resolve conflict trong thư mục skills/ nếu có
git push origin main
```

Người dùng cuối chỉ cần `git pull` trên fork.

---

## 5. Workflow Overview

Quy ước 3 Pass nội bộ:

```
PASS 1 — Discovery (đầu Epic, 1-2 ngày)
  ├─ creating-epic-context        chạy một lần
  ├─ mapping-us-dependencies      chạy một lần, xuất thứ tự brainstorm
  └─ speccing-story               lặp, từng US theo thứ tự
                                  output: spec + T-shirt size + risk
                                  KHÔNG viết Plan ở Pass này

⏸ Stakeholder review estimate → approve timeline

PASS 2 — Sprint preparation (trước mỗi sprint)
  ├─ writing-plans (Superpowers)  plan cho US sắp code
  └─ creating-jira-subtasks       sinh sub-task từ plan, confirm, ghi Jira

PASS 3 — Execution (trong sprint)
  └─ TDD + subagent-driven-development (Superpowers)
                                  code, review, merge
```

### Nguyên tắc thiết kế

- **Pass 1 không viết Plan.** Plan bind vào codebase tại thời điểm viết; chỉ tạo Plan ở Pass 2, sát sprint.
- **Pass 2 không viết Plan cả lượt cho Epic.** Chỉ viết cho 4-5 US của sprint sắp tới.
- **Sub-task tạo sau Plan, trước Code.** Không tạo ở Pass 1 (chưa biết breakdown), không tạo sau Code (đã chạy xong).
- **Estimate Pass 1 là ước lượng thô.** Margin thực tế ±40-50% cho Epic đầu chưa có historical data; siết về ±25-30% sau 2-3 sprint calibrate.
- **Mọi action ghi vào Jira hoặc Confluence cần xác nhận tường minh** trong chat trước khi skill gọi MCP.

---

## 6. Tham chiếu

- Upstream Superpowers: https://github.com/obra/superpowers
- Atlassian Remote MCP: https://www.atlassian.com/platform/remote-mcp-server
- Rinoedu Atlassian Cloud ID: `1b3f06bb-40bc-43b5-abb8-f0b0eb04c3db`
- Jira project IL (Innovation Lab): nơi PoC các initiative AI và workflow nội bộ

---

## 7. Hỗ trợ

Vấn đề về cài đặt hoặc sử dụng skill: mở issue trong repo này hoặc liên hệ team AI nội bộ.