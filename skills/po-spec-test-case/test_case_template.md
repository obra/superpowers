# Test case template — theo đúng schema thật của RinoEdu

Schema này lấy từ file thật TEAM1-697 (4 sheet, 14 cột/sheet) — chọn làm canonical vì đầy đủ hơn bản TEAM4-747 (thiếu `Loại TC` và `Dữ liệu kiểm thử` riêng). Nếu PO/lead muốn theo đúng style một team cụ thể, hỏi lại — mặc định dùng bản này.

## 14 cột, đúng thứ tự thật

| # | Cột | Ai/khi nào điền | Mô tả |
|---|---|---|---|
| 1 | TC ID | Lúc tạo | `<MÃ-MODULE>-<số-sub-feature 2 chữ số>-<số-thứ-tự 3 chữ số>`, vd `BALU-01-003` |
| 2 | Nhóm chức năng | Lúc tạo | `<mã ticket/sheet> - <mã US>`, vd `TEAM1-731 - US-BALU-01` — để trace ngược ticket |
| 3 | Module | Lúc tạo | Vùng UI/chức năng cụ thể đang test (không phải tên cả màn) — vd "Status tiles", "Lọc nâng cao", "Tab lịch sử" |
| 4 | Mục tiêu kiểm thử | Lúc tạo | Tiêu đề ngắn, đủ hiểu không cần đọc thêm |
| 5 | Tiền điều kiện | Lúc tạo | Điều kiện cần có trước khi thực hiện |
| 6 | Bước thực hiện | Lúc tạo | Đánh số 1. 2. 3. ngay trong cell, không tách dòng riêng |
| 7 | Dữ liệu kiểm thử | Lúc tạo | Giá trị input cụ thể dùng để test (tên, mã, số liệu...) |
| 8 | Kết quả mong đợi | Lúc tạo | Quan sát/assert được — tránh "hiển thị đúng", "hoạt động bình thường" |
| 9 | Loại TC | Lúc tạo | Lấy từ tập thật: `Smoke / UI / Functional / Validation / Business Rule / Negative / Integration / Responsive`, có thể ghép `UI/Functional` — xem `test-design-patterns.md` |
| 10 | Priority | Lúc tạo | `High / Medium / Low` — field riêng, song song với Loại TC |
| 11 | Kết quả Auto mt DEV | Sau khi chạy automation | Để TRỐNG lúc generate |
| 12 | Thời điểm Auto | Sau khi chạy automation | Để TRỐNG lúc generate |
| 13 | Note Auto | Sau khi chạy automation | Để TRỐNG lúc generate |
| 14 | Kết quả manual mt DEV | Sau khi test tay | Để TRỐNG lúc generate |

Cột 11-14 LUÔN để trống khi skill generate — đây là cột QA điền sau khi thực thi, không phải việc của bước sinh test case. Giữ cột để file ghép thẳng vào quy trình tracking hiện có, không cần thêm cột tay.

Test case không xác định được Kết quả mong đợi do spec/Figma chưa rõ → thêm `[CẦN LÀM RÕ]` vào đầu Mục tiêu kiểm thử, Bước thực hiện viết như thường, Kết quả mong đợi ghi rõ lý do thiếu thông tin — KHÔNG tự suy diễn để lấp khoảng trống.

## Tổ chức output: 1 sheet/section = 1 màn hoặc 1 sub-feature

Test case thật được nhóm theo sheet riêng cho mỗi màn/sub-feature trong cùng một ticket (vd `TEAM1-731_Màn danh sách`, `TEAM1-732_Hộp thoại chi tiết`, `TEAM1-733_Luồng xử lý`), CỘNG một sheet riêng `Nghiệp vụ ảnh hưởng sau khi xử` chỉ chứa case Impact (xem test-design-patterns.md). Theo đúng cấu trúc này khi generate — đừng dồn hết vào một bảng dài.

