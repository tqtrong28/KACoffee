import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { StatePanel } from "../components/common/StatePanel";
import { useAuthStore } from "../features/auth/authStore";
import { AdminLayout } from "../layouts/AdminLayout";
import { CustomerLayout } from "../layouts/CustomerLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { ShipperLayout } from "../layouts/ShipperLayout";
import { StaffLayout } from "../layouts/StaffLayout";
import { fetchMe } from "../services/authApi";

const BottleExchangesPage = lazy(() =>
  import("../pages/admin/BottleExchangesPage").then((module) => ({ default: module.BottleExchangesPage })),
);
const BranchesPage = lazy(() => import("../pages/admin/BranchesPage").then((module) => ({ default: module.BranchesPage })));
const DashboardPage = lazy(() => import("../pages/admin/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const AdminDeliveriesPage = lazy(() =>
  import("../pages/admin/DeliveriesPage").then((module) => ({ default: module.DeliveriesPage })),
);
const CategoriesPage = lazy(() =>
  import("../pages/admin/CategoriesPage").then((module) => ({ default: module.CategoriesPage })),
);
const DiscountsPage = lazy(() => import("../pages/admin/DiscountsPage").then((module) => ({ default: module.DiscountsPage })));
const EmployeesPage = lazy(() => import("../pages/admin/EmployeesPage").then((module) => ({ default: module.EmployeesPage })));
const ProductsPage = lazy(() => import("../pages/admin/ProductsPage").then((module) => ({ default: module.ProductsPage })));
const OrdersPage = lazy(() => import("../pages/admin/OrdersPage").then((module) => ({ default: module.OrdersPage })));
const SystemSettingsPage = lazy(() =>
  import("../pages/admin/SystemSettingsPage").then((module) => ({ default: module.SystemSettingsPage })),
);
const TargetsPage = lazy(() => import("../pages/admin/TargetsPage").then((module) => ({ default: module.TargetsPage })));
const AdminLoginPage = lazy(() => import("../pages/admin/AdminLoginPage").then((module) => ({ default: module.AdminLoginPage })));
const AuditLogsPage = lazy(() => import("../pages/admin/AuditLogsPage").then((module) => ({ default: module.AuditLogsPage })));
const CartPage = lazy(() => import("../pages/customer/CartPage").then((module) => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import("../pages/customer/CheckoutPage").then((module) => ({ default: module.CheckoutPage })));
const LoginPage = lazy(() => import("../pages/customer/LoginPage").then((module) => ({ default: module.LoginPage })));
const MembershipPage = lazy(() =>
  import("../pages/customer/MembershipPage").then((module) => ({ default: module.MembershipPage })),
);
const OrderDetailPage = lazy(() =>
  import("../pages/customer/OrderDetailPage").then((module) => ({ default: module.OrderDetailPage })),
);
const OrderHistoryPage = lazy(() =>
  import("../pages/customer/OrderHistoryPage").then((module) => ({ default: module.OrderHistoryPage })),
);
const ProfilePage = lazy(() => import("../pages/customer/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const RegisterPage = lazy(() => import("../pages/customer/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const AboutPage = lazy(() => import("../pages/public/AboutPage").then((module) => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import("../pages/public/ContactPage").then((module) => ({ default: module.ContactPage })));
const HomePage = lazy(() => import("../pages/public/HomePage").then((module) => ({ default: module.HomePage })));
const MenuPage = lazy(() => import("../pages/public/MenuPage").then((module) => ({ default: module.MenuPage })));
const PromotionsPage = lazy(() =>
  import("../pages/public/PromotionsPage").then((module) => ({ default: module.PromotionsPage })),
);
const ShipperDeliveriesPage = lazy(() =>
  import("../pages/shipper/DeliveriesPage").then((module) => ({ default: module.DeliveriesPage })),
);
const ShipperLoginPage = lazy(() =>
  import("../pages/shipper/ShipperLoginPage").then((module) => ({ default: module.ShipperLoginPage })),
);
const BottleExchangePage = lazy(() =>
  import("../pages/staff/BottleExchangePage").then((module) => ({ default: module.BottleExchangePage })),
);
const InStoreOrderPage = lazy(() =>
  import("../pages/staff/InStoreOrderPage").then((module) => ({ default: module.InStoreOrderPage })),
);
const OrderStatusPage = lazy(() => import("../pages/staff/OrderStatusPage").then((module) => ({ default: module.OrderStatusPage })));
const StaffLoginPage = lazy(() => import("../pages/staff/StaffLoginPage").then((module) => ({ default: module.StaffLoginPage })));

function RouteFallback() {
  return (
    <div className="route-loading-shell">
      <StatePanel
        title="Đang mở trang"
        message="KACoffee đang chuẩn bị giao diện tiếp theo để bạn tiếp tục thao tác thật mượt."
        tone="loading"
      />
    </div>
  );
}

function AuthBootstrap() {
  const session = useAuthStore((state) => state.session);
  const setMe = useAuthStore((state) => state.setMe);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!session) return;
    fetchMe().then(setMe).catch(logout);
  }, [session, setMe, logout]);

  return null;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route element={<ProtectedRoute actorType="customer" />}>
              <Route path="/checkout" element={<CheckoutPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute actorType="customer" />}>
            <Route element={<CustomerLayout />}>
              <Route path="/account" element={<ProfilePage />} />
              <Route path="/account/membership" element={<MembershipPage />} />
              <Route path="/account/orders" element={<OrderHistoryPage />} />
              <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
            </Route>
          </Route>

          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route element={<ProtectedRoute actorType="employee" roles={["employee", "manager", "admin"]} redirectTo="/staff/login" />}>
            <Route element={<StaffLayout />}>
              <Route path="/staff" element={<OrderStatusPage />} />
              <Route path="/staff/orders/new" element={<InStoreOrderPage />} />
              <Route path="/staff/bottle-exchanges" element={<BottleExchangePage />} />
            </Route>
          </Route>

          <Route path="/shipper/login" element={<ShipperLoginPage />} />
          <Route element={<ProtectedRoute actorType="employee" roles={["shipper"]} redirectTo="/shipper/login" />}>
            <Route element={<ShipperLayout />}>
              <Route path="/shipper" element={<ShipperDeliveriesPage />} />
            </Route>
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<ProtectedRoute actorType="employee" roles={["admin", "manager"]} redirectTo="/admin/login" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/employees" element={<EmployeesPage />} />
              <Route path="/admin/orders" element={<OrdersPage />} />
              <Route path="/admin/deliveries" element={<AdminDeliveriesPage />} />
              <Route path="/admin/activity" element={<AuditLogsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute actorType="employee" roles={["admin"]} redirectTo="/admin/login" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/branches" element={<BranchesPage />} />
              <Route path="/admin/system-settings" element={<SystemSettingsPage />} />
              <Route path="/admin/targets" element={<TargetsPage />} />
              <Route path="/admin/categories" element={<CategoriesPage />} />
              <Route path="/admin/products" element={<ProductsPage />} />
              <Route path="/admin/discounts" element={<DiscountsPage />} />
              <Route path="/admin/bottle-exchanges" element={<BottleExchangesPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
