"""Render text statistics as a human-readable report."""


def format_report(stats):
    return "\n".join(f"{name}: {stats[name]}" for name in ("words", "lines", "chars"))
