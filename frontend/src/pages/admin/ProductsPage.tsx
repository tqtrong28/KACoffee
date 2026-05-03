import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createProduct, updateProduct } from "../../services/adminApi";
import { fetchCategories, fetchProducts } from "../../services/catalogApi";
import type { Product } from "../../types/models";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatVnd } from "../../utils/format";
import { getProductTypeLabel } from "../../utils/labels";
import { applyProductImageFallback, getProductImageUrl } from "../../utils/productMedia";
import { getLowestDisplayedPrice, hasFlexibleSizePricing } from "../../utils/productPricing";

type FormValues = {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  badge_text?: string;
  flavor_note?: string;
  product_type: "takeaway" | "bottled" | "in_shop";
  price_vnd: number;
  small_price_vnd?: number;
  large_price_vnd?: number;
  is_featured: boolean;
  is_active: boolean;
  is_online_available: boolean;
  is_in_store_available: boolean;
};

function productToFormValues(product?: Product | null): FormValues {
  return {
    category_id: product?.category_id ?? 0,
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    image_url: product?.image_url ?? "",
    badge_text: product?.badge_text ?? "",
    flavor_note: product?.flavor_note ?? "",
    product_type: product?.product_type ?? "takeaway",
    price_vnd: product?.price_vnd ?? 0,
    small_price_vnd: product?.small_price_vnd ?? undefined,
    large_price_vnd: product?.large_price_vnd ?? undefined,
    is_featured: product?.is_featured ?? false,
    is_active: product?.is_active ?? true,
    is_online_available: product?.is_online_available ?? true,
    is_in_store_available: product?.is_in_store_available ?? true,
  };
}

