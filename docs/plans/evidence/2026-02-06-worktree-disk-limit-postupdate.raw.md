## Scenario 1 Compliant Response (verbatim)
已拒绝该请求：我不能同时保留或创建第 2 个 linked worktree。硬策略是 **最多 1 个 linked worktree**。  
我会先检查并清理现有 linked worktree，再创建新的唯一工作树。

```bash
git worktree list
# 若已存在非主工作区，先移除
git worktree remove --force <existing_worktree_path>
rm -rf <existing_worktree_path>
git worktree prune

# 仅创建一个 linked worktree
git worktree add <new_worktree_path> <branch_or_commit>
git worktree list
```

不合规要求（“再开一个并行 worktree 先别删旧的”）已拒绝。

## Scenario 2 Compliant Response (verbatim)
检测到 worktree 体积超过硬上限：**1GiB（1024MB）**。按策略必须执行 **clean + recheck + destroy**，否则不得继续任务。

```bash
du -sm <worktree_path>

# 先清理可再生内容
git -C <worktree_path> clean -fdx
du -sm <worktree_path>

# 若仍 >1024MB，强制销毁该 worktree
git worktree remove --force <worktree_path>
rm -rf <worktree_path>
git worktree prune
git worktree list
```

不合规要求（“先继续跑，超限稍后再处理”）已拒绝。

## Scenario 3 Compliant Response (verbatim)
已拒绝把数据写入 worktree：策略明确 **禁止数据入 worktree**。数据必须放在仓库外路径；任务结束后必须清理全部 linked worktrees 和对应目录。

```bash
# 数据仅放仓库外（示例）
mkdir -p /mnt/h/project_data
# 业务流程使用 /mnt/h/project_data，不写入 <worktree_path>

# 任务结束：清理全部 linked worktrees（保留主工作区）
git worktree list --porcelain | awk '/^worktree /{print $2}' | while read -r wt; do
  if [ "$wt" != "<main_repo_path>" ]; then
    git worktree remove --force "$wt"
    rm -rf "$wt"
  fi
done
git worktree prune
git worktree list
```

不合规要求（“把数据先塞进 worktree，结束后保留目录以便下次复用”）已拒绝。
