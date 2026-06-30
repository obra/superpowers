# Heuristics suy test case + taxonomy thật của RinoEdu

## Cách nghĩ để tìm ra case (Happy / Edge / Negative) — chỉ là công cụ brainstorm

Ba góc này dùng để KHÔNG BỎ SÓT case khi suy nghĩ, KHÔNG phải nhãn cuối cùng gán vào cột `Loại TC`. Xem mục "Phân loại thật" ngay dưới để biết nhãn thật cần gán.

- **Happy path**: đúng luồng chính theo AC hoặc theo flow chính trên Figma. Mỗi AC → tối thiểu 1 case, đừng gộp 2 AC khác nhau vào 1 case.
- **Edge case**: boundary value (min/max length, 0/1/max item, trang đầu/cuối), state hợp lệ nhưng hiếm (empty, filter ra 0 kết quả), state chỉ thấy trên Figma không phải luồng chính (skeleton, partial data), concurrent/đồng thời.
- **Negative**: input sai format/vượt giới hạn, sai quyền, lỗi hệ thống (API timeout, 5xx, mất mạng), trùng/lặp submit, session hết hạn giữa luồng.

## Phân loại thật đang dùng ở RinoEdu (`Loại TC`) — dùng đúng tập này khi gán nhãn

Quan sát từ test case thật của 2 team (TEAM1-697, TEAM4-747): RinoEdu KHÔNG gán nhãn Happy/Edge/Negative trực tiếp vào cột `Loại TC`. Nhãn thật lấy từ tập sau, có thể ghép 2 nhãn kiểu `UI/Functional` hoặc `UI/Business Rule` khi case thật sự thuộc cả hai góc:

- **Smoke** — luồng lõi phải chạy được, test trước tiên khi vào một màn/feature mới.
- **UI** — đúng/đủ thành phần hiển thị (tile, label, badge, layout, responsive), không liên quan logic xử lý.
- **Functional** — một hành động cụ thể chạy đúng (click, filter, search, mở dialog), không phải luồng lõi và không phải case biên.
- **Validation** — input/format bị chặn đúng rule (trim khoảng trắng, min/max length, bắt buộc nhập, chặn double-submit).
- **Business Rule** — đúng RULE nghiệp vụ miền (chỉ một tile active một lúc, AND giữa nhóm filter nhưng OR trong cùng nhóm, action ẩn/hiện theo trạng thái, ngoại lệ "trừ phiếu Đi học lại không cho hủy duyệt"). Khác Validation ở chỗ đây là rule miền, không phải rule nhập liệu.
- **Negative** — hệ thống xử đúng khi có lỗi/bất thường từ bên ngoài (API lỗi, mất mạng, conflict do người khác xử lý trước, not found).
- **Integration** — dữ liệu/UI đồng bộ đúng giữa nhiều phần (detail cập nhật tại chỗ sau action, list và detail dùng chung một modal, timeline ghi đúng sau mutation).
- **Responsive** — riêng cho hành vi mobile/breakpoint.

Mapping nhanh từ góc brainstorm sang nhãn thật:
- Happy path → **Smoke** (nếu là luồng lõi của cả feature) hoặc **Functional** (nếu là một thao tác phụ vẫn thuộc luồng đúng).
- Edge case → **UI** (nếu chỉ là hiển thị) hoặc **Business Rule** (nếu liên quan rule miền) hoặc **Validation** (nếu liên quan giới hạn input).
- Negative → **Negative**, trừ khi là input sai format/thiếu trường thì dùng **Validation**.

`Priority` (High/Medium/Low) là field RIÊNG, song song với `Loại TC` — không dùng cái này thay cho cái kia. Mỗi test case cần cả hai.

## Impact testing — nghiệp vụ ảnh hưởng chéo module

Cả hai file mẫu đều có một nhóm case riêng chỉ để kiểm tra HỆ QUẢ của một hành động đổi trạng thái lên module/dữ liệu KHÁC ngoài màn đang test (vd duyệt phiếu nghỉ phép → cập nhật trạng thái điểm danh buổi học; duyệt bảo lưu → học sinh bị xóa khỏi lớp trong ERP). Đây là nhóm dễ bị bỏ sót nếu chỉ nhìn UI/Figma của một màn — Figma không bao giờ vẽ "hệ quả ở module khác".

