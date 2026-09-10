"""TUI fixture: three timed colour states, then wait for `q`.
`tree DIR` instead leaves a three-deep process tree running for cleanup tests."""
import json, os, subprocess, sys, time
from pathlib import Path


def getch():
    if os.name == "nt":
        import msvcrt
        return msvcrt.getwch()
    import termios, tty
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setcbreak(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


if len(sys.argv) > 1 and sys.argv[1] == "tree":
    directory = Path(sys.argv[2])
    directory.mkdir(exist_ok=True)
    level = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    if level < 2:
        subprocess.Popen([sys.executable, __file__, "tree", str(directory), str(level + 1)])
    (directory / f"{level}.json").write_text(json.dumps(dict(pid=os.getpid(), level=level)))
    while True:
        time.sleep(1)

print("WRAPPING OUTPUT " + ("0123456789 wrap proof " * 60), flush=True)
time.sleep(1.4)
states = []
for label, color in [("STATE ONE RED", 41), ("STATE TWO GREEN", 42), ("STATE THREE BLUE", 44)]:
    print("\x1b[2J\x1b[H" + f"\x1b[{color}m" + (label + " " * 60 + "\n") * 12 + "\x1b[0m", end="", flush=True)
    states.append(dict(label=label, time=time.monotonic()))
    Path("states.json").write_text(json.dumps(states))
    time.sleep(1.5)
while getch() != "q":
    pass
print("\nAUTOMATIC GATE COMPLETE", flush=True)