**Excel sheet name tối đa 31 ký tự** — file thật đã bị cắt vì vượt giới hạn này (`...phiếu+ `, `...chi tiết ph`, `...sau khi xử `). Khi xuất `.xlsx` qua `build_test_case_xlsx.py`, script tự cắt — nhưng khi đặt tên sheet trong bước generate, ưu tiên đặt tên ngắn gọn sẵn để tránh bị cắt mất nghĩa.

## Ví dụ minh hoạ (generic, không phải case thật của RinoEdu — chỉ demo đúng 14 cột)

| TC ID | Nhóm chức năng | Module | Mục tiêu kiểm thử | Tiền điều kiện | Bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Loại TC | Priority |
|---|---|---|---|---|---|---|---|---|---|
| STD-01-001 | TEAM2-XXX - US-STD-01 | Status tiles | Load danh sách mặc định | Có dữ liệu học viên đủ trạng thái | 1. Mở màn danh sách 2. Quan sát toolbar/tile/bảng | — | Hiển thị tile trạng thái, bảng dữ liệu, phân trang mặc định | Smoke | High |
| STD-01-014 | TEAM2-XXX - US-STD-01 | Status tiles | Chỉ một tile active một lúc | Có nhiều trạng thái | 1. Click tile A 2. Click tile B | Tile A, Tile B | Chỉ tile B active; tile A bỏ active | Business Rule | Medium |
| STD-01-027 | TEAM2-XXX - US-STD-01 | Trạng thái dữ liệu | Error state khi load lỗi | Giả lập API lỗi | 1. Mở màn danh sách | API error | Hiển thị thông báo lỗi kết nối và nút Tải lại | Negative | High |
| STD-01-041 | TEAM2-XXX - US-STD-01 | Trạng thái dữ liệu | [CẦN LÀM RÕ] Hành vi khi học viên có nhiều enrollment khác status | Học viên có ≥2 lớp status khác nhau | 1. Mở màn danh sách 2. Quan sát trạng thái hiển thị | Học viên có 2 lớp: Đang học + Đã nghỉ | **Chưa xác định** — doc không định nghĩa trạng thái hiển thị thuộc Học viên hay Enrollment khi nhiều lớp khác status. Cần PO/BA chốt trước khi automate | Business Rule | High |

Cột 11-14 (tracking) để trống cho cả 4 dòng trên, không hiển thị ở bảng minh hoạ này để gọn.

## Cấu trúc khi trình bày trong chat trước khi xuất .xlsx

```
# Test case: <Tên màn hình/feature> (<mã US>)
> Nguồn: <tên file doc> · Figma: <đã xem qua ảnh / qua Claude in Chrome / chưa có>

## Tóm tắt
- Tổng: N case (Smoke: a · UI: b · Functional: c · Validation: d · Business Rule: e · Negative: f · Integration: g · Responsive: h)
- Cần làm rõ: k case (xem mục cuối)

## <Tên sheet/sub-feature 1>
[bảng 10 cột đầu — bỏ 4 cột tracking khi xem trong chat cho gọn, script xuất .xlsx sẽ tự thêm lại]

## <Tên sheet/sub-feature 2>
...

## Nghiệp vụ ảnh hưởng sau khi xử (nếu có)
[case Impact riêng — xem test-design-patterns.md]

## Câu hỏi cho PO
[chỉ xuất hiện nếu có case CẦN LÀM RÕ]
```

Sau khi user xác nhận nội dung đúng, dùng `build_test_case_xlsx.py` để xuất file `.xlsx` đa-sheet đúng schema 14 cột, sẵn sàng nộp vào quy trình QA hiện có.

> **Phase 1+:** bảng 14 cột này là ĐÍCH dẫn xuất, KHÔNG phải nguồn. Test case sống ở nguồn canonical (`testcase-source-schema.md`) → `derive_source_to_xlsx_input.py` → `build_test_case_xlsx.py`. Cấm dẫn Excel từ text Gherkin.
