import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { StatePanel } from "../../components/common/StatePanel";
import { useToastStore } from "../../features/toast/toastStore";
import { fetchCustomerNotifications, fetchMembership, fetchPointHistory, markAllCustomerNotificationsRead } from "../../services/customerApi";
import { formatDateTime } from "../../utils/format";
import { fetchAvailableDiscounts } from "../../services/discountApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { getPointReasonLabel } from "../../utils/labels";

export function MembershipPage() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);
  const membershipQuery = useQuery({ queryKey: ["membership"], queryFn: fetchMembership });
  const historyQuery = useQuery({ queryKey: ["point-history"], queryFn: fetchPointHistory });
  const discountsQuery = useQuery({ queryKey: ["available-discounts"], queryFn: fetchAvailableDiscounts });
  const notificationsQuery = useQuery({
    queryKey: ["customer-notifications"],
    queryFn: fetchCustomerNotifications,
  });
  const notifications = notificationsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const discounts = discountsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const markAllReadMutation = useMutation({
    mutationFn: markAllCustomerNotificationsRead,
    onSuccess: async () => {
      pushToast("Đã đánh dấu tất cả thông báo là đã đọc.", "success");
      await queryClient.invalidateQueries({ queryKey: ["customer-notifications"] });
    },
  });

  if (membershipQuery.isLoading) {
    return <StatePanel title="Đang tải khu vực thành viên" message="KACoffee đang lấy hạng thành viên, điểm và các thông báo mới nhất cho bạn." tone="loading" />;
  }

  if (membershipQuery.isError) {
    return (
      <StatePanel
        title="Chưa tải được khu vực thành viên"
        message={getApiErrorMessage(membershipQuery.error, "Đã có lỗi khi tải dữ liệu thành viên. Vui lòng thử lại sau ít phút.")}
        tone="error"
      />
    );
  }

  return (
    <section className="card">
      <h1>Thành viên</h1>
      <p>
        Hạng hiện tại: <strong>{membershipQuery.data?.membership_rank.name}</strong>
      </p>
      <p>
        Điểm tích lũy: <strong>{membershipQuery.data?.total_points ?? 0}</strong>
      </p>
      <div className="section-heading compact">
        <h2>Thông báo thành viên</h2>
        <div className="inline-actions">
          {unreadCount ? <span className="badge count-badge">Mới: {unreadCount}</span> : null}
          {unreadCount ? (
            <button className="button secondary" onClick={() => markAllReadMutation.mutate()} type="button">
              Đánh dấu đã đọc
            </button>
          ) : null}
        </div>
      </div>
      <ul className="stack-list">
        {notifications.map((notification) => (
          <li key={notification.id} className={`product-card ${notification.is_read ? "" : "notification-card unread"}`}>
            <div className="product-details">
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <p className="product-hint">{formatDateTime(notification.created_at)}</p>
            </div>
          </li>
        ))}
        {!notificationsQuery.isLoading && notifications.length === 0 ? <StatePanel title="Chưa có thông báo mới" message="Khi đơn sẵn sàng, giao thất bại hoặc bạn lên hạng thành viên, KACoffee sẽ báo tại đây." /> : null}
      </ul>
      <h2>Lịch sử điểm</h2>
      <ul className="stack-list">
        {history.map((item: { id: number; reason: string; points_delta: number }) => (
          <li key={item.id}>
            {getPointReasonLabel(item.reason)}: +{item.points_delta} điểm
          </li>
        ))}
        {!historyQuery.isLoading && history.length === 0 ? <StatePanel title="Chưa có lịch sử điểm" message="Điểm sẽ xuất hiện ở đây khi bạn có đơn hoàn tất hoặc lên hạng thành viên." /> : null}
      </ul>
      <h2>Ưu đãi hiện có</h2>
      <ul className="stack-list">
        {discounts.map((discount) => (
          <li key={discount.id}>
            <strong>{discount.code}</strong> · {discount.description ?? "Chưa có mô tả"}
          </li>
        ))}
        {!discountsQuery.isLoading && discounts.length === 0 ? <StatePanel title="Chưa có ưu đãi khả dụng" message="Khi hạng thành viên hoặc chiến dịch ưu đãi thay đổi, mã phù hợp sẽ xuất hiện tại đây." /> : null}
      </ul>
    </section>
  );
}
