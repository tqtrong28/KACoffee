import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { StatePanel } from "../../components/common/StatePanel";
import {
  customerTestimonials,
  featuredCombos,
  homeReasons,
  lifestyleGallery,
  originStory,
} from "../../content/publicContent";
import { fetchBranches, fetchProducts } from "../../services/catalogApi";
import { fetchPublicSystemSettings } from "../../services/systemSettingsApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatVnd } from "../../utils/format";
import { getProductTypeLabel } from "../../utils/labels";
import { applyProductImageFallback, getProductImageUrl, showcaseDrinks } from "../../utils/productMedia";
import { getLowestDisplayedPrice, hasFlexibleSizePricing } from "../../utils/productPricing";

export function HomePage() {
  const settingsQuery = useQuery({
    queryKey: ["public-system-settings"],
    queryFn: fetchPublicSystemSettings,
  });
  const productsQuery = useQuery({
    queryKey: ["home-products"],
    queryFn: () => fetchProducts(),
  });
  const branchesQuery = useQuery({
    queryKey: ["home-branches"],
    queryFn: fetchBranches,
  });
  const settings = settingsQuery.data;
  const products = productsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  if (settingsQuery.isLoading || productsQuery.isLoading || branchesQuery.isLoading) {
    return (
      <StatePanel
        title="KACoffee đang chuẩn bị trải nghiệm cho bạn"
        message="Chúng mình đang tải thực đơn nổi bật, câu chuyện thương hiệu và thông tin chi nhánh để trang chủ hiện lên đầy đủ nhất."
        tone="loading"
        action={
          <>
            <Link to="/menu" className="button secondary">
              Vào thẳng thực đơn
            </Link>
            <Link to="/contact" className="button secondary">
              Xem chi nhánh
            </Link>
          </>
        }
      />
    );
  }

  if (settingsQuery.isError || productsQuery.isError || branchesQuery.isError) {
    return (
      <StatePanel
        title="Trang chủ chưa tải trọn vẹn"
        message={getApiErrorMessage(
          settingsQuery.error ?? productsQuery.error ?? branchesQuery.error,
          "KACoffee đang gặp trục trặc nhỏ khi tải dữ liệu trang chủ. Bạn vẫn có thể vào thẳng thực đơn hoặc xem chi nhánh.",
        )}
        tone="error"
        action={
          <>
            <Link to="/menu" className="button primary">
              Xem thực đơn
            </Link>
            <Link to="/contact" className="button secondary">
              Xem chi nhánh
            </Link>
          </>
        }
      />
    );
  }

  const featuredProducts = products.filter((product) => product.is_featured).slice(0, 4);
  const featuredShowcase = featuredProducts.length ? featuredProducts : products.slice(0, 4);

  return (
    <section className="home-shell">
      <section className="hero hero-grid home-hero">
        <div className="hero-copy reveal-up">
          <p className="eyebrow">Cà phê tươi mỗi ngày tại Hà Nội</p>
          <h1>
            {settings?.brand_headline ??
              "Cà phê chuẩn vị, phục vụ chỉn chu và một hệ thành viên dùng chung tại mọi chi nhánh KACoffee."}
          </h1>
          <p className="lead">
            {settings?.brand_subheadline ??
              "Khám phá những món signature, đặt hàng trực tuyến nhanh gọn và tận hưởng quyền lợi thành viên đồng nhất ở bất kỳ chi nhánh nào trong hệ thống KACoffee."}
          </p>
          {settings?.public_notice ? <p className="product-hint">{settings.public_notice}</p> : null}
          <div className="actions">
            <Link to="/menu" className="button primary">
              Xem thực đơn
            </Link>
            <Link to="/promotions" className="button secondary">
              Xem ưu đãi
            </Link>
            <Link to="/contact" className="button secondary">
              Xem chi nhánh
            </Link>
          </div>
          <div className="hero-stat-row">
            <div className="hero-stat">
              <strong>{branches.length}</strong>
              <span>chi nhánh tại Hà Nội</span>
            </div>
            <div className="hero-stat">
              <strong>1 hệ</strong>
              <span>membership dùng chung</span>
            </div>
            <div className="hero-stat">
              <strong>{settings?.delivery_fee_vnd ? formatVnd(settings.delivery_fee_vnd) : formatVnd(20_000)}</strong>
              <span>phí giao hàng nội thành</span>
            </div>
          </div>
        </div>
        <div className="hero-showcase">
          {showcaseDrinks.map((drink, index) => (
            <article
              key={drink.title}
              className="showcase-card reveal-up"
              style={{ animationDelay: `${120 + index * 120}ms` }}
            >
              <img src={drink.imageUrl} alt={drink.title} />
              <div className="showcase-copy">
                <strong>{drink.title}</strong>
                <span>{drink.subtitle}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {featuredShowcase.length ? (
        <section className="home-section">
          <div className="section-heading">
            <p className="eyebrow">Best seller của quán</p>
            <h2>Những món khách gọi nhiều nhất tại KACoffee</h2>
          </div>
          <div className="home-product-grid">
            {featuredShowcase.map((product, index) => {
              const productImage = getProductImageUrl(product);
              return (
                <article
                  key={product.id}
                  className="product-card media-card reveal-up featured-product-card"
                  style={{ animationDelay: `${100 + index * 90}ms` }}
                >
                  <div className="product-thumb-wrap">
                    {productImage ? (
                    <img
                      className="product-thumb"
                      src={productImage}
                      alt={product.name}
                      onError={(event) => applyProductImageFallback(event, product.product_type)}
                    />
                    ) : (
                      <div className={`product-thumb placeholder ${product.product_type}`}>
                        <span>{product.name.slice(0, 1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="product-details">
                    <div className="chip-row">
                      {product.badge_text ? <span className="badge accent">{product.badge_text}</span> : null}
                      <span className="badge muted">{getProductTypeLabel(product.product_type)}</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    {product.flavor_note ? <p className="product-hint">Gợi ý vị: {product.flavor_note}</p> : null}
                    <strong>{hasFlexibleSizePricing(product) ? `Từ ${formatVnd(getLowestDisplayedPrice(product))}` : formatVnd(product.price_vnd)}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="home-section">
          <StatePanel
            title="Thực đơn nổi bật đang được cập nhật"
            message="KACoffee đang làm mới danh sách món best seller. Bạn vẫn có thể xem toàn bộ menu để chọn món phù hợp."
            action={
              <Link to="/menu" className="button primary">
                Xem toàn bộ thực đơn
              </Link>
            }
          />
        </section>
      )}

      <section className="home-section split-story">
        <div className="section-heading">
          <p className="eyebrow">Vì sao khách quay lại?</p>
          <h2>Một thương hiệu cafe đáng tin luôn bắt đầu từ cảm giác yên tâm</h2>
        </div>
        <div className="value-grid">
          {homeReasons.map((reason, index) => (
            <article key={reason.title} className="card reveal-up" style={{ animationDelay: `${index * 80}ms` }}>
              <h3>{reason.title}</h3>
              <p>{reason.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section story-grid">
        <div className="section-heading">
          <p className="eyebrow">Câu chuyện hương vị</p>
          <h2>Hạt cà phê, cách pha và nguồn nguyên liệu là thứ giữ bản sắc của quán</h2>
        </div>
        <div className="value-grid">
          {originStory.map((item, index) => (
            <article key={item.title} className="card reveal-up" style={{ animationDelay: `${index * 80}ms` }}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <p className="eyebrow">Khoảnh khắc tại quán</p>
          <h2>Một vài hình ảnh nhỏ về nhịp sống của KACoffee</h2>
        </div>
        <div className="lifestyle-grid">
          {lifestyleGallery.map((item, index) => (
            <figure key={item.title} className="about-image-card reveal-up" style={{ animationDelay: `${index * 90}ms` }}>
              <img src={item.imageUrl} alt={item.title} />
              <figcaption>
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <p className="eyebrow">Khách hàng nói gì</p>
          <h2>Phản hồi khiến KACoffee luôn muốn làm tốt hơn mỗi ngày</h2>
        </div>
        <div className="value-grid">
          {customerTestimonials.map((testimonial, index) => (
            <article key={testimonial.name} className="card testimonial-card reveal-up" style={{ animationDelay: `${index * 90}ms` }}>
              <p>“{testimonial.quote}”</p>
              <strong>{testimonial.name}</strong>
              <span className="product-hint">{testimonial.role}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section combo-section card">
        <div className="section-heading">
          <p className="eyebrow">Gợi ý combo</p>
          <h2>Những lựa chọn nhanh cho từng nhịp trong ngày</h2>
        </div>
        <div className="value-grid">
          {featuredCombos.map((combo) => (
            <article key={combo.title} className="combo-card">
              <strong>{combo.title}</strong>
              <p className="combo-subtitle">{combo.subtitle}</p>
              <p>{combo.description}</p>
            </article>
          ))}
        </div>
        <div className="actions">
          <Link to="/menu" className="button primary">
            Đặt ngay
          </Link>
          <Link to="/contact" className="button secondary">
            Xem chi nhánh
          </Link>
        </div>
      </section>
    </section>
  );
}
