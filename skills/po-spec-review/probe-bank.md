# Probe bank — bộ "mồi" cho từng nhóm phát hiện

Đây là danh sách gợi ý để quét doc. Không phải checklist phải tick hết — chỉ áp cái nào *thực sự* khớp với doc và dẫn được về một đoạn trích. Bỏ qua cái không liên quan.

> **Nghi ngờ doc lỗi thời (staleness) — áp xuyên suốt.** PO hay chốt thay đổi qua họp/chat rồi quên cập nhật doc. Khi thấy mâu thuẫn nội bộ, tính năng nửa vời, hoặc mô tả lệch với thực tế đã biết, đừng chỉ ghi nhận — gắn cờ và hỏi: *"Có thay đổi nào đã thống nhất qua trao đổi/họp mà chưa đưa vào doc không?"* Doc không phải nguồn chân lý duy nhất.

## 1. Điểm mơ hồ (Ambiguities)

**Từ/cụm cờ đỏ** (gặp là dừng lại soi): "nhanh / realtime / tức thì / ngay lập tức / tối ưu / mượt / linh hoạt / một số / v.v. / tương ứng / phù hợp / đầy đủ / cơ bản / nếu cần / sau này / hợp lý". Mỗi cụm này thiếu một con số hoặc một quy tắc.

Quét theo các trục thường bị bỏ trống:
- **Số đo hiệu năng:** "tải nhanh" = bao nhiêu ms? "realtime" = push/WebSocket, polling mấy giây, hay chỉ refetch? Có SLA/p95 không?
- **Debounce/throttle tìm kiếm:** "sau khi dừng gõ" → bao nhiêu ms? Có min-length (gõ 1 ký tự có query không)? Có hủy request cũ (race) không?
- **Giới hạn input:** min/max length, ký tự cho phép, xử lý ký tự đặc biệt / dấu / emoji / khoảng trắng giữa.
- **Phân trang & sắp xếp:** page size mặc định & tùy chọn? Sắp xếp mặc định theo cột nào, chiều nào? Offset hay cursor? Tổng count tính thế nào?
- **Logic kết hợp bộ lọc:** nhiều nhóm filter ghép nhau là AND hay OR? Trong một nhóm chọn nhiều giá trị là OR? Search ô nhanh có giao với filter đang bật không? Đổi filter có reset về trang 1 không?
- **Trường tính toán:** tuổi tính từ ngày sinh (làm tròn? mốc nào?), "đã học X/Y buổi", "số buổi còn lại" — tính ở DB, BE hay FE? Cập nhật khi nào?
- **Định danh:** mã (STU-001, mã lớp…) — định dạng, độ dài, ai sinh, có đảm bảo duy nhất không.
- **Quyền (RBAC):** "được phân quyền" = role nào thấy gì (trường nào, cột nào, hành động nào)? Mô hình quyền chưa nêu thì là một lỗ to.
- **Thuật ngữ / khái niệm / role chưa định nghĩa:** doc có định nghĩa rõ các từ khoá lặp lại (giá trị `status`, nhãn cột) **và các đối tượng/role/khái niệm mới được nhắc** (vd nêu role "Quản lý giáo viên" nhưng không nói nó là ai, làm được gì)? Có nhiều tên cho cùng một thứ, hoặc khái niệm gần nghĩa không phân định ("chương trình" vs "lộ trình" vs "khung chương trình"; "trình độ chính/phụ")? → đề nghị một **glossary/enum canonical** (gắn role vào RBAC).
- **Câu đa nghĩa:** câu hiểu được ≥2 cách về *mặt ngôn ngữ* (không chỉ thiếu số liệu) — vd "hiển thị thông tin liên quan", "xử lý phù hợp". Nêu các cách hiểu khả dĩ và hỏi PO chọn.
- **Lỗi chính tả / tên gọi không nhất quán:** nhất là ở tên field/enum/nhãn *sẽ thành code hoặc DB key*. Một typo ("Hết buổi" vs "Het buoi", "recieve") nếu dev copy thẳng vào schema/enum là lệch về sau. Cờ chúng + chốt tên canonical.
- **Reference doc khác bằng mã tự đặt:** vd "§4.2 List Page Pattern", "US-XXX", tên tài liệu nội bộ. Kiểm mã đó trỏ tới đâu, người review có tài liệu đó không, có phải dependency ẩn không → liệt kê các tham chiếu **chưa giải được** để xin link/bản đầy đủ.