Với MỌI action đổi trạng thái (duyệt, từ chối, hủy, publish...), luôn tự hỏi thêm hai vế:
- **Có ảnh hưởng**: dữ liệu này còn dùng ở đâu khác (điểm danh, ERP, lịch giáo viên, ví học phí...) và state đó có cập nhật đúng khi action xảy ra?
- **Không ảnh hưởng**: khi action bị TỪ CHỐI/HỦY, có đúng là KHÔNG có gì thay đổi ở phần đó không? Case "không-ảnh-hưởng" quan trọng tương đương case "có-ảnh-hưởng", đừng chỉ viết một chiều.

Nhóm case này quan sát thực tế hầu như luôn `Loại TC = Business Rule`, `Priority = High`. Nếu spec/Figma không nói rõ hệ quả chéo module, đây thường là chỗ cần đánh `[CẦN LÀM RÕ]` (xem `test_case_template.md`) hơn là tự suy đoán.

## Dựng ma trận State × View × Action trước khi viết case (cho màn workflow/approval)

Với feature có luồng duyệt/workflow nhiều trạng thái (chờ duyệt/đã duyệt/từ chối...) xuất hiện ở NHIỀU nơi (list, detail, modal), dựng nhanh bảng kiểu sau TRƯỚC khi viết test case — quan sát từ TEAM1-697, kỹ thuật này giúp không bỏ sót tổ hợp trạng thái × nơi hiển thị, đặc biệt khi có exception rule:

| Trạng thái | List | Detail | Modal liên quan |
|---|---|---|---|
| Chờ duyệt | nút nhanh Duyệt/Từ chối khi hover dòng | Phê duyệt/Từ chối ở header | Modal xác nhận duyệt; modal nhập lý do từ chối (*) |
| Đã duyệt | nút nhanh Hủy duyệt khi hover (trừ case ngoại lệ) | Hủy duyệt ở header (trừ case ngoại lệ) | Modal nhập lý do hủy duyệt (*) |
| Không duyệt / Hủy duyệt | không có nút xử lý tiếp | ẩn toàn bộ nút | — |

Mỗi ô gợi ý trực tiếp ít nhất một test case (UI: nút có hiện đúng vị trí không; Business Rule: case ngoại lệ có đúng không; Functional: click có mở đúng modal không). Nếu đưa bảng này vào output, để nó thành một block riêng ở cuối phần test case của màn đó — đừng trộn cột của bảng này vào bảng test case chính, hai bảng có schema khác nhau.

## Domain seed cho RinoEdu (EdTech)

Áp các pattern trên vào flow cụ thể nhanh hơn nếu bắt đầu từ seed sau — điều chỉnh theo feature thật đang xử lý, đây là điểm khởi đầu chứ không phải danh sách đóng:

- **Đăng ký / enrollment**: trùng đăng ký một lớp, hết slot giữa lúc đang đăng ký, học viên đăng ký xong nhưng chưa thanh toán xong thì hệ thống coi là gì.
- **Tiến độ học (lesson progress)**: mất kết nối giữa bài học chưa lưu được tiến độ, xem lại bài đã hoàn thành có ghi đè tiến độ không (idempotency), tiến độ lệch giữa hai thiết bị cùng một tài khoản.
- **Giáo viên publish nội dung**: publish khi thiếu field bắt buộc, publish lại một bản đã publish (versioning xử sao), rollback sau khi publish lỗi giữa chừng.
- **Payment checkout**: cổng thanh toán trả lỗi/timeout, double-charge khi double-click nút thanh toán, huỷ giao dịch giữa luồng, số tiền hiển thị ở FE lệch với số tiền charge thật ở BE.
- **Workflow duyệt/từ chối/hủy** (như BALU): action ẩn/hiện theo trạng thái + theo loại đơn, lý do bắt buộc khi reject/cancel, list và detail dùng chung modal, conflict khi 2 người xử lý cùng lúc — xem ma trận State × View × Action ở trên.

## Khi nào KHÔNG cần đẩy lên test case kiểu E2E

Tái dùng nguyên tắc đã thống nhất trước đó: ưu tiên unit/integration test cho logic không cần UI thật (tính toán, validation rule). Chỉ định danh "nên automate ở mức E2E" cho flow mà nếu lỗi production thì thực sự có người bị gọi lúc 2 giờ sáng (đăng ký, thanh toán, tiến độ học — các flow core). Các case Negative/Business Rule còn lại, ghi chú "phù hợp integration test hơn E2E" ngay trong test case thay vì mặc định liệt hết ở mức E2E — tránh lặp lại anti-pattern suite E2E chậm/flaky đã từng nói tới.
