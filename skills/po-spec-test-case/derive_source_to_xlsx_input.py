#!/usr/bin/env python3
"""
derive_source_to_xlsx_input.py — Dẫn xuất NGUỒN canonical (1 US, JSON theo
testcase-source-schema.md) thành input phẳng cho build_test_case_xlsx.py.

Nguồn là sự thật duy nhất; đây là bước "render B" (tester Excel). Không sửa
build_test_case_xlsx.py (giữ 14 cột thật) — script này chỉ map field.

Usage:
    python derive_source_to_xlsx_input.py <source.json> <xlsx_input.json>
    # rồi: python build_test_case_xlsx.py <xlsx_input.json> <output.xlsx>

Zero-dependency (chỉ stdlib). Phase 1: KHÔNG merge-by-TC-ID (Phase 2).
"""
import json
import sys
from pathlib import Path

IMPACT_SHEET = "Nghiệp vụ ảnh hưởng sau khi xử"


def _join_steps(steps):
    """when[] -> '1. a 2. b 3. c' ngay trong cell (đúng convention template)."""
    steps = [s for s in (steps or []) if str(s).strip()]
    return " ".join(f"{i}. {s}" for i, s in enumerate(steps, 1))


def _join(items, sep="; "):
    return sep.join(str(x) for x in (items or []) if str(x).strip())


def _base_row(case):
    """Field chung, không phụ thuộc biến thể examples."""
    title = case.get("title", "")
    nc = case.get("needs_clarification", {}) or {}
    if nc.get("is"):
        title = f"[CẦN LÀM RÕ] {title}"
    return {
        "nhom_chuc_nang": case.get("nhom_chuc_nang", ""),
        "module": case.get("module", ""),
        "muc_tieu": title,
        "tien_dieu_kien": _join(case.get("given")),
        "loai_tc": "/".join(case.get("loai_tc", []) or []),
        "priority": case.get("priority", ""),
    }


def _expected(case):
    """Kết quả mong đợi mặc định (khi không có examples.ket_qua riêng)."""
    nc = case.get("needs_clarification", {}) or {}
    if nc.get("is"):
        ref = f" (ref: {nc['ref']})" if nc.get("ref") else ""
        return f"**Chưa xác định** — {nc.get('reason', 'spec/Figma chưa định nghĩa')}{ref}"
    kind = case.get("kind")
    if kind in ("ui", "responsive", "smoke") and case.get("checklist_items"):
        return "Hiển thị đầy đủ: " + _join(case["checklist_items"])
    then = _join(case.get("then"), sep=" ")
    if kind == "impact":
        tag = case.get("affected_module", "module khác")
        if case.get("direction") == "no-effect":
            return f"[{tag}] KHÔNG thay đổi: {then}"
        return f"[{tag}] {then}"
    return then


def _steps_cell(case):
    if case.get("when"):
        return _join_steps(case["when"])
    # ui/responsive/smoke không có 'when' rõ → bước quan sát mặc định
    if case.get("kind") in ("ui", "responsive", "smoke"):
        return _join_steps([f"Mở {case.get('module', 'màn')}", "Quan sát hiển thị"])
    return ""


def rows_for_case(case):
    """1 case -> 1 hoặc N dòng (N = số phần tử examples)."""
    base = _base_row(case)
    steps = _steps_cell(case)
    examples = case.get("examples")
    if examples:
        out = []
        for i, ex in enumerate(examples, 1):
            row = dict(base)
            row["tc_id"] = f"{case['case_id']}.{i}"
            row["buoc_thuc_hien"] = steps
            row["du_lieu"] = ex.get("du_lieu", "")
            row["ket_qua_mong_doi"] = ex.get("ket_qua") or _expected(case)
            out.append(row)
        return out
    row = dict(base)
    row["tc_id"] = case["case_id"]
    row["buoc_thuc_hien"] = steps
    row["du_lieu"] = _join(case.get("test_data"), sep="; ") or "—"
    row["ket_qua_mong_doi"] = _expected(case)
    return [row]


def derive(source):
    main_rows = []
    for ac in source.get("acceptance", []):
        for case in ac.get("cases", []):
            main_rows.extend(rows_for_case(case))

    impact_rows = []
    for case in source.get("impact", []):
        case.setdefault("kind", "impact")
        impact_rows.extend(rows_for_case(case))

    sheets = [{"name": source.get("sheet_name") or source.get("us_id", "Test cases"),
               "rows": main_rows}]
    if impact_rows:
        sheets.append({"name": IMPACT_SHEET, "rows": impact_rows})
    return {"sheets": sheets}


def main():
    if len(sys.argv) != 3:
        print("Usage: python derive_source_to_xlsx_input.py <source.json> <xlsx_input.json>")
        sys.exit(1)
    src = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = derive(src)
    Path(sys.argv[2]).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(
        {"xlsx_input": sys.argv[2],
         "sheets": [{"name": s["name"], "rows": len(s["rows"])} for s in out["sheets"]],
         "total_rows": sum(len(s["rows"]) for s in out["sheets"])},
        ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
