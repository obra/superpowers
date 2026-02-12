import os
import re

def generate_index(skills_dir, output_file):
    index_content = "# Superpowers Skills Index\n\n"
    index_content += "This index provides a lightweight summary of all available skills. Use this to discover relevant skills before loading their full instructions.\n\n"
    index_content += "| Skill Name | Description |\n"
    index_content += "|------------|-------------|\n"

    for root, dirs, files in os.walk(skills_dir):
        if "SKILL.md" in files:
            skill_path = os.path.join(root, "SKILL.md")
            with open(skill_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Extract frontmatter name and description
                name_match = re.search(r'^name:\s*(.+)$', content, re.MULTILINE)
                desc_match = re.search(r'^description:\s*(.+)$', content, re.MULTILINE)
                
                name = name_match.group(1).strip() if name_match else os.path.basename(root)
                description = desc_match.group(1).strip().strip('"') if desc_match else "No description available."
                
                index_content += f"| {name} | {description} |\n"

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(index_content)

if __name__ == "__main__":
    # Assuming the script runs from the repo root or lib/scripts
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    skills_dir = os.path.join(base_dir, "skills")
    output_file = os.path.join(base_dir, "skills/SKILLS_INDEX.md")
    
    # Also handle the awesome-automation if linked
    generate_index(skills_dir, output_file)
    print(f"Generated index at {output_file}")