**Data-setup theo domain** (khi US chạm vào việc dựng dữ liệu — học liệu/nội dung, test đầu vào, chấm điểm theo kỹ năng/danh mục): soi kỹ mô hình dữ liệu ngầm — thực thể nội dung/học liệu & quan hệ với bài học/lộ trình; bộ **kỹ năng/danh mục** dùng để chấm (cố định hay mở rộng được?); **thang điểm** & cách quy đổi; luồng **test đầu vào → kết quả → xếp lớp/trình độ**. Đây là chỗ dễ thiếu enum/quan hệ nhất.

## 2. Edge cases bị bỏ sót

**Lớp generic (luôn kiểm):**
- Bấm nút/submit liên tiếp (double-submit, idempotency).
- Mất mạng / request timeout giữa chừng; có giữ lại filter/scroll khi reload không.
- Token/session hết hạn giữa thao tác → redirect login hay báo lỗi? Mất dữ liệu đang nhập?
- Ký tự đặc biệt / Unicode / dấu / SQL-ish / quá dài trong ô input & search.
- Dữ liệu quá lớn: list rất nhiều bản ghi, một bản ghi có rất nhiều quan hệ con, export lớn.
- Quyền bị thu hồi giữa phiên; dữ liệu vừa xem đã bị xóa/đổi ở nơi khác (stale).
- Concurrency: 2 người sửa cùng bản ghi; trạng thái đổi từ hệ thống trong khi đang xem (optimistic update / refetch?).
- Rỗng & một phần: list rỗng, filter ra 0 kết quả, một số cột/khối lỗi nhưng phần còn lại vẫn tải (partial failure).

**Lớp theo nghiệp vụ (suy từ chính doc — ví dụ cho màn danh sách có quan hệ con):**
- Bản ghi cha có 0 / 1 / rất nhiều bản ghi con: nếu UI gộp dòng (rowSpan) theo cha thì 0 con render ra gì? nhiều con có vỡ layout không?
- Giá trị biên của các nhóm phân loại (khoảng tuổi, khoảng số buổi…): có khoảng nào hở hoặc chồng lấn ở mép không.
- Số đếm trên các "ô thống kê" so với số dòng thực tế sau filter có khớp không (đếm distinct theo cha hay theo con?).
- Trường nhạy cảm bị che (vd SĐT che giữa) nhưng có nút "sao chép"/"gọi" → copy/call ra bản đầy đủ hay bản đã che? Ai được mở full?
- Mobile/responsive: cột bị ẩn ở màn hẹp thì hành động trên cột đó (gọi, xem) còn truy cập được không; "mobile" là breakpoint nào.
- Hiển thị chỉ-bằng-màu (badge/chấm màu) → người mù màu / màn đen trắng (a11y, WCAG 1.4.1) còn phân biệt được trạng thái không.

## 3. Logic flaws & mâu thuẫn

