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

## Backup & khôi phục — BẮT BUỘC làm thường xuyên

- Trong app: **Sao lưu & khôi phục → Tải file sao lưu** (JSON). App cũng tự nhắc/tải 1 lần/ngày khi mở.
- Trước khi **khôi phục**, app tự tải thêm một bản `kho-backup-truoc-restore-YYYY-MM-DD-HHmm.json`
  (snapshot ngay trước khi ghi đè). Nếu trình duyệt chặn tải file, app **dừng restore** thay vì ghi đè mù.
- File khôi phục phải có đủ **3 bảng** `products` / `transactions` / `prescriptions`; app
  kiểm tra ngày, số lượng và tiền trước khi nhận.
- Restore / PUT `/api/state` = **xóa sạch toàn bộ bảng rồi ghi lại snapshot** → ghi đè mất
  dữ liệu nếu file sai. Restore trong app là thao tác **chủ động ghi đè**: luôn ép ghi lên
  Cloud (`X-Force: 1`), không hỏi conflict.
- Luôn giữ file `kho-backup-*.json` ở nơi an toàn (ngoài git).

### Khôi phục toàn bộ D1 bằng Time Travel

Time Travel luôn bật và **không tốn phí**; khôi phục tới bất kỳ phút nào trong
**7 ngày (Free)** hoặc **30 ngày (Paid)**. Thao tác restore **ghi đè toàn bộ DB tại chỗ**
và huỷ query đang chạy, nên luôn lưu bookmark trước khi migrate/sửa tay/khôi phục.

```bash
# Kiểm tra DB có hỗ trợ Time Travel (cần version: production)
npx wrangler d1 info quan-ly-kho

# Lấy bookmark hiện tại (lưu lại trước thao tác rủi ro)
npx wrangler d1 time-travel info quan-ly-kho

# Lấy bookmark tại một thời điểm
npx wrangler d1 time-travel info quan-ly-kho --timestamp="2026-11-05T10:00:00+07:00"

# Khôi phục DB về bookmark / mốc thời gian
npx wrangler d1 time-travel restore quan-ly-kho --bookmark=<bookmark>
npx wrangler d1 time-travel restore quan-ly-kho --timestamp=<unix-seconds>
```

Sau khi restore, Wrangler in ra **bookmark trước đó**; giữ lại để undo nếu restore nhầm.
Time Travel chưa hỗ trợ clone/fork, nên không dùng để copy sang DB mới — chỉ dùng để khôi phục.

### Backup lâu hơn 30 ngày

Time Travel chỉ giữ 7/30 ngày. Muốn lâu hơn, xuất SQL định kỳ (chạy ngoài giờ bán hàng vì
export đang chạy sẽ chặn request khác):

```bash
npx wrangler d1 export quan-ly-kho --remote --output=backup-$(date +%F).sql
```

Có thể thêm job GitHub Actions cuối tuần chạy lệnh này và upload `.sql` làm artifact
(giữ 90 ngày). Không cần Worker cron hay R2 cho nhu cầu 1 người.

## Logic cốt lõi — KHÔNG được phá vỡ khi sửa

1. **Tồn kho** (`products.stock_kg`, đơn vị kg, kiểu REAL): `NHAP` cộng, `BAN` trừ;
   bán/xuất phải kiểm tra đủ hàng trước (sai số cho phép `1e-9`, báo lỗi nếu không đủ).
   App có màn **đối soát tồn kho**: so `stock_kg` với tổng từ `transactions`, cho phép sửa về `calc`;
   nếu số theo lịch sử âm thì app chặn và yêu cầu sửa giao dịch trước.
   **Đơn thuốc chén:** vốn từng vị = kg × giá nhập, lãi chia đều, dòng cuối nhận phần dư;
   sửa gram/xóa vị giữ tiền khách trả, chia lại đơn; giá bán thấp hơn tổng vốn thì không cho lưu;
   giữ vốn lịch sử khi sửa/xóa.
2. **Tiền** (lưu bằng **đồng nguyên** qua `money()`; hiển thị theo **nghìn VND** — giữ tới tối đa
   3 số lẻ để thấy từng đồng): lưu nguyên giá trị, **hiển thị đúng giá trị đã lưu** (không cắt
   lẻ từng dòng) để tổng các dòng luôn khớp dòng tổng. Ví dụ `42.5` hiển thị `42,5` (nghìn = 42.500
   đồng). Không làm tròn khi lưu. Lưu/đọc: `money` (đồng) — `kToDong`/`kInput`/`fmtMoney` (nghìn).
3. **Số kg**: dùng `dec()` để khử sai số dấu phẩy động nhị phân; hiển thị 1 kg = 10 lạng = 1000 g.
4. **Đồng bộ**: `PUT /api/state` ghi snapshot toàn bộ trong 1 D1 batch.
   Client gửi header `X-Base-Updated: <updatedAt>`; thiếu `X-Base-Updated` (không có `X-Force`) → **428**.
   `X-Base-Updated` không hợp lệ → **400**. Với **400/428**, client **KHÔNG** tự gửi lại — hiện lỗi
   và nút *"Bỏ thay đổi chưa gửi, lấy bản máy chủ"*; lỗi **5xx/network** retry theo backoff **4s → max 60s**
   (reset khi thành công). Nếu bản trên server mới hơn → **409 conflict** (client hiện dialog
   *"Giữ bản máy này" / "Lấy bản mới nhất"*, hoặc gửi `X-Force: 1` để ép ghi đè).
   Client lưu thêm cờ `dirty` + mốc `cloudBase` trong localStorage: thay đổi chưa gửi được
   giữ lại khi tải lại trang và tự đẩy lên server; không còn so sánh đồng hồ máy với server.
   Tự làm mới mỗi **15s** khi quay lại tab/focus, tạm hoãn khi đang soạn/`dirty`. Huy hiệu
   *"Chưa đồng bộ"* + nút *"Bỏ thay đổi chưa gửi"* (có tải JSON nháp trước).
   Server kiểm tra snapshot trước khi ghi (tồn/tiền không âm, ngày `YYYY-MM-DD`, đủ 3 bảng).
   **Trùng khóa → 400** (không còn cảnh báo bỏ qua). JSON hỏng cũng trả **400**. Server **cảnh báo**
   (không chặn) khi giao dịch/dòng đơn trỏ tới `productId` không có trong `products`.
   **Cảnh báo lệch tồn (stockDrift):** app chỉ cảnh báo (**toast**), không chặn ghi; xem màn **Đối chiếu tồn kho**.
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
