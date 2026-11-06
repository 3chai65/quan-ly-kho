# Quản Lý Kho — bản chạy local

App quản lý kho dược liệu cá nhân (1 người dùng): nhập hàng, bán lẻ, đơn thuốc chén,
tồn kho, thống kê doanh thu 12 tháng. Bản này chạy **hoàn toàn trong mạng nội bộ**,
dữ liệu là **file SQLite trên ổ cứng** — không phụ thuộc cloud.

## Tinh thần dự án (đặt từ đầu)

- **PageSpeed/Lighthouse cao nhất có thể**: không tài nguyên ngoài (font/CDN/analytics),
  ít request nhất có thể. SEO cố ý để thấp vì app riêng tư gửi `noindex`.
- **Gọn nhẹ và đơn giản**: ít file nhất; không framework, không build step.
- **Tiền bạc và tồn kho phải chuẩn xác**: mọi thay đổi dữ liệu đi qua luồng của chính
  app, backup tự động.
- **CSS/JS/HTML ngữ nghĩa**: nhãn/aria đúng chuẩn để A11y tốt.

## Kiến trúc

```
Máy tính (máy chủ)                          Điện thoại / PC khác (cùng WiFi)
┌──────────────────────────────┐
│ Docker Desktop               │
│  └─ container "quan-ly-kho"  │  ◄── http://<IP-máy-tính>:8787
│      Node + Express + SQLite │
│      ↓ đọc/ghi               │
│  data/app.db (file SQLite)   │
│  data/backups/ (tự động)     │
└──────────────────────────────┘
```

- **Server**: Node + Express + better-sqlite3, chạy trong Docker (`server.js`).
- **Client**: toàn bộ HTML + CSS + JS nằm trong `src/page.js`, nhúng inline khi trả trang.
- **Dữ liệu**: file SQLite `data/app.db` trên ổ cứng PC.
- **Truy cập**: PC qua `localhost`, thiết bị khác qua IP máy tính trong cùng WiFi.

## Cấu trúc

| File/Thư mục | Vai trò |
|---|---|
| `server.js` | Server: API `/api/state`, đọc/ghi SQLite, lắp trang, tự động backup |
| `src/page.js` | `PAGE`: toàn bộ HTML + CSS + JS client (nhúng inline) |
| `migrations/` | Schema SQLite tham khảo (server tự tạo bảng bằng `CREATE TABLE IF NOT EXISTS`) |
| `tests/worker.test.mjs` | Test logic client (tiền, tồn kho, đồng bộ) — chạy trên host |
| `tests/server.test.mjs` | Test `server.js` thật qua HTTP — chạy trong Docker |
| `Dockerfile`, `docker-compose.yml` | Đóng gói và chạy server |
| `data/` | Dữ liệu SQLite + backup — **không commit** (gitignore) |
| `README-LOCAL.md` | Hướng dẫn vận hành chi tiết (chạy, backup, khôi phục) |
| `CHANGELOG.md` | Lịch sử thay đổi (Keep a Changelog + SemVer) |

## Chạy

```powershell
cd "G:\Quản Lý Kho-local"
docker compose up -d --build
```

- **PC**: mở `http://localhost:8787`
- **Điện thoại**: mở `http://<IP-máy-tính>:8787` (cùng WiFi). Xem IP: `ipconfig`.

Docker Desktop tự khởi động cùng Windows; container có `restart: unless-stopped` nên
tự chạy lại. Không cần chạy lệnh gì sau khi bật máy.

Xem `README-LOCAL.md` để biết chi tiết (backup, khôi phục, nạp dữ liệu, đổi cổng).

## Chạy test

```powershell
node --test tests/worker.test.mjs                 # test client (trên máy)
docker run --rm -e DATA_DIR=/tmp/qlk quan-ly-kho:latest npm test   # test server (trong Docker)
```

## Logic cốt lõi — KHÔNG được phá vỡ khi sửa

1. **Tồn kho** (`products.stock_kg`, đơn vị kg, kiểu REAL): `NHAP` cộng, `BAN` trừ;
   bán/xuất phải kiểm tra đủ hàng trước (sai số cho phép `1e-9`). App có màn
   **đối soát tồn kho**: so `stock_kg` với tổng từ `transactions`, cho phép sửa về `calc`.
2. **Tiền** (đơn vị **nghìn VND — "k"**): lưu và hiển thị **số nguyên** (làm tròn).
   `fmtMoney` dùng `Math.round`; làm tròn cả khi lưu (`money()` ở client và `validateState`
   ở server) để tổng các dòng luôn khớp dòng tổng.
3. **Số kg**: dùng `dec()` để khử sai số dấu phẩy động nhị phân; hiển thị 1 kg = 10 lạng = 1000 g.
4. **Đồng bộ**: `PUT /api/state` ghi snapshot toàn bộ trong 1 transaction SQLite.
   Client gửi `X-Base-Updated: <updatedAt>`; server so với `app_meta.source_updated_at`,
   nếu bản trên server mới hơn → **409 conflict** (client hiện dialog "Lấy bản mới nhất" /
   "Giữ bản máy này", hoặc gửi `X-Force: 1` để ép ghi đè). Header `X-Base-Updated` không
   hợp lệ → **400**. Server kiểm tra snapshot trước khi ghi (tồn/tiền không âm, ngày
   `YYYY-MM-DD`, đủ 3 bảng, không trùng khoá) và trả **400** kèm chi tiết; JSON hỏng cũng
   trả **400**. Server **cảnh báo** (không chặn) khi giao dịch/dòng đơn trỏ tới `productId`
   không tồn tại.
5. **Không có đăng nhập**: app chỉ chạy trong LAN nội bộ.

## API

| Endpoint | Mô tả |
|---|---|
| `GET /` | Trang app đầy đủ (SSR dữ liệu vào HTML) |
| `GET /api/state` | Lấy toàn bộ state (JSON) |
| `PUT /api/state` | Ghi snapshot (cần `X-Base-Updated`, xem mục 4) |
| `GET /api/backups` | Liệt kê các bản backup `.db` hiện có |

## Backup & khôi phục

- **Tự động**: server tạo 1 bản `data/backups/backup-YYYY-MM-DD.db` mỗi ngày (giữ 30 bản).
- **Khôi phục**: dừng container, copy file backup đè lên `app.db`, khởi động lại
  (xem `README-LOCAL.md`).
- **Trong app**: nút "Sao lưu" tải file JSON theo trình duyệt của từng thiết bị.

## Quy ước làm việc

- `data/` là source of truth; mọi thay đổi đọc/ghi qua `/api/state`.
- Danh sách tồn kho mặc định sắp xếp theo **bán chạy nhất** (tổng kg đã bán, `BAN`).
  Cột: **Tên – Đã bán – Tồn kho – Giá nhập**.
- Sửa logic tiền/tồn kho = vùng nhạy cảm nhất — **chạy test trước khi commit**.
- Mỗi thay đổi đáng kể → ghi vào `CHANGELOG.md`.
- **Không** đưa thông tin cá nhân hay secret vào repo.
