# Superpowers cho Doanh nghiệp SME
## Hướng dẫn sử dụng hiệu quả nhất theo Pareto

> *"Nếu bạn không thể giải thích đơn giản, nghĩa là bạn chưa hiểu đủ sâu."* - Richard Feynman

---

# 🎯 Big Picture: Superpowers là gì?

Hãy tưởng tượng bạn có một trợ lý siêu thông minh. Nhưng trợ lý này có một vấn đề: **nó làm việc tốt nhất khi có quy trình rõ ràng**.

**Superpowers chính là bộ "công thức nấu ăn" cho trợ lý AI của bạn.**

Thay vì mỗi lần làm việc lại phải giải thích lại từ đầu, bạn chỉ cần nói: "Dùng skill TDD" hoặc "Dùng skill debugging" - và AI sẽ tự biết phải làm gì.

---

# 📊 Quy tắc 80/20: 4 Skills mang lại 80% giá trị

```
┌─────────────────────────────────────────────────────────────┐
│                    PARETO ANALYSIS                          │
├─────────────────────────────────────────────────────────────┤
│  HIGH IMPACT                                                 │
│  ↑                                                          │
│  │    ┌─────────┐                                           │
│  │    │   TDD   │ ← Viết code đúng từ đầu                   │
│  │    └─────────┘                                           │
│  │              ┌──────────────┐                            │
│  │              │ Brainstorming │ ← Lên ý tưởng tốt         │
│  │              └──────────────┘                            │
│  │                           ┌────────────┐                 │
│  │                           │ Debugging  │ ← Sửa bug nhanh │
│  │                           └────────────┘                 │
│  │                                    ┌──────────┐          │
│  │                                    │ Planning │ ← Làm đúng việc │
│  │                                    └──────────┘          │
│  └──────────────────────────────────────────────→ EFFORT    │
│         LOW                                   HIGH          │
└─────────────────────────────────────────────────────────────┘
```

---

# 🚀 Skill 1: Brainstorming - "Hãy nghĩ kỹ trước khi làm"

## Khi nào dùng?
- Bắt đầu tính năng mới
- Đổi ý tưởng thành code
- Không biết bắt đầu từ đâu

## Ví dụ đời thường

**Không có Superpowers:**
```
Bạn: "Làm tính năng đăng nhập"
AI: *Viết code ngay*
→ Code sai, thiếu cases, phải sửa đi sửa lại
```

**Có Superpowers:**
```
Bạn: "Làm tính năng đăng nhập"
AI: "Đợi, để tôi brainstorm trước..."
→ AI đặt câu hỏi: OAuth hay email? Remember me?
→ AI vẽ diagram, liệt kê edge cases
→ Bạn approve → Mới bắt đầu code
```

## Quy trình đơn giản

```
User Request → Brainstorm → Clarify → Plan → Approve → Code
     ↑                                              ↓
     └──────────── Rất rẻ ←─── Sửa ở đây ──────────┘
                                                  ↓
                    Sửa ở đây = Rất đắt ←─────────┘
```

## Template sử dụng

```
/tài liệu:brainstorming

Tôi muốn: [mô tả tính năng]
Context: [thông tin thêm nếu có]
```

---

# 🧪 Skill 2: Test-Driven Development - "Viết test trước, code sau"

## Tại sao quan trọng?

Hãy tưởng tượng bạn xây nhà:

```
❌ Cách sai: Xây nhà → Kiểm tra sau → Nhà sập → Sửa
✅ Cách đúng: Vẽ blueprint → Kiểm tra blueprint → Xây nhà theo blueprint
```

TDD chính là "blueprint" cho code của bạn.

## Ví dụ thực tế

**Tình huống:** Viết hàm tính thuế VAT

```
Bước 1: Viết test TRƯỚC
┌────────────────────────────────────┐
│ test('VAT 10% của 100đ = 10đ')     │
│ test('VAT của số âm = error')      │
│ test('VAT của 0 = 0')              │
└────────────────────────────────────┘
         ↓ Chạy test → FAIL (chưa có code)

Bước 2: Viết code ĐỦ PASS
┌────────────────────────────────────┐
│ function calculateVAT(amount) {    │
│   if (amount < 0) throw Error;     │
│   return amount * 0.1;             │
│ }                                  │
└────────────────────────────────────┘
         ↓ Chạy test → PASS

Bước 3: Refactor nếu cần
```

## Lợi ích cho SME

