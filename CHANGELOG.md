# Changelog

Mọi thay đổi đáng chú ý của dự án **Quản Lý Kho** được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/) và
tuân theo [Semantic Versioning](https://semver.org/lang/vi/).

## [2.5.0] - 2026-11-06

### Ổn định dữ liệu & vòng đời server

- **Giữ `created_at` gốc**: `writeState` (xóa sạch rồi ghi lại) nay đọc `created_at`
  hiện có của `products`/`transactions` và giữ nguyên thay vì đặt lại thành thời
  điểm ghi. Bản ghi mới vẫn nhận `now`.
- **Đóng sạch khi dừng (SIGTERM/SIGINT)**: handler ngừng nhận request, đóng DB
  (checkpoint WAL) rồi thoát; có timeout 10s phòng request treo. `docker stop`
  không còn cắt đột ngột.
- Thêm test `created_at` giữ nguyên (server test 11/11).

## [2.4.0] - 2026-11-06

### Dọn dẹp repo (theo đánh giá review)

- **Xóa `wrangler.toml`** — chứa `database_id` và KV id thật, không còn dùng.
- **Xóa file legacy Cloudflare**: `worker.js`, `migrations/`, `scripts/backup-to-sql.mjs`.
- **Đổi tên** `tests/worker.test.mjs` → `tests/client.test.mjs` (chỉ còn test client;
  các test Cloudflare đã có `tests/server.test.mjs` tương đương).
- **Gỡ placeholder `%%NONCE%%`** khỏi `page.js` và `server.js` (CSP dùng `unsafe-inline`).
- **`package-lock.json`** được commit; `Dockerfile` dùng `npm ci` để build tái lập.
- **`package.json`**: version → `2.3.0`, thêm `engines.node >= 22`.
- **`docker-compose.yml`**: thêm `TZ=Asia/Ho_Chi_Minh` (tên backup đúng ngày VN).
- **`README.md`** viết lại cho bản local (bỏ hướng dẫn Cloudflare/D1/Time Travel).
- **`.gitignore`**: bỏ `.wrangler/`, `.dev.vars`.

## [2.3.0] - 2026-11-06

### Kiểm thử & sửa lỗi P0 (theo đánh giá review)

- **Test chạy trực tiếp `server.js`**: thêm `tests/server.test.mjs` (10 test) khởi
  động server thật và kiểm tra qua HTTP — validate, conflict 409, làm tròn tiền,
  tự động backup. Trước đây chỉ có test cho `worker.js` (bản Cloudflare cũ), nên
  file đang chạy production không được test.
- **Vá lỗi `X-Base-Updated` không phải số**: header `NaN` trước đây bị bỏ qua
  kiểm tra conflict (ghi đè mù); nay trả **400**.
- **Gỡ nút "Đăng xuất" chết**: `/logout` không còn tồn tại ở bản local (bỏ đăng
  nhập), nút này trỏ tới 404.
- **Docker**: COPY `tests/server.test.mjs` vào image; thêm `npm test` (server)
  và `npm run test:client` (client).
- **CI**: tách 2 job — test client trên host, test server bên trong container.

## [2.2.1] - 2026-11-06

### Bỏ cấu hình Claude Code cho code-review-graph

- Gỡ `.mcp.json`, `.claude/` và pre-commit hook do code-review-graph cài — không
  dùng với Claude Code. Giữ `CLAUDE.md` làm tài liệu kiến trúc.
- Vẫn có thể dùng CLI `code-review-graph` thủ công khi cần (`build`, `update`,
  `query`, `impact`, `architecture`).

## [2.2.0] - 2026-11-06

### Tích hợp code-review-graph (MCP)

- Cấu hình `code-review-graph` cho Claude Code để index repo này: `.mcp.json`,
  `.claude/settings.json` (hooks cập nhật graph), `.claude/skills/`.
- Thêm `CLAUDE.md` mô tả kiến trúc và hướng dẫn AI dùng graph khi đọc/sửa code.
- `.mcp.json` và `.claude/` (chứa đường dẫn tuyệt đối theo máy) được gitignore;
  graph DB `.code-review-graph/` cũng không commit.

## [2.1.1] - 2026-11-06

### CI — bỏ workflow deploy Cloudflare

- Thay `.github/workflows/deploy.yml` (deploy lên Cloudflare Workers, không còn
  dùng và luôn thất bại) bằng `.github/workflows/ci.yml`: chạy test và build
  thử Docker image trên mỗi push/PR.

## [2.1.0] - 2026-11-06

### Tự động sao lưu mỗi ngày

- Server tự tạo **1 bản backup file `.db` mỗi ngày** bằng SQLite `VACUUM INTO`
  (nhất quán, không cần dừng app).
- Lưu vào `data/backups/backup-YYYY-MM-DD.db` (trên ổ cứng PC), **giữ 30 bản**
  gần nhất, tự xóa bản cũ hơn.
- Chạy khi khởi động, sau mỗi lần ghi dữ liệu, và kiểm tra mỗi giờ (kịp chụp khi
  app chạy qua nửa đêm).
- Thêm API `GET /api/backups` liệt kê các bản backup hiện có.
- Cấu hình qua biến môi trường: `BACKUP_DIR`, `BACKUP_KEEP_DAYS`.

## [2.0.1] - 2026-11-06

### Thay đổi hiển thị & lưu trữ tiền — làm tròn về số nguyên

- **Tiền (đơn vị nghìn VND) luôn là số nguyên.** `fmtMoney` làm tròn (`Math.round`)
  và hiển thị không còn phần thập phân; bỏ dấu `,` (ví dụ `42,5` → `43`,
  `1.234,56` → `1.235`).
- **Làm tròn cả giá trị lưu**, không chỉ hiển thị: `price`, `total`, `cost`,
  `unitPrice` (giao dịch), `costPrice` (sản phẩm), `total` (đơn thuốc) đều được
  làm tròn ở cả client (`sanitize`) và server (`validateState`).
- **Chia tiền đơn thuốc** (`allocateRemedyAmounts`) giờ chia thành số nguyên;
  dòng cuối nhận phần dư nên tổng các dòng luôn khớp đúng số thang × giá 1 thang.
- Số lượng/khối lượng (`qty`, `stock`, `grams`, `g`, `thang`) **không** bị làm
  tròn — vẫn giữ phần thập phân vì là kg/gram.
- Đã làm tròn lại toàn bộ dữ liệu hiện có (273/463 giao dịch có tiền lẻ → 0).

## [2.0.0] - 2026-11-06

### Kiến trúc — chuyển sang chạy local (Docker + SQLite)

- **Bỏ Cloudflare Worker + D1**, thay bằng server Node (`server.js`) dùng
  **Express + better-sqlite3** chạy trong Docker; dữ liệu là **file SQLite thật
  trên ổ cứng** (`data/app.db`), dễ copy để backup.
- Giữ **nguyên hợp đồng API** `GET/PUT /api/state` (kể cả `X-Base-Updated`,
  `X-Force`, 409 conflict) và **toàn bộ logic tiền/tồn kho** trong `src/page.js`.
- PC và điện thoại trong cùng mạng WiFi truy cập chung một nguồn dữ liệu qua
  `http://<IP-máy-tính>:8787`; không cần internet.
- Thêm `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `package.json`.
- Cổng mặc định 8787, volume `./data:/data`.

### Bỏ đăng nhập

- Gỡ xác thực `APP_TOKEN` / cookie `qlk_token` / trang `/login` — bản local chỉ
  chạy trong mạng nội bộ. `authFetch` (kiểm tra Bearer + redirect 401) trong
  `src/page.js` được thay bằng `apiFetch` gọi thẳng API.

### Ghi chú

- `worker.js`, `wrangler.toml` và bộ test cũ được **giữ lại làm tham chiếu**;
  27 test hiện có vẫn chạy và pass.
- Hướng dẫn chạy cho người dùng nằm trong `README-LOCAL.md`.

## [1.14.2] - 2026-11-05

### Khôi phục & an toàn dữ liệu

- **Backup trước khi restore**: app tự tải `kho-backup-truoc-restore-YYYY-MM-DD-HHmm.json`
  (snapshot ngay trước khi ghi đè). Nếu trình duyệt chặn tải, restore bị huỷ thay vì mù quáng.
- README bổ sung runbook **D1 Time Travel** (kiểm tra `version: production`, lấy bookmark hiện
  tại/theo timestamp, khôi phục ghi đè, undo bằng bookmark trước đó) và hướng dẫn `d1 export`
  cho backup dài hạn.

### Sửa lỗi server & validate

- `PUT /api/state` với **JSON hỏng trả 400** (`JSON không hợp lệ`) thay vì 500.
- Server **cảnh báo** (không chặn) khi `transactions.productId` hoặc `prescription_items.productId`
  trỏ tới sản phẩm không có trong `products`; tổng số warning bị giới hạn 50 dòng.

### Refactor & test

- Tách `computeStats()` và `allocateRemedyAmounts()` thành hàm thuần, dùng chung cho UI và test.
  Tổng dòng khi chia tiền đơn thuốc vẫn bằng đúng `grand`; dòng cuối nhận phần dư.
- Test tăng từ 18 lên **27 pass**: stats/lãi ngày-tháng-năm, chia tiền lẻ, backup trước restore,
  luồng 409 (Lấy bản mới / Giữ bản máy này + `X-Force`), `pullState` khi dirty,
  JSON hỏng → 400, cảnh báo `productId` mồ côi.

## [1.14.1] - 2026-11-05

### Refactor

- Tách khối `PAGE` (~3.978 dòng: HTML + CSS + toàn bộ JS client) từ `worker.js` sang
  `src/page.js` dưới dạng `export const PAGE = String.raw\`...\``. `worker.js` còn ~530 dòng,
  chỉ giữ router/API, xác thực, đồng bộ D1 và lắp trang.
- `worker.js` import `PAGE` từ `src/page.js`; Wrangler tự bundle ESM nên **không phát sinh
  bước build mới**, không cần `package.json`/`npm install`.
- Giữ nguyên 100% nội dung HTML/CSS/JS client, placeholder `%%NONCE%%` / `%%BOOT%%` /
  `%%NEEDFETCH%%`, SSR và CSP.
- Test đọc `PAGE` từ `src/page.js`; thêm test xác nhận placeholder và việc `GET /` lắp trang,
  thay nonce/SSR đúng. Tổng test: **18 pass**.

## [1.14.0] - 2026-11-05

### Sửa lỗi dữ liệu (P0)

- **Xóa đơn nhập không còn làm tồn âm**: `delTx()` / `delOrder()` kiểm tra hàng đã bán trước
  khi trừ tồn; màn **Đối chiếu tồn kho** từ chối áp dụng số âm và bỏ qua các dòng lịch sử âm.
- **Sửa giao dịch bán giữ nguyên giá vốn lịch sử** (dùng đơn giá vốn cũ của chính giao dịch,
  chỉ fallback giá hiện tại khi thiếu `cost`) và **cập nhật lại `unitPrice`** cho mọi dòng
  cùng đơn thuốc để `Số thang × Giá 1 thang = Thành tiền` luôn đúng.
- **Chặn tiền/số lượng âm** ở bán lẻ, ghi chú bán lẻ, nhập hàng, sửa giá nhập và sửa giao dịch.
- **Mọi giao dịch bán lẻ đều có cờ `retail`** (kể cả đơn 1 vị); `mergeCandidates()` loại cả
  `retail` và tên cũ "Bán lẻ" nên không gộp nhầm đơn bán lẻ.
- **Lưu đơn thuốc theo ID đang chọn**, không dò theo tên: đổi tên không ghi đè đơn khác;
  trùng tên bị chặn; đổi tên có xác nhận (đổi tên hay lưu thành đơn mới).
- **Restore an toàn hơn**: file phải đủ `products` / `transactions` / `prescriptions`, kiểm tra
  ngày và số liệu; restore luôn **ép ghi đè Cloud** thay vì có thể mất bản vừa khôi phục.
- **Chia tiền đơn thuốc theo gram**: dòng cuối nhận phần dư để tổng khớp tuyệt đối; giá 1 thang
  được đọc sau khi thêm dòng đang nhập (không còn dùng giá trị cũ).

### Đồng bộ & API

- Thay so sánh `Date.now()` của client với timestamp server bằng **cờ `dirty` + `cloudBase`**
  lưu trong localStorage; thay đổi chưa gửi được giữ khi tải lại và tự đẩy lên Cloud.
  Khi không lưu được (mất mạng/400), app báo một lần "dữ liệu vẫn giữ trên máy này".
- Chống mất thay đổi khi có thao tác mới trong lúc request `PUT` đang chạy (giữ `dirty`, gửi tiếp).
- `readState()` đọc giao dịch và dòng đơn theo **`rowid`** để giữ đúng thứ tự dòng sau khi tải lại.
- Server **validate snapshot trước khi ghi**: đủ 3 bảng, tồn/tiền/qty không âm, ngày
  `YYYY-MM-DD`, số thang/gram hợp lệ; tự loại bản ghi trùng id/tên và trả `400` kèm chi tiết.
- Client `sanitize()` cũng loại trùng id/tên để lần lưu sau không làm hỏng `db.batch()`.

### Công cụ & tài liệu

- `scripts/backup-to-sql.mjs`: `cost: null` giữ `NULL` thay vì ghi thành `0`.
- Thêm `tests/worker.test.mjs` (Node built-in test runner) cho tiền, chuẩn hoá, đối chiếu tồn,
  gộp đơn, restore, validate API, conflict và script backup.
- README cập nhật quy ước tiền (nghìn VND), hiển thị đúng giá trị, dirty/cloudBase, restore ép
  ghi đè và mục tiêu Lighthouse (SEO cố ý `noindex`).

## [1.13.1] - 2026-11-05

### Docs

- README thêm mục **Tinh thần dự án (đặt từ đầu)**: PageSpeed/Lighthouse ở mức cao nhất
  (A11y / Best-Practices / SEO = 100), không tài nguyên ngoài, ít request, ngữ nghĩa
  HTML/ARIA, dữ liệu tiền/tồn kho qua luồng app, backup thường xuyên. Làm sổ tay chung
  cho người và cho AI khi sửa code sau này.

## [1.13.0] - 2026-11-05

### Bỏ tính năng Sổ Thu Chi

- Gỡ hoàn toàn mục **4. Sổ Thu Chi** khỏi app (phiên bản trước dùng để ghi thu/chi viết
  tay): form ghi thu/chi, nút Thu/Chi, danh mục, tổng thu/chi/số dư, lịch sử thu/chi
  tháng này, khuôn (CSS), bộ đếm trong sao lưu và mã đồng bộ `/api/state`.
- Dữ liệu không còn dùng tới: bảng `ledger` **trống (0 dòng)** → xóa hẳn bảng bằng
  `migrations/0002_drop_ledger.sql`. Người dùng chuyển sang ứng dụng khác cho việc thu chi.
- Backup/khôi phục không còn chứa `ledger`; script `scripts/backup-to-sql.mjs` cũng bỏ
  phần import/ledger. Các thống kê (nhập/bán/lợi nhuận/tồn kho) không phụ thuộc sổ thu chi
  nên giữ nguyên.
- Mục còn lại tự đánh số lại gọn: 1. Đơn bán lẻ · 2. Đơn thuốc chén · 3. Nhập hàng.

## [1.12.0] - 2026-11-05

### Thay đổi

- **Danh sách tồn kho bỏ cột "Trị giá"**; thứ tự cột hiện là **Tên – Đã bán – Tồn kho – Giá nhập**
  (đúng yêu cầu); cột **Đã bán** hiển thị tổng kg đã bán của vị đó (cùng nguồn với mục
  sắp xếp "Bán chạy nhất"). Bỏ luôn 2 lựa chọn sắp xếp theo trị giá trong dropdown.

### Dữ liệu

- Sửa giao dịch nhập **Thăng Ma** (01/11/2026) bị gõ nhầm **40 kg → 4 kg** qua chức năng
  "Sửa giao dịch" của app (giá giữ 240k/kg, thành tiền 9.600 → 960): tồn kho, lịch sử,
  thống kê tháng tự đồng bộ; verify bằng D1 (`stock=4`) và màn **Đối chiếu tồn kho**
  (Thăng Ma không còn lệch).
- Xóa giao dịch **nhập kép Tri Mẫu** (31/10/2026): chỉ nhập 1 lần nhưng ghi 2 dòng
  2,5 kg (@ 17k và @ 170k) — xóa dòng @ 17k (42,5k), giữ dòng @ 170k (425k); sau đó
  chỉnh tồn theo lịch sử trong màn Đối chiếu → **Tri Mẫu tồn = 2,44 kg, khớp thực tế**.
  Đối chiếu hiện còn 4 vị lệch nhỏ (Đại Táo +0,03; Hồng Hoa +0,01; Sinh Địa +0,01;
  Xuyên Khung Thái +0,01) — **chưa tự sửa**, chờ quyết định của chủ shop.

## [1.11.0] - 2026-11-05

### Thêm mới

- **Danh sách tồn kho sắp xếp mặc định theo "Bán chạy nhất"**: tổng kg đã bán (mọi giao
  dịch `BAN` — bán lẻ lẫn đơn chén, đều lưu `qty_kg`) giảm dần; hòa nhau → theo tên A→Z.
  Lựa chọn mới nằm trên dropdown `#invSort`, các cách sắp xếp cũ giữ nguyên.
  Chỉ đổi thứ tự hiển thị, không đụng dữ liệu.
- Ý tưởng cảnh báo "tồn còn 10%" đã **bỏ** (chiều đo mơ hồ, dễ gây rối).

## [1.10.0] - 2026-11-05

### Thay đổi

- **Phiên đăng nhập không tự hết hạn**: cookie `qlk_token` sống ~10 năm, chỉ kết thúc khi
  bấm **Đăng xuất** (xóa cookie tại `/logout`). Không còn giới hạn 30 ngày.
- **Chống dò mật khẩu**: nhập sai quá **10 lần trong 10 phút** (đếm theo IP, lưu trong
  KV, TTL 10 phút) → tạm khóa đăng nhập, trả 429. Đăng nhập đúng → bộ đếm được xóa.
  Cần thiết vì mã truy cập là mật khẩu ngắn.
- Độ trễ sau mỗi lần nhập sai tăng lên 800ms (trước là 400ms).
- Mã truy cập hiện tại đặt qua `wrangler secret put APP_TOKEN` (nêu rõ nếu đổi mã thì mọi
  cookie/Bearer cũ vô hiệu).

## [1.9.0] - 2026-11-05

### Bảo mật

- **Trang login 1 ô mật khẩu**: `/` chưa đăng nhập chỉ trả về trang login (~2 KB, HTML thuần,
  không JS, **không chứa bất kỳ dữ liệu nào**). Trước bản này, toàn bộ dữ liệu (sản phẩm,
  tồn, giá vốn, giao dịch) bị nhúng thẳng trong HTML qua `window.__DB__` — ai mở `/` cũng
  đọc được toàn bộ, token API không chặn được việc này.
- Đăng nhập đúng → cookie `qlk_token` (`HttpOnly; SameSite=Strict; Max-Age=30 ngày`), app
  dùng đầy đủ như trước, không cần nhập lại cho tới khi hết hạn/xóa cookie.
- API `/api/*` chấp nhận cookie (trình duyệt tự gửi) hoặc `Authorization: Bearer <APP_TOKEN>`
  (tương thích bản 1.8.0). Sai mã → 401 + trễ 400ms.
- Nút **Đăng xuất** trên header (`GET /logout` xóa cookie → về `/login`).
- Worker so sánh mã sau khi `trim()` ở cả Bearer lẫn cookie.

### Sửa lỗi

- Một số trình duyệt/máy yếu không render được vùng app → thấy trang trắng. Trang login
  mới không dùng JS nên hiển thị được trên mọi trình duyệt; app được phục vụ như cũ sau khi đăng nhập.

## [1.8.0] - 2026-11-05

### Thêm mới

- **Mã truy cập (token) cho mọi API `/api/*`**: Worker kiểm tra header `Authorization: Bearer
  <APP_TOKEN>` trước khi xử lý; thiếu/sai → 401. Trang HTML (`/`) vẫn mở được nhưng không
  chứa dữ liệu — dữ liệu chỉ trả về khi có token.
- Token lưu trong `localStorage` của trình duyệt, nhập 1 lần mỗi máy; app gửi kèm header
  tự động cho cả `GET` (pullState) và `PUT` (pushState).
- Secret `APP_TOKEN` đặt qua `npx wrangler secret put APP_TOKEN`, không nằm trong git;
  Worker so sánh token sau khi `trim()`.
- Repo GitHub chuyển sang **private**; README viết lại tối giản (bỏ URL, database_id, KV id,
  thông tin cá nhân) và ghi rõ các quy tắc logic cốt lõi (tiền REAL chỉ cắt lẻ khi hiển
  thị, tồn kho kg/REAL + check 1e-9, conflict 409 qua `X-Base-Updated`).
- `preview_urls = false` trong `wrangler.toml`.

### Bảo mật

- Trước bản này: ai có link đều đọc/ghi/xóa được toàn bộ dữ liệu. Từ 1.8.0, link không
  còn đủ — cần token. Backup JSON vẫn bắt buộc vì PUT `/api/state` ghi đè toàn bộ snapshot.

## [1.7.0] - 2026-11-04

### Thay đổi phá vỡ

- **Dữ liệu chính chuyển từ Cloudflare KV sang Cloudflare D1**: app đọc/ghi `products`,
  `transactions`, `prescriptions`, `prescription_items`, `ledger` trực tiếp trong D1.
- **Không còn nút “Lưu Cloud” / “Tải Cloud”**: mỗi lần mở trang app tải dữ liệu mới nhất từ
  máy chủ; các thao tác ghi sẽ tự lưu vào D1.
- **Bỏ đồng bộ qua KV và localStorage làm nguồn chính**: localStorage chỉ còn là cache tạm,
  dữ liệu chính nằm trong D1.
- **Di chuyển dữ liệu hiện tại sang D1**: import từ bản KV mới nhất (142 sản phẩm,
  432 giao dịch, 6 đơn thuốc chén).
- App vẫn public, chưa có lớp đăng nhập; ai có link đều dùng được.

### Kỹ thuật

- Thêm D1 database `quan-ly-kho` với schema migration `migrations/0001_init.sql`.
- Thêm `scripts/backup-to-sql.mjs` để import backup JSON vào D1.
- Worker đọc/ghi D1 qua `/api/state`; `/sync` cũ đã bị thay thế.
- Ghi dữ liệu dùng D1 batch, xóa/chèn lại toàn bộ snapshot trong một lần gọi.
- Giữ KV binding trong cấu hình để có thể rollback nếu cần, nhưng app không còn dùng KV.

## [1.6.0] - 2026-11-04

### Thay đổi phá vỡ

- **Bỏ hoàn toàn đăng nhập của ứng dụng**: mọi người có link đều xem và thao tác được app,
  không còn mật khẩu `APP_PASSWORD`, cookie `qlk_session`, trang `/login`, nút **Thoát**
  và cơ chế khóa tạm theo IP.
- **`/sync` không còn yêu cầu xác thực**: dữ liệu có thể bị xem, ghi đè hoặc thay đổi bởi
  bất kỳ ai có link. Mọi người dùng nên chủ động backup JSON thường xuyên.
- Không nên dùng bản này để lưu dữ liệu cần riêng tư.

## [1.5.1] - 2026-11-04

### Thêm mới

- **Sửa từng dòng ngay trong hộp Chi tiết đơn** (cả đơn nhập lẫn đơn bán, kể cả đơn
  thuốc chén): mỗi dòng có menu `···` → **Sửa dòng** / **Xóa dòng**.
  - Đơn lẻ/bán lẻ/nhập: sửa *SL (kg)* + *Đơn giá*, tổng tiền tự tính lại.
  - Đơn thuốc chén: sửa *Số gram (mỗi thang)* — nhãn và ô thật hiển thị theo gram,
    không phải kg.
  - Tồn kho, thống kê doanh thu/lợi nhuận và lịch sử tự điều chỉnh như thao tác
    sửa/xóa giao dịch lẻ; đơn xóa hết dòng sẽ tự đóng.
- Hộp *Chi tiết đơn* luôn hiển thị đúng: sửa/xóa từ lịch sử cũng tự làm mới hộp nếu
  đang mở.

### Sửa lỗi

- Đơn gộp trước đây không có nút sửa/xóa từng dòng — chỉ xóa cả đơn (phải xóa rồi
  nhập lại). Giờ sửa được ngay tại hộp chi tiết.

## [1.5.0] - 2026-11-04

### Thêm mới

- **Sổ Thu Chi** (mục *4. Sổ Thu Chi*, ngay sau *3. Nhập hàng*): ghi nhanh thu/chi bằng
  loạt nút `[Thu] [Chi]` → nhập số tiền → chọn danh mục → **Ghi**. Bảng lịch sử tháng
  hiện tại (đi theo bộ màu xanh/đỏ) với **tổng kết Thu tháng / Chi tháng / Số dư**; mỗi
  dòng có menu `···` để xóa. Dữ liệu lưu vào `db.ledger` nên **tự động đồng bộ Cloud**,
  có trong bản sao lưu khôi phục cả khi đặt lại. Danh mục Thu: Bán hàng, Bán lẻ, Thu nợ,
  Khác · Danh mục Chi: Nhập hàng, Tiền nhà, Lương, Điện nước, Vận chuyển, Khác.

### Thay đổi

- **"Gần nhất" trong Lịch sử nhập & bán hàng giờ hiện cả ngày** thay vì chỉ các giao
  dịch trong cùng phút gần nhất (trước đây bán xong là các đơn cũ bị ẩn, dễ hiểu lầm là
  mất đơn). Bấm **Tất cả** hoặc lọc theo tháng vẫn xem được toàn bộ.

## [1.4.8] - 2026-11-04

### Thay đổi

- **Cột thao tác (sửa/xóa) chuyển thành menu `···`** trong toàn bộ các bảng có nút
  thao tác theo dòng: *Tồn kho*, *Lịch sử nhập hàng & bán hàng* (giao dịch lẻ và đơn
  gộp), *Tờ ghi nhập hàng* (danh sách chờ nhập), *Tờ ghi bán lẻ* và *Tờ ghi đơn thuốc
  chén*. Menu dùng `position: fixed` nên không bị cắt bởi vùng cuộn ngang của bảng,
  tự căn theo nút `···` (căn phải, tự lật lên trên khi gần đáy màn hình); đóng khi
  bấm ra ngoài, nhấn **Esc**, cuộn trang hoặc đổi kích thước cửa sổ. Mỗi mục xóa tô
  màu đỏ; điều hướng bàn phím và ARIA (`aria-haspopup="menu"`, `role=menu/menuitem`).
  Hành vi sửa/xóa giữ nguyên.
- **Ẩn dấu mũi tên (spinner) của mọi ô nhập `type="number"`** trên desktop
  (Chrome/Edge/Firefox); trên mobile vẫn nhập số qua bàn phím như cũ.

## [1.4.7] - 2026-11-04

### Thay đổi

- **Giá 1 thang nằm ngay trong tờ ghi đơn thuốc chén**: ô nhập *Giá 1 thang* được dời
  vào cuối dòng *Tổng 1 thang* (bên phải số gram, dạng số trơn không có chữ `k`), ví dụ
  `Tổng 1 thang · 415 g · [140]`.
- **Khung tính tiền gọn lại**: phía dưới chỉ còn `Số thang [10] = Thành tiền 1.400`;
  bỏ cụm `× Giá 1 thang` vì giá đã nhập ngay trên tờ ghi. Thành tiền vẫn là
  *Số thang × Giá 1 thang* và cập nhật ngay khi thay đổi.

## [1.4.6] - 2026-11-04

### Thay đổi

- **Nhấn Enter là đưa vị thuốc vào tờ ghi** (mục *1. Đơn bán lẻ* và *2. Đơn thuốc chén*):
  khi đang nhập dòng (ô *SL (kg)* / *Thành tiền*, hoặc ô *Số gram*), nhấn **Enter** sẽ
  đưa thẳng vị thuốc vào tờ ghi bên dưới (giống nút `+`), tờ ghi tự cập nhật và focus
  quay về ô tìm vị thuốc để nhập tiếp. Trước đây Enter chỉ đưa focus về ô chọn vị thuốc,
  vị thuốc chỉ hiện vào tờ ghi khi bạn chọn vị thuốc tiếp theo. Nếu SL/gram = 0 hoặc
  trống, app báo và focus lại ô cần nhập, không thêm dòng rác. Thêm dòng hint nhắc nhấn
  Enter ở cả hai mục.

## [1.4.5] - 2026-11-04

### Sửa lỗi

- **Xóa đơn nhập gộp**: nút thùng rác ở dòng *Đơn nhập ngày …* trong *Lịch sử nhập hàng*
  trước đây **cộng thêm** số lượng vào tồn kho của từng vị thuốc (đúng với đơn bán), làm
  tồn kho tăng ảo sau khi xóa. Nay xóa đơn nhập sẽ **trừ** lại số lượng đã nhập, xóa đơn
  bán vẫn cộng lại tồn như cũ (giống xóa từng dòng giao dịch lẻ).
- Logic giá giữ nguyên theo đúng sổ sách: mỗi giao dịch lưu đơn giá tại thời điểm
  nhập/bán; giá vốn đơn bán tính theo giá vốn lúc bán ra.

## [1.4.4] - 2026-11-04

### Sửa lỗi

- **Căn cột tiền trong tờ ghi**: ô *Đơn giá* và *Thành tiền* của từng dòng trong hộp chi
  tiết đơn nhập và trong *Tờ ghi nhập hàng* (danh sách chờ nhập) giờ căn phải, thẳng cột
  với tiêu đề và dòng *Tổng cộng / Tổng tiền* ở cuối bảng (trước đây các ô này căn trái
  nên tiền bị lệch cột so với tiêu đề và số tổng).
- **Lịch sử nhập & bán hàng**: cột *Đơn giá* và *Thành tiền* (cả tiêu đề lẫn số liệu)
  căn phải trên màn hình rộng để các cột tiền thẳng hàng; trên điện thoại giữ nguyên
  dạng thẻ như cũ.

## [1.4.3] - 2026-11-04

### Thay đổi

- **Nhãn tiền**: bỏ `(k)` trong tiêu đề cột và tổng tiền, đồng bộ hiển thị.

## [1.4.2] - 2026-11-04

### Thay đổi

- **Đơn vị tiền**: bỏ hàng nghìn, hiển thị theo nghìn VND (ví dụ `69.457`).

## [1.4.1] - 2026-11-04

### Thay đổi

- **Đơn vị tiền**: bỏ đơn vị `tr` (triệu) và `k` (nghìn); hiển thị tiền đầy đủ bằng VND,
  làm tròn đến hàng nghìn, phân cách nghìn bằng dấu `.` (ví dụ `69.457.000`).

## [1.4.0] - 2026-11-04

Bản cập nhật đồng bộ cách hiển thị lịch sử nhập hàng với lịch sử bán hàng, chuẩn hoá
định dạng ngày kiểu Việt Nam và hiển thị số liệu chính xác, không làm tròn.

### Thay đổi

- **Lịch sử nhập hàng dạng bảng**: bỏ giao diện chọn "lần nhập" và tờ ghi riêng; lịch
  sử nhập hàng giờ là bảng giống lịch sử bán hàng (*Ngày · Vị thuốc · SL · Đơn giá ·
  Thành tiền · Thao tác*). Nút *Gần nhất* lọc theo ngày **và giờ:phút**, không chỉ ngày.
- **Đơn nhập nhiều vị thuốc**: lần nhập có từ 2 vị trở lên hiện thành một dòng đơn có
  tên *Đơn nhập ngày dd/mm/yyyy · HH:MM*; bấm vào tên để mở hộp chi tiết như đơn bán.
  Lần nhập chỉ có 1 vị vẫn hiện thành dòng bình thường.
- **Ngày kiểu Việt Nam**: mọi ô chọn ngày/tháng và mọi chỗ hiển thị ngày đều dùng
  `dd/mm/yyyy` hoặc `mm/yyyy`; bấm biểu tượng lịch vẫn mở bộ chọn ngày gốc.
- **Hiển thị số chính xác**: bỏ làm tròn 2 chữ số thập phân; số lượng, đơn giá và thành
  tiền hiển thị đầy đủ chữ số (chỉ dọn nhiễu nhị phân của JavaScript), phân cách nghìn
  bằng dấu `.` và phần thập phân bằng dấu `,`.
- **Lưu thời điểm giao dịch**: mỗi giao dịch mới lưu thêm `ts` (miligiây); dữ liệu cũ
  được suy ra thời điểm từ mã giao dịch để sắp xếp và lọc "Gần nhất" chính xác.

### Sửa lỗi

- Đơn nhập nhiều vị không còn bị tách rời trong lịch sử; xóa cả đơn sẽ điều chỉnh lại
  tồn kho cho tất cả vị thuốc trong đơn.
- Hộp chi tiết đơn nhập hiển thị đúng các cột *SL · Đơn giá · Thành tiền*.

## [1.3.0] - 2026-11-03

Bản cập nhật bảo mật: ứng dụng yêu cầu đăng nhập bằng mật khẩu.

### Thêm mới

- **Đăng nhập bằng mật khẩu**: khi chưa đăng nhập chỉ thấy trang nhập mật khẩu; không
  xem được trang chính, không đọc hay ghi được dữ liệu qua `/sync`. Đăng nhập một lần
  được ghi nhớ 30 ngày trên từng thiết bị.
- **Nút Thoát** ở thanh trên cùng để đăng xuất.
- **Chặn dò mật khẩu**: sai quá 5 lần từ cùng một địa chỉ IP sẽ bị khóa 15 phút.
- Khi phiên đăng nhập hết hạn lúc đang dùng, app báo và tải lại về trang đăng nhập.

### Thay đổi

- Mật khẩu đặt bằng secret `APP_PASSWORD` trên Cloudflare (không nằm trong mã nguồn
  hay trên GitHub). Chưa đặt secret thì ứng dụng bị khóa và hiện hướng dẫn đặt mật khẩu.
- Đổi `APP_PASSWORD` sẽ làm mọi thiết bị đang đăng nhập phải đăng nhập lại.
- Bỏ CORS `*` của API; `robots.txt` chặn toàn bộ; trang gửi `X-Robots-Tag: noindex`.

### Kỹ thuật

- Phiên đăng nhập là cookie `qlk_session` (`HttpOnly`, `SameSite=Strict`, `Secure`) ký
  HMAC-SHA256 từ mật khẩu; so sánh mật khẩu và chữ ký theo thời gian không đổi.
- `POST /login`, `POST /logout` kiểm tra `Origin` cùng nguồn. Đếm số lần sai lưu trong
  KV với khóa `rl:<ip>` (tự xóa sau 15 phút).
- `GET/POST /sync` trả `401` khi chưa đăng nhập.

## [1.2.0] - 2026-11-03

Bản cập nhật tập trung vào độ chính xác của dữ liệu (đối chiếu tồn kho, cảnh báo
giá nhập, chống ghi đè Cloud) và đưa lịch sử nhập hàng, đơn thuốc chén về dạng "tờ ghi".

### Thêm mới

- **Tờ ghi đơn thuốc chén**: ô nhập chỉ còn một dòng (tên vị thuốc, số gram); bấm
  nút `+` để đưa dòng vào tờ ghi. Tờ ghi có các cột *STT · Tên · SL (gram)*, nút
  sửa/xóa từng dòng, 10 dòng mỗi trang, dòng cuối *Tổng 1 thang*. Chọn trùng vị
  thuốc đã có trong tờ ghi sẽ báo và mở sẵn ô sửa gram. Chọn *Đơn có sẵn* sẽ nạp
  toàn bộ vị thuốc vào tờ ghi; dòng đang nhập dở vẫn được tính khi lưu hoặc bán đơn.
- **Lịch sử nhập hàng theo từng lần nhập**: chọn một lần nhập (ngày, số vị, tổng tiền)
  để xem dưới dạng tờ ghi *STT · Tên · SL · Giá/kg* kèm nút sửa/xóa từng dòng, dòng
  *Tổng tiền* của lần nhập đó và phân trang 10 dòng. Có nút *Xóa cả lần nhập*
  (tự điều chỉnh lại tồn kho). Bỏ cột ngày vì ngày đã nằm ở tiêu đề tờ ghi.
- **Cảnh báo giá nhập chênh nhiều**: khi giá nhập mới lệch hơn 50% so với lần nhập
  gần nhất của vị thuốc đó (cao hơn 1,5 lần hoặc thấp hơn một nửa), app hiện hộp
  xác nhận trước khi thêm vào danh sách hoặc lưu nhập. Vị thuốc mới hoặc chưa từng
  nhập thì không cảnh báo.
- **Đối chiếu tồn kho**: nút *Đối chiếu tồn kho* ở mục *Danh sách tồn kho* liệt kê
  các vị thuốc có tồn khác với (tổng nhập − tổng bán) trong lịch sử, kèm nút
  *Dùng số lịch sử* cho từng dòng và *Áp dụng tất cả*.
- **Chống ghi đè Cloud khi dùng nhiều thiết bị**: nếu Cloud đã được lưu từ thiết bị
  khác sau lần bạn mở trang, app hỏi tải bản Cloud về hay giữ bản trên máy và ghi
  đè, thay vì ghi đè âm thầm.
- **Gộp đơn thuốc lẻ cũ**: nút *Gộp đơn thuốc lẻ cũ* ở *Lịch sử bán hàng* (chỉ hiện khi
  có đơn cần gộp) liệt kê các nhóm dòng bán chưa có tên đơn, cùng ngày và cùng đơn
  giá/kg để chọn gộp thành một đơn *Đơn thuốc lẻ*. Nhóm có đơn giá lẻ do chia đều
  được tick sẵn; nhóm đơn giá tròn (có thể là bán lẻ) không tick sẵn.

### Thay đổi

- **Đơn thuốc chén không đặt tên** khi bán sẽ được lưu thành một đơn tên
  *Đơn thuốc lẻ* (trước đây hiện rời từng vị trong lịch sử bán hàng). Ô *Tên đơn* có
  gợi ý "Để trống sẽ ghi là Đơn thuốc lẻ".
- **Mỗi lần bấm Lưu nhập hàng** được lưu thành một lần nhập riêng (có mã `oid`). Các
  lần nhập cũ chưa có mã được gom theo ngày.
- Tờ ghi gọn hơn trên điện thoại (cột thao tác hẹp hơn, số liệu không xuống dòng).

### Sửa lỗi

- Số gram lẻ trong tờ ghi đơn thuốc chén không còn bị làm tròn theo kg
  (ví dụ 15 g từng hiện thành 20 g); nay hiển thị đúng số gram đã nhập.

### Kỹ thuật

- `sanitize()` giữ lại `oid` của giao dịch nhập hàng (`NHAP`), không cần `oname`.
- Endpoint `POST /sync` nhận header `X-Base-Updated` (thời điểm cập nhật Cloud mà máy
  đã biết) và `X-Force`; nếu Cloud mới hơn trả `409 {"conflict": true}`. Client cũ
  không gửi header vẫn ghi bình thường.
- Thêm các hàm `impBatches`, `renderImpNote`, `renderRemedyNote`, `nhapPriceOk`,
  `reconcileList`, `mergeCandidates` và biến `cloudBase`.

## [1.1.0] - 2026-11-03

Bản cập nhật tập trung vào trải nghiệm nhập liệu nhanh và cách hiển thị đơn hàng
gọn gàng theo dạng "tờ ghi".

### Thêm mới

- **Sao chép đơn có sẵn**: nút *Sao chép đơn* xuất hiện khi đang chọn một đơn
  trong mục *Đơn có sẵn*. Bấm nút sẽ hỏi tên đơn mới (mặc định
  `"<tên đơn> (bản sao)"`), sao chép đúng nội dung đang hiển thị trên màn hình
  (kể cả phần vừa sửa nhưng chưa lưu), lưu thành đơn mới và tự chọn đơn đó.
  Có kiểm tra trùng tên và báo lỗi khi đơn chưa có vị thuốc.
- **Hộp thoại Chi tiết đơn** trong *Lịch sử bán hàng*: bấm vào tên đơn để xem
  danh sách vị thuốc của đơn đó, giống cách xem đơn có sẵn ở mục *Đơn thuốc chén*.
- **Đơn bán lẻ nhiều vị**: đơn bán lẻ có hơn 1 vị khi lưu sẽ được gom thành một
  đơn tên *Bán lẻ* (kèm số vị) trong lịch sử bán hàng; bấm vào tên xem được chi tiết.
  Đơn chỉ có 1 vị vẫn hiển thị như một dòng giao dịch bình thường.
- **Tờ ghi nhập hàng**: danh sách chờ nhập có các cột *STT · Tên · SL · Giá nhập*,
  dòng *Tổng tiền* và nút xóa từng dòng.
- **Phân trang** cho chi tiết đơn (10 dòng/trang) với nút *Trước / số trang / Sau*.

### Thay đổi

- **Chi tiết đơn thuốc chén** hiển thị gọn theo dạng tờ ghi:
  - Bảng chỉ còn *STT · Tên · SL (gram)*, 10 dòng mỗi trang.
  - Dòng cuối: *Tổng 1 thang* kèm tổng số gram của một thang.
  - Khối thông số: **Số thang × Giá 1 thang = Thành tiền**.
- **Mục Nhập hàng**:
  - Bỏ ô *Ngày* (khi lưu tự dùng ngày hôm nay).
  - Ba ô *Vị thuốc · Số lượng (kg) · Giá nhập (k/kg)* nằm trên một hàng ngang,
    kể cả trên điện thoại.
  - Nhấn **Enter** sau khi nhập số lượng/giá sẽ thêm dòng vào tờ ghi, xóa trắng ô
    nhập và quay về ô *Vị thuốc*; danh sách gợi ý không tự bung ra.
  - Chọn gợi ý xong tự chuyển focus sang ô *Số lượng*.
- **Ô chọn vị thuốc** (Đơn bán lẻ, Đơn thuốc chén, Nhập hàng, Tìm tồn kho): không
  còn tự hiện toàn bộ danh sách khi bấm/focus; chỉ hiện gợi ý khi bắt đầu gõ chữ.
- **Placeholder** các ô chọn vị thuốc đổi thành *"Nhập tên vị thuốc..."*
  (ô lọc tồn kho: *"Nhập tên vị thuốc để lọc..."*).

### Sửa lỗi

- Cột *Đơn giá* trong chi tiết đơn thuốc chén hiển thị sai đơn vị (k/kg trong khi
  SL là lạng/g). Đã bỏ cột này và thay bằng khối thông số thang/giá chính xác.
- Giao dịch đơn thuốc chén trước đây không lưu thông tin thang/giá nên không thể
  hiển thị lại chính xác; nay mỗi giao dịch lưu thêm `rx`, `g`, `thang`, `unitPrice`.
- Đơn cũ thiếu metadata vẫn xem được đúng nhờ fallback theo đơn có sẵn cùng tên
  (`presetByName`), giá 1 thang suy ra từ tổng tiền thực tế chia số thang.

### Kỹ thuật

- `sanitize()` giữ lại các trường `retail`, `rx`, `g`, `thang`, `unitPrice`
  khi đọc/ghi dữ liệu và đồng bộ Cloud.
- Bổ sung CSS `.nhap-row`, `.linkbtn`; dùng lại kiểu `.note` cho các tờ ghi.
- Không phát sinh lỗi console khi render và thao tác trên trình duyệt.

## [1.0.0] - 2026-11-03

Phiên bản đầu tiên.

### Tính năng

- Quản lý kho dược liệu: danh mục vị thuốc, tồn kho, giá nhập gần nhất.
- Nhập hàng, bán lẻ, đơn thuốc chén (đơn có sẵn) và lịch sử bán hàng.
- Biểu đồ nhập/bán theo tháng, thống kê doanh thu và giá vốn.
- Sao lưu/khôi phục dữ liệu, đồng bộ lên Cloud (KV).
- Giao diện SSR tối ưu PageSpeed: CSS nhúng, SVG sprite, không phụ thuộc CDN.
