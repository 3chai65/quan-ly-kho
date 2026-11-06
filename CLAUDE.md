# Quản Lý Kho — bản local (Docker + SQLite)

Repo này là **bản chạy local** của app Quản Lý Kho: server Node (Express +
better-sqlite3) chạy trong Docker, dữ liệu là file SQLite trên ổ cứng. Xem
`README-LOCAL.md` để chạy và `CHANGELOG.md` cho lịch sử thay đổi.

## Kiến trúc
- `server.js` — Express + better-sqlite3, thay Cloudflare Worker. Giữ hợp đồng
  API `GET/PUT /api/state`. Tự động backup mỗi ngày (`VACUUM INTO`).
- `src/page.js` — toàn bộ HTML + CSS + JS client (nhúng inline).
- `migrations/` — schema SQLite.
- `worker.js`, `wrangler.toml` — bản Cloudflare cũ, giữ làm tham chiếu.
- `tests/worker.test.mjs` — test hồi quy (`node --test "tests/**/*.test.mjs"`).

## Vùng nhạy cảm
Sửa xong phải chạy test: logic tiền, tồn kho, đồng bộ
(`sanitize`, `validateState`, `allocateRemedyAmounts`, `pushState`/`pullState`).
