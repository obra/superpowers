---
name: po-spec-test-case
description: Sinh test case QA (Smoke/UI/Functional/Validation/Business Rule/Negative/Integration/Responsive — đúng taxonomy thật của RinoEdu) từ tài liệu đặc tả của PO (docx, Confluence export) kết hợp Figma design. Dùng skill này khi user nhắc tới viết test case, sinh test case, test case từ spec/PO, tester cần test case cho feature mới, hoặc upload đặc tả PO + Figma và muốn ra danh sách test case để QA review/automate. Khác với po-spec-review (review tìm lỗi đặc tả trước khi build) — skill này tạo test case thực thi được, dùng sau khi đặc tả đã tương đối rõ ràng.
---

# Sinh test case từ PO spec + Figma

## Việc skill này làm — và KHÔNG làm

Sinh test case THỰC THI được (QA chạy tay hoặc automate), không phải review/critique đặc tả. Nếu đặc tả còn nhiều ambiguity/blocker rõ ràng, gợi ý dùng `po-spec-review` trước — sinh test case trên một spec còn nhiều lỗ hổng chỉ tạo ra test case sai.

Nếu input đã kèm sẵn output của `po-spec-review` (đặc tả đã qua review, blocker đã được trả lời), ưu tiên dùng bản đã review đó làm nguồn sự thật, không re-flag lại blocker đã resolve.

**Vị trí trong chuỗi:** chạy SAU `slicing-stories-model-b`, **theo từng US**. Với mỗi US, input gồm: (a) **section doc con đã review + Figma** của US đó → AC, state, mismatch (nội dung test case lấy từ đây); (b) **US-00 contract** trong breakdown (`docs/rino-s9s/specs/<date>-<EPIC>/us-breakdown-model-b.md`) → enum/DTO/permission/endpoint canonical. **KHÔNG** sinh test case chỉ từ bảng US của breakdown — nó thiếu AC/state.

**Cổng ATDD:** dev-view được dev duyệt/phản biện **per-US, ngay trước `writing-plans`/TDD** của US đó (re-check drift doc/Figma) — KHÔNG phải lúc sinh ở Pass 1. Dev-view là artifact sống, regenerate được. Dev không duyệt-pass AC nào còn `[CẦN LÀM RÕ]`.

## Quy trình

### 1. Đọc input

- **Doc PO**: nếu là `.docx` thật → đọc trực tiếp bằng docx skill / file-reading skill. Nếu là Confluence "Save as Word" export (đuôi `.doc` nhưng thực chất là MIME multipart, KHÔNG phải OOXML hay .doc binary thật) → chạy `prep_doc.py <file>` trước để decode + tách section + build claim index. Đáng chạy script khi file raw lớn hơn ~30-40KB — phần lớn dung lượng đó thường là CSS/markup rác, không phải nội dung thật.
- **Figma**: xem `figma-input.md`. Không có Figma MCP connector ở web session (đã kiểm tra registry) — đi thẳng đường ảnh/PDF export hoặc Claude in Chrome + screenshot (vision-based). Không cố scrape DOM/accessibility tree cho Figma.

### 2. Trích scenario + state

Với mỗi user story / AC trong doc, xác định luồng chính (Given-When-Then nếu doc viết theo dạng đó). Với mỗi frame Figma liên quan, xác định toàn bộ state hiển thị được (default, empty, error, loading/skeleton, disabled, validation message...). Chi tiết cách trích state ở `figma-input.md`.

### 3. Suy test case + gán nhãn đúng taxonomy thật

Dùng Happy path / Edge case / Negative chỉ để BRAINSTORM không bỏ sót case — nhãn cuối gán vào `Loại TC` lấy từ tập thật của RinoEdu (`Smoke/UI/Functional/Validation/Business Rule/Negative/Integration/Responsive`, có thể ghép như `UI/Functional`). Bảng mapping brainstorm → nhãn thật ở `test-design-patterns.md`. File đó có sẵn domain seed cho các flow quen của RinoEdu (enrollment, lesson progress, publish nội dung, payment checkout, workflow duyệt/từ chối) — tận dụng nếu feature đang xử khớp nhóm này.

Với feature có luồng workflow nhiều trạng thái hiện ở nhiều nơi (list/detail/modal), dựng ma trận State × View × Action trước (xem `test-design-patterns.md`) rồi mới viết case — tránh bỏ sót tổ hợp.

Sau khi xong case cho chính màn đang xử, luôn thêm một lượt **Impact testing**: action đổi trạng thái này ảnh hưởng gì tới module/dữ liệu khác (điểm danh, ERP, lịch GV...) — kể cả chiều "không ảnh hưởng" khi action bị từ chối/hủy. Gom riêng thành section/sheet "Nghiệp vụ ảnh hưởng sau khi xử", thường gán `Business Rule` + `High`.

### 4. Flag chỗ chưa rõ — đừng tự suy diễn Expected Result

Nếu một case cần Expected Result mà spec/Figma không định nghĩa rõ (state thiếu mô tả, con số mâu thuẫn giữa các section, role/khái niệm chưa định nghĩa — cùng nhóm lỗi `po-spec-review` hay bắt được), set field `needs_clarification` trong nguồn (→ ép `automation_level=manual_only`, KHÔNG viết Then) — render ra `[CẦN LÀM RÕ]` ở cả 2 view (xem `testcase-source-schema.md`). KHÔNG bịa hành vi để lấp khoảng trống. Gom toàn bộ case dạng này vào mục "Câu hỏi cho PO" ở cuối output.

### 5. Xuất: một NGUỒN canonical → hai render

