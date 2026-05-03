import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { StatePanel } from "../../components/common/StatePanel";
import { useToastStore } from "../../features/toast/toastStore";
import { cancelMyOrder, fetchMyOrder, fetchOrderTracking } from "../../services/orderApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatDateTime, formatVnd } from "../../utils/format";
import {
  getFulfillmentMethodLabel,
  getIceLevelLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getProductSizeLabel,
  getSugarLevelLabel,
} from "../../utils/labels";

const orderStages = ["preparing", "ready", "completed"] as const;

function getOrderEta(status?: string, fulfillmentMethod?: string) {
  if (status === "preparing") return "Ước tính 10 - 15 phút để hoàn tất pha chế.";
  if (status === "ready" && fulfillmentMethod === "pickup") return "Đơn đã sẵn sàng, bạn có thể ghé chi nhánh để nhận món.";
  if (status === "ready" && fulfillmentMethod === "delivery") return "Đơn đã sẵn sàng và đang chờ shipper nhận hàng để giao.";
  if (status === "completed") return "Đơn đã hoàn tất. Cảm ơn bạn đã đặt hàng tại KACoffee.";
  if (status === "cancelled") return "Đơn đã được hủy theo yêu cầu hoặc theo xử lý của hệ thống.";
  return "KACoffee đang cập nhật tiến trình đơn hàng của bạn.";
}

function getPickupHint(status?: string, fulfillmentMethod?: string) {
  if (fulfillmentMethod !== "pickup") {
    if (status === "ready") return "Shipper sẽ nhận đơn từ quầy và mang đến địa chỉ bạn đã cung cấp.";
    if (status === "completed") return "Đơn đã giao thành công. Nếu cần hỗ trợ thêm, bạn có thể liên hệ chi nhánh phụ trách.";
    return "Bạn có thể theo dõi thêm thông báo trong mục thành viên nếu đơn được cập nhật trạng thái giao hàng.";
  }
  if (status === "preparing") return "Hãy chờ thêm ít phút. Khi đơn chuyển sang trạng thái sẵn sàng, bạn có thể ghé quầy để lấy món.";
  if (status === "ready") return "Bạn có thể mang theo mã đơn và ghé quầy pickup để nhận món nhanh hơn.";
  if (status === "completed") return "Bạn đã nhận món thành công. Hẹn gặp lại bạn ở lần đặt tiếp theo.";
  return "Nếu cần hỗ trợ thêm về việc lấy hàng, bạn có thể liên hệ trực tiếp chi nhánh đã chọn.";
}

