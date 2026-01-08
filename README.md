# QN Office Management System - Functional Requirements

## Tổng quan dự án

Hệ thống quản lý văn phòng QN bao gồm Bot Mezon và Web Application để quản lý các hoạt động nội bộ văn phòng.

## Công nghệ sử dụng

- **Monorepo**: NextJS ShadCN+ NestJS
- **Build Tool**: Nx Monorepo
- **Authentication**: Mezon OAuth

### Lưu ý về Authentication

- Sử dụng Mezon OAuth cho cả Bot và Web
- `mezon_user_id` từ Bot và Login Mezon trên Web sẽ **giống nhau**
- **Bắt buộc**: Lưu lại Mezon ID của mỗi user trong hệ thống

## Định nghĩa Roles

| Role         | Mô tả                                 |
| ------------ | ------------------------------------- |
| **HR**       | Human Resources - Quản lý nhân sự     |
| **GDVP**     | Giám Đốc Văn Phòng - Branch Directors |
| **Employee** | Nhân viên văn phòng                   |

---

## Các chức năng chung

### 1. Quản lý chi nhánh

**Mô tả**: Hệ thống hỗ trợ quản lý nhiều chi nhánh. Hiện tại xây dựng cho 1 chi nhánh QN, có khả năng mở rộng sau này.

**Tính năng**:

- Quản lý thông tin chi nhánh
- Quản lý danh sách nhân viên thuộc từng chi nhánh
- Quản lý trạng thái nhân viên (Active/Inactive)

**Quy trình Onboarding/Offboarding**:

- Khi có nhân viên mới onboard hoặc nghỉ việc
- Tự động thực hiện các service liên quan:
  - Cập nhật lịch dọn vệ sinh
  - Cập nhật lịch Open Talk
  - Cập nhật quyền truy cập kênh
  - Cập nhật danh sách phạt
- **Chi tiết xử lý**:
  - **Nhân viên mới**: Tự động thêm vào **cuối** cycle hiện tại.
  - **Nhân viên nghỉ**:
    - Nếu có lịch trong cycle hiện tại: Tự động thay đổi các lịch sau đó để thế chỗ.
    - Nếu có lịch trong cycle sắp tới: Tự động dồn lịch.
  - **Thông báo**: Chỉ gửi thông báo cho **HR** và **GDVP** khi có thay đổi nhân sự (không thông báo cho cả team).

**Yêu cầu Web**:

- CRUD nhân viên
- Phân quyền theo role (HR, GDVP, Employee)
- Theo dõi trạng thái active/inactive

**Yêu cầu Bot**:

- Đồng bộ danh sách nhân viên với hệ thống
- Gửi thông báo khi có thay đổi nhân sự

---

### 2. Quản lý kênh (Channel Management)

**Mô tả**: Quản lý các kênh Mezon được sử dụng bởi Bot.

**Tính năng**:

- Quản lý kênh chính của Bot
- Quản lý các kênh cho từng chức năng:
  - Kênh thông báo dọn vệ sinh
  - Kênh thông báo Open Talk
  - Kênh thông báo phạt
  - Kênh tổng hợp

**Yêu cầu Web**:

- Cấu hình channel ID cho từng chức năng
- Quản lý quyền gửi tin nhắn vào các kênh

**Yêu cầu Bot**:

- Đăng ký và lắng nghe các kênh được cấu hình
- Gửi thông báo vào đúng kênh theo chức năng

---

### 3. Quản lý ngày nghỉ trong năm

**Mô tả**: Quản lý danh sách các ngày nghỉ lễ, nghỉ hè để điều chỉnh lịch trình.

**Tính năng**:

- Định nghĩa các ngày nghỉ trong năm
- Tự động điều chỉnh lịch dọn vệ sinh vào ngày nghỉ
- Tự động điều chỉnh lịch Open Talk vào ngày nghỉ
- Tạm dừng hoặc không thông báo một số tính năng vào ngày nghỉ

**Yêu cầu Web**:

- CRUD danh sách ngày nghỉ
- Import/Export danh sách ngày nghỉ
- Xem lịch năm với các ngày nghỉ được đánh dấu

**Yêu cầu Bot**:

- Kiểm tra ngày nghỉ trước khi gửi thông báo
- Tự động dời lịch nếu rơi vào ngày nghỉ