Test case sống ở **một nguồn canonical JSON / US** (schema + mapping rules: `testcase-source-schema.md` — đọc trước khi viết). Từ nguồn dẫn xuất **2 render**; KHÔNG sửa render trực tiếp, KHÔNG dẫn Excel từ text Gherkin.

1. **Viết nguồn** (per-US, 2 tầng acceptance + detail; mỗi case có `kind`, G-W-T hoặc `checklist_items`, `loai_tc`, `priority`, `automation_level`, `needs_clarification`, impact). Lưu `docs/rino-s9s/specs/<date>-<EPIC>/testcases/<US>.json`. Single-writer = PO/BA.
2. **Dev-view (Markdown Gherkin)** render từ nguồn — `flow`/`impact`→scenario (tags trace + `automation_level`), `ui`/`responsive`/`smoke`→checklist, cần-làm-rõ→`@needs-clarification` không Then. Đây là bản **dev duyệt/phản biện**; cũng là draft **user review** như cũ.
3. **Tester-view (Excel 14-cột)** sau khi user duyệt: `python derive_source_to_xlsx_input.py <US>.json xlsx_input.json` → `python build_test_case_xlsx.py xlsx_input.json <out>.xlsx`. Giữ đúng 14 cột (`test_case_template.md` là ĐÍCH); `examples`→N dòng có TC ID riêng; impact→sheet riêng; 4 cột tracking trống.

**Regenerate an toàn:** `build_test_case_xlsx.py` **merge theo TC ID** — giữ cột 11-14 (kết quả tester đã điền) + case tester tự thêm; case bỏ ở nguồn → đánh dấu OBSOLETE (không xoá). **Kiểm độ phủ:** `python trace_matrix.py <US>.json` (cảnh báo AC 0 case / ref AC sai) — chạy ở cổng ATDD. (Phase 3: xuất `.feature` — chưa.)

## Fan-out (Claude Code, tuỳ chọn)

*Gia tốc* khi nhiều US — KHÔNG phải xương sống. Nơi không có sub-agent hoặc < 3 US → làm **tuần tự, logic y hệt**.

- **Cổng fan-out:** chỉ bung khi (a) harness có Task/sub-agent **và** (b) ≥ 3 US (độc lập theo nghĩa sinh-case: leaf chỉ cần section doc + lát contract, không cần US khác — KHÔNG phải độc lập nghiệp vụ). Cơ chế dispatch: xem `dispatching-parallel-agents`.
- **Leaf = sinh case 1 US.** NHẬN: section doc đã review của US + figma refs · **lát US-00 contract** · `test-design-patterns.md` + `testcase-source-schema.md`. TRẢ: **nguồn-per-US** (JSON theo `testcase-source-schema.md`: G-W-T/checklist + trace AC/US + `contract_ref` + `automation_level` + `needs_clarification` + Impact nội-bộ-US). Leaf KHÔNG render/xuất `.xlsx`.
- **KHÔNG** đưa leaf chỉ bảng US của breakdown để sinh case — thiếu AC/state.
- **Orchestrator giữ (không giao):** gộp + dedup cross-US **trên nguồn** (theo trace AC/US) · **Impact CROSS-US** (action US-A đụng dữ liệu US-B) · cross-check số liệu toàn doc · render dev-view + Excel từ nguồn đã gộp, xuất `.xlsx` sau khi user duyệt **draft ĐÃ GỘP**.

## Nguyên tắc

- 1 AC/1 state rõ ràng = 1 test case riêng. Đừng gộp nhiều điều kiện vào một case khiến Expected Result mơ hồ, không assert được.
- Expected Result phải quan sát/assert được — tránh kiểu viết "hiển thị đúng", "hoạt động bình thường".
- Spec im lặng → flag, đừng đoán. Đoán sai thì test case sai, automate theo cái sai đó còn tệ hơn không có test case.
- Doc dài, nhiều màn/nhiều US → xử từng màn trước, rồi mới làm một lượt cross-check số liệu toàn doc (claim index từ `prep_doc.py` hỗ trợ bước này).
- Trước khi liệt một edge/negative case nào đó cần automate full E2E, tự hỏi theo nguyên tắc đã thống nhất: nếu flow này lỗi, có ai bị gọi lúc 2 giờ sáng không? Nếu không, note "phù hợp integration test hơn E2E" trong test case thay vì mặc định đẩy hết lên E2E.
- `Loại TC` và `Priority` là hai field độc lập, mỗi case cần cả hai — không lấy cái này thay cho cái kia.
- `Dữ liệu kiểm thử` phải là giá trị CỤ THỂ, dùng được ngay (tên/mã/số liệu mẫu như "BL-00002", "Lê Chi", chuỗi vượt max length thật), không viết chung chung kiểu "input hợp lệ" / "dữ liệu bất kỳ". Tester nhận case data mơ hồ thì vẫn phải tự nghĩ lại từ đầu.
- Đừng dừng ở happy path. Mỗi AC và mỗi state nhìn thấy trên Figma cần tối thiểu một case; một màn thật thường ra vài chục case (file mẫu: 36–45 case/màn) — nếu chỉ ra dăm ba case thì gần như chắc chắn đang bỏ sót state/edge/negative.
- Schema 14 cột chọn theo bản TEAM1 (đầy đủ hơn TEAM4). Nếu thấy team khác có convention khác hẳn, hỏi lại trước khi áp schema này cho team đó — đừng tự cho rằng mọi team RinoEdu đều theo đúng một schema.
- **Nếu US đến từ `slicing-stories-model-b`:** test case Integration / Business Rule / Impact phải bám **US-00 contract** (enum/DTO/permission/endpoint đã đóng băng) — đừng tự suy enum hay permission. Lệch contract FE/BE đã thống nhất = test sai.
