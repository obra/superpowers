---
name: po-spec-review
description: Review a Product Owner / BA specification or requirements document from a Lead Developer / System Architect viewpoint — surfacing ambiguities, missing edge cases, logic flaws and contradictions, doc-vs-Figma mismatches, and a concrete list of clarification questions to send back to the PO before building the DB/backend. Use whenever the user shares or points to a PO/BA spec, SRS, feature or requirements doc, user story, or a Confluence/docx export with Figma designs and wants it reviewed, critiqued, "soi", QA'd, gap-analyzed, or checked for ambiguity / edge cases / inconsistencies before implementation. Triggers include Vietnamese phrasings such as "review tài liệu PO", "soi spec", "đánh giá tài liệu đặc tả", "check tài liệu trước khi dựng DB", "tài liệu này có thiếu/mâu thuẫn gì không", "tạo câu hỏi gửi PO". Trigger even without the word "review" if they want a dev/architect critique or PO questions. NOT for GENERATING test cases — that's po-spec-test-case.
---

# Review đặc tả của PO (PO Spec Review)

Soi một tài liệu đặc tả do PO/BA viết — thường là `.docx` hoặc bản export Confluence, kèm link/bản vẽ Figma — dưới góc nhìn **Lead Dev / System Architect (FE + BE + Tester)**, để phát hiện chỗ sẽ làm tắc nghẽn khi **dựng DB và code**, rồi xuất một bản review Markdown gọn, có thứ tự ưu tiên, kèm danh sách câu hỏi cụ thể để gửi lại PO.

**Vì sao skill này tồn tại (đọc kỹ — nó định hình cách làm):** doc thực tế thường rất lớn, và PO không phải lúc nào cũng nắm chắc nghiệp vụ. Hệ quả:
- Phải **dẫn Blocker lên đầu** — người đọc cần biết cái gì chặn mình *trước*, không phải đọc hết 10 trang mới thấy.
- Phải bắt cả **mâu thuẫn nội bộ trong chính doc** (PO yếu nghiệp vụ hay tự mâu thuẫn: số liệu lặp lại lệch nhau, cùng một thứ mô tả hai kiểu).
- Mọi phát hiện phải **trích dẫn vị trí cụ thể** để PO biết sửa ở đâu.
- **Không bịa.** Chỗ nào thiếu thông tin (đặc biệt là design) thì hỏi/liệt kê, không tự suy diễn cho có.

## Quy trình

1. **Lấy text sạch + đo kích thước + tách section + chỉ mục claim** — chạy `prep_doc.py <file> [out_dir]`. Nó làm sạch (docx / export Confluence MIME / html / md / txt), đo **chữ thật** (chars/words/~tokens — đừng nhìn dung lượng file vì export hay phình CSS), tách `sections/`, và xuất `index.json` (link Figma + các con số đếm kèm vị trí). Nó cũng gợi ý có cần quy trình "Doc dài" không. Nếu muốn làm tay: docx → skill `docx`/`pandoc`/`python-docx`; export Confluence → parse MIME + decode quoted-printable + strip HTML (mẹo ở `figma-compare.md`); text dán → dùng luôn.

2. **Trích toàn bộ link Figma** trong doc. Nếu có link → đọc `figma-compare.md` và lấy design về để đối chiếu (phục vụ Mục 4). Đây là phần phụ thuộc tool, nên hướng dẫn để riêng.

3. **Nạp `probe-bank.md`** để có bộ "mồi" đầy đủ cho từng nhóm phát hiện. Đừng cố nhớ hết các edge case/anti-pattern trong đầu — đọc file đó, nó liệt kê sẵn.

4. **Đi qua doc và lập phát hiện theo 5 nhóm** ở dưới. Mỗi phát hiện **bắt buộc** có đủ 3 thứ:
   - **Trích nguyên văn** cụm/đoạn liên quan trong doc (hoặc số §/tên mục).
   - **Impact**: vì sao nó chặn DB/code, hoặc sẽ gây làm lại/bug gì.
   - (khuyến khích) **Giả định an toàn** nếu PO không trả lời kịp — để team không bị chặn cứng.
   > Phát hiện không có trích dẫn = phát hiện rỗng, bỏ. Mục tiêu là sắc và dẫn được về doc, không phải dài.

