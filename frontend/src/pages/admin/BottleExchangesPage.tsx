import { useQuery } from "@tanstack/react-query";

import { fetchBottleExchanges } from "../../services/bottleExchangeApi";
import { formatDateTime } from "../../utils/format";

export function BottleExchangesPage() {
  const { data: exchanges = [] } = useQuery({
    queryKey: ["admin-bottle-exchanges"],
    queryFn: fetchBottleExchanges
  });

  return (
    <section className="card">
      <h1>Lịch sử đổi vỏ chai</h1>
      <div className="stack-list">
        {exchanges.map((record) => (
          <div key={record.id} className="product-card">
            <div className="product-details">
              <h3>{record.reward_product_name_snapshot}</h3>
              <p>{record.branch_name}</p>
              <p>
                {record.returned_bottle_qty} vỏ chai đổi · nhận {record.reward_quantity} chai miễn phí
              </p>
              <p>
                Khách hàng: {record.customer_name ?? "Khách lẻ"} {record.customer_phone_snapshot ? `· ${record.customer_phone_snapshot}` : ""}
              </p>
              <p>
                Xử lý bởi {record.processed_by_employee_name} · {formatDateTime(record.created_at)}
              </p>
              {record.note ? <p className="product-hint">{record.note}</p> : null}
            </div>
          </div>
        ))}
        {exchanges.length === 0 ? <p className="product-hint">Chưa có lượt đổi vỏ chai nào.</p> : null}
      </div>
    </section>
  );
}
