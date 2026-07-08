# System Quality Review — Troubleshooting Guide

> 本文件记录 ace:system-quality-review skill 在实际执行中反复踩到的坑，以及对应的正确姿势。后续 agent 在执行 Phase 3-5（wiki 落盘 → base 写入 → 群通知）前应优先阅读。

---

## 1. Wiki 节点 token ≠ 文档 obj_token

### 现象
给 wiki 链接的 token 传 `--obj-type docx/doc` 调 `lark-cli wiki +node-get`，返回 `131005 not found`，容易被误判为权限问题。

### 根因
`/wiki/{token}` 里的 token 是 **wiki node token**，不是 docx obj_token。`--obj-type` 只用于裸 obj_token 查询；对 wiki node token 传 `--obj-type` 会让 CLI 去对应文档命名空间查这个 token → 必然找不到。

### 正确姿势
用完整 URL，**不带 `--obj-type`**，让 CLI 自己解析：

```bash
lark-cli wiki +node-get --as user --node-token "https://dptechnology.feishu.cn/wiki/TvV8wYrayikOrskEIhxcFfYkn7b"
```

返回里会给出 `obj_type` 和 `obj_token`（例如 bitable 表或 docx 文档）。后续 `docs +create` 时也传完整 wiki URL 作为 `--wiki-node`。

### 反例
```bash
# ❌ 错误
lark-cli wiki +node-get --as user --node-token "TvV8wYrayikOrskEIhxcFfYkn7b" --obj-type docx
# → 131005 not found
```

---

## 2. lark-cli scope 名必须以 `lark-cli auth scopes` 输出为准

### 现象
用 `--scope "docx:document:write"` 登录，整包 scope 被拒：`invalid or malformed scopes`。

### 根因
飞书 docx 写权限的 scope 名是 `docx:document`，没有 `:write` 后缀。设备授权流程是整包校验，一个非法 scope 会导致整串 scope 都被拒绝。

### 正确姿势
1. 先列出应用已开通的全部 scope：
   ```bash
   lark-cli auth scopes
   ```
2. 只使用输出清单里的 scope 名。system-quality-review 链路通常需要：
   - `wiki:node:retrieve`
   - `wiki:node:create`
   - `docx:document`
   - `docx:document:readonly`
   - `base:record:create`
   - `im:message`（群卡片）
   - `im:message.send_as_user`（内部群 user 身份发卡片）

### 反例
```bash
# ❌ 错误
lark-cli auth login --scope "docx:document:write"

# ✅ 正确
lark-cli auth login --scope "wiki:node:retrieve wiki:node:create docx:document docx:document:readonly base:record:create"
```

---

## 3. Base 字段创建：类型用字符串枚举，select 需先建选项

### 现象
- 创建字段时传 `"type": 1` 或 `"type": 3` 报 `Invalid discriminator value`。
- select 字段传 `"property": {"options": [...]}` 报 `Unrecognized key(s) in object: 'property'`。
- 写入记录时报 `not_found: Provide an existing option value`。

### 根因
1. `lark-cli base +field-create` 的 `--json` 里 `type` 必须是字符串枚举值：`text`、`select`、`user`、`number` 等，不是整数。
2. 创建 select 字段时不支持内嵌 `property`；需先创建空 select 字段，再用 `+field-update` 添加选项。
3. 写入记录前必须先确保选项存在，否则记录值无法匹配。

### 正确姿势
```bash
# 1. 创建空 select 字段
lark-cli base +field-create --as user --base-token <base> --table-id <table> \
  --json '{"name":"类型","type":"select"}'

# 2. 用 field-update 加选项（必须带 --yes）
lark-cli base +field-update --as user --base-token <base> --table-id <table> \
  --field-id <field_id> --yes \
  --json '{"name":"类型","type":"select","options":[{"name":"缺陷","color":0},{"name":"优化","color":1}]}'

# 3. 确认选项存在后再写入记录
```

