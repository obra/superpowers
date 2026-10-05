# Fixture: a tiny sync tool. Run with cwd = the scenario's work dir.
cat > sync.py <<'PY'
import argparse, shutil, sys
from pathlib import Path

def main():
    p = argparse.ArgumentParser(description="Copy changed files from SRC to DST.")
    p.add_argument("src"); p.add_argument("dst")
    a = p.parse_args()
    src, dst = Path(a.src), Path(a.dst)
    n = 0
    for f in src.rglob("*"):
        if not f.is_file():
            continue
        t = dst / f.relative_to(src)
        try:
            if not t.exists() or t.stat().st_mtime < f.stat().st_mtime:
                t.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, t)
                print(f"copied {f}")
                n += 1
        except OSError as e:
            print(f"error: {f}: {e}", file=sys.stderr)
    print(f"synced {n} files")

if __name__ == "__main__":
    main()
PY
git init -q && git add sync.py && git -c user.email=t@t -c user.name=t commit -qm "sync tool"
