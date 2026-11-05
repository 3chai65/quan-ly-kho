# Changelog

Mọi thay đổi đáng chú ý của dự án **Quản Lý Kho** được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/) và
tuân theo [Semantic Versioning](https://semver.org/lang/vi/).

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
