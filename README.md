
# KACoffee

Nền tảng web quản lý chuỗi cửa hàng cà phê — hỗ trợ đặt hàng online, bán tại quán (POS), quản lý giao hàng, chương trình thành viên tích điểm và báo cáo doanh thu. Chi tiết có thể tải KACoffee_UseCases.html về xem nội dung .

## Tính năng

- Đăng ký thành viên qua số điện thoại, 4 hạng: New → Silver → Gold → Diamond
- Đặt hàng online (cafe chai + take-away), giao hàng nội thành 20.000đ
- POS tại quán dành cho nhân viên — tra cứu thành viên, áp mã giảm giá, tích điểm tự động
- Quản lý giao hàng: Admin phân công Shipper, Shipper cập nhật trạng thái thời gian thực
- Đổi vỏ chai: trả 5 chai vỏ → nhận 1 chai miễn phí
- Mã giảm giá với điều kiện hạng thành viên
- Dashboard báo cáo doanh thu, hiệu suất nhân viên, tiến độ KPI chi nhánh
- Hỗ trợ đa chi nhánh — dùng chung pool thành viên và chính sách khuyến mãi
- Audit log toàn bộ hành động trong hệ thống

## Công nghệ

| Layer | Công nghệ |s
|---|---|
| Backend | FastAPI 0.115 · Python · Uvicorn |
| ORM / Migration | SQLAlchemy 2.0 · Alembic |
| Database | MySQL 8.4 · PyMySQL |
| Frontend | React 19 · Vite · TypeScript |
| State / Data | TanStack Query · Zustand · React Hook Form · Axios |
| Auth | JWT (python-jose · passlib bcrypt) |
| DevOps | Docker Compose |

## Cài đặt

### Cách 1 — Docker (khuyến nghị)

Yêu cầu: **Git** và **Docker Desktop**.

```bash
git clone https://github.com/tqtrong28/KACoffee.git
cd kacoffee
docker compose up --build
```

Sau khi chạy xong:

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs
- MySQL (Workbench): `127.0.0.1:3307`

### Cách 2 — Chạy local

**Backend:**

```bash
python3 -m venv .venv_phase1
source .venv_phase1/bin/activate
pip install -r backend/requirements.txt

cd backend
cp .env.example .env
# Chỉnh DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD trong .env

alembic upgrade head
python -m app.db.bootstrap --with-seed
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Cách dùng

Truy cập http://localhost:5173, đăng nhập bằng tài khoản demo bên dưới tương ứng với vai trò muốn thử.

## Tài khoản demo

| Vai trò | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Manager | `manager1` | `manager123` |
| Staff | `staff1` | `staff123` |
| Shipper | `shipper1` | `ship123` |

> Khách hàng tự đăng ký tài khoản tại trang chủ.

## Cấu trúc thư mục

```
kacoffee/
├── backend/
│   ├── alembic/          # Database migrations
│   └── app/
│       ├── modules/      # 16 domain modules (auth, orders, deliveries…)
│       ├── db/           # Models, session, bootstrap
│       └── seed/         # Demo data
├── frontend/
│   └── src/
│       ├── features/     # Feature modules theo role
│       ├── layouts/      # PublicLayout, CustomerLayout, AdminLayout…
│       └── pages/        # Các trang
├── docker-compose.yml
└── README.md
```

## Vai trò hệ thống

- **Customer** — đăng ký, đặt hàng online, theo dõi đơn, xem điểm & thông báo
- **Staff** — tạo đơn tại quầy, xử lý đổi vỏ chai, cập nhật trạng thái đơn
- **Shipper** — nhận delivery được phân công, cập nhật pickup / giao / thất bại
- **Manager** — quản lý đơn, nhân sự, báo cáo trong phạm vi chi nhánh
- **Admin** — quản lý toàn hệ thống, sản phẩm, mã giảm giá, KPI, audit log

## Lệnh hữu ích

```bash
# Chạy test backend
python -m pytest backend/tests -q

# Build frontend
cd frontend && npm run build

# Tắt Docker và giữ dữ liệu
docker compose down

# Tắt Docker và xóa dữ liệu
docker compose down -v
```