5. **Gán severity, sắp xếp, viết report** theo đúng template bên dưới. Vì doc lớn: dồn các nit `[LOW]` thành một cụm ngắn cuối mục, đẩy `[BLOCKER]`/`[HIGH]` lên trên.

6. **Trả lời bằng ngôn ngữ của doc/người dùng** (mặc định **tiếng Việt** cho RinoEdu); giữ thuật ngữ kỹ thuật song ngữ khi cần (vd: "trạng thái thuộc về enrollment", "source of truth").

## 5 nhóm phát hiện (phạm vi gọn)

1. **Điểm mơ hồ (Ambiguities)** — mô tả chung chung, thiếu thông số đo được (vd: "tải nhanh", "phản hồi realtime", "sau khi dừng gõ" mà không có debounce). *Why:* mỗi cụm mờ là một chỗ FE/BE/QA sẽ tự đoán mỗi người một kiểu → bug tích hợp.
2. **Edge cases bị bỏ sót** — bấm nút liên tiếp, mất mạng giữa chừng, token hết hạn, ký tự đặc biệt, dữ liệu quá lớn, và các edge case *theo nghiệp vụ* của màn này. Lấy danh sách mồi từ `probe-bank.md`.
3. **Logic flaws & mâu thuẫn** — gồm: (a) mâu thuẫn *nội bộ* trong doc **và chéo giữa các doc** (xem "Bộ nhiều doc"); (b) **xung đột & ranh giới với hệ thống cũ** — migration, dữ liệu dùng chung bị dư thừa, trường mới mà hệ cũ chưa thu thập, trường đổi ngữ nghĩa; (c) **source of truth** bất nhất giữa các hệ; (d) **PO giả định "đã có" mà hệ thống thực ra chưa có**; (e) **PO áp giải pháp kỹ thuật (how) thay vì what/why** & viện dẫn field/keyword không có trong DB.
4. **Sai lệch Tài liệu ↔ Figma** — field/cột/state/copy có ở bên này mà không có bên kia, nhãn lệch nhau, số đếm lệch (vd doc ghi "13 nhóm" nhưng liệt kê 12). Cách lấy & so: `figma-compare.md`.
5. **Câu hỏi gửi PO** — danh sách câu hỏi **đóng, đo được, ép ra quyết định**, nhóm theo độ khẩn để phục vụ tiến độ dựng DB.

## Doc dài thì xử lý thế nào

`prep_doc.py` đã cho biết kích thước chữ thật. Nếu nó báo **DOC DÀI** (hoặc > ~6k từ / nhiều US·màn):

1. **Map trước, đừng nhồi cả doc một lượt.** Dùng outline + `index.json` (link Figma, con số đếm) prep_doc xuất ra làm bản đồ.
2. **Đối soát chéo — làm SỚM.** So các con số/danh sách lặp lại trong `index.json` và các tập field/enum/status nằm rải rác (vd "N nhóm filter" ở AC vs số nhóm liệt kê ở bảng; tập field search ở các mục khác nhau). Mâu thuẫn nội bộ sống ở khoảng-cách-xa — đọc rời từng khúc là mất nó.
3. **Đào sâu theo section.** Review lần lượt các file trong `sections/`, mang theo chỉ mục + glossary đã dựng ở bước 2; gom phát hiện lại.
4. **Module nhiều màn/US.** Review **theo từng màn/US** thành report riêng (mỗi cái một file ngắn, dev xử được ngay), rồi một **pass đối soát chéo màn**: enum/status/tên field/luồng dùng chung có nhất quán giữa các màn không.
5. **Ngân sách output.** Luôn §0 (tóm tắt + blockers) trước. Doc dài → xuất *đầy đủ* chỉ `[BLOCKER]/[HIGH]`; `[MED]/[LOW]` gom thành **phụ lục đếm theo mục** để khỏi chôn vùi cái quan trọng.

## Bộ nhiều doc (doc tổng + doc con)

PO thường giao 1 **doc tổng** (phạm vi Epic) + nhiều **doc con** (feature/US) + link Confluence/Jira chéo nhau.