| Trước TDD | Sau TDD |
|-----------|---------|
| Bug phát hiện khi deploy | Bug phát hiện khi code |
| Sửa bug tốn 4-8 giờ | Sửa bug tốn 15 phút |
| Sợ refactor | Refactor thoải mái |
| Code rối rắm | Code sạch sẽ |

## Template sử dụng

```
/tài liệu:test-driven-development

Tính năng: [mô tả]
Ngôn ngữ: [JavaScript/Python/etc]
```

---

# 🔍 Skill 3: Systematic Debugging - "Sửa bug có hệ thống"

## Vấn đề phổ biến

Khi gặp bug, đa số chúng ta:
```
1. Đoán nguyên nhân
2. Sửa đại
3. Không được → Đoán lại
4. Lặp lại... tốn cả ngày
```

## Cách Superpowers làm

```
┌─────────────────────────────────────────┐
│        SYSTEMATIC DEBUGGING             │
├─────────────────────────────────────────┤
│                                         │
│  1. OBSERVE: Bug là gì chính xác?       │
│     - Input nào gây ra?                 │
│     - Output sai ra sao?                │
│     - Có pattern không?                 │
│                                         │
│  2. HYPOTHESIZE: Nguyên nhân có thể?    │
│     - Liệt kê 3-5 khả năng              │
│     - Sắp xếp theo xác suất             │
│                                         │
│  3. ISOLATE: Thu hẹp phạm vi            │
│     - Binary search trong code          │
│     - Log strategically                 │
│                                         │
│  4. FIX: Sửa NGUYÊN NHÂN                │
│     - Không phải triệu chứng            │
│                                         │
│  5. VERIFY: Chắc chắn đã sửa?           │
│     - Viết test cho bug                 │
│     - Kiểm tra không gây bug mới        │
│                                         │
└─────────────────────────────────────────┘
```

## Ví dụ thực tế

**Bug:** "User không đăng nhập được"

```
❌ Cách sai:
- Sửa code đăng nhập đại
- Thêm log random
- Restart server
- Tốn 4 giờ

✅ Cách Superpowers:
1. OBSERVE: User nào? Khi nào? Error message?
2. HYPOTHESIZE:
   - Database down? (10%)
   - Session expired? (30%)
   - Password hash thay đổi? (60%)
3. ISOLATE: Test từng hypothesis
4. FIX: Password hash logic sai → Sửa
5. VERIFY: Viết test, deploy
→ Tốn 30 phút
```

## Template sử dụng

```
/tài liệu:systematic-debugging

Bug: [mô tả chi tiết]
Steps to reproduce: [các bước]
Expected: [kết quả mong đợi]
Actual: [kết quả thực tế]
```

---

# 📋 Skill 4: Planning - "Làm đúng việc trước khi làm việc đúng"

## Tại sao Planning quan trọng?

```
        Code without planning
              ↓
    ░░░░░░░░░░░░░░░░░░░░
    ░░░░░░░░░░░░░░░░░░░░
    ░░░░░░░░░░░░░░░░░░░░  ← Rework, confusion
    ░░░░░░░░░░░░░░░░░░░░
    ░░░░░░░░░░░░░░░░░░░░
```

## Quy trình Planning

```
┌──────────────────────────────────────────────────────┐
│                 WRITING PLANS                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  INPUT:                                              │
│  ┌─────────────────────────────────────────┐        │
│  │ Brainstorm output                       │        │
│  │ User requirements                       │        │
│  │ Technical constraints                   │        │
│  └─────────────────────────────────────────┘        │
│                    ↓                                 │
│  PROCESS:                                            │
│  ┌─────────────────────────────────────────┐        │
│  │ 1. Break into tasks                     │        │
│  │ 2. Define dependencies                  │        │
│  │ 3. Estimate effort                      │        │
│  │ 4. Identify risks                       │        │
│  └─────────────────────────────────────────┘        │
│                    ↓                                 │
│  OUTPUT:                                             │
│  ┌─────────────────────────────────────────┐        │
│  │ Plan.md với:                            │        │
│  │ - Task list                             │        │
│  │ - File structure                        │        │
│  │ - Test cases                            │        │
│  │ - Acceptance criteria                   │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Template sử dụng

```
/tài liệu:writing-plans

