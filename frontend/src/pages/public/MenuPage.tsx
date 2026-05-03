import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ProductCustomizationFields } from "../../components/common/ProductCustomizationFields";
import { StatePanel } from "../../components/common/StatePanel";
import { featuredCombos } from "../../content/publicContent";
import { useCartStore } from "../../features/cart/cartStore";
import { useToastStore } from "../../features/toast/toastStore";
import { fetchCategories, fetchProducts } from "../../services/catalogApi";
import type { Product, ProductType } from "../../types/models";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatVnd } from "../../utils/format";
import { getProductSizeLabel, getProductTypeLabel } from "../../utils/labels";
import { applyProductImageFallback, getProductImageUrl, isGeneratedProductImage } from "../../utils/productMedia";
import { getDefaultCustomization, type ProductCustomization } from "../../utils/productOptions";
import { getLowestDisplayedPrice, getUnitPriceForSize, hasFlexibleSizePricing } from "../../utils/productPricing";

type ProductTypeFilter = ProductType | "all";

function ProductQuickViewModal({
  product,
  relatedProducts,
  onClose,
  onAddToCart,
  onSelectProduct,
}: {
  product: Product;
  relatedProducts: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, customization: ProductCustomization) => void;
  onSelectProduct: (product: Product) => void;
}) {
  const [customization, setCustomization] = useState<ProductCustomization>(getDefaultCustomization(product));
  const selectedPrice = getUnitPriceForSize(product, customization.size_option);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setCustomization(getDefaultCustomization(product));
  }, [product]);

  const productImage = getProductImageUrl(product);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card large" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} type="button">
          ×
        </button>
        <div className="modal-grid">
          <div className="modal-media">
            {productImage ? (
              <img
                src={productImage}
                alt={product.name}
                className={`modal-image ${isGeneratedProductImage(product) ? "generated-image" : ""}`}
                onError={(event) => applyProductImageFallback(event, product.product_type)}
              />
            ) : (
              <div className={`product-thumb placeholder ${product.product_type} modal-image`}>
                <span>{product.name.slice(0, 1)}</span>
              </div>
            )}
          </div>
          <div className="modal-content">
            <div className="chip-row">
              {product.badge_text ? <span className="badge accent">{product.badge_text}</span> : null}
              <span className="badge muted">{getProductTypeLabel(product.product_type)}</span>
              {product.is_featured ? <span className="badge">Best seller</span> : null}
            </div>
            <h2>{product.name}</h2>
            <p className="lead">{product.description}</p>
            {product.flavor_note ? <p className="product-hint">Gợi ý vị: {product.flavor_note}</p> : null}
            <strong className="modal-price">{formatVnd(selectedPrice)}</strong>
            {hasFlexibleSizePricing(product) ? (
              <p className="product-hint">Giá đang hiển thị cho size {getProductSizeLabel(customization.size_option).toLowerCase()}.</p>
            ) : null}
            <p className="product-hint">Đặt online áp dụng hình thức tự đến lấy hoặc giao tận nơi. Nếu muốn dùng tại quán, bạn có thể gọi trực tiếp tại quầy.</p>

            <ProductCustomizationFields
              productType={product.product_type}
              value={customization}
              onChange={(patch) => setCustomization((current) => ({ ...current, ...patch }))}
              showServingOptions={false}
            />

            {product.is_online_available ? (
              <button
                className="button primary"
                onClick={() => {
                  onAddToCart(product, customization);
                  onClose();
                }}
                type="button"
              >
                Thêm cấu hình này vào giỏ
              </button>
            ) : (
              <span className="badge muted">Tạm chưa mở đặt online</span>
            )}

            {relatedProducts.length ? (
              <div className="related-products">
                <h3>Uống kèm cũng hợp</h3>
                <div className="related-product-list rich">
                  {relatedProducts.map((item) => {
                    const itemImage = getProductImageUrl(item);
                    return (
                      <button
                        key={item.id}
                        className="related-product-card rich"
                        onClick={() => onSelectProduct(item)}
                        type="button"
                      >
                        {itemImage ? (
                          <img
                            src={itemImage}
                            alt={item.name}
                            className={isGeneratedProductImage(item) ? "generated-image" : ""}
                            onError={(event) => applyProductImageFallback(event, item.product_type)}
                          />
                        ) : null}
                        <span>{item.name}</span>
                        <small>{hasFlexibleSizePricing(item) ? `Từ ${formatVnd(getLowestDisplayedPrice(item))}` : formatVnd(item.price_vnd)}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MenuPage() {
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });
  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const addItem = useCartStore((state) => state.addItem);
  const pushToast = useToastStore((state) => state.pushToast);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const featuredProducts = useMemo(() => products.filter((product) => product.is_featured).slice(0, 5), [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.description ?? "").toLowerCase().includes(normalizedSearch) ||
        (product.flavor_note ?? "").toLowerCase().includes(normalizedSearch) ||
        (product.badge_text ?? "").toLowerCase().includes(normalizedSearch);
      const matchesType = typeFilter === "all" || product.product_type === typeFilter;
      const matchesFeatured = !featuredOnly || product.is_featured;
      return matchesSearch && matchesType && matchesFeatured;
    });
  }, [featuredOnly, products, searchTerm, typeFilter]);

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products
      .filter((product) => product.id !== selectedProduct.id)
      .filter(
        (product) =>
          product.category_id === selectedProduct.category_id || product.product_type === selectedProduct.product_type,
      )
      .sort((left, right) => Number(right.is_featured) - Number(left.is_featured))
      .slice(0, 4);
  }, [products, selectedProduct]);

  if (categoriesQuery.isLoading || productsQuery.isLoading) {
    return <StatePanel title="Đang mở thực đơn" message="KACoffee đang chuẩn bị thực đơn và các món nổi bật cho bạn." tone="loading" />;
  }

  if (categoriesQuery.isError || productsQuery.isError) {
    return (
      <StatePanel
        title="Chưa tải được thực đơn"
        message={getApiErrorMessage(
          productsQuery.error ?? categoriesQuery.error,
          "Đã có lỗi khi tải thực đơn. Vui lòng thử lại sau ít phút.",
        )}
        tone="error"
      />
    );
  }

  return (
    <section className="menu-shell">
      <section className="card reveal-up menu-hero-card">
        <p className="eyebrow">Thực đơn KACoffee</p>
        <h1>Chọn món theo gu vị, rồi tinh chỉnh theo đúng cách bạn muốn uống</h1>
        <p className="lead">
          Chọn món theo gu vị của bạn rồi tinh chỉnh size, đá, đường và ghi chú ngay trên web. Sau đó bạn chỉ cần chọn tự
          đến lấy hoặc giao tận nơi tại bước thanh toán.
        </p>
        <div className="menu-toolbar">
          <input
            className="menu-search"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên món, mô tả, badge hoặc gợi ý vị"
            value={searchTerm}
          />
          <div className="chip-row">
            <button
              className={typeFilter === "all" ? "button primary" : "button secondary"}
              onClick={() => setTypeFilter("all")}
              type="button"
            >
              Tất cả
            </button>
            <button
              className={typeFilter === "takeaway" ? "button primary" : "button secondary"}
              onClick={() => setTypeFilter("takeaway")}
              type="button"
            >
              Pha ly
            </button>
            <button
              className={typeFilter === "bottled" ? "button primary" : "button secondary"}
              onClick={() => setTypeFilter("bottled")}
              type="button"
            >
              Đóng chai
            </button>
            <button
              className={typeFilter === "in_shop" ? "button primary" : "button secondary"}
              onClick={() => setTypeFilter("in_shop")}
              type="button"
            >
              Signature
            </button>
            <button
              className={featuredOnly ? "button primary" : "button secondary"}
              onClick={() => setFeaturedOnly((value) => !value)}
              type="button"
            >
              Best seller
            </button>
          </div>
        </div>
      </section>

      {featuredProducts.length ? (
        <section className="card reveal-up">
          <div className="section-heading compact">
            <p className="eyebrow">Bán chạy trong ngày</p>
            <h2>Những món đang được khách gọi nhiều nhất</h2>
          </div>
          <div className="horizontal-product-strip">
            {featuredProducts.map((product) => {
              const productImage = getProductImageUrl(product);
              return (
                <button key={product.id} className="featured-menu-card" onClick={() => setSelectedProduct(product)} type="button">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={product.name}
                      className={isGeneratedProductImage(product) ? "generated-image" : ""}
                      onError={(event) => applyProductImageFallback(event, product.product_type)}
                    />
                  ) : null}
                    <div>
                      <span className="badge accent">{product.badge_text ?? "Nổi bật"}</span>
                      <strong>{product.name}</strong>
                      <small>{hasFlexibleSizePricing(product) ? `Từ ${formatVnd(getLowestDisplayedPrice(product))}` : formatVnd(product.price_vnd)}</small>
                    </div>
                  </button>
                );
            })}
          </div>
        </section>
      ) : null}

      <section className="card reveal-up">
        <div className="section-heading compact">
          <p className="eyebrow">Gợi ý mua kèm</p>
          <h2>Combo nhanh cho từng nhịp trong ngày</h2>
        </div>
        <div className="value-grid">
          {featuredCombos.map((combo) => (
            <article key={combo.title} className="combo-card polished">
              <strong>{combo.title}</strong>
              <p className="combo-subtitle">{combo.subtitle}</p>
              <p>{combo.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid">
        {categories.map((category, categoryIndex) => {
          const categoryProducts = filteredProducts.filter((product) => product.category_id === category.id);
          if (!categoryProducts.length) return null;

          return (
            <div key={category.id} className="card reveal-up" style={{ animationDelay: `${categoryIndex * 100}ms` }}>
              <div className="section-heading compact">
                <h2>{category.name}</h2>
                <p>{category.description}</p>
              </div>
              <div className="product-list">
                {categoryProducts.map((product, productIndex) => {
                  const productImage = getProductImageUrl(product);
                  return (
                    <article
                      key={product.id}
                      className="product-card media-card reveal-up clickable-card"
                      onClick={() => setSelectedProduct(product)}
                      role="button"
                      style={{ animationDelay: `${productIndex * 70}ms` }}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedProduct(product);
                        }
                      }}
                    >
                      <div className="product-thumb-wrap">
                        {productImage ? (
                          <img
                            className="product-thumb"
                            data-generated={isGeneratedProductImage(product) ? "true" : "false"}
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
                        <p className="product-meta">
                          {hasFlexibleSizePricing(product) ? `Từ ${formatVnd(getLowestDisplayedPrice(product))}` : formatVnd(product.price_vnd)}
                        </p>
                      </div>
                      <div className="product-card-actions">
                        {product.is_online_available ? (
                          <button
                            className="button primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedProduct(product);
                            }}
                            type="button"
                          >
                            Tùy chọn món
                          </button>
                        ) : (
                          <span className="badge muted">Tạm chưa mở đặt online</span>
                        )}
                        <button
                          className="button secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          type="button"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!filteredProducts.length ? (
        <section className="card empty-state">
          <StatePanel
            title="Chưa tìm thấy món phù hợp"
            message="Thử đổi từ khóa, bỏ bớt bộ lọc hoặc quay lại nhóm món bán chạy để xem thêm lựa chọn khác."
            action={
              <button
                className="button secondary"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setFeaturedOnly(false);
                }}
                type="button"
              >
                Xóa bộ lọc
              </button>
            }
          />
        </section>
      ) : null}

      {selectedProduct ? (
        <ProductQuickViewModal
          onAddToCart={(product, customization) => {
            addItem(product, customization);
            pushToast(`Đã thêm ${product.name} vào giỏ với cấu hình bạn vừa chọn.`, "success");
          }}
          onClose={() => setSelectedProduct(null)}
          onSelectProduct={(product) => setSelectedProduct(product)}
          product={selectedProduct}
          relatedProducts={relatedProducts}
        />
      ) : null}
    </section>
  );
}
