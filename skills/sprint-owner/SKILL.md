---
name: sprint-owner
description: "Sprint 主持人助手（Hyper Instrument）：每两周一次 Sprint 的主持人查表、准备 Sprint 沟通文档（复制上期 + 需求拆分为新需求/上周未完成）、整理 release note、每周五提醒大家写工作内容并上传周报、以及周期结束时按排班表 @ 下一位主持人。供主持人直接调用，也供定时任务（cron）自动触发。"
user-invocable: true
---

# Sprint 主持人助手（Hyper Instrument）

每两周一次的 Sprint 由一位轮值主持人负责。本 skill 把主持人的例行事务固化成可执行流程 + 现成命令：**算出当前是第几个 Sprint、谁主持** → **准备文档 / 整理 release note / 提醒周报 / 交接下一位主持人**。

> **执行从松原则**：周会 SOP（[wiki](https://dptechnology.feishu.cn/wiki/Ih29wLfnviFIYFk7gsWclUFZn3g)）是理想流程，但当前不严格执行。例如某项目当期无迭代（如 FibSEM 暂停迭代）时**不必发版**。判断不了要不要做某一步时，按“对团队有用就做，纯走形式就跳过”，拿不准就先问人。

## When to use

- 轮到自己主持 Sprint，需要准备沟通文档、主持进度对齐会、整理 release note。
- 每周五（或定时任务触发）提醒大家填写本周工作内容并上传周报。
- 一个 Sprint 周期结束，需要按排班表提醒下一位主持人接棒。
- 定时任务（cron）触发，让 agent 判断“今天该做哪一步”并执行。

## When NOT to use

- 与 Sprint 主持无关的一次性飞书操作（发普通消息、读文档）——直接用对应 lark-* skill。
- bug 上报 / 求助 / merge 通知的 owner 路由——走 `ace:agent-discovery`。

---

## 一、事实源（唯一权威数据）

### 1.1 排班（两周轮回，7 人循环）

排班表原文：[Sprint 负责人排班](https://dptechnology.feishu.cn/wiki/IItewIAvuiGszDkGM4RcelqunVf)。**从 Sprint 15 起**为干净的 7 人循环，顺序固定：

| 顺位 | 姓名 | open_id（用于 @） |
|------|------|--------------------|
| 0 | 刘鹏 | `ou_aa1da0fb8d5b42eb69389ba4eca58303` |
| 1 | 苗宏图 | `ou_f4b53eba875ad32fbe8e016c94de2180` |
| 2 | 段智峰 | `ou_1afb6099b902c8b28052bb48e166278a` |
| 3 | 颜啸峰 | `ou_429fd55faf9f6a245523e778f74647c3` |
| 4 | 陈桂森 | `ou_3752ca8840654d9f36976aaba1457bf6` |
| 5 | 张泽中 | `ou_7d4395c96b4c615901a6cc31a39930cf` |
| 6 | 杜卓然 | `ou_da4b3a6a463472241d91e56be0011822` |

- **主持人公式**：Sprint N（N≥15）主持人 = 顺位 `(N-15) mod 7`。
- **周期**：每个 Sprint 14 天，周一起 → 两周后周一止。Sprint 15 起始 **2026-07-20**（周一），结束 **2026-08-03**。
- ⚠️ **颜啸峰 open_id 备注**：排班表原文 reference_map 里 颜啸峰 记为 `ou_bdeda50236a3c29418c8df9125af7b9f`，但 HyperEM 群实际成员表和 Sprint 15 文档都是 `ou_429fd55faf9f6a245523e778f74647c3`（本表采用后者）。首次 @ 到颜啸峰时读回验证 `mentions` 非空；若解析失败再用 `ace:agent-discovery` 的 id 缓存刷新。

近期排期（可直接查，避免日期算错）：

| Sprint | 起(周一) | 止(周一) | 主持人 |
|--------|----------|----------|--------|
| 15 | 2026-07-20 | 2026-08-03 | 刘鹏 |
| 16 | 2026-08-03 | 2026-08-17 | 苗宏图 |
| 17 | 2026-08-17 | 2026-08-31 | 段智峰 |
| 18 | 2026-08-31 | 2026-09-14 | 颜啸峰 |
| 19 | 2026-09-14 | 2026-09-28 | 陈桂森 |
| 20 | 2026-09-28 | 2026-10-12 | 张泽中 |
| 21 | 2026-10-12 | 2026-10-26 | 杜卓然 |
| 22 | 2026-10-26 | 2026-11-09 | 刘鹏 |

超出本表时用下面的脚本按锚点计算，不要手推日期。

### 1.2 关键资源

| 资源 | 标识 |
|------|------|
| 周会 SOP（含各类模板子页） | wiki `Ih29wLfnviFIYFk7gsWclUFZn3g` |
| Sprint 模板（子页） | docx `OJ39d5RaSocywExJyVGccduHnDC` |
| 排班表 | wiki `IItewIAvuiGszDkGM4RcelqunVf` |
| Sprint 15 沟通文档（复制范本） | wiki `TqNlwNTvSi4Y5Akj5MKcsGkJnec` |
| 周报多维表格 | wiki `HmELwO6B5iJtUdk26ZXcz4Orn7d` · base `RF6abBSWBajzCbsmIlZcIjQpnqg` · table `tbl0AdwHBk1WgimO` |
| HyperEM 群（外部群，发消息一律 `--as bot`） | `oc_335cc3ff0ab0f353fa920fed387d5162` |

### 1.3 计算当前 Sprint / 主持人 / 处于周期第几天

```bash
python3 - <<'PY'
from datetime import date
anchor = date(2026, 7, 20)  # Sprint 15 起始（周一）
owners = ["刘鹏","苗宏图","段智峰","颜啸峰","陈桂森","张泽中","杜卓然"]
oid = {"刘鹏":"ou_aa1da0fb8d5b42eb69389ba4eca58303","苗宏图":"ou_f4b53eba875ad32fbe8e016c94de2180",
       "段智峰":"ou_1afb6099b902c8b28052bb48e166278a","颜啸峰":"ou_429fd55faf9f6a245523e778f74647c3",
       "陈桂森":"ou_3752ca8840654d9f36976aaba1457bf6","张泽中":"ou_7d4395c96b4c615901a6cc31a39930cf",
       "杜卓然":"ou_da4b3a6a463472241d91e56be0011822"}
today = date.today()
k = (today.toordinal() - anchor.toordinal()) // 14
sprint = 15 + k
start = date.fromordinal(anchor.toordinal() + 14 * k)
end = date.fromordinal(start.toordinal() + 14)
owner = owners[k % 7]
nxt = owners[(k + 1) % 7]
day_in = today.toordinal() - start.toordinal()  # 0..13
print(f"今天={today}  Sprint {sprint}  主持={owner} {oid[owner]}")
print(f"周期 {start} → {end}  第 {day_in} 天(0起)")
print(f"下期 Sprint {sprint+1} 主持={nxt} {oid[nxt]}")
print(f"是否周五提醒日: {today.weekday()==4}")
print(f"是否周期最后一天(交接日): {day_in==13}")
PY
```

判断“今天该做什么”（供 cron）：
- `today.weekday()==4`（周五）→ **周报提醒**（见三）。
- `day_in==13`（周期最后一天，第二个周日）或 `day_in==0`（新周期第一天）→ **交接下一位主持人**（见五）；新周期开始前主持人应已**准备好沟通文档**（见二）。

---

## 二、准备 Sprint 沟通文档

**规则（重要）**：每期文档 = **把上一期文档整份复制**过来，模板结构保留；把需求区拆成两部分——**① 新需求**、**② 上周未完成**（从上期未勾选 / 未完成项挪过来）。

1. 找到上一期沟通文档（上表给的是 Sprint 15；后续每期主持人把最新一期链接更新回 §1.2）。用 `lark-drive` 复制，**不要**用 fetch+create 重建正文：
   ```bash
   # 复制上一期文档为新副本（标题改成新 Sprint 号）
   lark-cli drive files copy --file <上期docx_token> --type docx \
     --name "Sprint 进度对齐会（Hyper Instrument） sprint-<N>" --as user
   ```
2. 打开新副本，逐项目更新：
   - 顶部 callout 的 **本次 Sprint 周期** 改成本期 `起 → 止`。
   - “本期 sprint 负责人”改成本期主持人。
   - 每个项目的需求区拆成 **新需求** 与 **上周未完成**：上期未勾选的 `checkbox done="false"` 项 → 归入“上周未完成”；本期新增 → 归入“新需求”。
   - 清空上期的会议纪要正文（保留“会议纪要模板”结构），更新“文档维护人 / 最后更新”。
   编辑用 `lark-doc +update`（局部 `str_replace` / `block_*`，默认 XML）。
3. 把新文档链接贴回 HyperEM 群，通知大家会前更新自己模块。

参考模板结构（Sprint 模板 docx `OJ39d5RaSocywExJyVGccduHnDC`）：整体目标 / 本期核心功能（新功能·优化）/ pending / 外部依赖 / 验收标准 / 时间节点与 Sprint 拆分 / 关键路径。

---

## 三、每周五提醒周报

**每周五**提醒所有人：① 更新沟通文档里自己模块的进展；② 把本周周报填进多维表格。

周报表头（已设计，`base RF6abBSWBajzCbsmIlZcIjQpnqg` / `table tbl0AdwHBk1WgimO`）：
`姓名`(主字段) · `所属项目/模块` · `周期 Sprint` · `本周工作内容` · `下周计划` · `风险与阻塞` · `状态`(🟢正常/🟡有风险/🔴阻塞) · `提交人`(自动) · `提交时间`(自动)。

发提醒（外部群，`--as bot`）：

```bash
lark-cli im +messages-send --as bot --chat-id oc_335cc3ff0ab0f353fa920fed387d5162 \
  --msg-type text --content '{"text":"📝 [周报提醒·Sprint <N>] 今天周五，请各位在下班前：\n1) 更新 Sprint 沟通文档里自己模块的进展\n2) 填写本周周报 → https://dptechnology.feishu.cn/wiki/HmELwO6B5iJtUdk26ZXcz4Orn7d?table=tbl0AdwHBk1WgimO&view=vew9HKcRzv\n（本周工作内容 + 下周计划 + 风险，状态记得选 🟢/🟡/🔴）"}'
```

可选：临近截止时，对照周报表已提交人名单，只 @ 未提交的人（`lark-cli base +record-list` 拉 `姓名`/`提交人`，与群成员比对后补一条 @ 提醒）。

---

## 四、整理 Release Note（从松）

**先判断本期是否需要发版**：某服务本期无迭代（如 FibSEM 暂停）→ 跳过。有实质发布内容的服务才整理。

方法（SOP 的 prompt）：审查本期合并到 `release/<n>` 的所有 PR（需求都在 PR 里），结合开发进度，参考既往 release note 格式，生成新 tag + release note，分“本期核心功能 / 优化”两部分列条目。GitHub 仓库如 `dptech-corp/hyper-fib`：

```bash
# 看本期合并的 PR，作为 release note 素材
gh pr list --repo dptech-corp/hyper-fib --state merged --base release/<n> --limit 50
# 参考既往格式
gh release view v0.0.4 --repo dptech-corp/hyper-fib
```

生成的 release note 先给主持人过目确认，再打 tag / 发布——**不要**未经确认直接对外发布。

---

## 五、周期结束交接下一位主持人

周期最后一天 / 新周期第一天，用 §1.3 脚本算出 **下一位主持人**，在 HyperEM 群 @ 他交接：

```bash
lark-cli im +messages-send --as bot --chat-id oc_335cc3ff0ab0f353fa920fed387d5162 \
  --msg-type text --content '{"text":"🔄 [Sprint 交接] Sprint <N> 结束，下一期 Sprint <N+1>（<起> → <止>）由 <at user_id=\"<下位open_id>\"></at> 主持。\n接棒事项：\n1) 复制上期沟通文档建 Sprint <N+1> 文档（需求拆新需求/上周未完成）\n2) 组织进度对齐会\n3) 每周五提醒周报\n4) 有迭代的服务整理 release note\n排班表: https://dptechnology.feishu.cn/wiki/IItewIAvuiGszDkGM4RcelqunVf"}'
```

发送后读回验证 @ 解析成功：

```bash
lark-cli im +chat-messages-list --as bot --chat-id oc_335cc3ff0ab0f353fa920fed387d5162 \
  --sort desc --page-size 1 --jq '.data.messages[0] | {message_id, mentions}'
```

---

## 发消息注意事项

- HyperEM 是**外部群**，发消息**一律 `--as bot`**。
- `@` 用文本消息里的 `<at user_id="ou_xxx"></at>`；发后读回确认 `mentions` 非空才算成功。
- **周报提醒、交接提醒**属于例行通知，cron 触发可直接发。
- **对外发布 release note、新建/大改文档**这类不易撤回的动作，先把草稿给主持人确认再执行。
- 找不到某人 open_id 或本表与实际群成员冲突时，用 `ace:agent-discovery` 的 id 缓存核对刷新，并把更正写回本文件。

## 定时任务（cron）

用户会另建定时任务触发本 skill。cron 触发时：跑 §1.3 脚本 → 按“今天该做什么”分支执行（周五发周报提醒 / 周期末发交接提醒）。每期主持人换人后，记得把 §1.2 的“最新一期沟通文档”链接更新回本文件并提交。
