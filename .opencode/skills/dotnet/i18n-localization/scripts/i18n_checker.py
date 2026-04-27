#!/usr/bin/env python3
"""
i18n Checker - Detects hardcoded strings and missing translations.
Scans for untranslated text in React, Vue, and Python files.
"""
import sys
import re
import json
from pathlib import Path

# Fix Windows console encoding for Unicode output
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except AttributeError:
    pass  # Python < 3.7

# Patterns that indicate hardcoded strings (should be translated)
HARDCODED_PATTERNS = {
    'jsx': [
        # Text directly in JSX: <div>Hello World</div>
        r'>\s*[A-Z][a-zA-Z\s]{3,30}\s*</',
        # JSX attribute strings: title="Welcome"
        r'(title|placeholder|label|alt|aria-label)="[A-Z][a-zA-Z\s]{2,}"',
        # Button/heading text
        r'<(button|h[1-6]|p|span|label)[^>]*>\s*[A-Z][a-zA-Z\s!?.,]{3,}\s*</',
    ],
    'vue': [
        # Vue template text
        r'>\s*[A-Z][a-zA-Z\s]{3,30}\s*</',
        r'(placeholder|label|title)="[A-Z][a-zA-Z\s]{2,}"',
    ],
    'python': [
        # print/raise with string literals
        r'(print|raise\s+\w+)\s*\(\s*["\'][A-Z][^"\']{5,}["\']',
        # Flask flash messages
        r'flash\s*\(\s*["\'][A-Z][^"\']{5,}["\']',
    ]
}

# Patterns that indicate proper i18n usage
I18N_PATTERNS = [
    r't\(["\']',           # t('key') - react-i18next
    r'useTranslation',     # React hook
    r'\$t\(',              # Vue i18n
    r'_\(["\']',           # Python gettext
    r'gettext\(',          # Python gettext
    r'useTranslations',    # next-intl
    r'FormattedMessage',   # react-intl
    r'i18n\.',             # Generic i18n
]

def find_locale_files(project_path: Path) -> list:
    """Find translation/locale files."""
    patterns = [
        "**/locales/**/*.json",
        "**/translations/**/*.json",
        "**/lang/**/*.json",
        "**/i18n/**/*.json",
        "**/messages/*.json",
        "**/*.po",  # gettext
    ]
    
    files = []
    for pattern in patterns:
        files.extend(project_path.glob(pattern))
    
    return [f for f in files if 'node_modules' not in str(f)]

def check_locale_completeness(locale_files: list) -> dict:
    """Check if all locales have the same keys."""
    issues = []
    passed = []
    
    if not locale_files:
        return {'passed': [], 'issues': ["[!] No locale files found"]}
    
    # Group by parent folder (language)
    locales = {}
    for f in locale_files:
        if f.suffix == '.json':
            try:
                lang = f.parent.name
                content = json.loads(f.read_text(encoding='utf-8'))
                if lang not in locales:
                    locales[lang] = {}
                locales[lang][f.stem] = set(flatten_keys(content))
            except:
                continue
    
    if len(locales) < 2:
        passed.append(f"[OK] Found {len(locale_files)} locale file(s)")
        return {'passed': passed, 'issues': issues}
    
    passed.append(f"[OK] Found {len(locales)} language(s): {', '.join(locales.keys())}")
    
    # Compare keys across locales
    all_langs = list(locales.keys())
    base_lang = all_langs[0]
    
    for namespace in locales.get(base_lang, {}):
        base_keys = locales[base_lang].get(namespace, set())
        
        for lang in all_langs[1:]:
            other_keys = locales.get(lang, {}).get(namespace, set())
            
            missing = base_keys - other_keys
            if missing:
                issues.append(f"[X] {lang}/{namespace}: Missing {len(missing)} keys")
            
            extra = other_keys - base_keys
            if extra:
                issues.append(f"[!] {lang}/{namespace}: {len(extra)} extra keys")
    
    if not issues:
        passed.append("[OK] All locales have matching keys")
    
    return {'passed': passed, 'issues': issues}

def flatten_keys(d, prefix=''):
    """Flatten nested dict keys."""
    keys = set()
    for k, v in d.items():
        new_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(flatten_keys(v, new_key))
        else:
            keys.add(new_key)
    return keys

def check_hardcoded_strings(project_path: Path) -> dict:
    """Check for hardcoded strings in code files."""
    issues = []
    passed = []
    
    # Find code files
    extensions = {
        '.tsx': 'jsx', '.jsx': 'jsx', '.ts': 'jsx', '.js': 'jsx',
        '.vue': 'vue',
        '.py': 'python'
    }
    
    code_files = []
    for ext in extensions:
        code_files.extend(project_path.rglob(f"*{ext}"))
    
    code_files = [f for f in code_files if not any(x in str(f) for x in 
                  ['node_modules', '.git', 'dist', 'build', '__pycache__', 'venv', 'test', 'spec'])]
    
    if not code_files:
        return {'passed': ["[!] No code files found"], 'issues': []}
    
    files_with_i18n = 0
    files_with_hardcoded = 0
    hardcoded_examples = []
    
    for file_path in code_files[:50]:  # Limit
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            ext = file_path.suffix
            file_type = extensions.get(ext, 'jsx')
            
            # Check for i18n usage
            has_i18n = any(re.search(p, content) for p in I18N_PATTERNS)
            if has_i18n:
                files_with_i18n += 1
            
            # Check for hardcoded strings
            patterns = HARDCODED_PATTERNS.get(file_type, [])
            hardcoded_found = False
            
            for pattern in patterns:
                matches = re.findall(pattern, content)
                if matches and not has_i18n:
                    hardcoded_found = True
                    if len(hardcoded_examples) < 5:
                        hardcoded_examples.append(f"{file_path.name}: {str(matches[0])[:40]}...")
            
            if hardcoded_found:
                files_with_hardcoded += 1
                
        except:
            continue
    
    passed.append(f"[OK] Analyzed {len(code_files)} code files")
    
    if files_with_i18n > 0:
        passed.append(f"[OK] {files_with_i18n} files use i18n")
    
    if files_with_hardcoded > 0:
        issues.append(f"[X] {files_with_hardcoded} files may have hardcoded strings")
        for ex in hardcoded_examples:
            issues.append(f"   → {ex}")
    else:
        passed.append("[OK] No obvious hardcoded strings detected")
    
    return {'passed': passed, 'issues': issues}

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    project_path = Path(target)
    
    print("\n" + "=" * 60)
    print("  i18n CHECKER - Internationalization Audit")
    print("=" * 60 + "\n")
    
    # Check locale files
    locale_files = find_locale_files(project_path)
    locale_result = check_locale_completeness(locale_files)
    
    # Check hardcoded strings
    code_result = check_hardcoded_strings(project_path)
    
    # Print results
    print("[LOCALE FILES]")
    print("-" * 40)
    for item in locale_result['passed']:
        print(f"  {item}")
    for item in locale_result['issues']:
        print(f"  {item}")
    
    print("\n[CODE ANALYSIS]")
    print("-" * 40)
    for item in code_result['passed']:
        print(f"  {item}")
    for item in code_result['issues']:
        print(f"  {item}")
    
    # Summary
    critical_issues = sum(1 for i in locale_result['issues'] + code_result['issues'] if i.startswith("[X]"))
    
    print("\n" + "=" * 60)
    if critical_issues == 0:
        print("[OK] i18n CHECK: PASSED")
        sys.exit(0)
    else:
        print(f"[X] i18n CHECK: {critical_issues} issues found")
        sys.exit(1)

if __name__ == "__main__":
    main()
