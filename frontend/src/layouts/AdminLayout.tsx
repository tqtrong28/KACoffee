import { Link, Outlet } from "react-router-dom";

import { useAuthStore } from "../features/auth/authStore";

export function AdminLayout() {
  const me = useAuthStore((state) => state.me);
  const isAdmin = me?.role === "admin";
  const title = isAdmin ? "KACoffee Quản trị" : "KACoffee Quản lý";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h2>{title}</h2>
        {me?.branch_name ? <p className="product-hint">{me.branch_name}</p> : null}
        <nav>
          <Link to="/admin">Tổng quan</Link>
          <Link to="/admin/employees">Nhân sự</Link>
          <Link to="/admin/orders">Đơn hàng</Link>
          <Link to="/admin/deliveries">Giao hàng</Link>
          <Link to="/admin/activity">Nhật ký thao tác</Link>
          {isAdmin ? <Link to="/admin/branches">Chi nhánh</Link> : null}
          {isAdmin ? <Link to="/admin/targets">Chỉ tiêu & hoa hồng</Link> : null}
          {isAdmin ? <Link to="/admin/system-settings">Cấu hình hệ thống</Link> : null}
          {isAdmin ? <Link to="/admin/categories">Danh mục</Link> : null}
          {isAdmin ? <Link to="/admin/products">Sản phẩm</Link> : null}
          {isAdmin ? <Link to="/admin/discounts">Khuyến mãi</Link> : null}
          {isAdmin ? <Link to="/admin/bottle-exchanges">Đổi vỏ chai</Link> : null}
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
