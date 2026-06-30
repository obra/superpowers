# Thiết kế: Fan-out hybrid cho chuỗi skill PO

> Ngày: 2026-06-30 · Trạng thái: **Đã duyệt (brainstorm)** — chờ implementation plan
> Phạm vi: `po-spec-review` → `slicing-stories-model-b` → `po-spec-test-case`

## 1. Bối cảnh & vấn đề

Hiện mỗi skill chạy bằng **1 agent** đọc full `SKILL.md` và thực thi toàn bộ trong **1 context**. Pain (user xác nhận cả 4):
- **Context limit** khi bộ doc tổng + doc con quá lớn cho 1 context (review chéo / sinh test case).
- **Chậm** khi xử tuần tự nhiều doc / nhiều US.
- **Sót case** vì chỉ một góc nhìn.
- Muốn theo **best-practice**.

Ràng buộc harness: **Claude Code là chính**, nhưng skill phải **vẫn chạy được** trên Cursor/Codex → fan-out là *optional accelerator*, có **fallback tuần tự**.

## 2. Quyết định kiến trúc

**Hướng 2 — Hybrid: orchestrator đơn + parallel leaves.**
- Loại Hướng 1 (single-agent thuần): không gỡ được pain context + chất lượng.
- Loại Hướng 3 (Workflow script) làm mặc định: CC-only (vỡ portable) + vòng PO tương tác không hợp batch fire-and-forget. *Để dành* cho tương lai nếu một bước thành batch nặng ở scale lớn.

## 3. Hai vai trò

- **Orchestrator** = agent chính của skill. Giữ MỌI thứ *stateful / tương tác / xuyên-đơn-vị*. Không bao giờ uỷ thác.
- **Leaf sub-agent** (Claude Code Task, **tuỳ chọn**) = làm 1 đơn vị độc lập, ngốn-context. **Hàm thuần**: context vào → findings có cấu trúc ra. Vô trạng thái, không biết hội thoại.

## 4. Cổng fan-out (khi nào mới bung)

Chỉ fan-out khi **CẢ HAI** đúng:
1. Harness có sub-agent (= Claude Code). Nơi khác → tuần tự, **logic y hệt**.
2. Có **≥ 3 đơn vị độc lập** (doc / US). Dưới ngưỡng → tuần tự trong context orchestrator (rẻ hơn, khỏi gộp).

> Ngưỡng 3 là default đã duyệt; tinh chỉnh khi có số doc-con/US thực tế mỗi epic.

## 5. Hợp đồng leaf (IN/OUT)

### 5.1. `po-spec-review` — leaf "đọc sâu 1 doc" (CHỈ vòng 1)
- **IN:** 1 doc (hoặc file section từ `prep_doc.py`) · `DOCKEY` · `probe-bank.md` · figma refs của doc đó.
- **OUT (cấu trúc):** danh sách finding `{ID: DOCKEY-n, severity, nhóm 1–5, tiêu đề, trích nguyên văn, impact, giả định an toàn}` + câu hỏi PO. **Không** có claim cross-doc (leaf không thấy doc khác).

### 5.2. `po-spec-test-case` — leaf "sinh case 1 US"
- **IN:** section doc đã review của US · figma refs · **lát US-00 contract** (enum/DTO/permission/endpoint) · taxonomy (`test-design-patterns.md`) + `test_case_template.md`.
- **OUT (cấu trúc):** test case theo schema 14 cột + cờ `[CẦN LÀM RÕ]` + câu hỏi PO của US đó.

### 5.3. `slicing-stories-model-b` — gần như KHÔNG fan-out
Recon + contract phụ thuộc nhau. Tuỳ chọn nhẹ: 1 leaf recon mỗi service legacy (đọc song song → "endpoint có chưa"); orchestrator gộp để phân loại FE/BE + đóng US-00 contract.

## 6. Ở lại orchestrator — KHÔNG bao giờ fan-out

- **Re-review diff** (stateful — cần report vòng trước).
- Tính **cổng bàn giao** + quyết định handoff.
- Tổng hợp **cross-doc** / dedup **cross-US** / **Impact-testing** (cần nhìn toàn cục).
- **Đối thoại PO** + vòng lặp human-in-the-loop.
- Ghi **artifact cuối** (`.xlsx`, file `review-*.md` per-doc).

→ Hệ quả khoá cứng: review **vòng 1 fan-out được**, **re-review thì không**.

## 7. Đòn bẩy chất lượng (tuỳ chọn — mặc định TẮT)

Sub-agent verify, dùng dè vì nhân token:
- **review:** sau tổng hợp cross-doc, 1 agent thử **bác bỏ** từng mâu thuẫn `[BLOCKER]` (lọc false-positive).
- **test-case:** "completeness critic" mỗi màn — "state/AC nào trên Figma chưa có case?" lặp tới khi cạn.
- Bật khi cần kỹ / user yêu cầu.

## 8. Thể hiện trong skill (giữ gọn — token efficiency)

- `po-spec-review`: thêm mục `## Fan-out (Claude Code, tuỳ chọn)` ~8–12 dòng: cổng + hợp đồng leaf + cái ở lại orchestrator + dòng fallback.
- `po-spec-test-case`: tương tự.
- `slicing-stories-model-b`: ~2 dòng (recon per-service tuỳ chọn).
- **Không** phình core; tuân `writing-skills` (mục mới ngắn, không viết lại nội dung đã tuned).

## 9. Kiểm thử (acceptance)

- **AT1:** epic 5-doc trên CC → agent fan-out **vòng 1** per-doc; giữ cross-doc + cổng + re-review ở orchestrator.
- **AT2:** re-review vòng 2 → **KHÔNG** fan-out (stateful); diff theo ID đúng.
- **AT3:** harness không sub-agent / doc < 3 → **fallback tuần tự**, output y hệt về cấu trúc.
- **AT4:** test-case epic nhiều US → fan-out per-US; orchestrator gộp + dedup + Impact + xuất `.xlsx`.

## 10. Ngoài phạm vi

- Không chuyển sang Workflow script.
- Không đụng skill upstream (`brainstorming`, `writing-plans`…).
- Đòn bẩy chất lượng (mục 7) để default OFF.
