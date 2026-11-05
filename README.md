# Quản Lý Kho

App quản lý kho dược liệu cá nhân (1 người dùng): nhập hàng, bán lẻ, đơn thuốc chén,
tồn kho, sổ thu/chi, thống kê doanh thu 12 tháng.

## Stack

- **Cloudflare Workers** — toàn bộ app nằm trong `worker.js` (HTML/CSS/JS inline, không build step)
- **Cloudflare D1** (SQLite) — nguồn dữ liệu chính; localStorage chỉ là cache tạm
- **GitHub Actions** (`.github/workflows/deploy.yml`) — push lên `main` là tự deploy
  (cần secret `CLOUDFLARE_API_TOKEN` trong repo)

## Cấu trúc

| File/Thư mục | Vai trò |
|---|---|
| `worker.js` | Toàn bộ code: frontend + API |
| `migrations/0001_init.sql` | Schema D1 (products, transactions, prescriptions, prescription_items, ledger, app_meta) |
| `scripts/backup-to-sql.mjs` | Import backup JSON vào D1 |
| `kho-backup/` | Backup JSON — **không được commit** (đã gitignore) |
| `CHANGELOG.md` | Lịch sử thay đổi (Keep a Changelog + SemVer) |

## Chạy & deploy

```bash
npx wrangler dev      # dev local → http://localhost:8787
npx wrangler deploy   # deploy tay
# hoặc: push lên main → Actions tự deploy
```

Không có `package.json`; không cần `npm install`.

## Backup — BẮT BUỘC làm thường xuyên

- Trong app: **Settings → Tải file sao lưu** (JSON).
- Restore / PUT `/api/state` = **xóa sạch toàn bộ bảng rồi ghi lại snapshot** → ghi đè mất dữ liệu nếu file sai.
- Luôn giữ file `kho-backup-YYYY-MM-DD.json` ở nơi an toàn (ngoài git).

## Logic cốt lõi — KHÔNG được phá vỡ khi sửa

1. **Tồn kho** (`products.stock_kg`, đơn vị kg, kiểu REAL): `NHAP` cộng, `BAN` trừ;
   bán/xuất phải kiểm tra đủ hàng trước (sai số cho phép `1e-9`, báo lỗi nếu không đủ).
   App có màn **đối soát tồn kho**: so `stock_kg` với tổng từ `transactions`, cho phép sửa về `calc`.
2. **Tiền** (VND, kiểu REAL): lưu nguyên giá trị, **chỉ cắt phần lẻ khi hiển thị**
   (`Math.trunc`). Không làm tròn khi lưu.
3. **Số kg**: dùng `dec()` để khử sai số dấu phẩy động nhị phân; hiển thị 1 kg = 10 lạng = 1000 g.
4. **Đồng bộ**: `PUT /api/state` ghi snapshot toàn bộ trong 1 D1 batch.
   Client gửi header `X-Base-Updated: <updatedAt>`; server so với `app_meta.source_updated_at`,
   nếu bản trên server mới hơn → **409 conflict** (client hiện dialog "Lấy bản mới nhất" /
   "Giữ bản máy này", hoặc gửi `X-Force: 1` để ép ghi đè).
5. **Không có auth**: ai có URL đều đọc/ghi/xóa được dữ liệu.
   → Không chia sẻ link; backup thường xuyên; cân nhắc để repo GitHub ở chế độ **private**.

## API

| Endpoint | Mô tả |
|---|---|
| `GET /api/state` | Lấy toàn bộ state (JSON) |
| `PUT /api/state` | Ghi snapshot (cần `X-Base-Updated`, xem mục 4) |
| `/sync` | Cũ (KV), không dùng nữa |

## Quy ước làm việc

- D1 là source of truth; mọi thay đổi đều đọc/ghi qua `/api/state`.
- Sửa logic tiền/tồn kho = sửa vùng nhạy cảm nhất của app — test kỹ trên dev trước khi deploy.
- Mỗi thay đổi đáng kể → ghi vào `CHANGELOG.md`.
- README này là context chung cho người và AI: giữ ngắn, chỉ ghi thông tin còn đúng;
  **không** đưa URL production, database_id, KV id hay thông tin cá nhân vào đây (repo đang public).
