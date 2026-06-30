# Đọc input & đối chiếu Figma

## Đọc input (text sạch)

- **`.docx`/`.dotx`:** ưu tiên skill `docx`; hoặc nhanh: `pandoc file.docx -t plain` / `python-docx`. Giữ tiêu đề, bảng, đoạn AC.
- **Export Confluence "Word"** (đuôi `.doc` nhưng thực ra là MIME multipart + HTML + quoted-printable): parse như email rồi strip HTML. Mẫu nhanh:
  ```python
  import email
  msg = email.message_from_bytes(open(path,'rb').read())
  html = next(p.get_payload(decode=True).decode('utf-8','replace')
              for p in msg.walk() if p.get_content_type()=='text/html')
  # strip tags (giữ \n ở tr/p/td/li/headings) rồi gom whitespace
  ```
- **Văn bản dán / `.md` / `.txt`:** dùng trực tiếp.

## Trích link Figma

Regex gợi ý: `https?://(?:www\.)?figma\.com/(?:design|file|proto)/[^\s"'<>]+`

Từ mỗi URL `figma.com/design/<FILE_KEY>/<slug>?node-id=<A-B>&...`:
- **fileKey** = đoạn ngay sau `/design/` (hoặc `/file/`, `/proto/`).
- **node-id** = giá trị tham số `node-id`. **Chuẩn hoá: đổi `-` thành `:`** → `3484-2704` thành `3484:2704` (API/MCP dùng dấu hai chấm). Không có `node-id` = lấy cả file/trang.

## Lấy design về — theo thứ tự ưu tiên

**(A) Có Figma MCP trong phiên** (tool có tên kiểu `figma`, `get_figma_data`, `get_file`, `get_node`, `get_image`, `get_code`, `get_variable_defs`…):
1. Trước tiên `tool_search("figma")` để biết tên & tham số chính xác — đừng đoán schema.
2. Với mỗi (fileKey, node-id): gọi tool lấy **structure + text + (nếu có) ảnh** đúng node đó.
3. Trích ra: nhãn & micro-copy hiển thị, **tên cột/field** trong bảng, các **state/màn** có trong frame (default/empty/error/loading/hover/disabled), thành phần tương tác (nút, ô lọc, badge…).

**(B) Không có Figma MCP nhưng có Claude‑in‑Chrome** và link mở được trong trình duyệt đã đăng nhập của người dùng:
- Figma vẽ trên **canvas/WebGL** → `get_page_text`/`read_page` (DOM/accessibility) thường **KHÔNG** bóc được nhãn/field. Cách đáng tin hơn: điều hướng tới frame rồi **chụp màn (`computer` screenshot) và đọc design bằng thị giác** — đếm nhóm, đọc tên cột/nhãn/micro-copy trực tiếp từ ảnh; dùng `zoom` cho chữ nhỏ. Đây mới là cách thực tế để đọc một app canvas.
- Cần Chrome đã cài extension + đã **đăng nhập Figma**. Ghi rõ trong report là đối chiếu bằng ảnh chụp (độ phân giải có thể giới hạn độ chắc chắn).

**(C) Không truy cập được design (chỉ có link):** KHÔNG suy diễn nội dung frame. Thay bảng so sánh ở Mục 4 bằng **Checklist frame cần đối chiếu**:
```
## 4. Sai lệch Tài liệu ↔ Figma — CHƯA truy cập được design
Chưa có Figma MCP/đăng nhập trong phiên này, nên chưa so pixel/field được. Cần đối chiếu các frame sau:
- <link 1> (node 3484:2704) — kiểm: bộ cột bảng có khớp danh sách §3.2.C? nhãn cột?
- <link 2> (node 3484:3952) — kiểm: đủ <N> nhóm filter như §3.2.D? tên nhóm khớp?
- … (mỗi link kèm CHÍNH XÁC cần kiểm gì, dẫn về § trong doc)
```
Ngoài ra, vẫn nêu được các **sai lệch nội bộ kiểm tra từ chính doc** mà không cần Figma (xem dưới).

## Các loại sai lệch cần soi

1. **Field/cột lệch:** cột/field có trong doc nhưng không thấy trong design (hoặc ngược lại).
2. **Nhãn & micro-copy lệch:** tên nút, placeholder, nhãn cột, thông báo — doc viết một kiểu, design hiển thị kiểu khác (vd placeholder liệt kê ít field hơn danh sách search trong text).
3. **State chưa được tả:** design có hover/disabled/tooltip/skeleton/empty/error mà doc không mô tả hành vi (hoặc doc tả state mà design chưa có).
4. **Số đếm lệch:** mọi con số "có N nhóm / N cột / N tab" trong doc — đối chiếu với số thực có trong design **và** với số thực liệt kê trong chính doc. (Đây là nguồn lỗi rất hay gặp.)
5. **Bố cục/luồng lệch:** thứ tự vùng, vị trí sticky, hành vi cuộn — design cho thấy điều doc không nói.

## Kiểm chéo nội bộ doc (không cần Figma)

Trước khi (hoặc khi không thể) mở Figma, vẫn bắt được kha khá: tìm mọi chỗ một **danh sách hoặc con số được lặp lại** ở nhiều mục và so chúng với nhau (số nhóm filter ở AC vs ở bảng; danh sách field search ở global-rules vs toolbar vs placeholder; tên trạng thái ở khối thống kê vs ở bảng vs ở corner case). Lệch nhau là một phát hiện hợp lệ, xếp vào Mục 3 (mâu thuẫn) hoặc Mục 4 (nếu liên quan trực tiếp tới hiển thị/design).
