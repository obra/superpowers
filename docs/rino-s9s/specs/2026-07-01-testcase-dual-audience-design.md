# Thiết kế: Test case một-nguồn, hai-đối-tượng (dev Gherkin + tester Excel)

> Ngày: 2026-07-01 · Trạng thái: **Đã duyệt (brainstorm, sau critique 5 lăng kính)** — chờ implementation
> Skill: `po-spec-test-case` · Liên quan: `slicing-stories-model-b`, chuỗi Pass 1 → writing-plans/TDD

## 1. Bối cảnh & mục tiêu

Skill hiện sinh test case Excel 14-cột (sao y file thật TEAM1-697) cho tester manual. Yêu cầu mới:
- **Tester:** giữ nguyên Excel manual 14-cột — KHÔNG đổi.
- **Dev "đi qua trước" với 4 vai trò:** duyệt AC trước khi code (ATDD) · self-test checklist · góp/phản biện test case · nguồn viết automated test.
- **"Chuẩn formal" = Gherkin** (Given-When-Then), KHÔNG ôm ISO 29119 nặng.

## 2. Quyết định gốc — ĐẢO HƯỚNG DỮ LIỆU

Sai lầm phải tránh: coi JSON mà `build_test_case_xlsx.py` đang ăn là "nguồn". JSON đó là bản **đã render phẳng cho Excel** (10 field, không G-W-T/US/AC/automation) → lấy làm nguồn = render-trên-render → drift.

**Nguồn canonical = 1 file MỚI (YAML/JSON, per-US), máy-đọc-được.** Cả dev-view (Gherkin) lẫn tester-view (Excel) đều **dẫn xuất từ nguồn này**. Cấm dẫn Excel từ text Gherkin.

Schema mỗi case:

| Field | Ý nghĩa |
|---|---|
| `case_id` | = TC ID, **bền** qua các lần regenerate (không tái đánh số) |
| `us_id`, `ac_id[]` | trace US + AC (list vì N-N) |
| `nhom_chuc_nang`, `module` | trace ticket/US + vùng UI (2 cột Excel thật) |
| `title` | Mục tiêu kiểm thử |
| `kind` | `flow` \| `ui` \| `responsive` \| `smoke` \| `impact` — quyết định cách render |
| `tier` | `acceptance` (mức AC, dev duyệt) \| `detail` (case chi tiết treo dưới AC) |
| `given[] / when[] / then[]` | mảng step (cho `flow`/`impact`) |
| `checklist_items[]` | cho `ui`/`responsive`/`smoke` (không ép G-W-T) |
| `loai_tc[]` | nhãn, **ghép được** (`UI/Functional`) |
| `priority` | High/Medium/Low |
| `test_data` | giá trị CỤ THỂ; Scenario Outline → `examples[]` |
| `automation_level` | enum đóng `{e2e, integration, manual_only}` |
| `needs_clarification` | `{is, reason, ref}` — field trạng thái, KHÔNG phải marker text |
| `is_impact`, `affected_module` | cho case Impact cross-module |
| `contract_ref` | enum/endpoint/permission dẫn từ US-00 (chống stale contract) |

## 3. Kiến trúc: nguồn 2 tầng → 2 render + trace matrix

```
                    NGUỒN canonical per-US (2 tầng: acceptance + detail)
                    single-writer: PO/BA · repo docs/rino-s9s/specs/... · banner DO NOT EDIT trên render
                         │
        ┌────────────────┼─────────────────────────┐
        ▼                ▼                           ▼
   Render A          Render B                  Traceability matrix
   dev-view          tester-view               (phái sinh)
   Markdown Gherkin  Excel 14-cột              AC→case (cảnh báo AC 0 case)
   (acceptance nổi,  (flatten cả 2 tầng,       case→AC (case mồ côi)
    detail collapse) merge-by-TC-ID)           = gate coverage ở cổng ATDD
```

## 4. Render A — dev-view (Markdown Gherkin, 0-dependency)

