import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { StatePanel } from "../../components/common/StatePanel";
import { fetchMyOrders } from "../../services/orderApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatDateTime, formatVnd } from "../../utils/format";
import { getOrderStatusLabel } from "../../utils/labels";

export function OrderHistoryPage() {
  const { data: orders = [], isLoading, isError, error } = useQuery({ queryKey: ["my-orders"], queryFn: fetchMyOrders });

  if (isLoading) {
    return <StatePanel title="Đang tải đơn hàng" message="KACoffee đang gom lại lịch sử đơn của bạn để hiển thị đầy đủ hơn." tone="loading" />;
  }

  if (isError) {
    return (
      <StatePanel
        title="Chưa tải được lịch sử đơn"
        message={getApiErrorMessage(error, "Đã có lỗi khi tải đơn hàng của bạn. Vui lòng thử lại sau ít phút.")}
        tone="error"
      />
    );
  }

  return (
    <section className="card">
      <h1>Đơn hàng của tôi</h1>
      <div className="stack-list">
        {orders.map((order) => (
          <div key={order.id} className="product-card">
            <div>
              <h3>{order.order_no}</h3>
              <p>
                {getOrderStatusLabel(order.status)} · {formatVnd(order.total_vnd)}
              </p>
              <p>{order.branch_name}</p>
              <p>{formatDateTime(order.created_at)}</p>
            </div>
            <Link to={`/account/orders/${order.id}`} className="button secondary">
              Xem chi tiết
            </Link>
          </div>
        ))}
        {orders.length === 0 ? (
          <StatePanel
            title="Bạn chưa có đơn hàng nào"
            message="Khi đặt món đầu tiên, lịch sử đơn và tiến trình xử lý sẽ xuất hiện tại đây."
            action={
              <Link to="/menu" className="button primary">
                Xem thực đơn
              </Link>
            }
          />
        ) : null}
      </div>
    </section>
  );
}
