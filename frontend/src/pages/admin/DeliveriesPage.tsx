import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { StatePanel } from "../../components/common/StatePanel";
import { useAuthStore } from "../../features/auth/authStore";
import { useToastStore } from "../../features/toast/toastStore";
import { fetchEmployees } from "../../services/adminApi";
import { fetchBranches } from "../../services/catalogApi";
import { assignDeliveryShipper, fetchAdminDeliveries, reassignDeliveryShipper } from "../../services/deliveryApi";
import { downloadCsv } from "../../utils/csv";
import { formatDateTime } from "../../utils/format";
import { getDeliveryStatusLabel } from "../../utils/labels";

export function DeliveriesPage() {
  const me = useAuthStore((state) => state.me);
  const isAdmin = me?.role === "admin";
  const pushToast = useToastStore((state) => state.pushToast);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data: deliveries = [], refetch } = useQuery({
    queryKey: ["admin-deliveries", branchId],
    queryFn: () => fetchAdminDeliveries(branchId),
  });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const { data: employees = [] } = useQuery({
    queryKey: ["admin-employees", branchId],
    queryFn: () => fetchEmployees(branchId),
  });
  const filteredDeliveries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return deliveries.filter((delivery) => {
      const matchesQuery =
        !normalizedQuery ||
        delivery.order_no.toLowerCase().includes(normalizedQuery) ||
        delivery.branch_name.toLowerCase().includes(normalizedQuery) ||
        delivery.recipient_name.toLowerCase().includes(normalizedQuery) ||
        delivery.recipient_phone.toLowerCase().includes(normalizedQuery);
      const matchesStatus = !statusFilter || delivery.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [deliveries, query, statusFilter]);
  const [selectedShipper, setSelectedShipper] = useState<Record<number, number>>({});
  const shippers = employees.filter((employee) => employee.role === "shipper");

  const assignMutation = useMutation({
    mutationFn: ({
      mode,
      deliveryId,
      orderId,
      shipperEmployeeId,
    }: {
      mode: "assign" | "reassign";
      deliveryId: number;
      orderId: number;
      shipperEmployeeId: number;
    }) =>
      mode === "assign"
        ? assignDeliveryShipper(orderId, shipperEmployeeId)
        : reassignDeliveryShipper(deliveryId, shipperEmployeeId, "Reassigned by admin"),
    onSuccess: async (_, variables) => {
      pushToast(variables.mode === "assign" ? "Đã phân công shipper." : "Đã phân công lại shipper.", "success");
      await refetch();
    },
  });

  return (
    <section className="card">
      <div className="section-heading compact">
        <p className="eyebrow">Điều phối giao hàng</p>
        <h1>Quản lý danh sách đơn đang chờ shipper hoặc cần giao lại</h1>
        <p className="product-hint">
          {isAdmin ? "Theo dõi toàn bộ luồng giao hàng và phân công shipper theo từng chi nhánh." : `Bạn đang điều phối giao hàng cho ${me?.branch_name ?? "chi nhánh hiện tại"}.`}
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
          <div className="badge">Đang điều phối giao hàng cho {me?.branch_name ?? "chi nhánh hiện tại"}</div>
        )}
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã đơn, tên, số điện thoại..." />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Tất cả trạng thái giao hàng</option>
          <option value="pending_assignment">Chờ phân công</option>
          <option value="assigned">Đã phân công</option>
          <option value="picked_up">Đã nhận hàng</option>
          <option value="delivering">Đang giao</option>
          <option value="delivered">Giao thành công</option>
          <option value="failed">Giao thất bại</option>
        </select>
        <button
          className="button secondary"
          onClick={() =>
            downloadCsv(
              "kacoffee-deliveries.csv",
              filteredDeliveries.map((delivery) => ({
                order_no: delivery.order_no,
                branch: delivery.branch_name,
                status: getDeliveryStatusLabel(delivery.status),
                recipient: delivery.recipient_name,
                phone: delivery.recipient_phone,
                shipper: delivery.shipper_name,
                created_at: formatDateTime(delivery.created_at),
              })),
            )
          }
          type="button"
        >
          Xuất CSV
        </button>
      </div>
      <div className="stack-list">
        {filteredDeliveries.map((delivery) => {
          const currentSelection = selectedShipper[delivery.id] ?? delivery.shipper_employee_id ?? shippers[0]?.id;
          const mode = delivery.shipper_employee_id ? "reassign" : "assign";

          return (
            <div key={delivery.id} className="product-card admin-record-card">
              <div className="product-details">
                <div className="record-header">
                  <h3>{delivery.order_no}</h3>
                  <span className={`badge status-${delivery.status === "delivered" ? "success" : delivery.status === "failed" ? "muted" : "warning"}`}>
                    {getDeliveryStatusLabel(delivery.status)}
                  </span>
                </div>
                <div className="record-meta">
                  <span>{delivery.branch_name}</span>
                  <span>{delivery.recipient_name}</span>
                  <span>{delivery.recipient_phone}</span>
                </div>
                <p>{[delivery.address_line, delivery.ward, delivery.district, delivery.city].filter(Boolean).join(", ")}</p>
                <p className="product-hint">
                  Shipper hiện tại: {delivery.shipper_name ?? "Chưa phân công"} · Tạo lúc {formatDateTime(delivery.created_at)}
                </p>
                {delivery.failure_reason ? <p className="error">Lý do giao thất bại: {delivery.failure_reason}</p> : null}
              </div>
              <div className="form-stack delivery-action-panel">
                {shippers.length > 0 ? (
                  <>
                    <select
                      value={currentSelection ?? ""}
                      onChange={(event) =>
                        setSelectedShipper((current) => ({
                          ...current,
                          [delivery.id]: Number(event.target.value),
                        }))
                      }
                    >
                      {shippers.map((shipper) => (
                        <option key={shipper.id} value={shipper.id}>
                          {shipper.full_name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="button primary"
                      disabled={!currentSelection || assignMutation.isPending}
                      onClick={() =>
                        assignMutation.mutate({
                          mode,
                          deliveryId: delivery.id,
                          orderId: delivery.order_id,
                          shipperEmployeeId: currentSelection,
                        })
                      }
                      type="button"
                    >
                      {assignMutation.isPending ? "Đang cập nhật..." : mode === "assign" ? "Phân công shipper" : "Phân công lại shipper"}
                    </button>
                  </>
                ) : (
                  <StatePanel
                    title="Chưa có shipper phù hợp"
                    message="Hãy tạo hoặc mở quyền cho một shipper trong chi nhánh này trước khi phân công giao hàng."
                    tone="neutral"
                  />
                )}
              </div>
            </div>
          );
        })}
        {filteredDeliveries.length === 0 ? (
          <StatePanel
            title="Không có đơn giao hàng nào khớp bộ lọc"
            message="Thử đổi trạng thái hoặc từ khóa để tìm đúng đơn đang cần điều phối."
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
