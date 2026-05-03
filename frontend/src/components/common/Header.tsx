import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, useLocation } from "react-router-dom";

import { useAuthStore } from "../../features/auth/authStore";
import { fetchCustomerNotifications } from "../../services/customerApi";

export function Header() {
  const { session, me, logout } = useAuthStore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: notifications = [] } = useQuery({
    queryKey: ["customer-notifications"],
    queryFn: fetchCustomerNotifications,
    enabled: session?.actor_type === "customer",
    staleTime: 30_000,
  });
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, session?.actor_type, me?.role]);

  const publicLinks = [
    { to: "/about", label: "Giới thiệu" },
    { to: "/menu", label: "Thực đơn" },
    { to: "/promotions", label: "Ưu đãi" },
    { to: "/contact", label: "Liên hệ" },
  ];

  const internalLinks = [
    { to: "/staff/login", label: "Nhân viên" },
    { to: "/shipper/login", label: "Giao hàng" },
    { to: "/admin/login", label: "Quản trị" },
  ];

  function renderPublicLinks() {
    return publicLinks.map((link) => (
      <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
        {link.label}
      </NavLink>
    ));
  }

  return (
    <header className="site-header">
      <div className="container nav">
        <Link to="/" className="brand">
          <span className="brand-title">KACoffee</span>
          <span className="brand-subtitle">Coffee house & online ordering</span>
        </Link>
        <nav className="nav-links">{renderPublicLinks()}</nav>
        <div className="nav-actions">
          {session?.actor_type === "customer" ? (
            <>
              <NavLink to="/cart" className={({ isActive }) => `nav-link action-link${isActive ? " active" : ""}`}>
                Giỏ hàng
              </NavLink>
              <NavLink to="/account" className={({ isActive }) => `nav-link-with-badge nav-link action-link${isActive ? " active" : ""}`}>
                <span>Tài khoản</span>
                {unreadCount ? <span className="badge count-badge">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
              </NavLink>
              <button className="link-button" onClick={logout} type="button">
                Đăng xuất
              </button>
            </>
          ) : session?.actor_type === "employee" ? (
            <>
              {me?.role === "shipper" ? (
                <NavLink to="/shipper" className={({ isActive }) => `nav-link action-link${isActive ? " active" : ""}`}>
                  Giao hàng
                </NavLink>
              ) : (
                <NavLink to="/staff" className={({ isActive }) => `nav-link action-link${isActive ? " active" : ""}`}>
                  Nhân viên
                </NavLink>
              )}
              {me?.role && ["admin", "manager"].includes(me.role) ? (
                <NavLink to="/admin" className={({ isActive }) => `nav-link action-link${isActive ? " active" : ""}`}>
                  {me.role === "manager" ? "Quản lý" : "Quản trị"}
                </NavLink>
              ) : null}
              <button className="link-button" onClick={logout} type="button">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/register" className={({ isActive }) => `nav-link action-link${isActive ? " active" : ""}`}>
                Đăng ký
              </NavLink>
              <NavLink to="/login" className={({ isActive }) => `button primary nav-auth-link${isActive ? " active" : ""}`}>
                Đăng nhập
              </NavLink>
              <button className="button tertiary nav-portal-button" onClick={() => setMenuOpen((value) => !value)} type="button">
                Cổng nội bộ
              </button>
            </>
          )}
          {me?.full_name ? <span className="badge identity-badge">{me.full_name}</span> : null}
          <button
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => setMenuOpen((value) => !value)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div className="container header-drawer-shell">
          <div className="header-drawer">
            <section className="drawer-section">
              <p className="eyebrow">Khám phá KACoffee</p>
              <div className="drawer-links">{renderPublicLinks()}</div>
            </section>

            {session?.actor_type === "customer" ? (
              <section className="drawer-section">
                <p className="eyebrow">Tài khoản của bạn</p>
                <div className="drawer-links">
                  <NavLink to="/cart" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                    Giỏ hàng
                  </NavLink>
                  <NavLink to="/account" className={({ isActive }) => `nav-link-with-badge nav-link${isActive ? " active" : ""}`}>
                    <span>Tài khoản</span>
                    {unreadCount ? <span className="badge count-badge">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
                  </NavLink>
                  <button className="link-button drawer-button" onClick={logout} type="button">
                    Đăng xuất
                  </button>
                </div>
              </section>
            ) : null}

            {session?.actor_type === "employee" ? (
              <section className="drawer-section">
                <p className="eyebrow">Công việc hôm nay</p>
                <div className="drawer-links">
                  {me?.role === "shipper" ? (
                    <NavLink to="/shipper" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                      Giao hàng
                    </NavLink>
                  ) : (
                    <NavLink to="/staff" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                      Nhân viên
                    </NavLink>
                  )}
                  {me?.role && ["admin", "manager"].includes(me.role) ? (
                    <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                      {me.role === "manager" ? "Quản lý" : "Quản trị"}
                    </NavLink>
                  ) : null}
                  <button className="link-button drawer-button" onClick={logout} type="button">
                    Đăng xuất
                  </button>
                </div>
              </section>
            ) : null}

            {!session ? (
              <>
                <section className="drawer-section">
                  <p className="eyebrow">Bắt đầu đặt hàng</p>
                  <div className="drawer-links">
                    <NavLink to="/register" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                      Đăng ký thành viên
                    </NavLink>
                    <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                      Đăng nhập khách hàng
                    </NavLink>
                  </div>
                </section>
                <section className="drawer-section">
                  <p className="eyebrow">Cổng nội bộ</p>
                  <div className="drawer-links">
                    {internalLinks.map((link) => (
                      <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
