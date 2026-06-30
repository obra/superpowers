---
name: slicing-stories-model-b
description: Use when breaking a Jira Epic or PO docs into User Stories for a team with separate frontend and backend developers (chuyên môn hoá FE/BE, "Model B"), before speccing individual stories. Triggers — phân rã epic, chia US theo mô hình B, chuẩn bị giao việc FE/BE song song, contract-first, classify FE-only/BE-only/split. Dùng SAU po-spec-review (spec đã chốt sạch); KHÔNG dùng cho một feature/spec đơn lẻ — đó là po-spec-review / po-spec-test-case.
---

# Slicing Stories — Model B (chuyên môn hoá FE/BE)

## Overview

Cắt Epic thành US cho đội có **dev FE riêng + dev BE riêng** (không full-stack). Bốn điều **BẮT BUỘC** — cũng là 4 thứ luôn bị bỏ sót nếu làm theo bản năng:

1. Phân loại **MỖI** US: `FE-only` / `BE-only` / `split`, dựa **recon BE legacy** ("endpoint đã có chưa?").
2. Đóng băng **contract** cho mọi US `split`; gom contract dùng chung + **xác minh endpoint GHI rủi ro** vào **US-00 làm TRƯỚC** (đừng đẩy rủi ro ra cuối).
3. FE build trên **mock khớp contract** — không bao giờ chờ BE.
4. Output là **doc breakdown** để duyệt — **KHÔNG tạo issue Jira**.

Cái dùng chung giữa FE/BE chỉ là **contract**; mọi thứ sau mặt cắt là của mỗi specialist.

## When to use

Sau khi **`po-spec-review` đã chốt spec** (0 `[BLOCKER]/[HIGH]` OPEN trên toàn bộ doc), trước **`po-spec-test-case`**, khi đội chuyên môn hoá FE/BE. **Không** dùng nếu đội full-stack thật, hoặc Epic thuần BE (job/cron).

## Quy trình

1. Đọc **bộ doc PO đã review-sạch** (output của `po-spec-review`: report đã chốt + doc đã sửa) → liệt kê **capability** (không phải màn/tab).
2. Cắt **DỌC theo capability**; mỗi US giao được giá trị độc lập. **Nếu doc con đã ≈ US** (PO tách sẵn) → đừng cắt lại, chuyển **chế độ thẩm định** (xem dưới) rồi đi tiếp từ bước 3.
3. **Recon BE legacy** (đọc code 5 service): endpoint/model đã có chưa — *đã có (đọc)* / *sửa nhẹ* / *tạo mới*. Recon có thể lộ **câu hỏi PO đợt 2** (endpoint ghi chưa có / permission catalog thiếu) → đưa vào §6 breakdown + gửi PO; `[BLOCKER]` thì chốt **trước** khi đóng US-00 contract.
4. **Phân loại** từng US (xem dưới).
5. Lập **US-00 nền & contract**; **verify ngay** các endpoint GHI rủi ro tại đây.
6. Sắp thứ tự: US-00 trước → theo phụ thuộc → **đẩy phần GHI/BE-legacy rủi ro lên sớm**.
7. Giao việc theo tỉ lệ đội; viết doc theo `breakdown-template.md`.

## Chế độ thẩm định (doc con ≈ US)

Khi PO đã tách doc con gần như từng US, việc của skill **không** phải cắt lại từ đầu mà là **thẩm định mặt cắt + làm phần FE/BE giá trị cao**:

- **Giữ** mặt cắt của PO làm mặc định; chỉ **gộp/tách** khi vi phạm INVEST — đặc biệt chữ **V**: một tab read-only / "shell" KHÔNG phải US độc lập.
- **Vẫn chạy đủ bước 3–7** (recon BE legacy · phân loại FE-only/BE-only/split · đóng băng US-00 contract · verify endpoint ghi rủi ro · sắp thứ tự · giao việc). Đây là phần giá trị — không được bỏ.
- Ghi rõ trong breakdown chỗ nào bạn **đổi** mặt cắt của PO và vì sao.

## Phân loại US

- Job/cron/sync, không UI → **BE-only**.
- Cần **GHI** dữ liệu (endpoint ghi mới) → **split** (FE‖BE).
- Chỉ **đọc**: endpoint legacy **đã có** → **FE-only**; **chưa có** (cần GET/counter mới) → **split**.

## Giao việc theo tỉ lệ đội

- **FE-nặng & ít FE** (vd 2BE+1FE): FE là cổ chai → BE **chạy trước** dọn đường (US-00 contract + endpoint ghi + verify GET + **fixtures**); FE chạy **dây chuyền** không nghẽn; BE dư front-load Epic kế.
- **BE khan hiếm:** dồn kiến thức legacy vào ít BE chuyên; FE-only chạy song song.
- **Cân bằng:** mỗi US `split` fork FE‖BE qua contract.

Quy tắc cứng: **FE build theo mock; trong US `split`, BE làm endpoint trước.**

## Output

Viết `docs/rino-s9s/specs/<date>-<EPIC>/us-breakdown-model-b.md` (cùng thư mục với report của `po-spec-review`) theo `breakdown-template.md` (cùng thư mục skill này — đọc nó trước khi viết). Đề xuất, không tạo Jira.

**Bàn giao:** breakdown được duyệt → sang **`po-spec-test-case`** sinh test case **theo từng US**. US-00 contract (enum/DTO/permission/endpoint) là nguồn sự thật cho test case Integration/Business Rule; nội dung AC/state/Figma vẫn lấy từ doc con đã review.

## Common Mistakes

- Cắt **ngang theo tab/tầng** → over-fragmentation. Cắt dọc theo capability, gộp tab đồng dạng.
- **FE chờ BE** → phải build trên mock.
- **Không gán** nhãn FE-only/BE-only/split cho từng US.
- **Đẩy endpoint ghi rủi ro ra cuối** → verify ở US-00.
- Coi "shell"/1 tab read-only là giá trị độc lập → kiểm INVEST chữ V, gộp.
- **Bịa** endpoint/permission → recon thật, gate trên catalog thật (model/action).

## Red Flags — DỪNG, làm lại

US thiếu nhãn slice · US `split` thiếu contract point · kế hoạch để **FE chờ BE** · endpoint ghi rủi ro nằm ở US cuối · cắt theo tab thay vì capability · tự tạo issue Jira.
