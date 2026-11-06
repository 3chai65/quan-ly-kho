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

## code-review-graph
Repo này được index bởi **code-review-graph** (MCP). Khi khám phá/sửa code,
ưu tiên hỏi graph trước khi đọc cả file:

- `get_minimal_context_tool(task=...)` trước mọi việc.
- `query_graph_tool` (callers_of, callees_of, tests_for, ...) để tìm phạm vi.
- `detect_changes_tool` để review thay đổi với risk score.
- Dùng `detail_level="minimal"` khi được; ngân sách ~5 tool call/tác vụ.

Vùng nhạy cảm — sửa xong phải chạy test: logic tiền, tồn kho, đồng bộ
(`sanitize`, `validateState`, `allocateRemedyAmounts`, `pushState`/`pullState`).