export function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.orderId);
  const pushToast = useToastStore((state) => state.pushToast);
  const orderQuery = useQuery({
    queryKey: ["my-order", orderId],
    queryFn: () => fetchMyOrder(orderId),
    enabled: Number.isFinite(orderId),
  });
  const trackingQuery = useQuery({
    queryKey: ["my-order-tracking", orderQuery.data?.order_no],
    queryFn: () => fetchOrderTracking(orderQuery.data!.order_no),
    enabled: Boolean(orderQuery.data?.order_no),
  });
  const order = orderQuery.data;
  const tracking = trackingQuery.data;

  const orderSnapshot = tracking?.order ?? order;
  const history = tracking?.history ?? [];
  const currentStatusIndex = orderSnapshot ? orderStages.indexOf(orderSnapshot.status as (typeof orderStages)[number]) : -1;

  const cancelMutation = useMutation({
    mutationFn: () => cancelMyOrder(orderId),
    onSuccess: async () => {
      pushToast("Đơn hàng đã được hủy thành công.", "success");
      await orderQuery.refetch();
      await trackingQuery.refetch();
    },
    onError: (error) => {
      pushToast(
        getApiErrorMessage(error, "KACoffee chưa thể hủy đơn lúc này. Bạn vui lòng thử lại sau ít phút."),
        "error",
      );
    },
  });

  if (!Number.isFinite(orderId)) {
    return (
      <StatePanel
        title="Mã đơn hàng chưa hợp lệ"
        message="Liên kết bạn mở chưa đúng định dạng đơn hàng. Bạn có thể quay lại lịch sử đơn để chọn lại."
        tone="error"
        action={
          <Link to="/account/orders" className="button primary">
            Về lịch sử đơn hàng
          </Link>
        }
      />
    );
  }

  if (orderQuery.isLoading) {
    return (
      <StatePanel
        title="KACoffee đang lấy thông tin đơn hàng"
        message="Mình đang chuẩn bị timeline, chi tiết món và trạng thái mới nhất cho đơn hàng của bạn."
        tone="loading"
      />
    );
  }

  if (orderQuery.isError) {
    return (
      <StatePanel
        title="Chưa tải được chi tiết đơn hàng"
        message={getApiErrorMessage(
          orderQuery.error,
          "Đã có lỗi khi tải chi tiết đơn hàng. Bạn vui lòng thử lại sau hoặc quay về danh sách đơn.",
        )}
        tone="error"
        action={
          <>
            <button className="button primary" onClick={() => orderQuery.refetch()} type="button">
              Thử lại
            </button>
            <Link to="/account/orders" className="button secondary">
              Về lịch sử đơn
            </Link>
          </>
        }
      />
    );
  }

  if (!orderSnapshot) {
    return (
      <StatePanel
        title="Không tìm thấy đơn hàng"
        message="Đơn hàng này có thể đã không còn khả dụng hoặc tài khoản hiện tại không có quyền xem."
        action={
          <Link to="/account/orders" className="button primary">
            Về lịch sử đơn hàng
          </Link>
        }
      />
    );
  }

  return (
    <section className="card order-detail-shell">
      <div className="section-heading compact">
        <p className="eyebrow">Theo dõi đơn hàng</p>
        <h1>Chi tiết đơn hàng</h1>
      </div>

      <div className="order-summary-grid">
        <div className="card nested">
          <p>
            Mã đơn: <strong>{orderSnapshot?.order_no}</strong>
          </p>
          <p>
            Chi nhánh: <strong>{orderSnapshot?.branch_name}</strong>
          </p>
          <p>
            Hình thức nhận hàng:{" "}
            <strong>{orderSnapshot ? getFulfillmentMethodLabel(orderSnapshot.fulfillment_method) : "-"}</strong>
          </p>
          <p>
            Trạng thái: <strong>{orderSnapshot ? getOrderStatusLabel(orderSnapshot.status) : "-"}</strong>
          </p>
          <p>
            Thanh toán: <strong>{orderSnapshot ? getPaymentStatusLabel(orderSnapshot.payment_status) : "-"}</strong>
          </p>
          <p>
            Thời gian tạo: <strong>{formatDateTime(orderSnapshot?.created_at ?? null)}</strong>
          </p>
        </div>
        <div className="card nested">
          <h2>Tiến trình hiện tại</h2>
          <p>{getOrderEta(orderSnapshot?.status, orderSnapshot?.fulfillment_method)}</p>
          <p className="product-hint">{getPickupHint(orderSnapshot?.status, orderSnapshot?.fulfillment_method)}</p>
          {orderSnapshot?.fulfillment_method === "pickup" && orderSnapshot?.status === "ready" ? (
            <div className="badge status-success">Mang theo mã đơn để lấy món nhanh hơn tại quầy.</div>
          ) : null}
        </div>
      </div>

      <div className="card nested">
        <h2>Timeline xử lý</h2>
        <div className="order-stepper">
          {orderStages.map((stage, index) => {
            const isCancelled = orderSnapshot?.status === "cancelled";
            const isCompleted = !isCancelled && currentStatusIndex >= index;
            return (
              <div key={stage} className={`step-card ${isCompleted ? "done" : ""} ${isCancelled ? "muted" : ""}`}>
                <div className="step-icon">{index + 1}</div>
                <div>
                  <strong>{getOrderStatusLabel(stage)}</strong>
                  <p className="product-hint">
                    {stage === "preparing"
                      ? "Quán đang chuẩn bị món."
                      : stage === "ready"
                        ? orderSnapshot?.fulfillment_method === "pickup"
                          ? "Món sẵn sàng để bạn ghé lấy."
                          : "Món sẵn sàng chờ giao đi."
                        : "Đơn đã hoàn tất."}
                  </p>
                </div>
              </div>
            );
          })}
          {orderSnapshot?.status === "cancelled" ? (
            <div className="step-card cancelled">
              <div className="step-icon">!</div>
              <div>
                <strong>Đơn đã hủy</strong>
                <p className="product-hint">Bạn có thể đặt lại món bất cứ lúc nào từ thực đơn.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {trackingQuery.isLoading ? (
        <StatePanel
          title="Đang đồng bộ timeline đơn hàng"
          message="KACoffee đang lấy lịch sử xử lý mới nhất để bạn theo dõi đơn rõ ràng hơn."
          tone="loading"
        />
      ) : trackingQuery.isError ? (
        <StatePanel
          title="Timeline đang tạm gián đoạn"
          message={getApiErrorMessage(
            trackingQuery.error,
            "KACoffee chưa lấy được lịch sử trạng thái mới nhất. Các thông tin chính của đơn vẫn đang hiển thị ở phía trên.",
          )}
          tone="error"
          action={
            <button className="button secondary" onClick={() => trackingQuery.refetch()} type="button">
              Tải lại timeline
            </button>
          }
        />
      ) : (
        <div className="tracking-timeline">
          {history.map((item, index) => (
            <div key={item.id} className="timeline-item">
              <div className={`timeline-dot ${index === history.length - 1 ? "active" : ""}`} />
              <div className="timeline-content">
                <strong>{getOrderStatusLabel(item.to_status)}</strong>
                <p className="product-hint">{formatDateTime(item.changed_at)}</p>
                {item.note ? <p>{item.note}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="stack-list">
        {orderSnapshot?.items.map((item) => (
          <div key={item.id} className="product-card">
            <div>
              <h3>{item.product_name_snapshot}</h3>
              <p>
                {item.quantity} x {formatVnd(item.unit_price_vnd)}
              </p>
              <p className="product-hint">
                {getProductSizeLabel(item.size_option)} · {getIceLevelLabel(item.ice_level)} · {getSugarLevelLabel(item.sugar_level)}
              </p>
              {item.note ? <p className="product-hint">Ghi chú món: {item.note}</p> : null}
            </div>
            <span>{formatVnd(item.line_total_vnd)}</span>
          </div>
        ))}
      </div>

      <p className="order-total">Tổng tiền: {formatVnd(orderSnapshot?.total_vnd ?? 0)}</p>
      {orderSnapshot.status === "preparing" ? (
        <button className="button danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()} type="button">
          {cancelMutation.isPending ? "Đang gửi yêu cầu hủy..." : "Hủy đơn hàng"}
        </button>
      ) : null}
    </section>
  );
}