---

## Quản lý dọn vệ sinh (Cleaning Schedule)

### Mô tả

Hệ thống tự động xếp lịch dọn vệ sinh cho nhân viên văn phòng, đảm bảo công bằng và hợp lý.

### Quy tắc xếp lịch

1. **Quy định cơ bản**:
   - Mỗi buổi dọn vệ sinh có **2 người**
   - Tổng số nhân viên active được xếp hết 1 vòng (cycle)
   - Hết một vòng → tự động xếp lịch vòng mới
   - **Dãn cách hợp lý**:
     - 1 người dọn nhiều nhất **1 lần/tuần**.
     - Khoảng cách giữa 2 lần dọn ít nhất **1 tuần**.
     - Tránh trường hợp người ở cuối cycle cũ và đầu cycle mới bị xếp lịch quá gần nhau (< 1 tuần).
   - **Ưu tiên**: Không có ưu tiên đặc biệt (công bằng cho mọi level từ Intern đến Senior).

### Thông báo

**Thông báo cuối ngày**:

- Gửi thread trong kênh chính
- Gửi tin nhắn riêng (DM) cho:
  - Người đang có lịch hôm nay
  - Người có lịch vào ngày tiếp theo

**Thông báo đầu ngày**:

- Gửi thread trong kênh chính
- Gửi tin nhắn riêng (DM) cho người có lịch hôm nay

### Đổi lịch

**Quy trình**:

1. Nhân viên gửi yêu cầu đổi lịch (qua Web hoặc Bot)
2. HR hoặc GDVP review và approve/reject
3. Nếu không được approve → tự động tính vào chức năng phạt

**Yêu cầu Web**:

- Xem lịch dọn vệ sinh (calendar view)
- Xem lịch sử các cycle
- Yêu cầu đổi lịch
- Approve/Reject yêu cầu đổi lịch (HR, GDVP)
- Xem thống kê số lần dọn của mỗi người

**Yêu cầu Bot**:

- Command xem lịch cá nhân
- Command yêu cầu đổi lịch
- Gửi thông báo tự động theo lịch trình
- DM nhắc nhở nhân viên

---

## Lên lịch Open Talk

### Mô tả

Hệ thống tự động xếp lịch Open Talk hàng tuần cho nhân viên.

### Quy tắc xếp lịch

1. **Quy định cơ bản**:
   - Mỗi người sẽ có **1 lịch Open Talk** vào **thứ 7 hàng tuần**
   - Tự động lên lịch theo nhân viên active tại văn phòng
   - Vào các ngày nghỉ lễ → tự động dời lịch

2. **Tính năng tự động**:
   - Tự động kiểm tra và điều chỉnh lịch nếu có nhân viên inactive
   - Tự động skip các ngày nghỉ lễ

### Quy trình submit slide

**Timeline**:

- **Trước mỗi 1 tuần**: Người làm Open Talk buổi tiếp theo cần submit slide
- **Kênh submit**: Web hoặc Bot
- **Review**: HR và GDVP review và approve

**Thông báo**:

- Bot gửi DM nhắc nhở nếu chưa submit slide
- Bot gửi thông báo trong kênh chính khi có slide mới
- Bot gửi reminder trước buổi Open Talk

### Đổi lịch

**Quy trình**:

1. Nhân viên gửi yêu cầu đổi lịch (qua Web hoặc Bot)
2. HR hoặc GDVP review và approve/reject
3. Nếu không được approve → tự động tính vào chức năng phạt

**Yêu cầu Web**:

- Xem lịch Open Talk (calendar view)
- Xem lịch sử các buổi Open Talk
- Yêu cầu đổi lịch
- Submit slide
- Approve/Reject yêu cầu đổi lịch (HR, GDVP)
- Approve/Reject slide (HR, GDVP)
- Xem thống kê số lần trình bày của mỗi người

**Yêu cầu Bot**:

- Command xem lịch cá nhân
- Command yêu cầu đổi lịch
- Command submit slide (hoặc upload file)
- Gửi thông báo tự động theo lịch trình
- DM nhắc nhở nhân viên submit slide

---

## Chức năng phạt văn phòng (Penalty System)

### Mô tả

Hệ thống quản lý các lỗi vi phạm và phạt của nhân viên trong văn phòng.

### Tính năng