- **Mâu thuẫn nội bộ doc:** cùng một danh sách/con số xuất hiện ở 2 mục mà lệch nhau (vd số nhóm filter ghi ở AC vs số nhóm liệt kê ở bảng; danh sách field search ở "global rules" vs ở bảng toolbar vs ở placeholder). Đây là dấu hiệu PO copy-paste lệch — luôn cross-check những thứ lặp lại.
- **Cùng một khái niệm gắn ở 2 cấp khác nhau:** vd "trạng thái" lúc tả như thuộc tính của thực thể cha, lúc lại lấy từ thực thể con → định hình schema sai nếu không chốt.
- **Xung đột với hệ thống cũ / luồng hiện hữu:** tính năng mới có phá vỡ ràng buộc, enum, hay luồng đang chạy không? Có giẫm lên dữ liệu/route đã có không? Có cần migrate/đồng bộ ngược không.
- **Source of truth bất nhất:** doc nhắc ≥2 hệ thống nguồn (vd "lấy môn học từ Station", "lấy trường từ ERP") → đâu là nguồn chuẩn cho mỗi thực thể, đồng bộ một chiều hay hai chiều, nếu nguồn đó down/lệch thì màn này xử sao.
- **Vòng đời/trạng thái thiếu quy tắc chuyển:** liệt kê N trạng thái nhưng không nói trạng thái nào chuyển sang trạng thái nào được, đâu là trạng thái cuối → BE không validate được transition.
- **PO áp giải pháp kỹ thuật (how) thay vì nhu cầu (what/why):** doc chỉ định *cách làm* — "lưu dạng JSON", "dùng bảng X", "gọi API Y", "gộp dòng bằng rowSpan", "index theo Z". Smell: (1) tách *nhu cầu gốc* khỏi giải pháp PO áp; (2) đánh giá giải pháp đó có đúng/khả thi/tối ưu không, hay đang ràng buộc dev nhầm; (3) nếu cần, hỏi lại "nhu cầu thực là gì" để dev/architect tự chọn cách.

**Đối chiếu hệ cũ / migration / ranh giới dữ liệu (legacy):**
- **PO giả định "đã có" mà hệ thống thực ra chưa có:** PO mô tả/dựa vào một tính năng, dữ liệu hay khả năng như thể nó tồn tại, nhưng thực tế chưa có (hoặc mới là mong muốn). Với mỗi thứ doc coi là "sẵn có", đối chiếu hiện trạng: có API/bảng/luồng thật chưa? **Kể cả khi PO ghi định danh kỹ thuật cụ thể** (tên bảng/cột/field/keyword/enum/API) — đối chiếu với schema/DB thật: tên đó có tồn tại đúng không, hay PO bịa/nhầm? Dấu hiệu hay gặp: phần ghi "đang phát triển" nhưng phần khác lại dùng nó như đã chạy.
- **Dữ liệu dùng chung từ hệ cũ → dư thừa/nhiễu (data scoping):** nguồn cũ chia sẻ dữ liệu với nhiều loại lớp/hệ khác, nên kéo về sẽ *rộng hơn* phạm vi cần (vd danh sách Môn/Trường dư so với Station mong muốn). Cần quy tắc scope/lọc: tập dữ liệu nào *thực sự* thuộc phạm vi này, lọc ở tầng nào, tránh hiển thị/đếm nhầm dữ liệu ngoài phạm vi.
- **Trường mới mà hệ cũ chưa từng thu thập → thiếu data lịch sử:** vd "giới tính học sinh". Bản ghi cũ trống trường này ⇒ phải nullable/default + chiến lược backfill; và mọi *filter/đếm theo trường đó sẽ sót bản ghi cũ* (cần nhóm "không rõ").
- **Trường đổi ngữ nghĩa giữa cũ↔mới (semantic drift):** cùng một khái niệm nhưng định nghĩa/tên đổi (vd cũ "Bài học trước" → mới "Bài học tiếp theo"). Cần mapping cũ→mới rõ ràng + xác nhận *cách tính/nguồn* của nghĩa mới, tránh dev hiểu nhầm hoặc migrate sai.

## 4. Sai lệch Tài liệu ↔ Figma

(Chi tiết cách lấy design & các loại lệch nằm trong `figma-compare.md`.) Tối thiểu đối chiếu: danh sách field/cột, nhãn & micro-copy (tên nút, placeholder, thông báo), các state có trong design mà doc không tả (hover/disabled/tooltip/skeleton/empty/error), và **các con số đếm** (số nhóm filter, số cột…) khai trong doc vs thực có.

