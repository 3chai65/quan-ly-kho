# Quản Lý Kho

App quản lý kho dược liệu cá nhân (1 người dùng): nhập hàng, bán lẻ, đơn thuốc chén,
tồn kho, thống kê doanh thu 12 tháng.

## Tinh thần dự án (đặt từ đầu)

- **PageSpeed/Lighthouse cao nhất có thể**: không tài nguyên ngoài (font/CDN/analytics),
  ít request nhất có thể, mục tiêu Lighthouse A11y / Best-Practices = **100**. SEO cố ý
  để thấp vì app riêng tư gửi `noindex` (không muốn bị tìm kiếm).
- **Gọn nhẹ và đơn giản**: số đường ngắn nhất, ít file nhất; không framework, không build step.
- **Tiền bạc và tồn kho phải chuẩn xác**: mọi thay đổi dữ liệu đi qua luồng của chính
  app (không SQL tường minh từ ngoài), backup thường xuyên.
- **Ít phụ thuộc**: càng ít thứ chạy ngoài/chạy ngầm càng tốt — chính nhờ vậy mà trang
  nhanh và PageSpeed đẹp.
- **CSS/JS/HTML ngữ nghĩa**: mọi tương tác có nhãn/aria đúng chuẩn để A11y đạt 100.


## Stack

- **Cloudflare Workers** — `worker.js` giữ router/API; `src/page.js` giữ HTML/CSS/JS client
  (vẫn nhúng inline khi trả trang). Import ESM được Wrangler tự bundle, **không cần build step**.
- **Cloudflare D1** (SQLite) — nguồn dữ liệu chính; localStorage chỉ là cache tạm
- **GitHub Actions** (`.github/workflows/deploy.yml`) — push lên `main` là tự deploy
  (cần secret `CLOUDFLARE_API_TOKEN` trong repo)

## Cấu trúc

| File/Thư mục | Vai trò |
|---|---|
| `worker.js` | Router/API Worker: xác thực, `/api/state`, đọc/ghi D1, lắp trang |
| `src/page.js` | `PAGE`: toàn bộ HTML + CSS + JS client (nhúng inline, có placeholder CSP/SSR) |
| `migrations/0001_init.sql` | Schema D1 ban đầu (products, transactions, prescriptions, prescription_items, ledger, app_meta) |
| `migrations/0002_drop_ledger.sql` | Xóa bảng `ledger` (gỡ tính năng Sổ Thu Chi) |
| `scripts/backup-to-sql.mjs` | Import backup JSON vào D1 |
| `tests/worker.test.mjs` | Test hồi quy logic tiền/tồn kho/đồng bộ/API (`node --test "tests/**/*.test.mjs"`) |
| `kho-backup/` | Backup JSON — **không được commit** (đã gitignore) |
| `CHANGELOG.md` | Lịch sử thay đổi (Keep a Changelog + SemVer) |

## Chạy & deploy

```bash
npx wrangler dev      # dev local → http://localhost:8787
npx wrangler deploy   # deploy tay
# hoặc: push lên main → Actions tự deploy

npx wrangler secret put APP_TOKEN   # bắt buộc 1 lần trước khi dùng bản có token
node --test "tests/**/*.test.mjs"   # chạy test trước khi deploy
```

Không có `package.json`; không cần `npm install`. `worker.js` import `src/page.js` — Wrangler
tự bundle các module ESM khi `dev`/`deploy`, không cần bước build riêng.

## Backup — BẮT BUỘC làm thường xuyên

- Trong app: **Settings → Tải file sao lưu** (JSON).
- File khôi phục phải có đủ **3 bảng** `products` / `transactions` / `prescriptions`; app
  kiểm tra ngày, số lượng và tiền trước khi nhận.
- Restore / PUT `/api/state` = **xóa sạch toàn bộ bảng rồi ghi lại snapshot** → ghi đè mất
  dữ liệu nếu file sai. Restore trong app là thao tác **chủ động ghi đè**: luôn ép ghi lên
  Cloud (`X-Force: 1`), không hỏi conflict.
- Luôn giữ file `kho-backup-YYYY-MM-DD.json` ở nơi an toàn (ngoài git).

## Logic cốt lõi — KHÔNG được phá vỡ khi sửa

