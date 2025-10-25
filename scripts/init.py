#!/usr/bin/env python3
"""
Claude Skills Factory - Init Script
===================================

Initializes a new Claude skill with all required components.

Usage: python init.py "skill-name" ["description"]
Example: python init.py "pdf-form-filler" "Fill PDF forms automatically"
"""

import sys
import os
import shutil
import zipfile
from pathlib import Path
from datetime import datetime

def create_skill_directory(skill_name, description=""):
    """Create a new skill directory with kebab-case naming."""
    kebab_name = skill_name.lower().replace(" ", "-").replace("_", "-")

    # Create skills directory if it doesn't exist
    skills_dir = Path("../../skills")
    skills_dir.mkdir(exist_ok=True)

    skill_dir = skills_dir / kebab_name

    if skill_dir.exists():
        print(f"❌ Skill directory '{kebab_name}' already exists!")
        return None

    skill_dir.mkdir(parents=True)
    print(f"✅ Created skill directory: {kebab_name}")

    return skill_dir, kebab_name

def copy_template_files(skill_dir, skill_name, description):
    """Copy and customize template files."""
    template_dir = Path("../templates")
    templates = list(template_dir.glob("*"))

    if not templates:
        print("❌ No template files found!")
        return False

    for template_file in templates:
        if template_file.is_file():
            dest_file = skill_dir / template_file.name

            if template_file.suffix == '.md':
                # Customize SKILL.md content
                content = template_file.read_text(encoding='utf-8')
                content = content.replace('[Skill Name]', skill_name)
                content = content.replace('[description]', description or f'Provides {skill_name} functionality')
                dest_file.write_text(content, encoding='utf-8')
            else:
                # Copy other files as-is
                shutil.copy2(template_file, dest_file)

            print(f"✅ Copied {template_file.name}")

    return True

def create_sample_prompt_file(skill_dir, skill_name):
    """Create a sample prompt file."""
    sample_prompt_path = skill_dir / "sample_prompt.md"

    content = f"""# Sample Prompts for {skill_name}

## Quick Start
"Hey Claude—I just added the "{skill_name.lower().replace(' ', '-')}" skill. Can you help me use it?"

## Specific Use Cases

### Basic Usage
"Use the {skill_name.lower()} skill to [describe what to do]"

### Advanced Usage
"With the {skill_name.lower()} skill, [describe advanced usage]"

## Tips for Best Results
- Be specific about your inputs
- Provide clear examples
- Expect structured output
"""

    sample_prompt_path.write_text(content, encoding='utf-8')
    print("✅ Created sample_prompt.md")

def create_zip_archive(skill_dir, skill_name):
    """Create a ZIP archive containing SKILL.md for easy import."""
    kebab_name = skill_name.lower().replace(" ", "-").replace("_", "-")
    zip_path = skill_dir / f"{kebab_name}-skill.zip"
    skill_md = skill_dir / "SKILL.md"

    if skill_md.exists():
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(skill_md, "SKILL.md")
        print(f"✅ Created ZIP archive: {kebab_name}-skill.zip")
    else:
        print("❌ SKILL.md not found, cannot create ZIP")

def main():
    """Main initialization function."""
    if len(sys.argv) < 2:
        print("Usage: python init.py 'skill-name' ['description']")
        print("Example: python init.py 'pdf-form-filler' 'Fill PDF forms automatically'")
        sys.exit(1)

    skill_name = sys.argv[1]
    description = sys.argv[2] if len(sys.argv) > 2 else ""

    print(f"🚀 Initializing Claude skill: {skill_name}")
    print(f"📝 Description: {description or 'No description provided'}")
    print()

    # Create skill directory
    result = create_skill_directory(skill_name, description)
    if not result:
        sys.exit(1)

    skill_dir, kebab_name = result

    # Copy and customize template files
    success = copy_template_files(skill_dir, skill_name, description)
    if not success:
        print("❌ Failed to copy template files")
        sys.exit(1)

    # Create sample prompt file
    create_sample_prompt_file(skill_dir, skill_name)

    # Create ZIP archive
    create_zip_archive(skill_dir, skill_name)

    print()
    print("🎉 Skill initialization complete!")
    print(f"📂 Location: {skill_dir}")
    print(f"📦 Ready to use: {kebab_name}-skill.zip")

if __name__ == "__main__":
    main()