## 5. Câu hỏi gửi PO — khuôn mẫu

Viết câu hỏi **đóng, ép ra quyết định**, kèm sẵn các phương án để PO chỉ việc chọn. Nhóm theo độ khẩn:
- **Nhóm A (trước khi dựng DB):** thường là câu định hình thực thể/quan hệ/enum/cấp-độ-gắn-thuộc-tính. "X thuộc cấp A hay cấp B? Nếu [tình huống biên] thì hành xử theo phương án (1) hay (2)?"
- **Nhóm B (trước khi code):** logic kết hợp filter (AND/OR), debounce, phân trang/sort mặc định, quy tắc tính trường dẫn xuất, hành vi khi lỗi/mất mạng.
- **Nhóm C (làm rõ sau):** micro-copy, nit UI, tính năng "coming soon" có cần chừa chỗ schema ngay không.

Ví dụ câu hỏi cho các pattern mới:
- (A) "Chốt định nghĩa canonical cho từng giá trị `status` và phân định các thuật ngữ gần nghĩa (chương trình / lộ trình / khung chương trình; trình độ chính / phụ) — gửi em một glossary."
- (A) "Trường <X> (vd giới tính) — hệ cũ đã có dữ liệu chưa? Nếu chưa: để nullable + nhóm 'không rõ', hay backfill? Filter theo <X> xử bản ghi cũ thế nào?"
- (B) "Môn/Trường lấy từ nguồn cũ dùng chung nhiều loại lớp — lọc về đúng phạm vi Station bằng tiêu chí nào (cờ/loại lớp/owner)?"
- (B) "Trường đổi nghĩa (vd 'bài học tiếp theo' so với 'bài học trước' ở hệ cũ) — nghĩa mới tính từ nguồn nào (lịch học? tiến độ?) và map sang dữ liệu cũ ra sao?"
- (A) "Có thay đổi nào đã thống nhất qua họp/trao đổi mà chưa cập nhật vào doc này không?"
- (C) "Gửi em bản đầy đủ + link các tài liệu được tham chiếu bằng mã nội bộ (vd '§4.2 List Page Pattern') để đối chiếu."
- (A) "Định nghĩa role/đối tượng được nhắc (vd 'Quản lý giáo viên'): là ai, thấy gì, làm được gì (map vào RBAC)?"
- (B) "Những chỗ doc chỉ định cách làm kỹ thuật (vd 'gộp dòng rowSpan', 'lưu JSON', tên field/keyword DB cụ thể) — nhu cầu *gốc* thực là gì? Để dev tự chọn giải pháp/kiểm tên field với schema thật nhé."

---

## Ví dụ một phát hiện đạt chuẩn (để hiệu chỉnh độ sắc)

> **[BLOCKER] Trạng thái thuộc Học viên hay thuộc Enrollment/Lớp? — §3.2.B vs §3.2.C**
> Trích: §3.2.B đếm "Tổng số *học viên*" theo từng trạng thái; nhưng §3.2.C ghi cột Trạng thái có "Nguồn dữ liệu: *Lớp học liên kết*", hiển thị theo từng lớp.
> Impact: một học viên học nhiều lớp ở các trạng thái khác nhau → không xác định được ô "Đang học" đếm cái gì, và không biết đặt cột `status` ở bảng `student` hay bảng `enrollment`. Sai chỗ này là phải migrate toàn bộ về sau.
> Giả định an toàn: coi trạng thái thuộc `enrollment`; ô thống kê đếm *distinct student có ≥1 enrollment ở trạng thái đó* — chờ PO xác nhận.

Một câu hỏi PO tương ứng (Nhóm A): "Trạng thái học tập gắn ở cấp Học viên hay cấp Enrollment (lớp)? Với HV nhiều lớp khác trạng thái, ô đếm 'Đang học' nên đếm (1) HV có ít nhất 1 lớp đang học, hay (2) HV mà mọi lớp đều đang học?"
