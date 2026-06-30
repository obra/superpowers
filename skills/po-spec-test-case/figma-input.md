# Input Figma cho test-case generation

## Không có Figma MCP ở web session

Đã kiểm tra `search_mcp_registry` cho "figma"/"design" — không có kết quả. Đây là giới hạn đã biết: MCP connector của Figma (nếu user có setup) hiện chỉ surface ở Claude Code/desktop, không xuất hiện trong claude.ai web session. Đừng tốn lượt search lại trừ khi user xác nhận họ vừa setup thứ gì khác — đi thẳng vào 2 đường nhận input dưới đây.

## Cách nhận input Figma

1. **Ảnh/PDF export trực tiếp (ưu tiên, nhanh và chắc nhất)** — User export frame liên quan từ Figma (PNG/PDF) và upload. Đọc bằng `view` (ảnh) hoặc pdf-reading skill (PDF).
2. **Link Figma + Claude in Chrome** — Nếu user chỉ đưa link share và Claude in Chrome đang connected: `navigate` tới link, sau đó dùng `computer` để chụp screenshot từng frame quan trọng. KHÔNG dùng `read_page`/accessibility tree cho Figma — Figma render bằng canvas/WebGL nên accessibility tree gần như trống hoặc sai lệch hoàn toàn. Luôn đọc bằng vision (screenshot), không scrape DOM.
3. **Không có ảnh, không có Chrome khả dụng** — Hỏi user export ảnh, hoặc xin họ mô tả bằng lời các state quan trọng (default/empty/error/loading). Đừng tự đoán UI khi không có gì để nhìn — thà thiếu test case còn hơn test case dựa trên UI tưởng tượng.

## Trích state từ Figma cho mục đích sinh test case

Khác với `po-spec-review` (mục tiêu là soi MISMATCH giữa doc và Figma), ở đây mục tiêu là liệt kê đầy đủ STATE/SCENARIO khả thi để biến thành test case. Mỗi state tìm được sẽ thành ít nhất một case — nhãn `Loại TC` cuối cùng gán theo tập thật ở `test-design-patterns.md`, không phải gán nhãn "Happy/Edge/Negative". Với mỗi frame liên quan, tìm:

- **State mặc định (default)** — luồng lõi của màn, thường thành case `Smoke` (load mặc định) hoặc `UI` (hiển thị đủ thành phần).
- **Empty state, error state, loading/skeleton** — mỗi state nhìn thấy thường thành một case riêng: `UI` cho phần hiển thị state đó, `Negative` cho riêng error do API/mạng.
- **Disabled/hover/focus, validation message hiển thị sẵn** (vd "Tối đa 50 ký tự", "Trường bắt buộc") — bắt thành constraint cho `Dữ liệu kiểm thử` và case `Validation` tương ứng (nhập vượt giới hạn, bỏ trống trường bắt buộc).
- **Luồng nhiều frame** (vd bước 1 → bước 2 → confirm) — map thành một chuỗi case end-to-end, đừng tách rời từng màn nếu chúng thuộc cùng một flow.
- **Annotation/redline** (chữ đỏ, comment trên file Figma) — ghi chú riêng, thường chứa rule mà doc không viết ra → hay thành case `Business Rule`.

## Khi Figma cho thấy state mà doc không nói gì

Đừng tự bịa Expected Result. Tạo test case dạng `[CẦN LÀM RÕ]` (xem `test_case_template.md`), trỏ thẳng tới frame/section liên quan, và liệt vào "Câu hỏi cho PO" ở cuối output. Đây thực chất là cùng nhóm lỗi mà `po-spec-review` Mục 4 (doc-vs-Figma mismatch) hay bắt được — chỉ khác là ở đây nó chặn việc viết test case thay vì chặn việc review.
