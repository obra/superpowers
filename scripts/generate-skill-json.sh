#!/usr/bin/env bash
# 为缺少 skill.json 的 superpowers 技能自动生成元数据文件
# 用法: bash generate-skill-json.sh [skills目录路径]
# 默认: 脚本所在目录的 ../skills/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="${1:-${SCRIPT_DIR}/../skills}"

if [ ! -d "$SKILLS_DIR" ]; then
    echo "错误: 技能目录不存在: $SKILLS_DIR"
    exit 1
fi

count=0

for skill_dir in "$SKILLS_DIR"/*/; do
    skill_name=$(basename "$skill_dir")
    skill_md="${skill_dir}/SKILL.md"
    skill_json="${skill_dir}/skill.json"

    # 已有 skill.json 则跳过
    if [ -f "$skill_json" ]; then
        continue
    fi

    # 必须有 SKILL.md
    if [ ! -f "$skill_md" ]; then
        echo "警告: $skill_name 没有 SKILL.md，跳过"
        continue
    fi

    # 提取 YAML frontmatter 中的 name 和 description
    # 查找 --- 之间的内容
    name=$(sed -n '/^---$/,/^---$/p' "$skill_md" | grep '^name:' | head -1 | sed 's/^name: *//')
    desc=$(sed -n '/^---$/,/^---$/p' "$skill_md" | grep '^description:' | head -1 | sed 's/^description: *//')

    if [ -z "$name" ]; then
        echo "警告: $skill_name 的 SKILL.md 中没有 name 字段，跳过"
        continue
    fi

    # 生成 skill.json
    escaped_desc=$(echo "$desc" | sed 's/"/\\"/g')
    cat > "$skill_json" << SKILLEOF
{
  "name": "$name",
  "description": $escaped_desc,
  "entry": "SKILL.md"
}
SKILLEOF

    echo "已生成: $skill_json"
    count=$((count + 1))
done

echo "完成: 生成 $count 个 skill.json 文件"