- **BỎ `.feature`** (chưa team nào chạy BDD runner) — chỉ Markdown Gherkin-text. Nếu sau này có runner, sinh thêm `.feature` plain-text, không validate qua runner.
- **Chỉ case `kind=flow`/`impact` → Gherkin scenario.** `ui`/`responsive`/`smoke` → **checklist bullet có trace AC** (KHÔNG giả làm scenario — ép G-W-T lên UI tĩnh là gượng). Vẫn hiện **đầy đủ** để dev không bỏ sót state Figma.
- **Impact → scenario cross-module tường minh, CẢ 2 chiều** (có ảnh hưởng / KHÔNG ảnh hưởng khi reject-cancel). First-class.
- **2 tầng:** acceptance scenario nổi bật; case detail **collapse** dưới từng AC (không loại bỏ — collapse chỉ ở trình bày).
- **Tags** mang metadata: `@{loai_tc} @{priority} @us-x @ac-n @{automation_level} @impact @needs-clarification`.
- Banner đầu file: `# DO NOT EDIT — generated from <nguồn>. Dev comment để phản biện; sửa nội dung ở nguồn.`

## 5. Render B — tester-view (Excel 14-cột, GIỮ NGUYÊN)

- `build_test_case_xlsx.py` **giữ nguyên** HEADERS/ROW_KEYS 14 cột. Thêm script `derive_source_to_xlsx_input`: `given[]→Tiền điều kiện`, `when[]→Bước thực hiện` (join `1. 2. 3.`), `then[]→Kết quả mong đợi`, `test_data→Dữ liệu kiểm thử` (cột 7), giữ `nhom_chuc_nang/module/loai_tc(ghép)/priority`. `checklist_items` → mỗi item 1 dòng.
- `automation_level` **KHÔNG thành cột 15** — sống ở nguồn + dev-view. Muốn thêm cột phải xin lead RinoEdu (đụng schema thật).
- **Merge-by-TC-ID khi regenerate:** đọc `.xlsx` cũ nếu có → **giữ cột 11-14** (kết quả QA) + case tester thêm tay → chỉ update cột 1-10 của TC ID trùng → case bị xoá ở nguồn đánh dấu **OBSOLETE** (không xoá hàng, tránh lệch dòng tester).
- Giữ **sheet "Nghiệp vụ ảnh hưởng sau khi xử"** riêng cho case Impact.

## 6. Mapping Gherkin ↔ Excel (ràng buộc cứng)

- **1 scenario = 1 case.** 1 AC cần assert nhiều điều kiện độc lập → **tách ở NGUỒN thành nhiều case ngay**. Cấm "multi-Then trong 1 scenario rồi dẫn 1 dòng Excel" (phá nguyên tắc "1 AC = 1 case assert được").
- **Scenario Outline:** mỗi hàng `examples` = **1 dòng Excel độc lập**, TC ID riêng nối tiếp, cột `Dữ liệu kiểm thử` điền giá trị cụ thể hàng đó (`BL-00002`, `Lê Chi`). Cấm "chạy với các giá trị trong bảng".
- **Validation số dòng:** dòng Excel = scenario thường + tổng hàng examples + checklist items + impact scenarios.

## 7. `needs_clarification` (ở CẢ hai render)

- `is=true` → **BẮT BUỘC `automation_level=manual_only`**; render A gắn `@needs-clarification`, **không sinh Then assert**, tách khỏi scenario đã chốt, gom vào "Câu hỏi cho PO".
- Render B: giữ `[CẦN LÀM RÕ]` + tô nền ô (như hiện tại).
- **Cấm** sinh automated test từ case gắn cờ tới khi PO đóng. **Dev không được duyệt-pass** AC còn `[CẦN LÀM RÕ]` ở tầng acceptance.

## 8. `automation_level`

- Enum đóng `{e2e, integration, manual_only}`, validate ở build. **LLM đề xuất → dev CHỐT tại cổng ATDD**; **preserve theo TC ID** khi regenerate (LLM không tự lật nhãn).
- Tiêu chí: `e2e` chỉ cho flow "gọi 2h sáng" (đăng ký/thanh toán/tiến độ); `integration` cho Business Rule/Negative/Integration không cần UI thật; `manual_only` cho UI/Responsive cảm quan, case cần kênh ngoài (email/SMS/sandbox), hoặc `[CẦN LÀM RÕ]`. **Impact cross-module mặc định = `integration`**, chỉ nâng `e2e` nếu chính flow là core.

## 9. Single-writer & nơi lưu nguồn

- Nguồn canonical ở **repo** `docs/rino-s9s/specs/<date>-<EPIC>/testcases/<US>.(yaml|json)`. **Single-writer = PO/BA.**
- Dev **phản biện qua comment** trên dev-view/PR → **PO apply về nguồn** → regenerate. Dev KHÔNG sửa trực tiếp render.
- Render A + B có banner "DO NOT EDIT — generated". Có lệnh verify (regenerate + diff) để phát hiện ai đó sửa tay render.