1. **Định nghĩa lỗi phạt**:
   - Danh sách các loại lỗi phạt (có thể cấu hình)
   - Mức phạt tương ứng với từng loại lỗi
   - Mô tả chi tiết cho từng loại lỗi

2. **Nhập phạt**:
   - **Người thực hiện**: HR
   - **Thông tin cần lưu**:
     - Nhân viên vi phạm
     - Loại lỗi
     - Ngày vi phạm
     - Mức phạt
     - Evidence (ảnh + lý do)
     - Trạng thái (đã nộp/chưa nộp)

3. **Xem lại lịch sử**:
   - Xem danh sách phạt theo nhân viên
   - Xem danh sách phạt theo thời gian
   - Xem tổng tiền phạt
   - Filter theo trạng thái, loại lỗi

4. **Tích hợp Campaign**:
   - Theo dõi tiền phạt theo campaign/quý/năm
   - Thống kê tổng hợp
   - Export báo cáo

**Yêu cầu Web**:

- CRUD loại lỗi phạt
- Nhập phạt với upload evidence (ảnh)
- Xem danh sách phạt (table view với filter)
- Xem lịch sử phạt của từng nhân viên
- Xem thống kê theo campaign
- Export báo cáo Excel/PDF
- Đánh dấu đã nộp phạt

**Yêu cầu Bot**:

- Command xem danh sách phạt cá nhân
- Command xem tổng phạt cá nhân
- Gửi thông báo khi bị phạt (DM + kênh chung)
- Gửi reminder cho phạt chưa nộp

---

## Cấu trúc Database (Gợi ý)

### Users

```
- id
- mezon_user_id (unique, indexed)
- name
- email
- role (HR, GDVP, Employee)
- branch_id
- status (active/inactive)
- created_at
- updated_at
```

### Branches

```
- id
- name
- address
- created_at
- updated_at
```

### Channels

```
- id
- channel_id (Mezon)
- name
- purpose (cleaning, opentalk, penalty, general)
- created_at
- updated_at
```

### Holidays

```
- id
- date
- name
- type (public, company)
- created_at
- updated_at
```

### CleaningSchedules

```
- id
- date
- user_id_1
- user_id_2
- cycle_number
- status (scheduled, completed, swapped)
- created_at
- updated_at
```

### CleaningSwapRequests

```
- id
- schedule_id
- requester_id
- target_user_id (người được đề nghị đổi)
- reason
- status (pending, approved, rejected)
- reviewer_id (HR hoặc GDVP)
- reviewed_at
- created_at
- updated_at
```

### OpenTalkSchedules

```
- id
- date
- user_id
- topic
- slide_url
- slide_status (pending, submitted, approved, rejected)
- schedule_status (scheduled, completed, swapped)
- created_at
- updated_at
```

### OpenTalkSwapRequests

```
- id
- schedule_id
- requester_id
- target_user_id
- reason
- status (pending, approved, rejected)
- reviewer_id
- reviewed_at
- created_at
- updated_at
```

### PenaltyTypes

```
- id
- name
- description
- amount
- created_at
- updated_at
```

### Penalties

```
- id
- user_id
- penalty_type_id
- date
- amount
- reason
- evidence_urls (JSON array)
- status (unpaid, paid)
- campaign_id
- created_by (HR user_id)
- created_at
- updated_at
```

### Campaigns

```
- id
- name
- start_date
- end_date
- created_at
- updated_at
```

---

## API Endpoints (Gợi ý)

### Authentication

- `POST /auth/login` - Login với Mezon OAuth
- `POST /auth/logout` - Logout
- `GET /auth/me` - Lấy thông tin user hiện tại

### Users

- `GET /users` - Danh sách users (filter theo branch, role, status)
- `GET /users/:id` - Chi tiết user
- `POST /users` - Tạo user mới
- `PUT /users/:id` - Cập nhật user
- `DELETE /users/:id` - Xóa user (soft delete)

### Branches

- `GET /branches` - Danh sách branches
- `GET /branches/:id` - Chi tiết branch
- `POST /branches` - Tạo branch
- `PUT /branches/:id` - Cập nhật branch

### Channels

- `GET /channels` - Danh sách channels
- `POST /channels` - Thêm channel
- `PUT /channels/:id` - Cập nhật channel

