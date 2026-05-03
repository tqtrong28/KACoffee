import { Outlet } from "react-router-dom";

import { Header } from "../components/common/Header";

export function PublicLayout() {
  return (
    <div>
      <Header />
      <main className="container page-shell">
        <Outlet />
      </main>
    </div>
  );
}
