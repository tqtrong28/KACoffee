import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { ProductCustomizationFields } from "../../components/common/ProductCustomizationFields";
import { useToastStore } from "../../features/toast/toastStore";
import { fetchProducts } from "../../services/catalogApi";
import { createStaffOrder, searchCustomerByPhone } from "../../services/staffApi";
import { fetchPublicSystemSettings } from "../../services/systemSettingsApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatVnd } from "../../utils/format";
import { getProductTypeLabel } from "../../utils/labels";
import { getDefaultCustomization, type ProductCustomization } from "../../utils/productOptions";
import { getLowestDisplayedPrice, getUnitPriceForSize, hasFlexibleSizePricing } from "../../utils/productPricing";

type FormValues = {
  source: "in_store" | "phone";
  customer_phone?: string;
  fulfillment_method: "pickup" | "delivery";
  recipient_name: string;
  recipient_phone: string;
  address_line?: string;
  ward?: string;
  district?: string;
  city?: string;
  discount_code?: string;
  note?: string;
};

type LineItem = Omit<ProductCustomization, "serving_option"> & {
  line_id: string;
  product_id: number;
  quantity: number;
  serving_option: "dine_in" | "takeaway";
};

function createLineId(productId: number) {
  return `${productId}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
}

export function InStoreOrderPage() {
  const { data: products = [] } = useQuery({ queryKey: ["staff-products"], queryFn: () => fetchProducts() });
  const { data: publicSettings } = useQuery({
    queryKey: ["public-system-settings"],
    queryFn: fetchPublicSystemSettings,
  });
  const pushToast = useToastStore((state) => state.pushToast);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [memberSummary, setMemberSummary] = useState<string>("");
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      source: "in_store",
      fulfillment_method: "pickup",
    },
  });
  const formError = Object.values(errors)[0]?.message as string | undefined;

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const product = products.find((item) => item.id === line.product_id);
        return sum + (product ? getUnitPriceForSize(product, line.size_option) : 0) * line.quantity;
      }, 0),
    [lines, products],
  );

  const lookupMutation = useMutation({
    mutationFn: searchCustomerByPhone,
    onSuccess: (customer) => {
      setMemberSummary(`${customer.full_name} · ${customer.membership_rank} · ${customer.total_points} điểm`);
      setValue("recipient_name", customer.full_name);
      setValue("recipient_phone", customer.phone);
    },
    onError: () => setMemberSummary("Không tìm thấy thành viên"),
  });

  const createMutation = useMutation({
    mutationFn: createStaffOrder,
    onSuccess: () => {
      setLines([]);
      setMemberSummary("Tạo đơn thành công");
      pushToast("Đã tạo đơn tại quầy thành công.", "success");
    },
  });

  const availableProducts = products.filter((product) => product.is_in_store_available);
  const fulfillmentMethod = watch("fulfillment_method");

  return (
    <section className="card">
      <h1>Tạo đơn tại quầy / qua điện thoại</h1>
      <form
        onSubmit={handleSubmit((values) =>
          createMutation.mutate({
            ...values,
            items: lines.map((line) => ({
              product_id: line.product_id,
              quantity: line.quantity,
              serving_option: line.serving_option,
              size_option: line.size_option,
              ice_level: line.ice_level,
              sugar_level: line.sugar_level,
              note: line.note || undefined,
            })),
          }),
        )}
        className="form-grid"
      >
        <select {...register("source")}>
          <option value="in_store">Tại quầy</option>
          <option value="phone">Điện thoại</option>
        </select>
        <div className="inline-actions">
          <input {...register("customer_phone")} placeholder="Số điện thoại thành viên (không bắt buộc)" />
          <button
            className="button secondary"
            onClick={() => {
              const phone = getValues("customer_phone");
              if (phone) lookupMutation.mutate(phone);
            }}
            type="button"
          >
            Tìm thành viên
          </button>
        </div>
        {memberSummary ? <p className="badge">{memberSummary}</p> : null}
        <select {...register("fulfillment_method")}>
          <option value="pickup">Tự đến lấy</option>
          <option value="delivery">Giao hàng</option>
        </select>
        <input {...register("recipient_name", { required: "Vui lòng nhập tên người nhận." })} placeholder="Tên người nhận" />
        <input {...register("recipient_phone", { required: "Vui lòng nhập số điện thoại người nhận." })} placeholder="Số điện thoại người nhận" />
        <input {...register("address_line")} placeholder="Địa chỉ cụ thể" />
        <input {...register("ward")} placeholder="Phường/Xã" />
        <input {...register("district")} placeholder="Quận/Huyện" />
        <input {...register("city")} placeholder="Tỉnh/Thành phố" />
        <input {...register("discount_code")} placeholder="Mã giảm giá (nếu có)" />
        <textarea {...register("note")} placeholder="Ghi chú chung của đơn" rows={4} />
        <div className="card nested">
          <h2>Thêm sản phẩm</h2>
          <div className="inline-actions">
            <select onChange={(event) => setSelectedProductId(Number(event.target.value))} defaultValue="">
              <option value="" disabled>
                Chọn sản phẩm
              </option>
              {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                  {product.name} · {hasFlexibleSizePricing(product) ? `Từ ${formatVnd(getLowestDisplayedPrice(product))}` : formatVnd(product.price_vnd)}
              </option>
              ))}
            </select>
            <button
              className="button secondary"
              onClick={() => {
                if (!selectedProductId) return;
                const product = availableProducts.find((item) => item.id === selectedProductId);
                if (!product) return;
                setLines((current) => [
                  ...current,
                  {
                    line_id: createLineId(selectedProductId),
                    product_id: selectedProductId,
                    quantity: 1,
                    ...(getDefaultCustomization(product, { includeServingOption: true }) as ProductCustomization & {
                      serving_option: "dine_in" | "takeaway";
                    }),
                  },
                ]);
              }}
              type="button"
            >
              Thêm
            </button>
          </div>
          <div className="stack-list">
            {lines.map((line) => {
              const product = products.find((item) => item.id === line.product_id);
              if (!product) return null;
              return (
                <div key={line.line_id} className="product-card cart-line-card">
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p>{getProductTypeLabel(product.product_type)}</p>
                    <ProductCustomizationFields
                      compact
                      productType={product.product_type}
                      value={line}
                      showServingOptions
                      onChange={(patch) =>
                        setLines((current) =>
                          current.map((item) => (item.line_id === line.line_id ? { ...item, ...patch } : item)),
                        )
                      }
                    />
                  </div>
                  <div className="stack-list align-end">
                    <strong>{formatVnd(getUnitPriceForSize(product, line.size_option) * line.quantity)}</strong>
                    <label className="quantity-field">
                      <span>Số lượng</span>
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(event) =>
                          setLines((current) =>
                            current.map((item) =>
                              item.line_id === line.line_id ? { ...item, quantity: Number(event.target.value) } : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      className="button secondary"
                      onClick={() => setLines((current) => current.filter((item) => item.line_id !== line.line_id))}
                      type="button"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p>Tạm tính: {formatVnd(subtotal)}</p>
          <p>Phí giao hàng dự kiến: {formatVnd(fulfillmentMethod === "delivery" ? (publicSettings?.delivery_fee_vnd ?? 20_000) : 0)}</p>
        </div>
        <button className="button primary" disabled={lines.length === 0} type="submit">
          Tạo đơn hàng
        </button>
      </form>
      {formError ? <p className="error">{formError}</p> : null}
      {!formError && createMutation.isError ? (
        <p className="error">
          {getApiErrorMessage(createMutation.error, "Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin và quy tắc nghiệp vụ.")}
        </p>
      ) : null}
    </section>
  );
}
