import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { StatePanel } from "../../components/common/StatePanel";
import { useToastStore } from "../../features/toast/toastStore";
import {
  completeDelivery,
  failDelivery,
  fetchShipperDeliveries,
  pickupDelivery,
  startDelivery,
} from "../../services/deliveryApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatDateTime } from "../../utils/format";
import { getDeliveryStatusLabel } from "../../utils/labels";

export function DeliveriesPage() {
  const pushToast = useToastStore((state) => state.pushToast);
  const [statusFilter, setStatusFilter] = useState("");
  const [failureDrafts, setFailureDrafts] = useState<Record<number, string>>({});
  const { data: deliveries = [], refetch, isLoading, isError, error } = useQuery({
    queryKey: ["shipper-deliveries"],
    queryFn: fetchShipperDeliveries,
  });
  const filteredDeliveries = useMemo(
    () => deliveries.filter((delivery) => !statusFilter || delivery.status === statusFilter),
    [deliveries, statusFilter],
  );

  const pickupMutation = useMutation({
    mutationFn: pickupDelivery,
    onSuccess: async () => {
      pushToast("Đã xác nhận nhận hàng từ quầy.", "success");
      await refetch();
    },
  });
  const startMutation = useMutation({
    mutationFn: startDelivery,
    onSuccess: async () => {
      pushToast("Đã bắt đầu giao hàng.", "success");
      await refetch();
    },
  });
  const completeMutation = useMutation({
    mutationFn: completeDelivery,
    onSuccess: async () => {
      pushToast("Đã xác nhận giao thành công.", "success");
      await refetch();
    },
  });
  const failMutation = useMutation({
    mutationFn: ({ deliveryId, failureReason }: { deliveryId: number; failureReason: string }) =>
      failDelivery(deliveryId, failureReason),
    onSuccess: async (_, variables) => {
      setFailureDrafts((current) => ({ ...current, [variables.deliveryId]: "" }));
      pushToast("Đã báo giao thất bại cho đơn hàng này.", "info");
      await refetch();
    },
  });

  if (isLoading) {
    return <StatePanel title="Đang tải đơn giao hàng" message="KACoffee đang đồng bộ những đơn vừa được phân công cho bạn." tone="loading" />;
  }

  if (isError) {
    return (
      <StatePanel
        title="Chưa tải được danh sách giao hàng"
        message={getApiErrorMessage(error, "Đã có lỗi khi tải đơn giao hàng. Vui lòng thử lại sau ít phút.")}
        tone="error"
      />
    );
  }

  return (
    <section className="card">
      <div className="section-heading compact">
        <p className="eyebrow">Shipper portal</p>
        <h1>Đơn được giao cho bạn</h1>
      </div>
      <div className="admin-toolbar">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="assigned">Đã phân công</option>
          <option value="picked_up">Đã nhận hàng</option>
          <option value="delivering">Đang giao</option>
          <option value="failed">Giao thất bại</option>
          <option value="delivered">Giao thành công</option>
        </select>
      </div>
      <div className="stack-list">
        {filteredDeliveries.map((delivery) => (
          <div key={delivery.id} className="product-card">
            <div className="product-details">
              <h3>{delivery.order_no}</h3>
              <p>
                {getDeliveryStatusLabel(delivery.status)} · {delivery.recipient_name} · {delivery.recipient_phone}
              </p>
              <p>{[delivery.address_line, delivery.ward, delivery.district, delivery.city].filter(Boolean).join(", ")}</p>
              {delivery.delivery_note ? <p>Ghi chú: {delivery.delivery_note}</p> : null}
              <p>{delivery.item_summary.join(" · ")}</p>
              <p className="product-hint">
                Phân công lúc {formatDateTime(delivery.assigned_at)} · Cập nhật{" "}
                {formatDateTime(delivery.delivering_at ?? delivery.picked_up_at ?? delivery.failed_at ?? delivery.delivered_at)}
              </p>
              {delivery.failure_reason ? <p className="error">Lần thất bại gần nhất: {delivery.failure_reason}</p> : null}
              {["assigned", "picked_up", "delivering"].includes(delivery.status) ? (
                <textarea
                  rows={2}
                  value={failureDrafts[delivery.id] ?? ""}
                  onChange={(event) =>
                    setFailureDrafts((current) => ({
                      ...current,
                      [delivery.id]: event.target.value,
                    }))
                  }
                  placeholder="Nếu giao thất bại, ghi ngắn gọn lý do tại đây..."
                />
              ) : null}
            </div>
            <div className="stack-list">
              {delivery.status === "assigned" ? (
                <button className="button secondary" onClick={() => pickupMutation.mutate(delivery.id)} type="button">
                  Nhận hàng
                </button>
              ) : null}
              {(delivery.status === "assigned" || delivery.status === "picked_up") ? (
                <button className="button secondary" onClick={() => startMutation.mutate(delivery.id)} type="button">
                  Bắt đầu giao
                </button>
              ) : null}
              {(delivery.status === "picked_up" || delivery.status === "delivering") ? (
                <button className="button primary" onClick={() => completeMutation.mutate(delivery.id)} type="button">
                  Xác nhận giao thành công
                </button>
              ) : null}
              {["assigned", "picked_up", "delivering"].includes(delivery.status) ? (
                <button
                  className="button danger"
                  onClick={() => {
                    const reason = (failureDrafts[delivery.id] ?? "").trim();
                    if (!reason) {
                      pushToast("Hãy nhập lý do trước khi báo giao thất bại.", "error");
                      return;
                    }
                    failMutation.mutate({ deliveryId: delivery.id, failureReason: reason });
                  }}
                  type="button"
                >
                  Báo giao thất bại
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {deliveries.length === 0 ? (
          <StatePanel title="Bạn chưa có đơn giao nào" message="Khi quản lý phân công đơn, chúng sẽ xuất hiện tại đây để bạn bắt đầu nhận và giao." />
        ) : null}
        {deliveries.length > 0 && filteredDeliveries.length === 0 ? (
          <StatePanel title="Không có đơn khớp bộ lọc" message="Hãy thử đổi trạng thái lọc để xem lại các đơn đã được phân công cho bạn." />
        ) : null}
      </div>
    </section>
  );
}
