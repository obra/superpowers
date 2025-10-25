#!/usr/bin/env python3
"""
Claude Skills Import Tool
=========================

Import external skills from Git repositories with verification and customization.

Usage: python import_skill.py <git-url> [skill-name]
Examples:
  python import_skill.py https://github.com/user/pdf-skill.git
  python import_skill.py https://github.com/user/pdf-skill.git "custom-pdf-processor"
"""

import sys
import os
import shutil
import subprocess
import zipfile
import yaml
from pathlib import Path
from urllib.parse import urlparse

def parse_github_url(url):
    """Extract owner/repo from GitHub URL."""
    parsed = urlparse(url.rstrip('/').rstrip('.git'))
    path_parts = parsed.path.strip('/').split('/')
    if len(path_parts) >= 2:
        return path_parts[0], path_parts[1]
    return None, None

def validate_skill_directory(skill_dir):
    """Validate that directory contains a proper skill structure."""
    skill_md = skill_dir / "SKILL.md"

    if not skill_md.exists():
        print("❌ SKILL.md not found - not a valid skill")
        return False

    try:
        content = skill_md.read_text(encoding='utf-8')
        if not content.startswith('---'):
            print("❌ SKILL.md missing YAML frontmatter")
            return False

        # Parse YAML frontmatter
        parts = content.split('---', 2)
        if len(parts) < 3:
            print("❌ Invalid SKILL.md format")
            return False

        metadata = yaml.safe_load(parts[1])
        required = ['name', 'description']
        missing = [k for k in required if k not in metadata]
        if missing:
            print(f"❌ Missing required metadata: {missing}")
            return False

        print("✅ Skill validation passed")
        return True

    except Exception as e:
        print(f"❌ Skill validation failed: {e}")
        return False

def create_zip_archive(skill_dir, skill_name):
    """Create ZIP archive for Claude Desktop import."""
    zip_path = skill_dir / f"{skill_name}-skill.zip"
    skill_md = skill_dir / "SKILL.md"

    if skill_md.exists():
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(skill_md, "SKILL.md")
        print(f"✅ Created ZIP archive: {zip_path.name}")
    else:
        print("❌ SKILL.md not found, cannot create ZIP")

def customize_skill(skill_dir, custom_name=None, custom_desc=None):
    """Customize skill name and description if requested."""
    skill_md = skill_dir / "SKILL.md"

    if not skill_md.exists():
        return

    content = skill_md.read_text(encoding='utf-8')

    if custom_name or custom_desc:
        # Parse and update YAML frontmatter
        parts = content.split('---', 2)
        if len(parts) >= 3:
            try:
                metadata = yaml.safe_load(parts[1])

                if custom_name:
                    metadata['name'] = custom_name
                if custom_desc:
                    metadata['description'] = custom_desc

                # Reconstruct content
                new_metadata = yaml.dump(metadata, default_flow_style=False).strip()
                content = f"---\n{new_metadata}\n---{parts[2]}"

                skill_md.write_text(content, encoding='utf-8')
                print("✅ Skill customized with new metadata")
            except Exception as e:
                print(f"⚠️  Could not customize skill: {e}")

def import_from_git(git_url, custom_name=None):
    """Import skill from Git repository."""
    owner, repo = parse_github_url(git_url)

    if not owner or not repo:
        print(f"❌ Could not parse GitHub URL: {git_url}")
        return False

    print(f"🚀 Importing skill from: {owner}/{repo}")

    # Check if skills directory exists
    skills_dir = Path("../../skills")
    skills_dir.mkdir(exist_ok=True)

    # Use custom name or extract from repo name
    skill_name = custom_name or repo.replace('claude-skill-', '').replace('-skill', '')

    # Create temporary directory for cloning
    temp_dir = skills_dir / f"temp-{skill_name}"

    try:
        # Clone repository
        print(f"📥 Cloning repository...")
        if custom_name:
            # Clone with custom directory name
            subprocess.run([
                'git', 'clone', '--depth', '1', git_url, str(temp_dir)
            ], check=True, capture_output=True)
        else:
            # Clone to temp directory first
            subprocess.run([
                'git', 'clone', '--depth', '1', git_url, str(temp_dir)
            ], check=True, capture_output=True)

        # Validate skill structure
        if not validate_skill_directory(temp_dir):
            print("❌ Repository does not contain a valid Claude skill")
            shutil.rmtree(temp_dir)
            return False

        # Customize skill if requested
        customize_skill(temp_dir, custom_name, None)

        # Move to final location
        final_dir = skills_dir / skill_name
        if final_dir.exists():
            print(f"⚠️  Skill '{skill_name}' already exists, overwriting...")
            shutil.rmtree(final_dir)

        shutil.move(str(temp_dir), str(final_dir))
        print(f"✅ Skill imported to: skills/{skill_name}")

        # Create ZIP archive for desktop import
        create_zip_archive(final_dir, skill_name)

        return True

    except subprocess.CalledProcessError as e:
        print(f"❌ Git clone failed: {e}")
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
        return False
    except Exception as e:
        print(f"❌ Import failed: {e}")
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
        return False

def list_available_skills():
    """List popular Claude skill repositories."""
    skills = [
        ("https://github.com/Anthropic/claude-skills-template", "Official template"),
        ("https://github.com/your-org/custom-skills", "Your organization skills"),
        # Add more known skill repositories
    ]

    print("\n📚 Popular Claude Skills Repositories:")
    for url, desc in skills:
        print(f"  {url}")
        print(f"    {desc}")
    print("\n🔍 Search GitHub for 'claude-skill' or 'anthropic-skill' to find more")

def main():
    """Main import function."""
    if len(sys.argv) < 2:
        print("Usage: python import_skill.py <git-url> [custom-name]")
        print("\nCommands:")
        print("  python import_skill.py <git-url>          # Import with auto-naming")
        print("  python import_skill.py <git-url> 'name'  # Import with custom name")
        print("  python import_skill.py list               # List available skills")
        print("\nExamples:")
        print("  python import_skill.py https://github.com/user/pdf-skill.git")
        print("  python import_skill.py https://github.com/user/pdf-skill.git 'my-pdf-tool'")
        sys.exit(1)

    if sys.argv[1] == "list":
        list_available_skills()
        return

    git_url = sys.argv[1]
    custom_name = sys.argv[2] if len(sys.argv) > 2 else None

    success = import_from_git(git_url, custom_name)

    if success:
        print("\n🎉 Skill imported successfully!")
        print("📝 Ready to use in Claude Code")
        print("📦 ZIP created for Claude Desktop import")
        print("\n💡 Tip: Test in Claude Code first, then import ZIP to Desktop")
    else:
        print("\n❌ Import failed. Check the Git URL and skill validity.")

if __name__ == "__main__":
    main()
