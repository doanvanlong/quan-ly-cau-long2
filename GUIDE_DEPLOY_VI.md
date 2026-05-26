# Hướng Dẫn Tải Lên GitHub & Kết Nối Vercel, Tên Miền (Domain)

Tài liệu này hướng dẫn chi tiết các bước để đẩy mã nguồn lên GitHub, triển khai (deploy) website tự động lên Vercel và kết nối tên miền riêng của bạn.

---

## Bước 1: Xuất Mã Nguồn & Upload Lên GitHub

Vì môi trường AI Studio chạy trong container khép kín, cách tốt nhất để đồng bộ hệ thống là sử dụng tính năng xuất mã nguồn trực tiếp từ giao diện AI Studio:

1. **Xuất Repo từ AI Studio**:
   - Nhấp vào biểu tượng **Settings (Cấu hình)** ở góc trái hoặc góc phải dưới bảng giao diện điều khiển AI Studio.
   - Chọn mục **Export to GitHub** (Xuất bản lên GitHub) hoặc **Download ZIP** (Tải về mã nguồn dưới dạng nén).
   - Nếu chọn **Export to GitHub**: Cấp quyền liên kết tài khoản GitHub của bạn, điền tên Repository mới và hệ thống sẽ tự động tạo một dự án GitHub chứa toàn bộ mã nguồn này.
   - Nếu chọn **Download ZIP**: Giải nén thư mục trên máy tính, mở terminal/git bash tại thư mục đó và chạy các lệnh Git sau:
     ```bash
     git init
     git add .
     git commit -m "Initialize V-Badminton Pro Tournament"
     # Tạo Repo mới trên website Github, sao chép URL và chạy:
     git remote add origin <URL_REPO_CỦA_BẠN>
     git branch -M main
     git push -u origin main
     ```

---

## Bước 2: Tự Động Kết Nối & Deploy Lên Vercel

Vercel là nền tảng tối ưu nhất để host ứng dụng React + Vite thế hệ mới:

1. **Đăng nhập Vercel**: Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub của bạn.
2. **Import Dự án**:
   - Nhấp vào nút **Add New** -> chọn **Project**.
   - Tìm kiếm tên Repository GitHub vừa tạo ở Bước 1 và nhấp **Import**.
3. **Cấu hình Dự án (Vite/Tailwind v4)**:
   - Vercel sẽ tự động phát hiện đây là dự án **Vite**. Các thông số *Build Command* (`npm run build`) và *Output Directory* (`dist`) đã được định hình tự động, bạn không cần thay đổi gì cả.
4. **Nhấn Deploy**: Chờ khoảng 1-2 phút, dự án của bạn sẽ trực tuyến với tên miền con mặc định miễn phí dạng `.vercel.app`.

---

## Bước 3: Kết Nối Tên Miền Riêng (Custom Domain) Lên Vercel

Sau khi website đã trực tuyến trên Vercel, bạn có thể liên kết tên miền thương mại riêng (ví dụ: `giai-cau-long.vn`):

1. **Thêm tên miền trên Vercel**:
   - Trong dashboard của dự án trên Vercel, chuyển sang tab **Settings** -> chọn mục **Domains** ở thanh menu dọc bên trái.
   - Nhập tên miền riêng của bạn vào hộp thoại (ví dụ: `www.tenmiencuaban.com` hoặc `tenmiencuaban.com`) rồi bấm **Add**.
2. **Cấu hình DNS tại nhà đăng ký tên miền (iNET, Tenten, Mắt Bão, Godaddy, v.v.)**:
   - Vercel sẽ hiển thị chi tiết các bản ghi DNS cần cấu hình. Truy cập trang quản trị DNS của nhà đăng ký tên miền của bạn và thêm các bản ghi sau:
     - **Nếu sử dụng tên miền chính (Apex Domain - ví dụ: `tenmiencuaban.com`)**:
       - Loại bản ghi (Type): **A**
       - Tên/Ký tự đại diện (Host/Name): `@`
       - Giá trị (Value/IP): `76.76.21.21` (Địa chỉ IP Anycast của Vercel)
     - **Nếu sử dụng tên miền phụ (Subdomain - ví dụ: `www.tenmiencuaban.com` hoặc `vleague.tenmiencuaban.com`)**:
       - Loại bản ghi (Type): **CNAME**
       - Tên (Host/Name): `www` hoặc `vleague`
       - Giá trị (Value/Target): `cname.vercel-dns.com`
3. **Kiểm tra và kích hoạt SSL**:
   - Sau khi cập nhật DNS (có thể mất 1 đến 15 phút để lan truyền mạng toàn cầu), Vercel sẽ tự động xác minh kết nối và khởi tạo chứng chỉ bảo mật HTTPS SSL miễn phí vĩnh viễn cho bạn.