## 10. Cổng ATDD (đặt per-US, TÁCH khỏi Pass 1)

- `po-spec-test-case` (Pass 1) chỉ **SINH nguồn + render**, KHÔNG sở hữu cổng.
- **Cổng đặt per-US NGAY TRƯỚC `writing-plans`/TDD của US đó:** dev mở dev-view đúng US → **re-check drift** doc/Figma (test-case sinh sớm ở Pass 1, code diễn ra rải rác về sau) → duyệt/phản biện → mới code.
- Dev-view là artifact **SỐNG, re-generate được**, không phải snapshot dùng-một-lần.

## 11. Cập nhật fan-out (sửa mục 5.2 spec fan-out trước đó)

- Leaf per-US **TRẢ nguồn-per-US có G-W-T** (+ trace AC/US, `contract_ref`, `automation_level`, `needs_clarification`, Impact nội-bộ-US) — **không còn** "draft Markdown 14 cột phẳng".
- Orchestrator **dedup cross-US TRÊN nguồn** theo trace AC/US (không trên text render), rồi render A+B một lần từ nguồn đã gộp, xuất `.xlsx` sau khi user duyệt draft đã gộp.

## 12. Scripts

- `build_test_case_xlsx.py`: giữ 14 cột; **nâng ghi-đè → merge-by-TC-ID** (§5).
- Mới `derive_source_to_xlsx_input.py`: nguồn → JSON phẳng 14-cột mà `build_test_case_xlsx.py` ăn (§5).
- Mới renderer dev-view (Markdown Gherkin) — có thể do agent render trực tiếp trong chat từ nguồn (không nhất thiết script), giữ token/zero-dep.
- Mới: sinh **traceability matrix** (AC→case, case→AC) làm gate coverage.

## 13. Phân phase (giảm rủi ro)

- **Phase 1 (MVP):** schema nguồn + derive script + dev-view Markdown Gherkin (flow) + checklist (ui/responsive) + `[CẦN LÀM RÕ]` field + Excel giữ 14 cột. Cổng ATDD per-US (thủ công đọc dev-view).
- **Phase 2:** merge-by-TC-ID (preserve cột 11-14) + traceability matrix + Impact cross-module 2 chiều đầy đủ + verify-diff.
- **Phase 3 (nếu cần):** xuất `.feature`, step glossary per-epic.

## 14. Ngoài phạm vi & rủi ro

- **Không** ôm ISO 29119 / test management tool. Gherkin chỉ là lớp diễn đạt; trace/coverage/nhãn sống ở nguồn.
- **Không** thêm cột 15 vào Excel tester.
- **Tôn trọng nội dung tuned** (8 Loại TC · Impact · ma trận State×View×Action · `[CẦN LÀM RÕ]`): sửa tối thiểu, theo `writing-skills` (RED→GREEN→REFACTOR) có eval trước/sau; diff nhỏ ở `figma-input.md`/`test-design-patterns.md` (tối đa ~1 câu: mỗi state/scenario = 1 case có G-W-T ở nguồn).
- **Rủi ro:** công sức lớn hơn "mở rộng" (schema mới + 2 script + merge + matrix + render 2 tầng); regression hành vi agent nếu eval kém; TC ID phải bền khi bung Examples/tách case; `contract_ref` stale khi slicing đổi contract → cần cơ chế phát hiện.

## 15. Acceptance tests

- **AT1:** nguồn có Scenario Outline 3 hàng examples → Excel ra đúng 3 dòng, TC ID riêng, cột `Dữ liệu kiểm thử` cụ thể từng hàng.
- **AT2:** case `kind=ui` → dev-view ra **checklist** (không scenario giả); vẫn đủ ở Excel.
- **AT3:** case `needs_clarification=true` → `automation_level=manual_only`, dev-view `@needs-clarification` không có Then, vào "Câu hỏi cho PO"; Excel `[CẦN LÀM RÕ]`.
- **AT4:** regenerate sau khi Excel đã điền cột 11-14 → cột 11-14 **được giữ**, case xoá-ở-nguồn thành OBSOLETE (không mất dòng tester).
- **AT5:** case Impact → dev-view scenario cross-module 2 chiều; Excel vào sheet "Nghiệp vụ ảnh hưởng".
- **AT6:** trace matrix cảnh báo AC không có case nào phủ + case mồ côi (không AC).
