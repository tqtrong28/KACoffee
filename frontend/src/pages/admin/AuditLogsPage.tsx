import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { StatePanel } from "../../components/common/StatePanel";
import { useAuthStore } from "../../features/auth/authStore";
import { fetchAuditLogs } from "../../services/adminApi";
import { fetchBranches } from "../../services/catalogApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { downloadCsv } from "../../utils/csv";
import { formatDateTime } from "../../utils/format";

export function AuditLogsPage() {
  const me = useAuthStore((state) => state.me);
  const isAdmin = me?.role === "admin";
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [action, setAction] = useState("");
  const [query, setQuery] = useState("");
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const { data: logs = [], error, isLoading } = useQuery({
    queryKey: ["audit-logs", branchId, action, query],
    queryFn: () => fetchAuditLogs({ branch_id: branchId, action: action || undefined, query: query || undefined }),
  });

  return (
    <section className="card">
      <div className="section-heading compact">
        <p className="eyebrow">Nhật ký thao tác</p>
        <h1>Tra cứu các hành động quan trọng trong hệ thống</h1>
        <p className="product-hint">Theo dõi các thay đổi nhạy cảm để rà lại lịch sử vận hành hoặc điều phối nhanh hơn.</p>
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
          <div className="badge">Đang xem log của {me?.branch_name}</div>
        )}
        <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="Lọc theo action, ví dụ delivery_failed" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mô tả hoặc người thao tác" />
        <button
          className="button secondary"
          onClick={() =>
            downloadCsv(
              "kacoffee-audit-logs.csv",
              logs.map((log) => ({
                created_at: formatDateTime(log.created_at),
                action: log.action,
                actor_name: log.actor_name,
                entity_type: log.entity_type,
                entity_id: log.entity_id,
                description: log.description,
                branch_id: log.branch_id,
              })),
            )
          }
          type="button"
        >
          Xuất CSV
        </button>
      </div>
      {isLoading ? (
        <StatePanel
          title="Đang tải nhật ký thao tác"
          message="KACoffee đang lấy lại lịch sử hành động để bạn theo dõi thật đầy đủ."
          tone="loading"
        />
      ) : null}
      {!isLoading && error ? (
        <StatePanel
          title="Không thể tải nhật ký thao tác"
          message={getApiErrorMessage(error, "Có lỗi khi tải audit log. Vui lòng thử lại sau.")}
          tone="error"
        />
      ) : null}
      {!isLoading && !error ? (
        <div className="stack-list">
          {logs.map((log) => (
            <div key={log.id} className="product-card admin-record-card">
              <div className="product-details">
                <div className="record-header">
                  <h3>{log.description ?? log.action}</h3>
                  {log.branch_id ? <span className="badge">Chi nhánh #{log.branch_id}</span> : null}
                </div>
                <div className="record-meta">
                  <span>{log.actor_name ?? `Actor ${log.actor_id}`}</span>
                  <span>{log.action}</span>
                  <span>
                    {log.entity_type} #{log.entity_id}
                  </span>
                </div>
                <p className="product-hint">{formatDateTime(log.created_at)}</p>
                {log.payload_json ? <p className="product-hint">Chi tiết: {log.payload_json}</p> : null}
              </div>
            </div>
          ))}
          {logs.length === 0 ? (
            <StatePanel
              title="Chưa có thao tác nào khớp bộ lọc"
              message="Hãy đổi hành động, từ khóa hoặc chi nhánh để tìm lại đúng lịch sử bạn cần."
              action={
                action || query || branchId ? (
                  <button
                    className="button secondary"
                    onClick={() => {
                      setAction("");
                      setQuery("");
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
      ) : null}
    </section>
  );
}
