#!/usr/bin/env python3
"""
build_test_case_xlsx.py — Xuất test case đã sinh ra thành file .xlsx đa-sheet
đúng schema 14 cột quan sát được từ file thật TEAM1-697 (canonical), mỗi
sheet tương ứng một màn/sub-feature, sẵn sàng nộp vào quy trình QA hiện có.

Input: 1 file JSON dạng
{
  "sheets": [
    {
      "name": "TEAM2-XXX_Màn danh sách",
      "rows": [
        {
          "tc_id": "STD-01-001",
          "nhom_chuc_nang": "TEAM2-XXX - US-STD-01",
          "module": "Status tiles",
          "muc_tieu": "Load danh sách mặc định",
          "tien_dieu_kien": "Có dữ liệu...",
          "buoc_thuc_hien": "1. ... 2. ...",
          "du_lieu": "...",
          "ket_qua_mong_doi": "...",
          "loai_tc": "Smoke",
          "priority": "High"
        }
      ]
    }
  ]
}

Usage:
    python build_test_case_xlsx.py <input.json> <output.xlsx>

Cột "Kết quả Auto mt DEV", "Thời điểm Auto", "Note Auto", "Kết quả manual mt
DEV" luôn để trống — đó là việc của QA sau khi chạy test, không phải lúc
generate.
"""
import json
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

HEADERS = [
    "TC ID",
    "Nhóm chức năng",
    "Module",
    "Mục tiêu kiểm thử",
    "Tiền điều kiện",
    "Bước thực hiện",
    "Dữ liệu kiểm thử",
    "Kết quả mong đợi",
    "Loại TC",
    "Priority",
    "Kết quả Auto mt DEV",
    "Thời điểm Auto",
    "Note Auto",
    "Kết quả manual mt DEV",
]

ROW_KEYS = [
    "tc_id",
    "nhom_chuc_nang",
    "module",
    "muc_tieu",
    "tien_dieu_kien",
    "buoc_thuc_hien",
    "du_lieu",
    "ket_qua_mong_doi",
    "loai_tc",
    "priority",
]

COL_WIDTHS = [16, 22, 18, 32, 24, 38, 22, 38, 14, 10, 14, 16, 24, 18]

EXCEL_SHEET_NAME_MAX = 31
INVALID_SHEET_CHARS = r'[\\/*?:\[\]]'


def safe_sheet_name(name: str, used: set) -> str:
    """Excel: tối đa 31 ký tự, không chứa \\/*?:[] , và không trùng tên trong cùng workbook."""
    cleaned = re.sub(INVALID_SHEET_CHARS, "-", name).strip()
    base = cleaned[:EXCEL_SHEET_NAME_MAX]
    candidate = base
    i = 2
    while candidate.lower() in used:
        suffix = f"~{i}"
        candidate = base[: EXCEL_SHEET_NAME_MAX - len(suffix)] + suffix
        i += 1
    used.add(candidate.lower())
    return candidate


def build_workbook(data: dict) -> Workbook:
    wb = Workbook()
    wb.remove(wb.active)  # bỏ sheet mặc định, tự tạo theo data

    used_names = set()
    header_font = Font(bold=True)
    header_fill = PatternFill("solid", fgColor="DDDDDD")
    wrap = Alignment(wrap_text=True, vertical="top")

    for sheet_def in data.get("sheets", []):
        name = safe_sheet_name(sheet_def.get("name", "Sheet"), used_names)
        ws = wb.create_sheet(name)

        for col_idx, header in enumerate(HEADERS, start=1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
        ws.freeze_panes = "A2"

        for row_idx, row in enumerate(sheet_def.get("rows", []), start=2):
            for col_idx, key in enumerate(ROW_KEYS, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=row.get(key, ""))
                cell.alignment = wrap
            # cột 11-14 (tracking) luôn để trống — không set giá trị

        for col_idx, width in enumerate(COL_WIDTHS, start=1):
            ws.column_dimensions[get_column_letter(col_idx)].width = width

    if not wb.sheetnames:
        wb.create_sheet("Sheet1")

    return wb


def main():
    if len(sys.argv) != 3:
        print("Usage: python build_test_case_xlsx.py <input.json> <output.xlsx>")
        sys.exit(1)

    in_path, out_path = Path(sys.argv[1]), Path(sys.argv[2])
    data = json.loads(in_path.read_text(encoding="utf-8"))
    wb = build_workbook(data)
    wb.save(out_path)

    total_rows = sum(len(s.get("rows", [])) for s in data.get("sheets", []))
    print(
        json.dumps(
            {
                "output": str(out_path),
                "num_sheets": len(wb.sheetnames),
                "sheet_names": wb.sheetnames,
                "total_test_cases": total_rows,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