### Holidays

- `GET /holidays` - Danh sách ngày nghỉ (filter theo năm)
- `POST /holidays` - Thêm ngày nghỉ
- `PUT /holidays/:id` - Cập nhật ngày nghỉ
- `DELETE /holidays/:id` - Xóa ngày nghỉ

### Cleaning Schedules

- `GET /cleaning-schedules` - Danh sách lịch (filter theo tháng, user)
- `GET /cleaning-schedules/my` - Lịch của user hiện tại
- `POST /cleaning-schedules/generate` - Tự động generate lịch cho cycle mới
- `POST /cleaning-schedules/swap-request` - Yêu cầu đổi lịch
- `PUT /cleaning-schedules/swap-request/:id/approve` - Approve đổi lịch
- `PUT /cleaning-schedules/swap-request/:id/reject` - Reject đổi lịch

### Open Talk Schedules

- `GET /opentalk-schedules` - Danh sách lịch (filter theo tháng, user)
- `GET /opentalk-schedules/my` - Lịch của user hiện tại
- `POST /opentalk-schedules/generate` - Tự động generate lịch
- `POST /opentalk-schedules/:id/submit-slide` - Submit slide
- `PUT /opentalk-schedules/:id/approve-slide` - Approve slide
- `POST /opentalk-schedules/swap-request` - Yêu cầu đổi lịch
- `PUT /opentalk-schedules/swap-request/:id/approve` - Approve đổi lịch

### Penalties

- `GET /penalties` - Danh sách phạt (filter theo user, campaign, status)
- `GET /penalties/my` - Danh sách phạt của user hiện tại
- `POST /penalties` - Nhập phạt mới
- `PUT /penalties/:id` - Cập nhật phạt
- `PUT /penalties/:id/mark-paid` - Đánh dấu đã nộp
- `GET /penalty-types` - Danh sách loại phạt
- `POST /penalty-types` - Tạo loại phạt mới

### Campaigns

- `GET /campaigns` - Danh sách campaigns
- `GET /campaigns/:id/penalties` - Thống kê phạt theo campaign
- `POST /campaigns` - Tạo campaign

---

## Bot Commands (Gợi ý)

### General

- `/help` - Hiển thị danh sách commands
- `/profile` - Xem profile cá nhân

### Cleaning Schedule

- `/cleaning-schedule` - Xem lịch dọn vệ sinh cá nhân
- `/cleaning-swap @user [reason]` - Yêu cầu đổi lịch với người khác
- `/cleaning-history` - Xem lịch sử dọn vệ sinh

### Open Talk

- `/opentalk-schedule` - Xem lịch Open Talk cá nhân
- `/opentalk-submit [file/url]` - Submit slide
- `/opentalk-swap @user [reason]` - Yêu cầu đổi lịch
- `/opentalk-history` - Xem lịch sử Open Talk

### Penalties

- `/penalty-list` - Xem danh sách phạt cá nhân
- `/penalty-total` - Xem tổng tiền phạt

### Admin Commands (HR, GDVP)

- `/approve-swap [request_id]` - Approve yêu cầu đổi lịch
- `/reject-swap [request_id]` - Reject yêu cầu đổi lịch
- `/add-penalty @user [type] [reason]` - Thêm phạt

---

## Notifications & Reminders

**Cấu hình**:

- Tích hợp với **MezonBot** (tương tự Discord).
- User **không** thể tắt notification quan trọng.
- Kênh: Mezon DM + Channel.

### Cleaning Schedule

1. **Hàng ngày - Cuối ngày (17:00)**:
   - Thread trong kênh chính: "Lịch dọn vệ sinh hôm nay và ngày mai"
   - DM cho người có lịch hôm nay: "Cảm ơn bạn đã dọn vệ sinh hôm nay!"
   - DM cho người có lịch ngày mai: "Bạn có lịch dọn vệ sinh vào ngày mai"

2. **Hàng ngày - Đầu ngày (8:00)**:
   - Thread trong kênh chính: "Lịch dọn vệ sinh hôm nay"
   - DM cho người có lịch hôm nay: "Bạn có lịch dọn vệ sinh hôm nay"

### Open Talk

1. **1 tuần trước Open Talk (thứ 7 tuần trước - 9:00)**:
   - DM cho người có lịch: "Bạn cần submit slide cho buổi Open Talk tuần sau"
   - Thread trong kênh chính: "Lịch Open Talk tuần này và tuần sau"

