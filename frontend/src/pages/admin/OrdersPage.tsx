import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { StatePanel } from "../../components/common/StatePanel";
import { useAuthStore } from "../../features/auth/authStore";
import { useToastStore } from "../../features/toast/toastStore";
import { fetchAdminOrders } from "../../services/adminApi";
import { fetchBranches } from "../../services/catalogApi";
import { cancelStaffOrder, updateStaffOrderStatus } from "../../services/staffApi";
import { downloadCsv } from "../../utils/csv";
import { formatDateTime, formatVnd } from "../../utils/format";
import {
  getFulfillmentMethodLabel,
  getOrderSourceLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "../../utils/labels";

export function OrdersPage() {
  const me = useAuthStore((state) => state.me);
  const isAdmin = me?.role === "admin";
  const pushToast = useToastStore((state) => state.pushToast);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const { data: orders = [], refetch } = useQuery({
    queryKey: ["admin-orders", branchId],
    queryFn: () => fetchAdminOrders(branchId),
  });
  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        order.order_no.toLowerCase().includes(normalizedQuery) ||
        (order.branch_name ?? "").toLowerCase().includes(normalizedQuery) ||
        (order.recipient_name ?? "").toLowerCase().includes(normalizedQuery) ||
        (order.recipient_phone ?? "").toLowerCase().includes(normalizedQuery);
      const matchesStatus = !statusFilter || order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: "ready" | "completed" }) =>
      updateStaffOrderStatus(orderId, status),
    onSuccess: async (_, variables) => {
      pushToast(
        variables.status === "ready" ? "Đã cập nhật đơn sang trạng thái sẵn sàng." : "Đã hoàn tất đơn hàng.",
        "success",
      );
      await refetch();
    },
  });
  const cancelMutation = useMutation({
    mutationFn: cancelStaffOrder,
    onSuccess: async () => {
      pushToast("Đã hủy đơn hàng thành công.", "success");
      await refetch();
    },
  });

  return (
    <section className="card">
      <div className="section-heading compact">
        <p className="eyebrow">Đơn hàng vận hành</p>
        <h1>Tra cứu và xử lý đơn hàng nhanh hơn</h1>
        <p className="product-hint">
          {isAdmin ? "Bạn đang xem toàn bộ hệ thống và có thể lọc theo từng chi nhánh." : `Bạn đang thao tác trong phạm vi ${me?.branch_name ?? "chi nhánh hiện tại"}.`}
        </p>
      </div>
      <div className="admin-toolbar">
        {isAdmin ? (
          <select value={branchId ?? ""} onChange={(event) => setBranchId(event.target.value ? Number(event.target.value) : undefined)}>
            <option value="">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="badge">Đang xem đơn của {me?.branch_name ?? "chi nhánh hiện tại"}</div>
        )}
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã đơn, chi nhánh, tên hoặc số điện thoại" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="preparing">Đang chuẩn bị</option>
          <option value="ready">Sẵn sàng</option>
          <option value="completed">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <button
          className="button secondary"
          onClick={() =>
            downloadCsv(
              "kacoffee-orders.csv",
              filteredOrders.map((order) => ({
                order_no: order.order_no,
                branch: order.branch_name,
                status: getOrderStatusLabel(order.status),
                payment_status: getPaymentStatusLabel(order.payment_status),
                fulfillment_method: getFulfillmentMethodLabel(order.fulfillment_method),
                recipient: order.customer_full_name ?? order.recipient_name,
                phone: order.customer_phone ?? order.recipient_phone,
                total_vnd: order.total_vnd,
                created_at: formatDateTime(order.created_at),
              })),
            )
          }
          type="button"
        >
          Xuất CSV
        </button>
      </div>
      <div className="stack-list">
        {filteredOrders.map((order) => (
          <div key={order.id} className="product-card admin-record-card">
            <div className="product-details">
              <div className="record-header">
                <h3>{order.order_no}</h3>
                <span className={`badge status-${order.status === "completed" ? "success" : order.status === "cancelled" ? "muted" : "warning"}`}>
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
              <div className="record-meta">
                <span>{order.branch_name}</span>
                <span>{getOrderSourceLabel(order.source)}</span>
                <span>{getPaymentStatusLabel(order.payment_status)}</span>
                <span>{getFulfillmentMethodLabel(order.fulfillment_method)}</span>
              </div>
              <p>{order.customer_full_name ?? order.recipient_name} · {order.customer_phone ?? order.recipient_phone}</p>
              {order.discount_code_snapshot ? <p>Mã giảm giá: {order.discount_code_snapshot}</p> : null}
              <p className="product-hint">{formatDateTime(order.created_at)}</p>
            </div>
            <div className="stack-list record-actions">
              <div className="record-total-block">
                <span className="product-hint">Tổng đơn</span>
                <strong>{formatVnd(order.total_vnd)}</strong>
              </div>
              {order.status === "preparing" ? (
                <div className="inline-actions responsive-actions">
                  <button
                    className="button secondary"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ orderId: order.id, status: "ready" })}
                    type="button"
                  >
                    Đánh dấu sẵn sàng
                  </button>
                  <button className="button danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(order.id)} type="button">
                    Hủy đơn
                  </button>
                </div>
              ) : null}
              {order.status === "ready" ? (
                order.fulfillment_method === "pickup" ? (
                  <button
                    className="button primary"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ orderId: order.id, status: "completed" })}
                    type="button"
                  >
                    Hoàn tất đơn
                  </button>
                ) : (
                  <span className="badge">Chờ shipper giao xong</span>
                )
              ) : null}
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 ? (
          <StatePanel
            title="Không có đơn hàng nào khớp bộ lọc"
            message="Thử đổi từ khóa tìm kiếm hoặc chọn lại trạng thái để xem thêm đơn trong hệ thống."
            action={
              query || statusFilter || branchId ? (
                <button
                  className="button secondary"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("");
                    setBranchId(undefined);
                  }}
                  type="button"
                >
                  Xóa bộ lọc
                </button>
              ) : undefined
            }
          />
        ) : null}
      </div>
    </section>
  );
}
