import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { StatePanel } from "../../components/common/StatePanel";
import { useAuthStore } from "../../features/auth/authStore";
import {
  fetchAdminDashboard,
  fetchBranchTargetProgressReport,
  fetchDeliveryPerformanceReport,
  fetchEmployeePerformanceReport,
  fetchRevenueReport,
} from "../../services/adminApi";
import { fetchBranches } from "../../services/catalogApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { downloadCsv } from "../../utils/csv";
import { formatVnd } from "../../utils/format";
import { getDeliveryStatusLabel, getRoleLabel } from "../../utils/labels";

export function DashboardPage() {
  const me = useAuthStore((state) => state.me);
  const isAdmin = me?.role === "admin";
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const dashboardQuery = useQuery({ queryKey: ["admin-dashboard", branchId], queryFn: () => fetchAdminDashboard(branchId) });
  const revenueQuery = useQuery({ queryKey: ["revenue-report", branchId], queryFn: () => fetchRevenueReport(branchId) });
  const deliveryQuery = useQuery({
    queryKey: ["delivery-performance-report", branchId],
    queryFn: () => fetchDeliveryPerformanceReport(branchId),
  });
  const employeePerformanceQuery = useQuery({
    queryKey: ["employee-performance-report", branchId],
    queryFn: () => fetchEmployeePerformanceReport(branchId),
  });
  const branchTargetQuery = useQuery({
    queryKey: ["branch-target-progress-report", branchId],
    queryFn: () => fetchBranchTargetProgressReport(branchId),
  });
  const branches = branchesQuery.data ?? [];
  const data = dashboardQuery.data;
  const report = revenueQuery.data ?? [];
  const deliveryReport = deliveryQuery.data ?? [];
  const employeePerformance = employeePerformanceQuery.data ?? [];
  const branchTargetProgress = branchTargetQuery.data ?? [];
  const isLoading =
    dashboardQuery.isLoading ||
    revenueQuery.isLoading ||
    deliveryQuery.isLoading ||
    employeePerformanceQuery.isLoading ||
    branchTargetQuery.isLoading;
  const error =
    dashboardQuery.error ||
    revenueQuery.error ||
    deliveryQuery.error ||
    employeePerformanceQuery.error ||
    branchTargetQuery.error;

  return (
    <section>
      <div className="section-heading compact">
        <p className="eyebrow">Dashboard vận hành</p>
        <h1>{isAdmin ? "Tổng quan toàn hệ thống" : `Tổng quan của ${me?.branch_name ?? "chi nhánh hiện tại"}`}</h1>
        <p className="product-hint">
          Theo dõi nhanh doanh thu, vận hành giao hàng và tiến độ chỉ tiêu để đội ngũ xử lý quyết định trong ngày.
        </p>
      </div>
      <div className="card dashboard-filter-card">
        {isAdmin ? (
          <label className="form-stack">
            <span>Phạm vi xem báo cáo</span>
            <select value={branchId ?? ""} onChange={(event) => setBranchId(event.target.value ? Number(event.target.value) : undefined)}>
              <option value="">Tất cả chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p>
            Tổng quan của chi nhánh <strong>{me?.branch_name ?? "hiện tại"}</strong>
          </p>
        )}
      </div>
      {isLoading ? (
        <StatePanel
          title="Đang tải dashboard"
          message="KACoffee đang gom số liệu vận hành, doanh thu và chỉ tiêu để hiển thị thật đầy đủ."
          tone="loading"
        />
      ) : null}
      {!isLoading && error ? (
        <StatePanel
          title="Không thể tải dashboard lúc này"
          message={getApiErrorMessage(error, "Có lỗi khi tải báo cáo vận hành. Vui lòng thử lại sau ít phút.")}
          tone="error"
        />
      ) : null}
      {!isLoading && !error ? (
        <>
          <div className="stats-grid">
            <div className="card dashboard-metric-card">
              <h2>Tổng đơn hàng</h2>
              <p className="metric-value">{data?.total_orders ?? 0}</p>
            </div>
            <div className="card dashboard-metric-card">
              <h2>Đơn hoàn tất</h2>
              <p className="metric-value">{data?.completed_orders ?? 0}</p>
            </div>
            <div className="card dashboard-metric-card">
              <h2>Doanh thu</h2>
              <p className="metric-value">{formatVnd(data?.revenue_vnd ?? 0)}</p>
            </div>
            {isAdmin ? (
              <div className="card dashboard-metric-card">
                <h2>Sản phẩm</h2>
                <p className="metric-value">{data?.total_products ?? 0}</p>
              </div>
            ) : null}
            {isAdmin ? (
              <div className="card dashboard-metric-card">
                <h2>Khách hàng</h2>
                <p className="metric-value">{data?.total_customers ?? 0}</p>
              </div>
            ) : null}
            <div className="card dashboard-metric-card">
              <h2>Đang chuẩn bị / Sẵn sàng / Đã hủy</h2>
              <p className="metric-value compact">
                {data?.preparing_orders ?? 0} / {data?.ready_orders ?? 0} / {data?.cancelled_orders ?? 0}
              </p>
            </div>
          </div>
          <div className="card dashboard-report-card">
            <div className="section-heading compact">
              <h2>Báo cáo doanh thu</h2>
              <button
                className="button secondary"
                onClick={() =>
                  downloadCsv(
                    "kacoffee-revenue-report.csv",
                    report.map((row) => ({
                      report_date: row.report_date,
                      completed_orders: row.completed_orders,
                      revenue_vnd: row.revenue_vnd,
                    })),
                  )
                }
                type="button"
              >
                Xuất CSV
              </button>
            </div>
            {report.length ? (
              <ul className="stack-list report-list">
                {report.map((row) => (
                  <li key={row.report_date} className="product-card admin-record-card">
                    <div className="product-details">
                      <div className="record-header">
                        <h3>{row.report_date}</h3>
                        <span className="badge">{row.completed_orders} đơn hoàn tất</span>
                      </div>
                    </div>
                    <div className="record-total-block">
                      <span className="product-hint">Doanh thu</span>
                      <strong>{formatVnd(row.revenue_vnd)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <StatePanel
                title="Chưa có dữ liệu doanh thu"
                message="Báo cáo doanh thu sẽ hiện ngay khi hệ thống có đơn hoàn tất trong phạm vi bạn đang xem."
              />
            )}
          </div>
          <div className="card dashboard-report-card">
            <div className="section-heading compact">
              <h2>Hiệu suất giao hàng</h2>
              <p className="product-hint">Xem nhanh trạng thái phân phối đơn để điều phối shipper kịp thời.</p>
            </div>
            {deliveryReport.length ? (
              <ul className="stack-list report-list">
                {deliveryReport.map((row) => (
                  <li key={row.status} className="product-card admin-record-card">
                    <div className="product-details">
                      <div className="record-header">
                        <h3>{getDeliveryStatusLabel(row.status)}</h3>
                        <span className="badge">{row.deliveries} lượt</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <StatePanel
                title="Chưa có dữ liệu giao hàng"
                message="Khi các đơn delivery bắt đầu chạy, dashboard sẽ tổng hợp hiệu suất shipper ngay tại đây."
              />
            )}
          </div>
          <div className="card dashboard-report-card">
            <div className="section-heading compact">
              <h2>Hiệu suất đội ngũ trong tháng</h2>
              <button
                className="button secondary"
                onClick={() =>
                  downloadCsv(
                    "kacoffee-employee-performance.csv",
                    employeePerformance.map((row) => ({
                      employee_name: row.employee_name,
                      role: getRoleLabel(row.role_code),
                      branch_name: row.branch_name,
                      actual_orders: row.actual_orders,
                      target_orders: row.monthly_order_target,
                      actual_revenue_vnd: row.actual_revenue_vnd,
                      target_revenue_vnd: row.monthly_revenue_target_vnd,
                      actual_deliveries: row.actual_deliveries,
                      target_deliveries: row.monthly_delivery_target,
                      estimated_commission_vnd: row.estimated_commission_vnd,
                    })),
                  )
                }
                type="button"
              >
                Xuất CSV
              </button>
            </div>
            {employeePerformance.length ? (
              <ul className="stack-list report-list">
                {employeePerformance.map((row) => (
                  <li key={row.employee_id} className="product-card admin-record-card">
                    <div className="product-details">
                      <div className="record-header">
                        <h3>{row.employee_name}</h3>
                        <span className={`badge ${row.met_target ? "accent" : ""}`}>{row.met_target ? "Đạt chỉ tiêu" : "Đang theo dõi"}</span>
                      </div>
                      <div className="record-meta">
                        <span>{getRoleLabel(row.role_code)}</span>
                        <span>{row.branch_name}</span>
                        <span>Đơn {row.actual_orders}/{row.monthly_order_target}</span>
                        <span>Giao hàng {row.actual_deliveries}/{row.monthly_delivery_target}</span>
                      </div>
                      <p className="product-hint">
                        Doanh thu {formatVnd(row.actual_revenue_vnd)}/{formatVnd(row.monthly_revenue_target_vnd)}
                      </p>
                    </div>
                    <div className="record-total-block">
                      <span className="product-hint">Hoa hồng ước tính</span>
                      <strong>{formatVnd(row.estimated_commission_vnd)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <StatePanel
                title="Chưa có dữ liệu hiệu suất nhân sự"
                message="Khi đội ngũ bắt đầu có doanh thu hoặc đơn hoàn tất trong tháng, hệ thống sẽ tổng hợp tại đây."
              />
            )}
          </div>
          <div className="card dashboard-report-card">
            <div className="section-heading compact">
              <h2>Tiến độ chỉ tiêu chi nhánh</h2>
              <button
                className="button secondary"
                onClick={() =>
                  downloadCsv(
                    "kacoffee-branch-progress.csv",
                    branchTargetProgress.map((row) => ({
                      branch_name: row.branch_name,
                      actual_orders: row.actual_orders,
                      target_orders: row.monthly_order_target,
                      actual_revenue_vnd: row.actual_revenue_vnd,
                      target_revenue_vnd: row.monthly_revenue_target_vnd,
                      estimated_bonus_vnd: row.estimated_bonus_vnd,
                    })),
                  )
                }
                type="button"
              >
                Xuất CSV
              </button>
            </div>
            {branchTargetProgress.length ? (
              <ul className="stack-list report-list">
                {branchTargetProgress.map((row) => (
                  <li key={row.branch_id} className="product-card admin-record-card">
                    <div className="product-details">
                      <div className="record-header">
                        <h3>{row.branch_name}</h3>
                        <span className={`badge ${row.met_target ? "accent" : ""}`}>{row.met_target ? "Đạt chỉ tiêu" : "Đang theo dõi"}</span>
                      </div>
                      <div className="record-meta">
                        <span>Đơn {row.actual_orders}/{row.monthly_order_target}</span>
                        <span>Doanh thu {formatVnd(row.actual_revenue_vnd)}/{formatVnd(row.monthly_revenue_target_vnd)}</span>
                      </div>
                    </div>
                    <div className="record-total-block">
                      <span className="product-hint">Thưởng dự kiến</span>
                      <strong>{formatVnd(row.estimated_bonus_vnd)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <StatePanel
                title="Chưa có dữ liệu chỉ tiêu chi nhánh"
                message="Báo cáo tiến độ sẽ xuất hiện khi các chi nhánh bắt đầu phát sinh doanh thu hoặc đơn trong tháng."
              />
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
