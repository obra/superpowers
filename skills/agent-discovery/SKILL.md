---
name: agent-discovery
description: "Agent Discovery — 团队服务 owner 路由：遇到我们研发的系统（ace / hyper-fib / hyperdata / ace-xxx / hyper-xxx）的 bug 时查该上报给谁；遇到不好解决的问题时在飞书群 @ 对应的人或 bot 寻求帮助。供用户直接调用，也供其他 skill（如 ace:system-quality-review）在发飞书消息时查 owner。"
user-invocable: true
---

# Agent Discovery — 服务负责人路由

回答两个问题：**这个系统的 bug 该报给谁？** 和 **这个难题该 @ 谁求助？** 查表 → 在飞书群发消息并 @ 对应 owner。整条链路已实测验证（2026-07-09，message_id `om_x100b6bdb70478c80c3538642fa3ec4f`，@人 与 @bot 均解析为真实 mention）。

## When to use

- 用户或 agent 遇到 ace / hyper-* 系列系统的 bug，需要知道上报给谁、并把 bug 发到群里 @ 对应 owner。
- 用户或 agent 遇到不好解决的问题（环境、权限、依赖、架构决策等），需要在飞书群 @ 人/agent 寻求帮助。
- 其他 skill 需要按项目查 owner（如 system-quality-review 的日报卡片 @ 项目负责人）。

## Owner 路由表（唯一事实源）

| 服务 | 类型 | 名称 | id（open_id / bot_id） |
|------|------|------|------------------------|
| ace | bot | hyper-instrument | `ou_2a0b3e6edcbca832452757b5bd043ed9` |
| hyper-data | 人 | 杜卓然 | `ou_da4b3a6a463472241d91e56be0011822` |
| hyper-fib | 人 | 苗宏图 | `ou_f4b53eba875ad32fbe8e016c94de2180` |

- **服务名宽松匹配**：`hyper-data` / `hyperdata` / `hyper_data` 视为同一服务，其余同理。
- **默认群**：HyperEM `oc_335cc3ff0ab0f353fa920fed387d5162`（外部群，**发消息一律 `--as bot`**）。
- **兜底联系人**：刘鹏 `ou_aa1da0fb8d5b42eb69389ba4eca58303`。

### 未登记服务的处理协议

遇到表里没有的服务（其他 ace-xxx / hyper-xxx）时**不要猜 owner**：

1. 在群里 @ 兜底联系人（刘鹏）询问该服务的 owner。
2. 拿到答案后，**立即把新路由写进上表，commit + push 本仓库**——每日 session 全新、跨机器唯一共享的记忆就是本文件（同 system-quality-review 的路由登记协议：只在会话里问到而不写回 = 没解决）。

## 用法 1 — bug 上报

1. 从用户/调用方描述中识别服务名，查路由表拿 owner。
2. 发送前收集最小必要信息：项目、现象一句话、复现命令或场景（有则带上）、环境。
3. 发到群里（文本消息 at 语法见下），模板：

```
🐛 [<服务> bug 上报] <at user_id="<owner_id>"></at>
· 项目: <服务>
· 现象: <一句话>
· 复现: <命令或场景，可选>
· 环境: <机器/分支/commit，可选>
· 上报方: <用户名或 agent 名>
```

## 用法 2 — 求助

1. 判断问题所属服务：能对应到路由表的 @ 该服务 owner；跨服务或归属不清的 @ 兜底联系人。
2. 求助消息必须自带上下文（已尝试什么、卡在哪、期望什么帮助），不发只有一句"帮忙看下"的消息。模板：

```
🙋 [求助·<服务或主题>] <at user_id="<owner_id>"></at>
· 问题: <一句话>
· 已尝试: <做过什么、结果如何>
· 卡点: <当前具体障碍，带报错/file:line 更好>
· 期望: <需要对方做什么>
```

## 发消息命令

```bash
# 文本消息（@ 用 at 标签，user 和 bot 的 ou_ id 都适用）
lark-cli im +messages-send --as bot --chat-id oc_335cc3ff0ab0f353fa920fed387d5162 \
  --msg-type text --content '{"text":"🐛 [ace bug 上报] <at user_id=\"ou_2a0b3e6edcbca832452757b5bd043ed9\"></at>\n· 现象: ..."}'

# 互动卡片里 @（lark_md 元素内）
# <at id=ou_xxx></at>
```

