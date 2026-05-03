import { Link, Outlet } from "react-router-dom";

export function StaffLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h2>KACoffee Nhân viên</h2>
        <nav>
          <Link to="/staff">Đơn đang xử lý</Link>
          <Link to="/staff/orders/new">Tạo đơn tại quầy</Link>
          <Link to="/staff/bottle-exchanges">Đổi vỏ chai</Link>
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
