# Template — US Breakdown theo Model B

Lưu tại: `docs/rino-s9s/specs/<date>-<EPIC>/us-breakdown-model-b.md`

## 1. Epic & nguồn
- Epic key + tên; link bộ report `po-spec-review` đã chốt; doc PO tham chiếu (Confluence/Figma).

## 2. Bảng US
| Mã | Tên | Slice (FE-only / BE-only / split) | Contract point | Phụ thuộc | Size | Giao ai |
|----|-----|-----------------------------------|----------------|-----------|------|---------|
| US-00 | Nền & Contract | BE-only | — | — | | |
| US-01 | … | | | | | |

## 3. US-00 — Nền & Contract
- **Contract dùng chung:** enum, DTO, shape response/request cho các US `split`.
- **Endpoint GHI rủi ro cần verify TRƯỚC khi fork:** liệt kê + service legacy sở hữu + "đã có / sửa / tạo mới".
- Permission (model/action) + scope cơ sở áp dụng.

## 4. Thứ tự thực hiện
- US-00 trước; sau đó theo phụ thuộc; **đẩy phần GHI/BE-legacy rủi ro lên sớm** (nêu lý do de-risk).

## 5. Giao việc theo tỉ lệ đội
- Ai **chạy trước** dọn đường (BE: contract + endpoint + fixtures).
- Ai chạy **dây chuyền** (thường FE nếu là cổ chai).
- BE dư làm gì (front-load Epic kế).

## 6. Rủi ro & câu hỏi cần chốt với PO
- Mỗi mục: vấn đề + vì sao chặn dev + câu hỏi cụ thể (vd: enum thiếu trạng thái, permission catalog chưa có, ghi atomic cross-store…).
