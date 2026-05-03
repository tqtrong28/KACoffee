import { useQuery } from "@tanstack/react-query";

import { StatePanel } from "../../components/common/StatePanel";
import { faqItems } from "../../content/publicContent";
import { fetchBranches } from "../../services/catalogApi";
import { fetchPublicSystemSettings } from "../../services/systemSettingsApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { getBranchOpenStatus } from "../../utils/branchStatus";
import { applyBranchImageFallback, getBranchImageUrl } from "../../utils/branchMedia";
import { formatVnd } from "../../utils/format";

function parseAmenities(value?: string | null) {
  return (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ContactPage() {
  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
  });
  const settingsQuery = useQuery({
    queryKey: ["public-system-settings"],
    queryFn: fetchPublicSystemSettings,
  });
  const branches = branchesQuery.data ?? [];
  const settings = settingsQuery.data;

  if (branchesQuery.isLoading || settingsQuery.isLoading) {
    return <StatePanel title="Đang tải thông tin chi nhánh" message="KACoffee đang chuẩn bị địa chỉ, hotline và giờ mở cửa để bạn chọn điểm ghé thuận tiện nhất." tone="loading" />;
  }

  if (branchesQuery.isError || settingsQuery.isError) {
    return (
      <StatePanel
        title="Chưa tải được thông tin chi nhánh"
        message={getApiErrorMessage(
          branchesQuery.error ?? settingsQuery.error,
          "Đã có lỗi khi tải danh sách chi nhánh. Vui lòng thử lại sau ít phút.",
        )}
        tone="error"
      />
    );
  }

  return (
    <section className="home-shell">
      <section className="card reveal-up">
        <p className="eyebrow">Chi nhánh KACoffee</p>
        <h1>Ghé quán gần bạn nhất hoặc chọn một điểm lấy hàng thật thuận tiện</h1>
        <p className="lead">
          KACoffee hiện phục vụ tại bốn chi nhánh ở Hà Nội, đồng thời duy trì chung một hệ thành viên và ưu đãi trên toàn hệ thống để khách có thể ghé bất kỳ đâu vẫn thấy thân thuộc.
        </p>
        {settings?.support_phone || settings?.support_email ? (
          <div className="card nested support-strip">
            {settings.support_phone ? <p>Hotline hỗ trợ: {settings.support_phone}</p> : null}
            {settings.support_email ? <p>Email hỗ trợ: {settings.support_email}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="home-section branch-grid">
        {branches.length === 0 ? (
          <StatePanel title="Chưa có chi nhánh khả dụng" message="Danh sách chi nhánh đang được cập nhật. Vui lòng quay lại sau." />
        ) : null}
        {branches.map((branch, index) => {
          const branchStatus = getBranchOpenStatus(branch.opening_hours);
          return (
            <article key={branch.id} className="card branch-showcase reveal-up" style={{ animationDelay: `${index * 90}ms` }}>
              <img
                className="branch-photo"
                src={getBranchImageUrl(branch)}
                alt={branch.name}
                onError={(event) => applyBranchImageFallback(event, branch.code)}
              />
              <div className="branch-copy">
                <div className="section-heading compact">
                  <p className="eyebrow">{branch.city}</p>
                  <h2>{branch.name}</h2>
                </div>
                {branch.address ? <p>{branch.address}</p> : null}
                {branch.phone ? <p>Điện thoại: {branch.phone}</p> : null}
                {branch.opening_hours ? <p>Giờ mở cửa: {branch.opening_hours}</p> : null}
                {branchStatus ? <span className={`badge status-${branchStatus.tone}`}>{branchStatus.label}</span> : null}
                {parseAmenities(branch.amenities_text).length ? (
                  <div className="chip-row">
                    {parseAmenities(branch.amenities_text).map((amenity) => (
                      <span key={amenity} className="badge branch-chip">
                        {amenity}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="actions">
                  {branch.map_url ? (
                    <a className="button primary" href={branch.map_url} rel="noreferrer" target="_blank">
                      Chỉ đường
                    </a>
                  ) : null}
                  {branch.phone || settings?.support_phone ? (
                    <a className="button secondary" href={`tel:${branch.phone ?? settings?.support_phone ?? ""}`}>
                      Gọi chi nhánh
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="home-section card faq-shell">
        <div className="section-heading">
          <p className="eyebrow">Chính sách ngắn gọn</p>
          <h2>Những thông tin nên biết trước khi đặt hoặc ghé quán</h2>
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
          Thành viên có thể dùng chung ưu đãi tại mọi chi nhánh. Phí giao hàng hiện áp dụng trong nội thành Hà Nội với mức cố định{" "}
          {formatVnd(settings?.delivery_fee_vnd ?? 20_000)}.
        </p>
        {settings?.public_notice ? <p className="product-hint">{settings.public_notice}</p> : null}
      </section>
    </section>
  );
}
