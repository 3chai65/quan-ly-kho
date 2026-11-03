# Changelog

Mọi thay đổi đáng chú ý của dự án **Quản Lý Kho** được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/) và
tuân theo [Semantic Versioning](https://semver.org/lang/vi/).

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
