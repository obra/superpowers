#!/usr/bin/env python3
"""
trace_matrix.py — Ma trận truy vết AC <-> case từ NGUỒN canonical (Phase 2).

Gate độ phủ ở cổng ATDD: bắt (a) AC không có case nào phủ (lỗ hổng test),
(b) case tham chiếu AC không được định nghĩa. In bảng Markdown + cảnh báo.

Usage:
    python trace_matrix.py <source.json> [out.md]

Zero-dependency (chỉ stdlib). Không fail build — cảnh báo để người/dev đọc.
"""
import json
import sys
from pathlib import Path


def collect(src):
    acs = []            # [(ac_id, title)]
    cover = {}          # ac_id -> [case_id]
    defined = set()
    for ac in src.get("acceptance", []):
        aid = ac.get("ac_id", "(no-id)")
        defined.add(aid)
        acs.append((aid, ac.get("title", "")))
        cover.setdefault(aid, [])
        for c in ac.get("cases", []):
            cid = c.get("case_id", "(no-id)")
            targets = [aid] + [a for a in c.get("ac_id", []) if a != aid]
            for t in targets:
                cover.setdefault(t, []).append(cid)
    return acs, cover, defined


def render(src):
    acs, cover, defined = collect(src)
    us = src.get("us_id", "?")
    lines = [f"# Traceability matrix — {us}", "",
             "| AC | Tiêu đề | #case | Case | |",
             "|---|---|---|---|---|"]
    gaps = []
    for aid, title in acs:
        cases = cover.get(aid, [])
        if not cases:
            gaps.append(aid)
        flag = "⚠ 0 case" if not cases else ""
        lines.append(f"| {aid} | {title} | {len(cases)} | {', '.join(cases)} | {flag} |")

    undefined = sorted(set(cover) - defined)
    impact = [c.get("case_id", "(no-id)") for c in src.get("impact", [])]
    lines += ["", "## Cảnh báo",
              f"- AC không có case (lỗ phủ): {', '.join(gaps) if gaps else 'không'}",
              f"- Case tham chiếu AC KHÔNG định nghĩa: {', '.join(undefined) if undefined else 'không'}",
              f"- Impact case (không gắn AC — kiểm tay): {', '.join(impact) if impact else 'không'}"]
    return "\n".join(lines) + "\n", {"gaps": gaps, "undefined_ac_refs": undefined,
                                     "impact_cases": len(impact)}


def main():
    if len(sys.argv) < 2:
        print("Usage: python trace_matrix.py <source.json> [out.md]")
        sys.exit(1)
    src = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    md, summary = render(src)
    if len(sys.argv) >= 3:
        Path(sys.argv[2]).write_text(md, encoding="utf-8")
    print(md)
    print("SUMMARY " + json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
