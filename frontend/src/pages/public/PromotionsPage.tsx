import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { StatePanel } from "../../components/common/StatePanel";
import { faqItems, promotionHighlights } from "../../content/publicContent";
import { fetchMembershipRanks } from "../../services/customerApi";
import { fetchPublicSystemSettings } from "../../services/systemSettingsApi";
import { getApiErrorMessage } from "../../utils/apiError";

const membershipDescriptions: Record<string, string> = {
  new: "Khởi đầu hành trình thành viên với những quyền lợi cơ bản và các ưu đãi phù hợp cho đơn đầu tiên.",
  silver: "Mở rộng thêm quyền dùng mã giảm giá theo hạng và giữ ưu đãi ổn định tại mọi chi nhánh.",
  gold: "Tăng mức quyền lợi cho các đơn thường xuyên, phù hợp với khách đã có thói quen quay lại đều đặn.",
  diamond: "Hạng cao nhất cho khách trung thành, ưu tiên các đợt ưu đãi tốt và quà tặng mang tính gắn kết lâu dài.",
};

export function PromotionsPage() {
  const ranksQuery = useQuery({
    queryKey: ["membership-ranks-public"],
    queryFn: fetchMembershipRanks,
  });
  const settingsQuery = useQuery({
    queryKey: ["public-system-settings"],
    queryFn: fetchPublicSystemSettings,
  });
  const ranks = ranksQuery.data ?? [];
  const settings = settingsQuery.data;

  if (ranksQuery.isLoading || settingsQuery.isLoading) {
    return <StatePanel title="Đang tải ưu đãi" message="KACoffee đang chuẩn bị quyền lợi thành viên và chính sách ưu đãi mới nhất cho bạn." tone="loading" />;
  }

  if (ranksQuery.isError || settingsQuery.isError) {
    return (
      <StatePanel
        title="Chưa tải được ưu đãi"
        message={getApiErrorMessage(
          ranksQuery.error ?? settingsQuery.error,
          "Đã có lỗi khi tải trang ưu đãi. Vui lòng thử lại sau ít phút.",
        )}
        tone="error"
      />
    );
  }

  return (
    <section className="home-shell">
      <section className="card promotions-hero reveal-up">
        <p className="eyebrow">Ưu đãi công khai</p>
        <h1>Ưu đãi thành viên và những đặc quyền giúp việc uống cà phê dễ chịu hơn mỗi ngày</h1>
        <p className="lead">
          KACoffee giữ một hệ thành viên chung cho toàn bộ chi nhánh, để khách có thể mua tại bất kỳ điểm nào trong hệ thống và vẫn tiếp tục tận hưởng ưu đãi như nhau.
        </p>
        <div className="actions">
          <Link to="/register" className="button primary">
            Đăng ký thành viên
          </Link>
          <Link to="/menu" className="button secondary">
            Đặt hàng ngay
          </Link>
        </div>
      </section>

      <section className="home-section">
        <div className="value-grid">
          {promotionHighlights.map((promotion, index) => (
            <article key={promotion.title} className="card reveal-up" style={{ animationDelay: `${index * 90}ms` }}>
              <h3>{promotion.title}</h3>
              <p>{promotion.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <p className="eyebrow">Quyền lợi từng hạng</p>
          <h2>Tích điểm đều đặn để mở khóa những đặc quyền tốt hơn</h2>
        </div>
        <div className="value-grid">
          {ranks.map((rank, index) => (
            <article key={rank.id} className="card membership-rank-card reveal-up" style={{ animationDelay: `${index * 90}ms` }}>
              <span className="badge accent">Từ {rank.min_points} điểm</span>
              <h3>{rank.name}</h3>
              <p>{membershipDescriptions[rank.code] ?? "Quyền lợi đang được cập nhật."}</p>
            </article>
          ))}
          {ranks.length === 0 ? <StatePanel title="Chưa có hạng thành viên hiển thị" message="Quyền lợi thành viên đang được cập nhật. Vui lòng quay lại sau." /> : null}
        </div>
      </section>

      <section className="home-section card faq-shell">
        <div className="section-heading">
          <p className="eyebrow">FAQ ngắn gọn</p>
          <h2>Những điều khách thường hỏi trước khi đặt hàng</h2>
        </div>
        <div className="faq-list">
          {faqItems.map((item) => (
            <details key={item.question} className="faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="product-hint">
          Phí giao hàng nội thành hiện tại: {(settings?.delivery_fee_vnd ?? 20_000).toLocaleString("vi-VN")} đ.
        </p>
      </section>
    </section>
  );
}
