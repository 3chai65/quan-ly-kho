# Quản Lý Kho — bản local (Docker + SQLite)

Repo này là **bản chạy local** của app Quản Lý Kho: server Node (Express +
better-sqlite3) chạy trong Docker, dữ liệu là file SQLite trên ổ cứng. Xem
`README-LOCAL.md` để chạy và `CHANGELOG.md` cho lịch sử thay đổi.

## Kiến trúc
- `server.js` — Express + better-sqlite3, thay Cloudflare Worker. Giữ hợp đồng
  API `GET/PUT /api/state`. Tự động backup mỗi ngày (`VACUUM INTO`).
- `src/page.js` — toàn bộ HTML + CSS + JS client (nhúng inline).
- `tests/client.test.mjs` — test logic client (tiền, tồn kho, đồng bộ), chạy trên máy.
- `tests/server.test.mjs` — test `server.js` thật qua HTTP, chạy trong Docker.

## Vùng nhạy cảm
Sửa xong phải chạy test: logic tiền, tồn kho, đồng bộ
(`sanitize`, `validateState`, `allocateRemedyByCost`, `pushState`/`pullState`).