export function ProductsPage() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const { data: categories = [] } = useQuery({ queryKey: ["product-categories"], queryFn: fetchCategories });
  const { data: products = [], refetch } = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchProducts() });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: productToFormValues(),
  });
  const formError = Object.values(errors)[0]?.message as string | undefined;

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const smallPrice =
        values.small_price_vnd === undefined || Number.isNaN(values.small_price_vnd) ? null : Number(values.small_price_vnd);
      const largePrice =
        values.large_price_vnd === undefined || Number.isNaN(values.large_price_vnd) ? null : Number(values.large_price_vnd);
      const payload = {
        ...values,
        category_id: Number(values.category_id),
        price_vnd: Number(values.price_vnd),
        small_price_vnd: smallPrice,
        large_price_vnd: largePrice,
        image_url: values.image_url || undefined,
        badge_text: values.badge_text || undefined,
        flavor_note: values.flavor_note || undefined,
        track_inventory: values.product_type === "bottled",
        inventory_qty: values.product_type === "bottled" ? 100 : 0,
      };
      return editingProduct ? updateProduct(editingProduct.id, payload) : createProduct(payload);
    },
    onSuccess: async () => {
      setEditingProduct(null);
      reset(productToFormValues());
      await refetch();
    },
  });

  const filteredProducts = products.filter((product) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.slug.toLowerCase().includes(normalizedQuery) ||
      (product.badge_text ?? "").toLowerCase().includes(normalizedQuery) ||
      product.category_name.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <section>
      <h1>Sản phẩm</h1>
      <div className="grid two-up">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="card form-stack">
          <select {...register("category_id", { valueAsNumber: true, required: "Vui lòng chọn danh mục." })}>
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input {...register("name", { required: "Vui lòng nhập tên sản phẩm." })} placeholder="Tên sản phẩm" />
          <input {...register("slug", { required: "Vui lòng nhập slug." })} placeholder="Slug" />
          <input {...register("image_url")} placeholder="URL hình ảnh công khai" />
          <input {...register("badge_text")} placeholder="Badge marketing, ví dụ Bán chạy / Mới / Đậm vị" />
          <input {...register("flavor_note")} placeholder="Ghi chú vị, ví dụ Êm vị, hậu ngọt nhẹ" />
          <textarea {...register("description")} placeholder="Mô tả" rows={4} />
          <select {...register("product_type", { required: "Vui lòng chọn loại sản phẩm." })}>
            <option value="takeaway">Pha ly</option>
            <option value="bottled">Đóng chai</option>
            <option value="in_shop">Signature</option>
          </select>
          <input
            {...register("price_vnd", { valueAsNumber: true, required: "Vui lòng nhập giá bán." })}
            type="number"
            placeholder="Giá size vừa (VND)"
          />
          <div className="form-grid compact-grid">
            <input
              {...register("small_price_vnd", { valueAsNumber: true })}
              type="number"
              placeholder="Giá size nhỏ (không bắt buộc)"
            />
            <input
              {...register("large_price_vnd", { valueAsNumber: true })}
              type="number"
              placeholder="Giá size lớn (không bắt buộc)"
            />
          </div>
          <div className="form-grid compact-grid">
            <label className="inline-actions">
              <input type="checkbox" {...register("is_featured")} />
              <span>Hiển thị ở mục nổi bật / best seller</span>
            </label>
            <label className="inline-actions">
              <input type="checkbox" {...register("is_active")} />
              <span>Sản phẩm đang hoạt động</span>
            </label>
            <label className="inline-actions">
              <input type="checkbox" {...register("is_online_available")} />
              <span>Cho phép đặt online</span>
            </label>
            <label className="inline-actions">
              <input type="checkbox" {...register("is_in_store_available")} />
              <span>Cho phép bán tại quầy</span>
            </label>
          </div>
          <div className="inline-actions">
            <button className="button primary" type="submit">
              {editingProduct ? "Lưu sản phẩm" : "Tạo sản phẩm"}
            </button>
            {editingProduct ? (
              <button
                className="button secondary"
                onClick={() => {
                  setEditingProduct(null);
                  reset(productToFormValues());
                }}
                type="button"
              >
                Hủy chỉnh sửa
              </button>
            ) : null}
          </div>
          {formError ? <p className="error">{formError}</p> : null}
          {!formError && mutation.isError ? (
            <p className="error">{getApiErrorMessage(mutation.error, "Không thể lưu sản phẩm.")}</p>
          ) : null}
        </form>
        <div className="card">
          <h2>Danh sách sản phẩm</h2>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, slug, badge hoặc danh mục" />
          <ul className="stack-list">
            {filteredProducts.map((product) => (
              <li key={product.id} className="product-card media-card compact">
                <div className="product-thumb-wrap small">
                  {getProductImageUrl(product) ? (
                    <img
                      className="product-thumb"
                      src={getProductImageUrl(product)!}
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
                  <strong>{product.name}</strong>
                  <p className="product-meta">
                    {getProductTypeLabel(product.product_type)} · {hasFlexibleSizePricing(product) ? `Từ ${formatVnd(getLowestDisplayedPrice(product))}` : formatVnd(product.price_vnd)}
                  </p>
                  {product.small_price_vnd != null || product.large_price_vnd != null ? (
                    <p className="product-hint">
                      Size: nhỏ {formatVnd(product.small_price_vnd ?? product.price_vnd)} · vừa {formatVnd(product.price_vnd)} · lớn{" "}
                      {formatVnd(product.large_price_vnd ?? product.price_vnd)}
                    </p>
                  ) : null}
                  {product.badge_text ? <p className="product-hint">Badge: {product.badge_text}</p> : null}
                  {product.flavor_note ? <p className="product-hint">Vị gợi ý: {product.flavor_note}</p> : null}
                  <div className="chip-row">
                    {product.is_featured ? <span className="badge">Nổi bật</span> : null}
                    {!product.is_active ? <span className="badge muted">Tạm ẩn</span> : null}
                    {product.is_online_available ? <span className="badge">Online</span> : <span className="badge muted">Tại quán</span>}
                  </div>
                </div>
                <div className="inline-actions branch-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setEditingProduct(product);
                      reset(productToFormValues(product));
                    }}
                    type="button"
                  >
                    Sửa
                  </button>
                </div>
              </li>
            ))}
            {filteredProducts.length === 0 ? <li>Không có sản phẩm nào khớp bộ lọc hiện tại.</li> : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
