# 更新日志

## \[5.0.5] - 2026-03-17

### 修复

* **Brainstorm 服务器 ESM 修复**：将 `server.js` 重命名为 `server.cjs`，以便 Brainstorm 服务器在 Node.js 22+ 上正确启动，因为在 Node.js 22+ 中，根目录的 `package.json` `"type": "module"` 会导致 `require()` 失败。([PR #784](https://github.com/obra/superpowers/pull/784) 由 @sarbojitrana 提交，修复了 [#774](https://github.com/obra/superpowers/issues/774), [#780](https://github.com/obra/superpowers/issues/780), [#783](https://github.com/obra/superpowers/issues/783))
* **Brainstorm 在 Windows 上的所有者进程 PID**：在 Windows/MSYS2 上跳过 `BRAINSTORM_OWNER_PID` 生命周期监控，因为其 PID 命名空间对 Node.js 不可见。防止服务器在 60 秒后自行终止。30 分钟的空闲超时仍作为安全网保留。([#770](https://github.com/obra/superpowers/issues/770)，文档来自 [PR #768](https://github.com/obra/superpowers/pull/768) 由 @lucasyhzhu-debug 提交)
* **stop-server.sh 可靠性**：在报告成功之前，验证服务器进程是否确实已终止。等待最多 2 秒以进行正常关闭，然后升级到 `SIGKILL`，如果进程仍然存活则报告失败。([#723](https://github.com/obra/superpowers/issues/723))

### 变更

* **执行交接**：恢复用户在计划编写后，在子代理驱动开发和执行计划之间的选择。子代理驱动是推荐的，但不再是强制性的。(撤销 `5e51c3e`)
