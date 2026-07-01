# Nguồn canonical test case — schema & render rules

**Nguồn sự thật DUY NHẤT** cho test case của một US. Từ nó dẫn xuất **2 render**: dev-view (Markdown Gherkin) và tester-view (Excel 14-cột). **Cấm** sửa render trực tiếp; **cấm** dẫn Excel từ text Gherkin — cả hai đọc cùng nguồn.

Định dạng: **JSON** (zero-dependency; agent + `derive_source_to_xlsx_input.py` đọc được). 1 file / 1 US: `docs/rino-s9s/specs/<date>-<EPIC>/testcases/<US>.json`. Single-writer = PO/BA; dev phản biện qua comment → PO apply.

## Cấu trúc

```json
{
  "us_id": "US-BALU-01",
  "epic": "TEAM1-731",
  "sheet_name": "TEAM1-731_Màn danh sách",
  "source_doc": "BALU spec.docx",
  "figma": "đã xem qua ảnh | chưa có",
  "acceptance": [
    {
      "ac_id": "AC-1",
      "title": "Tải danh sách mặc định",
      "cases": [ /* case objects */ ]
    }
  ],
  "impact": [ /* case objects, kind=impact */ ]
}
```

### Case object

| Field | Bắt buộc | Ý nghĩa |
|---|---|---|
| `case_id` | ✓ | = TC ID, **BỀN** qua regenerate; format `<MÃ-MODULE>-<sub 2 số>-<seq 3 số>` vd `BALU-01-003` |
| `kind` | ✓ | `flow` \| `ui` \| `responsive` \| `smoke` \| `impact` — quyết định render |
| `module` | ✓ | vùng UI cụ thể (`Status tiles`), không phải tên cả màn |
| `nhom_chuc_nang` | ✓ | `<mã ticket> - <mã US>` (trace ngược) |
| `title` | ✓ | Mục tiêu kiểm thử — ngắn, đủ hiểu |
| `loai_tc` | ✓ | list, ghép được: `["UI","Functional"]` |
| `priority` | ✓ | `High` \| `Medium` \| `Low` |
| `automation_level` | ✓ | `e2e` \| `integration` \| `manual_only` (LLM đề xuất, dev chốt ở cổng ATDD) |
| `given` / `when` / `then` | flow/impact | mảng step (câu ngắn, quan sát được) |
| `checklist_items` | ui/responsive/smoke | mảng điểm kiểm (thay G-W-T) |
| `test_data` | — | list giá trị cụ thể cho 1 case |
| `examples` | — | list `{du_lieu, ket_qua?}` — mỗi phần tử → 1 dòng Excel + 1 TC ID (`<case_id>.<n>`) |
| `needs_clarification` | ✓ | `{"is": bool, "reason": "...", "ref": "..."}` |
| `affected_module` | impact | module bị ảnh hưởng (ngoài màn đang test) |
| `direction` | impact | `affects` \| `no-effect` (chiều "không ảnh hưởng" khi reject/cancel) |
| `contract_ref` | — | enum/endpoint/permission dẫn từ US-00 (chống stale) |

### Ràng buộc cứng
- **`examples` vs tách case:** dùng `examples` khi **cùng `given`/`when`, chỉ khác input + expected** (→ Scenario Outline); nếu khác bước/flow → **tách case riêng** (`case_id` riêng), đừng nhồi vào examples.
- `needs_clarification.is=true` → **BẮT BUỘC** `automation_level="manual_only"`, `then` để trống (không assert bịa). Vẫn ra **1 dòng** Excel (`Kết quả mong đợi` = `[CẦN LÀM RÕ]` + lý do).
- `automation_level` tiêu chí: `e2e` chỉ flow "gọi 2h sáng"; `integration` cho Business Rule/Negative/Integration không cần UI thật; `manual_only` cho UI/Responsive cảm quan, kênh ngoài, hoặc cần-làm-rõ. Impact mặc định `integration`.

## Render → dev-view (Markdown Gherkin)
- `kind=flow`/`impact` → **scenario Gherkin**. Tags: `@{loai_tc} @{priority} @{us_id} @{ac_id} @{automation_level}`; impact thêm `@impact`; cần-làm-rõ thêm `@needs-clarification`. **Chuẩn hoá tag:** mỗi phần tử `loai_tc` → 1 tag **lowercase, space→`-`** (`Business Rule`→`@business-rule`).
- Case có `examples` → render **`Scenario Outline` + bảng `Examples`** (cùng given/when, chỉ thay tham số).
- `kind=ui`/`responsive`/`smoke` → **checklist bullet** có trace AC, KHÔNG giả làm scenario.
- `impact` → scenario cross-module, ghi rõ `direction` (cả chiều không-ảnh-hưởng).
- `needs_clarification.is=true` → gắn `@needs-clarification`, KHÔNG viết Then, gom vào "Câu hỏi cho PO".
- 2 tầng: scenario mức acceptance nổi bật; case detail collapse dưới từng AC (KHÔNG loại case).
- Banner đầu file: `<!-- DO NOT EDIT — generated from <nguồn>. Dev comment để phản biện; sửa ở nguồn. -->`

## Render → tester-view (Excel) — qua `derive_source_to_xlsx_input.py` → `build_test_case_xlsx.py`
- `given→Tiền điều kiện`, `when→Bước thực hiện` (join `1. 2. 3.`), `then→Kết quả mong đợi`, `test_data→Dữ liệu kiểm thử`.
- **1 scenario = 1 dòng.** 1 AC assert nhiều điều kiện độc lập → **tách thành nhiều case ở NGUỒN**, đừng nhồi nhiều Then.
- **`examples`: mỗi phần tử = 1 dòng** riêng, TC ID `<case_id>.<n>`, cột `Dữ liệu kiểm thử` = giá trị hàng đó.
- `checklist_items` → 1 dòng, `Kết quả mong đợi` = "Hiển thị đầy đủ: " + join.
- `impact` → sheet riêng **"Nghiệp vụ ảnh hưởng sau khi xử"**.
- `automation_level` **KHÔNG** thành cột (giữ đúng 14 cột thật).
- Validation: số dòng Excel = scenario thường + tổng phần tử `examples` + checklist + impact.

## Phạm vi Phase 1
CÓ: schema này · derive → Excel · dev-view render · `[CẦN LÀM RÕ]` field. CHƯA (Phase 2): merge-by-TC-ID (giữ cột 11-14), traceability matrix, xuất `.feature`.
