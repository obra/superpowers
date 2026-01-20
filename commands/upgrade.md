---
description: 运行 Horspowers 版本升级助手（检测并迁移旧版本内容）
---

运行 Horspowers 版本升级脚本，处理从 4.2.0 以前版本的升级。

该脚本会：
1. 检测是否存在 `document-driven-ai-workflow` 目录
2. 询问是否需要移除该目录（因为新版本已内置其功能）
3. 执行文档目录到统一 `docs/` 结构的迁移

请在项目根目录运行此命令。

## 命令行选项（直接运行脚本时可用）：

- `--skip-ddaw` - 跳过 DDAW 目录检测和移除
- `--skip-docs` - 跳过文档迁移
- `--quiet, -q` - 静默模式