1. **Tồn kho** (`products.stock_kg`, đơn vị kg, kiểu REAL): `NHAP` cộng, `BAN` trừ;
   bán/xuất phải kiểm tra đủ hàng trước (sai số cho phép `1e-9`, báo lỗi nếu không đủ).
   App có màn **đối soát tồn kho**: so `stock_kg` với tổng từ `transactions`, cho phép sửa về `calc`;
   nếu số theo lịch sử âm thì app chặn và yêu cầu sửa giao dịch trước.
2. **Tiền** (lưu bằng số thực; dữ liệu hiện tại tính theo **nghìn VND — “k”**): lưu nguyên
   giá trị, **hiển thị đúng giá trị đã lưu** (không cắt lẻ từng dòng) để tổng các dòng luôn
   khớp dòng tổng. Ví dụ `42.5` hiển thị `42,5`. Không làm tròn khi lưu.
3. **Số kg**: dùng `dec()` để khử sai số dấu phẩy động nhị phân; hiển thị 1 kg = 10 lạng = 1000 g.
4. **Đồng bộ**: `PUT /api/state` ghi snapshot toàn bộ trong 1 D1 batch.
   Client gửi header `X-Base-Updated: <updatedAt>`; server so với `app_meta.source_updated_at`,
   nếu bản trên server mới hơn → **409 conflict** (client hiện dialog "Lấy bản mới nhất" /
   "Giữ bản máy này", hoặc gửi `X-Force: 1` để ép ghi đè).
   Client lưu thêm cờ `dirty` + mốc `cloudBase` trong localStorage: thay đổi chưa gửi được
   giữ lại khi tải lại trang và tự đẩy lên server; không còn so sánh đồng hồ máy với server.
   Server kiểm tra snapshot trước khi ghi (tồn/tiền không âm, ngày `YYYY-MM-DD`, đủ 3 bảng,
   không trùng khoá) và trả **400** kèm chi tiết thay vì làm hỏng cả batch.
5. **Đăng nhập 1 người dùng**: mở `/` chưa đăng nhập → **trang login 1 ô mật khẩu**
   (HTML thuần, không JS, không chứa dữ liệu). Đăng nhập đúng → cookie `qlk_token`
   `HttpOnly; SameSite=Strict` — **không tự hết hạn**, chỉ kết thúc khi bấm **Đăng xuất**
   (cookie sống tối đa ~10 năm). Nhập sai quá **10 lần trong 10 phút** → tạm khóa
   đăng nhập ~10 phút (đếm theo IP qua KV). API `/api/*` chấp nhận cookie (trình duyệt
   tự gửi) hoặc header `Authorization: Bearer <APP_TOKEN>` (tương thích bản cũ).
   Secret đặt qua `npx wrangler secret put APP_TOKEN` — không nằm trong git.
   Đổi mã → đặt secret mới + deploy lại, mọi cookie cũ vô hiệu.

## API

| Endpoint | Cần đăng nhập? | Mô tả |
|---|---|---|
| `GET /` | Có | Đã đăng nhập → app đầy đủ; chưa → trang login (1 ô mật khẩu, không chứa dữ liệu) |
| `GET/POST /login` | Không | POST sai mã → 401; đúng → cookie (không tự hết hạn) + quay về `/`; sai >10 lần/10 phút → 429 tạm khóa |
| `GET /logout` | Không | Xóa cookie → về `/login` |
| `GET /api/state` | **Có** | Lấy toàn bộ state (JSON) |
| `PUT /api/state` | **Có** | Ghi snapshot (cần `X-Base-Updated`, xem mục 4) |
| `/sync` | — | Cũ (KV), không dùng nữa |

Xác thực qua cookie `qlk_token` (HttpOnly) hoặc header `Authorization: Bearer <APP_TOKEN>`.
Trang HTML **không bao giờ** nhúng dữ liệu cho người chưa đăng nhập.

## Quy ước làm việc

- D1 là source of truth; mọi thay đổi đều đọc/ghi qua `/api/state`.
- Danh sách tồn kho mặc định sắp xếp theo **Bán chạy nhất** (tổng kg đã bán, `BAN`); các cách sắp xếp khác trong dropdown vẫn dùng được. Cột hiển thị: **Tên – Đã bán – Tồn kho – Giá nhập** (không còn Trị giá).
- Sửa logic tiền/tồn kho = sửa vùng nhạy cảm nhất của app — test kỹ trên dev trước khi deploy.
- Mỗi thay đổi đáng kể → ghi vào `CHANGELOG.md`.
- README này là context chung cho người và AI: giữ ngắn, chỉ ghi thông tin còn đúng;
  **không** đưa URL production, database_id, KV id hay thông tin cá nhân vào đây (repo đã để private).
