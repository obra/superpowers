# Cài đặt Superpowers cho Kiro IDE

Phương pháp này sử dụng cơ chế nạp ngữ cảnh tại chỗ (in-place context loading) của Kiro IDE. Bạn không cần phải copy bất kỳ file nào.

## Cách cài đặt qua Kiro IDE

1. Mở **Kiro IDE**.
2. Mở bảng **Powers Panel**.
3. Chọn **Import from GitHub**.
4. Nhập URL của kho lưu trữ này (hoặc URL fork của bạn).
5. Kiro sẽ tự động clone repo về `~/.kiro/powers/repos/superpowers`.

## Cách sử dụng

Vì các kỹ năng không được copy vật lý vào `~/.kiro/skills/`, **bạn sẽ không sử dụng được lệnh gạch chéo (slash commands như `/brainstorm`)**.

Thay vào đó, Power tự động kích hoạt thông qua **Từ khóa (Keywords)** hoặc **Ngôn ngữ tự nhiên**.

Hãy chat với Agent các câu lệnh như:
- *"Hãy dùng kỹ năng brainstorming để lên ý tưởng cho tính năng này."*
- *"Kích hoạt systematic-debugging để tìm lỗi."*
- *"Sử dụng superpowers để viết test."*

Agent sẽ tự động gọi `discloseContext` để đọc file kỹ năng tương ứng từ repo và hỗ trợ bạn ngay lập tức.

## Cập nhật (Update)

Vì hệ thống đọc trực tiếp từ repo, để cập nhật các kỹ năng mới nhất, bạn chỉ cần thực hiện:

```bash
cd ~/.kiro/powers/repos/superpowers
git pull
```

## Lợi ích

1. **Zero Maintenance:** Không còn lệnh `cp -R`, không lo lỗi do symlink, và không phải viết script kiểm tra HĐH (Windows vs Unix).
2. **Real-time Update:** Khi có PR mới gộp vào repo gốc, người dùng chỉ cần `git pull` là Agent sẽ đọc được nội dung mới ngay lập tức.
3. **Đơn giản hóa:** Tránh được "maintenance nightmare" của việc copy file thủ công.