2. **3 ngày trước Open Talk (thứ 4 - 9:00)**:
   - DM cho người chưa submit slide: "Bạn chưa submit slide, còn 3 ngày"

3. **1 ngày trước Open Talk (thứ 6 - 9:00)**:
   - DM cho người chưa submit slide: "Nhắc nhở lần cuối: Submit slide trước ngày mai"
   - Thread trong kênh chính: "Buổi Open Talk ngày mai"

4. **Sáng ngày Open Talk (thứ 7 - 8:00)**:
   - Thread trong kênh chính: "Hôm nay có Open Talk"

### Penalties

1. **Khi bị phạt**:
   - DM cho người bị phạt: Chi tiết lỗi, mức phạt, evidence
   - Thread trong kênh chính: "Cập nhật danh sách phạt"

2. **Cuối tháng (ngày 25)**:
   - DM cho người có phạt chưa nộp: "Nhắc nhở nộp phạt"
   - Thread trong kênh chính: "Thống kê phạt tháng này"

---

## Quyền hạn (Permissions)

### Employee

- Xem lịch của bản thân
- Yêu cầu đổi lịch
- Submit slide Open Talk
- Xem danh sách phạt của bản thân

### HR

- Tất cả quyền của Employee
- Quản lý nhân viên (CRUD)
- Approve/Reject yêu cầu đổi lịch
- Approve/Reject slide Open Talk
- Nhập phạt
- Quản lý loại phạt
- Xem tất cả thống kê

### GDVP (Giám Đốc Văn Phòng)

- Tất cả quyền của HR
- Quản lý chi nhánh
- Quản lý kênh
- Quản lý ngày nghỉ
- Quản lý campaign
- Export báo cáo

---

## Technical Notes

### Nx Monorepo Structure

```
/
├── apps/
│   ├── web/                 # React + Vite
│   ├── api/                 # NestJS
│   └── bot/                 # Mezon Bot (NestJS)
├── libs/
│   ├── shared/
│   │   ├── types/          # Shared TypeScript types
│   │   ├── utils/          # Shared utilities
│   │   └── constants/      # Shared constants
│   ├── ui/                 # Shared React components
│   └── api-interfaces/     # API contracts
├── tools/
├── nx.json
├── package.json
└── README.md
```

### Mezon OAuth Integration

1. Redirect user to Mezon OAuth
2. Receive authorization code
3. Exchange code for access token
4. Get user profile (including mezon_user_id)
5. Store mezon_user_id in database
6. Use mezon_user_id for Bot interactions

### Bot Architecture

- NestJS application
- Connect to Mezon API
- Listen to messages and commands
- Interact with API backend for data
- Send notifications via Mezon API

---

## Deployment & DevOps

### Environment Variables

```
# API
DATABASE_URL=
JWT_SECRET=
MEZON_CLIENT_ID=
MEZON_CLIENT_SECRET=
MEZON_REDIRECT_URI=

# Bot
MEZON_BOT_TOKEN=
API_BASE_URL=

# Web
VITE_API_BASE_URL=
VITE_MEZON_CLIENT_ID=
```

### CI/CD

- Build: `nx build web` và `nx build api`
- Test: `nx test` và `nx e2e`
- Deploy: Docker containers hoặc cloud platform

---

## Roadmap

### Phase 1: Core Features (MVP)

- [ ] Authentication với Mezon OAuth
- [ ] Quản lý users và branches
- [ ] Cleaning Schedule (auto-generate + notifications)
- [ ] Bot commands cơ bản

### Phase 2: Open Talk

- [ ] Open Talk Schedule
- [ ] Submit slide
- [ ] Approval flow

### Phase 3: Penalties

- [ ] Penalty system
- [ ] Campaign tracking
- [ ] Statistics và reports

### Phase 4: Enhancements

- [ ] Multi-branch support
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Integration với các tools khác

---

## Contacts & Support

- **Project Owner**: [Tên người phụ trách]
- **Technical Lead**: [Tên technical lead]
- **Repository**: [GitHub/GitLab URL]

---

**Last Updated**: January 5, 2026

[] Swap OT - CLEAN
[] Request Swap Clean
[]
