# Quản Lý Kho — bản chạy local (Docker + SQLite)

Bản này thay thế Cloudflare Worker + D1 bằng một server Node nhỏ chạy trong
Docker, lưu dữ liệu vào **file SQLite thật trên ổ cứng**. Dùng chung dữ liệu
giữa máy tính và điện thoại trong cùng mạng WiFi (LAN), không cần internet.

## Yêu cầu
- Docker Desktop đang chạy.
- Máy tính và điện thoại **cùng một mạng WiFi**.

## Chạy
```powershell
cd "G:\Quản Lý Kho-local"
docker compose up -d --build
```

Mở trên máy tính: **http://localhost:8787**

Mở trên điện thoại: **http://<IP-máy-tính>:8787**
- Xem IP máy tính: `ipconfig` → dòng `IPv4 Address` của card WiFi (dạng `192.168.x.x`).

## Dữ liệu nằm ở đâu
- File SQLite: `G:\Quản Lý Kho-local\data\app.db`

## Tự động sao lưu (mỗi ngày)
- Server tự tạo **1 bản backup/ngày** vào `G:\Quản Lý Kho-local\data\backups\`,
  tên `backup-YYYY-MM-DD.db`, giữ **30 bản** gần nhất (bản cũ tự xóa).
- Xem danh sách backup: mở `http://localhost:8787/api/backups`.
- **Khôi phục nhanh:** dừng container, copy file backup đè lên `app.db`, khởi động lại:
  ```powershell
  cd "G:\Quản Lý Kho-local"
  docker compose stop
  Copy-Item "data\backups\backup-2026-11-06.db" "data\app.db" -Force
  Remove-Item "data\app.db-wal","data\app.db-shm" -ErrorAction SilentlyContinue
  docker compose start
  ```
- **Backup offsite:** trỏ `BACKUP_DIR` sang thư mục Google Drive (sửa
  `docker-compose.yml`).
- **Backup thủ công:** nút "Sao lưu" trong app tải file JSON theo trình duyệt
  của từng thiết bị; cách copy `app.db`/`backups` trên mới là backup thật trên PC.

## Nạp dữ liệu từ file backup JSON

Nếu có file `kho-backup-YYYY-MM-DD.json` (xuất từ bản Cloudflare cũ hoặc từ nút
"Sao lưu" trong app), nạp vào DB local như sau:

```powershell
# 1. Tách payload và gửi lên server (giữ đúng UTF-8)
$raw = Get-Content "đường-dẫn\kho-backup-2026-11-06.json" -Raw -Encoding UTF8
$obj = $raw | ConvertFrom-Json
$payload = @{ products = $obj.data.products; transactions = $obj.data.transactions; prescriptions = $obj.data.prescriptions; updatedAt = 0 } | ConvertTo-Json -Depth 20 -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)

$req = [System.Net.HttpWebRequest]::Create("http://localhost:8787/api/state")
$req.Method = "PUT"
$req.ContentType = "application/json; charset=utf-8"
$req.Headers.Add("X-Force", "1")     # ép ghi đè
$req.ContentLength = $bytes.Length
$s = $req.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
(New-Object System.IO.StreamReader($req.GetResponse().GetResponseStream())).ReadToEnd()
```

Hoặc đơn giản hơn: mở app → **Sao lưu & khôi phục → Khôi phục từ file** trên
chính giao diện web.

## Chạy test
```powershell
# Test client (trên máy, chỉ cần Node):
node --test tests/worker.test.mjs

# Test server thật (cần better-sqlite3 → chạy trong container):
docker run --rm -e DATA_DIR=/tmp/qlk quan-ly-kho:latest npm test
# hoặc nếu chưa build: docker build -t quan-ly-kho:latest .  rồi chạy lệnh trên
```

## Dừng / khởi động lại
```powershell
docker compose stop      # dừng (giữ dữ liệu)
docker compose start     # chạy lại
docker compose down      # dừng và xoá container (dữ liệu vẫn còn trong ./data)
docker compose logs -f   # xem log
```

## Ghi chú
- Bản này **không có đăng nhập** — chỉ nên dùng trong mạng nhà.
- Cổng đổi được trong `docker-compose.yml` (mục `ports`, ví dụ `"9000:8787"`).
- Muốn dùng ngoài WiFi sau này: cài Tailscale trên PC + điện thoại rồi mở
  `http://<tên-tailscale-PC>:8787`.