### 反例
```bash
# ❌ 错误：整数 type
--json '{"name":"问题描述","type":1}'

# ❌ 错误：创建时带 property
--json '{"name":"类型","type":"select","property":{"options":[...]}}'
```

---

## 4. record-batch-create 用 `fields` + `rows`，不是 `records`

### 现象
传 `{ "records": [...] }` 报 `fields: Provide a value of type array` / `rows: Provide a value of type array` / `request: Remove unsupported fields`。

### 根因
旧版 lark-cli（1.0.42）的 `base +record-batch-create` 要求 JSON 结构为：
```json
{
  "fields": ["问题描述", "失败原因", ...],
  "rows": [
    ["...", "...", ...],
    ["...", "...", ...]
  ]
}
```
而不是 `{ "records": [{ "fields": { ... } }] }`。

### 正确姿势
```bash
cat > batch.json << 'EOF'
{
  "fields": ["问题描述", "失败原因", "复现路径", "变更文件", "类型"],
  "rows": [
    ["[project-slug] xxx", "root cause", "cmd", "file:line", "缺陷"]
  ]
}
EOF
lark-cli base +record-batch-create --as user --base-token <base> --table-id <table> --json @./batch.json
```

---

## 5. Base 高风险写操作需要 `--yes`

### 现象
`base +field-update` 报 `confirmation_required: add --yes to confirm`。

### 正确姿势
所有 `base +field-update`、`base +record-delete` 等 high-risk-write 操作都加 `--yes`：
```bash
lark-cli base +field-update --as user ... --yes --json '{...}'
```

---

## 6. jq 表达式里避免直接用中文字段名做 key

### 现象
`--jq '.data | {问题描述: ...}'` 报 `invalid jq expression: unexpected token "问"`。

### 正确姿势
- 如果字段名包含中文，用引号包裹或用数组索引：
  ```bash
  --jq '.data | {desc: ."问题描述"}'
  ```
- 更简单：先不加 `--jq` 拿到完整响应，再处理。

---

## 7. kimi-k2.6 分类器临时不可用时会拦截所有 `lark-cli` Bash 调用

### 现象
任何 `lark-cli` 命令都返回 `kimi-k2.6 is temporarily unavailable, so auto mode cannot determine the safety of Bash right now`。

### 处理
这不是权限或命令问题，是执行环境分类器短暂不可用。等 5-30 秒后重试即可。期间可以做不依赖 Bash 的只读操作（Read 文件、TaskUpdate 等）。不要无限快速重试。

---

## 8. lark-cli @file 只接受当前目录相对路径

### 现象
`--json @/tmp/xxx.json` 报 `--file must be a relative path within the current directory`。

### 正确姿势
先把文件放到当前目录（通常是项目仓库根目录），再用相对路径：
```bash
cd /data/codes/<project>
cat > ./batch.json << 'EOF'
...
EOF
lark-cli ... --json @./batch.json
```

---

## 9. 发送互动卡片的身份选择

- **内部群**：可用 `--as user` + `im:message.send_as_user` scope。
- **外部群**：必须用 `--as bot`；bot 需先入群，否则报 `230002`；user 身份发外部群报 `230027`。

---

## 10. 升级 lark-cli

旧版 CLI（如 1.0.42）与新 skill 文档的参数格式可能脱节。建议执行前升级：
```bash
lark-cli update
```

---

## 快速检查清单（每次执行 Phase 3-5 前）

- [ ] wiki node 用完整 URL，不加 `--obj-type`
- [ ] `lark-cli auth status` 已包含所需 scope
- [ ] base table 存在且字段已创建（`+field-list`）
- [ ] select 字段选项已预创建（`+field-list` 看 options）
- [ ] batch JSON 使用 `fields`/`rows` 格式
- [ ] 高风险写操作带 `--yes`
- [ ] @file 路径是相对当前目录
- [ ] 群是外部还是内部已确认，bot 已在群内
