import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useToastStore } from "../../features/toast/toastStore";
import { cancelStaffOrder, fetchStaffOrders, updateStaffOrderStatus } from "../../services/staffApi";
import { formatDateTime, formatVnd } from "../../utils/format";
import { getOrderSourceLabel, getOrderStatusLabel, getPaymentStatusLabel } from "../../utils/labels";

export function OrderStatusPage() {
  const pushToast = useToastStore((state) => state.pushToast);
  const [query, setQuery] = useState("");
  const { data: orders = [], refetch } = useQuery({ queryKey: ["staff-orders"], queryFn: fetchStaffOrders });
  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!normalizedQuery) return true;
      return (
        order.order_no.toLowerCase().includes(normalizedQuery) ||
        (order.customer_full_name ?? order.recipient_name).toLowerCase().includes(normalizedQuery) ||
        (order.customer_phone ?? order.recipient_phone).toLowerCase().includes(normalizedQuery)
      );
    });
  }, [orders, query]);

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: "ready" | "completed" }) =>
      updateStaffOrderStatus(orderId, status),
    onSuccess: async (_, variables) => {
      pushToast(variables.status === "ready" ? "Đã chuyển đơn sang trạng thái sẵn sàng." : "Đã hoàn tất đơn hàng.", "success");
      await refetch();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelStaffOrder,
    onSuccess: async () => {
      pushToast("Đã hủy đơn hàng.", "success");
      await refetch();
    },
  });

  return (
    <section className="card">
      <div className="section-heading compact">
        <p className="eyebrow">Staff portal</p>
        <h1>Đơn hàng đang xử lý tại chi nhánh</h1>
      </div>
      <div className="admin-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã đơn, tên hoặc số điện thoại" />
      </div>
      <div className="stack-list">
        {filteredOrders.map((order) => (
          <div key={order.id} className="product-card">
            <div>
              <h3>{order.order_no}</h3>
              <p>
                {getOrderSourceLabel(order.source)} · {getOrderStatusLabel(order.status)} · {getPaymentStatusLabel(order.payment_status)}
              </p>
              <p>
                {order.customer_full_name ?? order.recipient_name} · {order.customer_phone ?? order.recipient_phone}
              </p>
              <p>{formatDateTime(order.created_at)}</p>
            </div>
            <div className="stack-list">
              <strong>{formatVnd(order.total_vnd)}</strong>
              {order.status === "preparing" ? (
                <div className="inline-actions">
                  <button className="button secondary" onClick={() => statusMutation.mutate({ orderId: order.id, status: "ready" })} type="button">
                    Đánh dấu sẵn sàng
                  </button>
                  <button className="button danger" onClick={() => cancelMutation.mutate(order.id)} type="button">
                    Hủy đơn
                  </button>
                </div>
              ) : null}
              {order.status === "ready" ? (
                order.fulfillment_method === "pickup" ? (
                  <button className="button primary" onClick={() => statusMutation.mutate({ orderId: order.id, status: "completed" })} type="button">
                    Hoàn tất
                  </button>
                ) : (
                  <span className="badge">Đang chờ shipper giao</span>
                )
              ) : null}
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 ? <p className="product-hint">Không có đơn nào khớp từ khóa hiện tại.</p> : null}
      </div>
    </section>
  );
}
