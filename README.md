# Quản Lý Kho - Sổ kho, đơn bán và doanh thu

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-Powered-26CDAE?style=for-the-badge)](https://workers.cloudflare.com)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare%20D1-%230db7e7?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

## 📋 Tổng quan

**Quản Lý Kho** là ứng dụng web quản lý kho dược liệu: đơn bán lẻ, đơn thuốc chén, nhập hàng, tồn kho, lịch sử giao dịch và thống kê doanh thu 12 tháng.

### ✨ Đặc điểm nổi bật

- **Public**: Mọi người có link đều dùng được, **không cần đăng nhập** hay mật khẩu
- **Đồng bộ 2 thiết bị**: PC + mobile qua Cloudflare D1 (đang migrate từ KV + localStorage)
- **Dữ liệu**: 142 sản phẩm, 432 giao dịch, 6 đơn thuốc chén, 213 dòng prescription_items
- **Chức năng**: Nhập hàng, bán lẻ, đơn thuốc chén, tồn kho, thống kê, backup/restore

### ⚠️ Mở rộng về an ninh

- Mỗi cài đặt có **Database D1 riêng** (`database_id = db9f5180-0f90-4f0e-bba9-2141f1c52fe6`)
- Dữ liệu giữa các user **không bị mix lẫn nhau**
- App **public** nghĩa là không có bước đăng nhập/run vào, không có xác thực mật khẩu
- Để xem/app dụng, truy cập qua domain của bạn (`quan-ly-kho.yellows-voz.workers.dev` hoặc domain cá nhân)

---

## 🚀 Cách triển khai

### 1. Cài đặt dependencies

```bash
npm install
# hoặc
pnpm install
```

### 2. Chạy development local

```bash
npx wrangler dev
```

App sẽ chạy tại `http://localhost:8787`.

### 3. Deploy lên Cloudflare

```bash
npx wrangler deploy
```

Hoặc upload file `worker.js` qua dashboard Cloudflare.

---

## ⚙️ Cấu hình

### File `wrangler.toml`

```toml
name = "quan-ly-kho"
main = "worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "quan-ly-kho"
database_id = "db9f5180-0f90-4f0e-bba9-2141f1c52fe6"

[[kv_namespaces]]
binding = "KV"
id = "59645293dd5b48348edf19a901ce19d3"
```

### Database D1

- Đã tạo: `quan-ly-kho` (region APAC)
- Đã migrate dữ liệu từ KV: 142 sản phẩm, 432 giao dịch, 6 đơn thuốc chén
- Schema: `migrations/0001_init.sql`

---

## 📦 Migration D1 (quá trình đã hoàn thành)

### Các file liên quan

| File | Mô tả |
|------|-------|
| `migrations/0001_init.sql` | Schema database (products, transactions, prescriptions, prescription_items, ledger, app_meta) |
| `scripts/backup-to-sql.mjs` | Script import backup JSON sang D1 |
| `kho-backup/kho-backup-2026-11-04.json` | File backup dữ liệu (nằm ngoài git) |

### Dữ liệu đã import

- **142 sản phẩm** (thuốc, vị thuốc)
- **432 giao dịch** (NHAP/BAN)
- **6 đơn thuốc chén** (chứa items productId+grams)
- **213 dòng prescription_items**

Quy trình:
1. `wrangler d1 create quan-ly-kho`
2. `wrangler d1 execute quan-ly-kho --remote --file migrations/0001_init.sql`
3. `wrangler d1 execute quan-ly-kho --remote --file scripts/backup-to-sql.mjs`

---

## 📱 Tính năng

### Chỉnh năng chính

| Tính năng | Mô tả |
|-----------|-------|
| **Nhập hàng** | Thêm số lượng kho, cập nhật tồn kho |
| **Bán lẻ** | Bán thuốc/vị thuốc, tự tính tổng tiền |
| **Đơn thuốc chén** | Quản lý đơn thuốc theo thang/gram |
| **Tồn kho** | Xem tồn kho thực tế, tồn lý |
| **Lịch sử giao dịch** | Xem toàn bộ lịch sử nhập/bán |
| **Thống kê 12 tháng** | Biểu đồ doanh thu, lợi nhuận |
| **Backup/Restore** | Lưu/tải dữ liệu JSON |
| **Theme** | Sáng/Tối (theo hệ điều hành) |

### Đặc biệt

- ✅ **Public**: Không có bước đăng nhập, app dùng trực tiếp
- ✅ **Đồng bộ**: Dữ liệu tự đồng bộ giữa PC và mobile qua D1
- ✅ **Backup**: Có thể download/upload JSON file
- ✅ **Không cần auth**: Mọi người có link đều dùng được

---

## 🛠️ Sử dụng API

### Endpoint quan trọng

| Endpoint | Phương thức | Mô tả |
|----------|-------------|-------|
| `/` | GET | Trang web chính (public, không cần auth) |
| `/api/state` | GET | Lấy trạng thái dữ liệu từ D1 |
| `/api/state` | PUT | Đồng bộ dữ liệu lên D1 (cần header `X-Base-Updated`) |
| `/sync` | GET | (Đã cũ) Trả dữ liệu từ KV - **chuyển sang `/api/state`** |
| `/favicon.ico` | GET | Favicon SVG |
| `/robots.txt` | GET | Robots config |

### Ví dụ gọi API

```bash
# Lấy dữ liệu hiện tại
curl https://quan-ly-kho.yellows-voz.workers.dev/api/state

# Đồng bộ dữ liệu (PUT)
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "X-Base-Updated: 1793783916463" \
  -d '{"products": [...], "transactions": [...]}' \
  https://quan-ly-kho.yellows-voz.workers.dev/api/state
```

---

## 📦 Backup & Restore

### Tạo backup

```bash
# Trong app: Settings → Tải file sao lưu
# Hoặc API:
curl https://quan-ly-kho.yellows-voz.workers.dev/ -X POST \
  -H "Content-Type: application/json" \
  -d '{"type": "backup"}'
```

### Khôi phục từ file

1. Click nút "Khôi phục từ file" trong app
2. Chọn file JSON đã tải về
3. Dữ liệu sẽ ghi đè lên D1 database

**Lưu ý**: Bản public không có xác thực, nên nên backup thường xuyên.

---

## 🐛 Troubleshooting

### Vấn đề thường gặp

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-----------|-----------|
| Trang trắng / không load dữ liệu | D1 chưa config đúng | Kiểm tra `wrangler.toml`, `database_id` |
| Lỗi conflict đồng bộ | Cùng lúc 2 device sửa dữ liệu | Sử dụng dialog "Lấy bản mới nhất" / "Giữ bản máy này" |
| Dữ liệu không đồng bộ | Cache browser cũ | Clear cache, hoặc `pullState` thủ công |
| Khóa tạm (lock) | Dùng phiên cũ có `APP_PASSWORD` | Đã xóa, app đang public hoàn toàn |

### Lệnh kiểm tra

```bash
# Kiểm tra D1 status
wrangler d1 info quan-ly-kho

# Kiểm tra KV (còn dùng nhưng app không dùng)
wrangler kv key get kho_data_v1 --binding KV --remote
```

---

## 📄 License

Dự án này được phát hành dưới license **MIT**. Xem file `LICENSE` để biết thêm chi tiết.

---

## 👥 Liên hệ

- **Email**: yellows.voz@gmail.com
- **GitHub**: [3chai65/quan-ly-kho](https://github.com/3chai65/quan-ly-kho)
- **Project**: `G:\Quản Lý Kho`

---

## 📜 Changelog

Xem chi tiết thay đổi trong file `CHANGELOG.md`:

- **1.7.0**: Migrate dữ liệu sang Cloudflare D1, bỏ nút Cloud/localStorage làm nguồn chính
- **1.6.0**: Bỏ hoàn toàn đăng nhập, app public

---

**Trang web phục vụ tại**: https://agent-browser.dev/desktop