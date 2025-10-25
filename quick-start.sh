#!/bin/bash
# Quick start helper script

echo "🚀 Superpowers Quick Start"
echo ""
echo "Choose your platform:"
echo "1) Claude Code (plugin)"
echo "2) Claude Desktop (import ZIPs)"
echo "3) Claude API (Python/TypeScript)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "📦 Claude Code Setup:"
    echo ""
    echo "Run in Claude Code:"
    echo "  /plugin marketplace add obra/superpowers-marketplace"
    echo "  /plugin install superpowers@superpowers-marketplace"
    echo ""
    echo "Verify:"
    echo "  /help"
    ;;

  2)
    echo ""
    echo "📦 Claude Desktop Setup:"
    echo ""
    echo "Steps:"
    echo "  1. Open Claude Desktop"
    echo "  2. Go to Profile → Skills → Import Skill"
    echo "  3. Select ZIP files from:"
    echo "     $(pwd)/skills/{skill-name}/{skill-name}-skill.zip"
    echo ""
    echo "Example:"
    echo "  $(pwd)/skills/pdf-processor/pdf-processor-skill.zip"
    echo ""
    echo "Available skills (28 total):"
    ls -1 skills/*/*.zip | head -10
    echo "  ... and more"
    ;;

  3)
    echo ""
    echo "📦 Claude API Setup:"
    echo ""
    echo "Python example:"
    cat <<'PYTHON'
from anthropic import Anthropic
from pathlib import Path

# Load skill
skill_path = Path("skills/pdf-processor/SKILL.md")
skill_content = skill_path.read_text()

# Use with Claude
client = Anthropic(api_key="your-key")
message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    system=f"{skill_content}\n\nUse this skill.",
    messages=[{
        "role": "user",
        "content": "Extract text from file.pdf"
    }]
)
PYTHON
    echo ""
    echo "See SETUP-GUIDE.md for complete examples"
    ;;

  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "📖 Full documentation: SETUP-GUIDE.md"
echo "📚 Usage guide: USAGE_GUIDE.md"