- **Chốt phạm vi trước.** Chỉ review các doc PO khai là in-scope cho Epic này; **KHÔNG tự đi theo mọi link** (nổ scope + rủi ro). Thiếu link nào thì hỏi, đừng đoán.
- **Review từng doc** theo Quy trình (dùng `prep_doc.py` cho doc lớn), xuất report riêng cho mỗi doc.
- **Một pass review CHÉO doc — làm SAU khi đã đọc hết.** Đối soát enum/status/tên field/số đếm/luồng dùng chung **giữa doc tổng ↔ doc con** và **giữa các doc con**: cùng một thứ bị đặt tên/mô tả/đếm khác nhau? Doc con mâu thuẫn doc tổng? Đây là lớp lỗi đắt nhất, chỉ lộ khi đặt các doc cạnh nhau. Gom vào `review-cross-doc.md`, gán `[BLOCKER]/[HIGH]` nếu lệch contract/DB.

## Vòng lặp với PO: report per-doc · re-review · cổng bàn giao

Doc nằm trên **Confluence, KHÔNG có connector ghi** → skill chỉ **xuất report**, người dùng tự paste comment vào Confluence. PO sẽ sửa rồi review lại nhiều vòng, nên report phải **truy vết được qua các vòng**:

1. **Lưu report ra file, mỗi doc một file:** `docs/rino-s9s/specs/<ngày>-<EPIC>/review-<dockey>.md` (doc tổng: `review-00-tong.md`); phát hiện chéo để riêng `review-cross-doc.md`.
2. **ID ổn định cho MỌI phát hiện & câu hỏi** — format `<DOCKEY>-<n>` (vd `TONG-3`, `US5-2`). Vòng sau **CÙNG vấn đề GIỮ NGUYÊN ID** (đừng đánh số lại); vấn đề mới lấy số kế tiếp. ID là thứ để bạn và PO nói chuyện xuyên vòng.
3. **Re-review = DIFF, không làm lại từ đầu.** Nạp report vòng trước; mỗi ID cũ gán trạng thái ✅ RESOLVED / 🔴 OPEN / ✏️ CHANGED (PO sửa chưa đủ); phát hiện mới gắn 🆕. §0 mở đầu bằng **bảng diff**: đã xử / còn treo / mới.
4. **Cổng bàn giao.** Đếm phát hiện **CHƯA ĐÓNG** (mọi trạng thái trừ ✅ RESOLVED — gồm 🔴 OPEN + ✏️ CHANGED + 🆕) **ở mức `[BLOCKER]` + `[HIGH]`** trên TẤT CẢ doc. Còn > 0 → **chưa chuyển**, tiếp vòng với PO. = 0 → spec đủ sạch để bóc tách US → bàn giao sang **`slicing-stories-model-b`** (nó đọc chính bộ report đã chốt + doc đã sửa). `[MED]/[LOW]` treo KHÔNG chặn bàn giao — ghi nhận để xử sau.

## Thang severity

- `[BLOCKER]` — chặn việc dựng DB hoặc một quyết định kiến trúc. Phải chốt trước khi đụng schema.
- `[HIGH]` — sẽ gây làm lại hoặc bug nặng nếu bỏ qua.
- `[MED]` — cần làm rõ, nhưng có thể giả định tạm và đi tiếp.
- `[LOW]` — nit / đề xuất cải thiện.

## Template output (theo đúng khung này)

