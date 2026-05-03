import { useQuery } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";

import { Header } from "../components/common/Header";
import { fetchCustomerNotifications } from "../services/customerApi";

export function CustomerLayout() {
  const { data: notifications = [] } = useQuery({
    queryKey: ["customer-notifications"],
    queryFn: fetchCustomerNotifications,
    staleTime: 30_000,
  });
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <div>
      <Header />
      <main className="container page-shell">
        <div className="subnav">
          <Link to="/account">Hồ sơ</Link>
          <Link to="/account/membership" className="nav-link-with-badge">
            <span>Thành viên</span>
            {unreadCount ? <span className="badge count-badge">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
          </Link>
          <Link to="/account/orders">Đơn hàng</Link>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