发送后可读回验证 mention 是否真实解析（`mentions` 数组非空才算成功）：

```bash
lark-cli im +chat-messages-list --as bot --chat-id oc_335cc3ff0ab0f353fa920fed387d5162 \
  --sort desc --page-size 1 --jq '.data.messages[0] | {message_id, mentions}'
```

## id 速查缓存（HyperEM 群，2026-07-09 解析）

路由表之外需要 @ 其他人时直接查这里，**不要再调 chat.members**（提速）。成员变动或 @ 解析失败时才按下节命令刷新本表。

**人（21）：**

| 姓名 | open_id |
|------|---------|
| 刘鹏 | `ou_aa1da0fb8d5b42eb69389ba4eca58303` |
| 杜卓然 | `ou_da4b3a6a463472241d91e56be0011822` |
| 苗宏图 | `ou_f4b53eba875ad32fbe8e016c94de2180` |
| 张泽中 | `ou_7d4395c96b4c615901a6cc31a39930cf` |
| 雨林中的山丘 | `ou_baa1a6ab965de22e49ce91bcc98683d3` |
| 段智峰 | `ou_1afb6099b902c8b28052bb48e166278a` |
| 陈桂森 | `ou_3752ca8840654d9f36976aaba1457bf6` |
| 彭倩雯 | `ou_5880ba073ba6e54faf5b07cc9db0fba1` |
| 鞠书波 | `ou_911c79147ab8e9243e5fba5577fba062` |
| 梁聿 | `ou_b2e74ff01bb6760157c64c8b2ee2d21e` |
| 赖弘龙 | `ou_8c8f4c3b38eb9bd8b83206763643dc8e` |
| 颜啸峰 | `ou_429fd55faf9f6a245523e778f74647c3` |
| 熊智恒 | `ou_6e9d0990a6128e4cc9a72d0c11f69b90` |
| 宋知远 | `ou_18ccb6fed5f2336e88bdfe82f6e36fd7` |
| 杨天宇 | `ou_fc78ccb4b78c1cfe6680bb9e042d2a18` |
| 李一 | `ou_20fb9e600dc9202023e69120e6af56c6` |
| 尤恺宇 | `ou_15fb04fb35d69f43a45bb1dea192f386` |
| 黄俊晨 | `ou_d5809a4e5816eddbcd8df3e7a17028f7` |
| 许科 | `ou_961a8fd0bddbf2dbd24594a6361cceb5` |
| 曹阳 | `ou_6a3002a10a74b408842b9c54b2b6f3b8` |
| 詹夏瑞 | `ou_1f8198dc46090ee1e9db72517bf2e38f` |

**bot（3）：**

| bot 名 | bot_id |
|--------|--------|
| hyper-instrument | `ou_2a0b3e6edcbca832452757b5bd043ed9` |
| openclaw-19.234 | `ou_caf04603e86aa0a6bd94575b42b4cff4` |
| 刘鹏的飞书 CLI（本 skill 的发送身份，别 @ 自己） | `ou_e63be60eb50add483de2efd432c1aedf` |

## id 的获取与维护

- 群成员（人）的 open_id：`lark-cli im chat.members get --as bot --page-all --params '{"chat_id":"<chat_id>","member_id_type":"open_id"}'`——bot 身份可用，不需要 `contact:user:search` scope（该 scope 常缺）。
- 群内 bot 的 bot_id：`lark-cli im chat.members bots --as bot --params '{"chat_id":"<chat_id>"}'`，返回的 `bot_id` 是 `ou_` 形式，可直接放进 at 标签。
- owner 不在群里时先拉人进群或改走私聊，别对着群发一个群里不存在的 @（不会解析）。

## 已知坑

- **外部群必须 `--as bot`**：HyperEM 是外部群，user 身份发送被平台拒（230027）；bot 不在群报 230002。前置条件链见 system-quality-review 的「已知坑」。
- **@bot 可行**：用 `chat.members bots` 返回的 `ou_` 形式 bot_id 走 `<at user_id="...">`，已实测解析成功；不要用 `cli_` 开头的 app_id 放进 at 标签。
- 任何 lark-cli 操作报错，先查 `skills/system-quality-review/trouble_shooting.md`（scope、token 解析、@file 路径等通用坑都在那里）。
