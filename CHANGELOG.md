# Changelog

Mọi thay đổi đáng chú ý của dự án **Quản Lý Kho** được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/) và
tuân theo [Semantic Versioning](https://semver.org/lang/vi/).

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