Feature: [tên]
Requirements: [danh sách]
Constraints: [giới hạn nếu có]
```

---

# 📅 Workflow hàng ngày cho SME

## Morning Routine (15 phút)

```
┌─────────────────────────────────────────┐
│           DAILY STANDUP                  │
├─────────────────────────────────────────┤
│                                         │
│  /pm:status                              │
│                                         │
│  → Xem task đang làm                    │
│  → Xem task blocked                     │
│  → Xem task cần làm tiếp                │
│                                         │
└─────────────────────────────────────────┘
```

## Khi bắt đầu tính năng mới

```
Step 1: Brainstorm (10-20 min)
        ↓
Step 2: Planning (15-30 min)
        ↓
Step 3: Review plan với team
        ↓
Step 4: Execute với TDD
        ↓
Step 5: Code Review
        ↓
Step 6: Merge & Deploy
```

## Khi gặp bug

```
Step 1: Document bug (5 min)
        ↓
Step 2: Systematic Debugging
        ↓
Step 3: Fix với TDD
        ↓
Step 4: Verify
```

---

# 💰 ROI Calculator cho SME

## Chi phí không dùng Superpowers

| Hoạt động | Thời gian/tuần | Chi phí/năm (500đ/giờ) |
|-----------|----------------|------------------------|
| Sửa bug phát hiện muộn | 8 giờ | 200,000đ |
| Rework do hiểu sai | 6 giờ | 150,000đ |
| Debug không hệ thống | 4 giờ | 100,000đ |
| **Tổng** | **18 giờ/tuần** | **450,000đ/năm** |

## Chi phí dùng Superpowers

| Hoạt động | Thời gian/tuần | Chi phí/năm |
|-----------|----------------|-------------|
| Setup ban đầu | 2 giờ (1 lần) | 1,000đ |
| Học skills | 4 giờ (1 lần) | 2,000đ |
| Planning thêm | 2 giờ | 50,000đ |
| **Tổng** | **2 giờ/tuần** | **53,000đ/năm** |

## Net Savings

```
┌────────────────────────────────────────┐
│  Chi phí hiện tại:    450,000đ/năm     │
│  Chi phí Superpowers:  53,000đ/năm     │
│  ─────────────────────────────────     │
│  TIẾT KIỆM:          397,000đ/năm     │
│                                        │
│  ROI: 750%                             │
└────────────────────────────────────────┘
```

---

# 🎓 Quick Start Guide

## Ngày 1: Setup

```bash
# Install Superpowers (Claude Code)
claude /skills:install obra/superpowers

# Verify
claude /skills:list
```

## Ngày 2-3: Thử Brainstorming

```
Mở Claude Code, nói:

"Dùng skill brainstorming, tôi muốn [tính năng đơn giản]"
```

## Tuần 1: Áp dụng TDD

```
Mỗi khi viết code mới:

"Dùng skill TDD để implement [tính năng]"
```

## Tuần 2+: Tích hợp đầy đủ

```
Workflow:
1. Brainstorm → Planning
2. TDD implementation
3. Code Review
4. Debug khi cần
```

---

# 🚨 Common Mistakes & Fixes

## Mistake 1: Skip Brainstorming

```
❌ "Đơn giản thôi, cần gì brainstorm"
→ 2 giờ sau: "Ồ, quên case này..."
→ 4 giờ sau: "Phải refactor lại..."

✅ 10 phút brainstorm tiết kiệm 4 giờ rework
```

## Mistake 2: Viết test sau

```
❌ "Viết code xong rồi viết test"
→ Test pass ngay → Không biết test đúng không
→ Bug phát hiện production

✅ Viết test trước → Thấy test fail → Biết test hoạt động
```

## Mistake 3: Debug bằng cảm tính

```
❌ "Chắc tại cái này, sửa thử"
→ Không được → "Chắc cái kia, sửa thử"
→ Cả ngày không xong

✅ Systematic: Observe → Hypothesize → Isolate → Fix
→ 30 phút xong
```

---

# 📚 Tài liệu tham khảo

| Tài liệu | Link |
|----------|------|
| Superpowers README | https://github.com/obra/superpowers |
| Fork của bạn | https://github.com/oudviet/superpowers |
| Security Audit | https://github.com/oudviet/oss-sentinel |

---

# 🎯 Checklist bắt đầu

- [ ] Install Superpowers
- [ ] Đọc skill Brainstorming
- [ ] Đọc skill TDD
- [ ] Thử brainstorming cho 1 tính năng nhỏ
- [ ] Thử TDD cho 1 hàm đơn giản
- [ ] Áp dụng workflow đầy đủ

---

*"The best time to plant a tree was 20 years ago. The second best time is now."*

**Bắt đầu ngay với 1 tính năng nhỏ. Feel the difference.**
