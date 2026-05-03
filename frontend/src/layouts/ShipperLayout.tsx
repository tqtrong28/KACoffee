import { Link, Outlet } from "react-router-dom";

export function ShipperLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h2>KACoffee Giao hàng</h2>
        <nav>
          <Link to="/shipper">Đơn được giao</Link>
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