```
# Review đặc tả: <DOCKEY · tên doc/feature> · vòng <N> · <ngày>
> Nguồn: <docx | Confluence export | text> · Figma: <đã đối chiếu N frame | chưa truy cập được>

## 0. Tóm tắt & Blockers
<2–4 câu tổng quan chất lượng doc.>
[Re-review — bỏ ở vòng 1] Diff: ✅ đã xử <ids> · 🔴 còn treo <ids> · ✏️ chưa đủ <ids> · 🆕 mới <ids>
Cổng bàn giao: CHƯA-ĐÓNG (≠✅) [BLOCKER]=<x> · [HIGH]=<y> → <CHƯA chuyển, tiếp vòng PO | ĐỦ SẠCH → bàn giao slicing-stories-model-b>
Blockers (chặn dựng DB / kiến trúc):
- [BLOCKER] <DOCKEY-n> <một dòng> → xem Mục <#>
⚠ Tính thời sự: <nếu nghi doc lỗi thời — nhiều mâu thuẫn nội bộ / tính năng nửa vời — cảnh báo 1 dòng + đẩy câu hỏi "có thay đổi nào chốt ngoài doc?" lên Nhóm A>

## 1. Điểm mơ hồ (Ambiguities)
- [SEVERITY] <DOCKEY-n> · <trạng thái khi re-review> — <tiêu đề ngắn> — §<vị trí>
  - Trích: "<nguyên văn cụm mờ>"
  - Impact: <vì sao chặn code/DB>
  - Giả định an toàn: <nếu có>

## 2. Edge cases bị bỏ sót
- [SEVERITY] <tình huống> — <điều gì xảy ra / chưa định nghĩa> — §<vị trí nếu có>

## 3. Logic flaws & mâu thuẫn
- [SEVERITY] <mô tả> — Trích/so: "<A>" vs "<B>" (§…/§…) — Impact: <…>

## 4. Sai lệch Tài liệu ↔ Figma
| Mục | Doc nói | Figma thể hiện | Loại lệch | Mức độ |
|---|---|---|---|---|
| … | … | … | thiếu field / lệch copy / state chưa tả / số đếm lệch | [SEV] |
<nếu chưa truy cập Figma → thay bảng bằng "Checklist frame cần đối chiếu" theo figma-compare.md>

## 5. Câu hỏi gửi PO
Nhóm A — PHẢI trả lời trước khi dựng DB:
1. <câu hỏi đóng, ép quyết định>
Nhóm B — Cần trước khi code:
1. …
Nhóm C — Có thể làm rõ sau:
1. …
```

## Nguyên tắc chất lượng

- **Trích dẫn cụ thể, không nói chung chung.** "Thiếu validation" là vô dụng; "§4.1 nói 'tự cắt khoảng trắng' nhưng không nêu min/max length và xử lý ký tự đặc biệt" mới dùng được.
- **Luôn nêu impact**, không chỉ "thiếu X". Senior cần biết *thiếu X thì hỏng cái gì*.
- **Câu hỏi cho PO phải đóng/đo được.** Tốt: "Trạng thái lưu ở cấp Học viên hay cấp Enrollment? Nếu 1 HV nhiều lớp khác trạng thái, ô đếm 'Đang học' đếm HV-có-ít-nhất-1-lớp-đang-học hay HV-toàn-bộ-lớp-đang-học?" Tệ: "Làm rõ về trạng thái." Trộn cả hai = mất giá trị.
- **Phân biệt stub với thiếu sót.** Tính năng ghi "đang phát triển / coming soon" là *chủ ý*, không phải lỗi — nhưng hãy hỏi: có cần chừa cột/quan hệ/endpoint trong schema *ngay bây giờ* để sau khỏi migrate đau không.
- **Nghi ngờ doc lỗi thời.** PO hay chốt thay đổi qua họp/chat rồi quên cập nhật doc → doc không phải nguồn chân lý duy nhất. Gắn cờ khi thấy dấu hiệu, và hỏi "có thay đổi nào đã thống nhất mà chưa vào doc không".
- **Kiểm "PO tưởng có".** Với mỗi thứ doc coi là *đã có sẵn* (tính năng/dữ liệu/khả năng), đối chiếu hiện trạng thật — đừng mặc nhiên tin là hệ thống đã hỗ trợ.
- **Tách "cần gì" khỏi "làm thế nào".** Khi PO áp giải pháp kỹ thuật hoặc ghi tên field/keyword cụ thể, trích *nhu cầu gốc* + đối chiếu định danh với DB/schema thật; đừng coi cách PO chỉ định là ràng buộc cứng.
- **Không bịa fact về Figma.** Thiếu truy cập → checklist, không suy diễn.

## Tham chiếu

- `prep_doc.py` — làm sạch + đo kích thước + tách section + chỉ mục claim (Figma links, con số đếm). Chạy ở bước 1.
- `probe-bank.md` — bộ "mồi" cho từng nhóm phát hiện (ambiguity, edge case, logic flaw, câu hỏi). Đọc ở bước 3.
- `figma-compare.md` — đọc input Confluence/docx + cách lấy & đối chiếu Figma. Đọc ở bước 2 khi có link.
