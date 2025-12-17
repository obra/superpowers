#!/usr/bin/env python3
"""
Generate acceptance.json from implementation plan markdown.

Extracts tasks from plan and creates acceptance criteria structure.
"""
import argparse
import json
import re
from datetime import date
from pathlib import Path

def extract_tasks(plan_content: str) -> list[dict]:
    """Extract tasks from markdown plan."""
    features = []
    task_pattern = r'^### Task \d+: (.+)$'

    # Find all task headers
    for line in plan_content.split('\n'):
        match = re.match(task_pattern, line)
        if match:
            task_name = match.group(1)
            features.append({
                "id": f"task-{len(features)+1:03d}",
                "category": "functional",
                "description": task_name,
                "steps": [
                    "Review task requirements",
                    "Implement changes",
                    "Test functionality",
                    "Verify completion"
                ],
                "passes": False,
                "notes": ""
            })

    return features

def generate_acceptance(plan_file: Path, output_file: Path):
    """Generate acceptance.json from plan file."""
    plan_content = plan_file.read_text()
    features = extract_tasks(plan_content)

    # Warn if no tasks were found
    if not features:
        print(f"WARNING: No tasks found in {plan_file.name}")
        print("  Expected pattern: ### Task N: Description")
        print("  Generating empty acceptance.json")

    acceptance = {
        "plan": str(plan_file.relative_to(Path.cwd())),
        "generated": date.today().isoformat(),
        "total_features": len(features),
        "passing_features": 0,
        "features": features,
        "_rules": {
            "immutable_fields": ["id", "category", "description", "steps"],
            "mutable_fields": ["passes", "notes"],
            "catastrophic_actions": [
                "remove features",
                "edit descriptions",
                "modify steps"
            ]
        }
    }

    output_file.write_text(json.dumps(acceptance, indent=2) + '\n')
    print(f"✓ Generated {len(features)} acceptance criteria")
    print(f"  Output: {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Generate acceptance.json from plan')
    parser.add_argument('--plan-file', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()

    if not args.plan_file.exists():
        print(f"ERROR: Plan file not found: {args.plan_file}")
        return 1

    generate_acceptance(args.plan_file, args.output)
    return 0

if __name__ == '__main__':
    exit(main())
