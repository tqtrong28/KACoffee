import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { StatePanel } from "../../components/common/StatePanel";
import { useCartStore } from "../../features/cart/cartStore";
import { useToastStore } from "../../features/toast/toastStore";
import { fetchBranches } from "../../services/catalogApi";
import { fetchAvailableDiscounts, validateDiscount } from "../../services/discountApi";
import { createOrder } from "../../services/orderApi";
import { fetchPublicSystemSettings } from "../../services/systemSettingsApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { getBranchOpenStatus } from "../../utils/branchStatus";
import { formatVnd } from "../../utils/format";
import {
  getFulfillmentMethodLabel,
  getIceLevelLabel,
  getProductSizeLabel,
  getSugarLevelLabel,
} from "../../utils/labels";

type CheckoutForm = {
  branch_id: number;
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

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
  const pushToast = useToastStore((state) => state.pushToast);
  const [localError, setLocalError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    defaultValues: {
      fulfillment_method: "pickup",
    },
  });

  const fulfillmentMethod = watch("fulfillment_method");
  const discountCode = watch("discount_code");
  const selectedBranchId = watch("branch_id");
  const formError = Object.values(errors)[0]?.message as string | undefined;
  const subtotal = items.reduce((sum, item) => sum + item.price_vnd * item.quantity, 0);
  const { data: publicSettings } = useQuery({
    queryKey: ["public-system-settings"],
    queryFn: fetchPublicSystemSettings,
  });
  const deliveryFee = fulfillmentMethod === "delivery" ? (publicSettings?.delivery_fee_vnd ?? 20_000) : 0;
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
  });
  const { data: availableDiscounts = [] } = useQuery({
    queryKey: ["checkout-discounts"],
    queryFn: fetchAvailableDiscounts,
  });

  useEffect(() => {
    if (!selectedBranchId && branches[0]) {
      setValue("branch_id", branches[0].id);
    }
  }, [branches, selectedBranchId, setValue]);

  const selectedBranch = branches.find((branch) => branch.id === Number(selectedBranchId));
  const branchStatus = getBranchOpenStatus(selectedBranch?.opening_hours);

  const discountPreview = useMutation({
    mutationFn: (code: string) => validateDiscount(code, subtotal),
  });

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      clear();
      pushToast(`Đơn ${order.order_no} đã được tạo thành công.`, "success");
      navigate(`/account/orders/${order.id}`);
    },
  });

  if (items.length === 0) {
    return (
      <section className="card">
        <div className="section-heading compact">
          <p className="eyebrow">Thanh toán</p>
          <h1>Bạn chưa có món nào để xác nhận đơn</h1>
        </div>
        <StatePanel
          title="Giỏ hàng đang chờ bạn chọn món"
          message="Hãy quay lại thực đơn, chọn vài món thật hợp gu rồi quay lại bước thanh toán. Mình sẽ giữ trải nghiệm ở đây thật gọn để chốt đơn nhanh."
          action={
            <Link to="/menu" className="button primary">
              Quay lại thực đơn
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="grid two-up order-experience-grid checkout-shell">
      <section className="card checkout-form-shell">
        <div className="section-heading compact">
          <p className="eyebrow">Thanh toán</p>
          <h1>Chốt chi nhánh, cách nhận hàng và thông tin người nhận</h1>
        </div>
        <p>Phương thức thanh toán hiện tại: thanh toán ngoại tuyến.</p>
        {publicSettings?.public_notice ? <p className="product-hint">{publicSettings.public_notice}</p> : null}
        <form
          onSubmit={handleSubmit((values) => {
            setLocalError("");
            mutation.mutate({
              ...values,
              items: items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                size_option: item.size_option,
                ice_level: item.ice_level,
                sugar_level: item.sugar_level,
                note: item.note || undefined,
              })),
            });
          })}
          className="stack-list checkout-form-layout"
        >
          <section className="card nested checkout-section">
            <div className="section-heading compact">
              <h2>Nhận hàng ở đâu</h2>
              <p className="product-hint">Chọn chi nhánh chuẩn bị đơn và cách nhận hàng phù hợp nhất.</p>
            </div>
            <div className="form-grid">
              <label className="form-field">
                <span>Chi nhánh chuẩn bị đơn</span>
                <select {...register("branch_id", { valueAsNumber: true, required: "Vui lòng chọn chi nhánh." })}>
                  <option value="">Chọn chi nhánh</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Hình thức nhận hàng</span>
                <select {...register("fulfillment_method")}>
                  <option value="pickup">Tự đến lấy</option>
                  <option value="delivery">Giao hàng (chỉ Hà Nội)</option>
                </select>
              </label>
            </div>
          </section>

          <section className="card nested checkout-section">
            <div className="section-heading compact">
              <h2>Thông tin người nhận</h2>
              <p className="product-hint">Tên và số điện thoại sẽ giúp chi nhánh chuẩn bị đơn thật nhanh.</p>
            </div>
            <div className="form-grid">
              <label className="form-field">
                <span>Tên người nhận</span>
                <input
                  {...register("recipient_name", { required: "Vui lòng nhập tên người nhận." })}
                  placeholder="Tên người nhận"
                />
              </label>
              <label className="form-field">
                <span>Số điện thoại người nhận</span>
                <input
                  {...register("recipient_phone", { required: "Vui lòng nhập số điện thoại người nhận." })}
                  placeholder="Số điện thoại người nhận"
                />
              </label>
            </div>
          </section>

          {fulfillmentMethod === "delivery" ? (
            <section className="card nested checkout-section">
              <div className="section-heading compact">
                <h2>Địa chỉ giao hàng</h2>
                <p className="product-hint">KACoffee hiện hỗ trợ giao hàng trong nội thành Hà Nội.</p>
              </div>
              <div className="form-grid">
                <label className="form-field">
                  <span>Địa chỉ cụ thể</span>
                  <input {...register("address_line")} placeholder="Số nhà, tên đường..." />
                </label>
                <label className="form-field">
                  <span>Phường/Xã</span>
                  <input {...register("ward")} placeholder="Phường/Xã" />
                </label>
                <label className="form-field">
                  <span>Quận/Huyện</span>
                  <input {...register("district")} placeholder="Quận/Huyện" />
                </label>
                <label className="form-field">
                  <span>Tỉnh/Thành phố</span>
                  <input {...register("city")} placeholder="Tỉnh/Thành phố" />
                </label>
              </div>
            </section>
          ) : (
            <section className="card nested checkout-section">
              <div className="section-heading compact">
                <h2>Tự đến lấy tại quán</h2>
                <p className="product-hint">
                  Sau khi đơn chuyển sang trạng thái sẵn sàng, bạn chỉ cần ghé chi nhánh đã chọn để nhận món.
                </p>
              </div>
            </section>
          )}

          <section className="card nested checkout-section">
            <div className="section-heading compact">
              <h2>Mã giảm giá và ghi chú</h2>
              <p className="product-hint">Nếu có mã ưu đãi, mình có thể xem trước ngay tại đây.</p>
            </div>
            <div className="inline-actions checkout-discount-row">
              <input {...register("discount_code")} placeholder="Mã giảm giá" />
              <button
                className="button secondary"
                onClick={() => {
                  if (discountCode) discountPreview.mutate(discountCode);
                }}
                type="button"
              >
                Xem thử ưu đãi
              </button>
            </div>
            <textarea {...register("note")} placeholder="Ghi chú cho toàn bộ đơn hàng" rows={4} />
          </section>

          <div className="checkout-submit-row">
            <button className="button primary" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Đang tạo đơn..." : "Đặt hàng ngay"}
            </button>
          </div>
        </form>
        {formError ? <p className="error">{formError}</p> : null}
        {!formError && localError ? <p className="error">{localError}</p> : null}
        {!formError && !localError && mutation.isError ? (
          <p className="error">
            {getApiErrorMessage(mutation.error, "Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin bắt buộc.")}
          </p>
        ) : null}
        {discountPreview.isError ? (
          <p className="error">
            {getApiErrorMessage(
              discountPreview.error,
              "Mã giảm giá không hợp lệ với hạng thành viên hoặc giá trị đơn hiện tại.",
            )}
          </p>
        ) : null}
      </section>

      <aside className="card cart-summary-card checkout-summary-shell">
        <div className="section-heading compact">
          <p className="eyebrow">Đơn sắp đặt</p>
          <h2>Tóm tắt trước khi xác nhận</h2>
        </div>
        {selectedBranch ? (
          <div className="card nested branch-preview-card">
            <strong>{selectedBranch.name}</strong>
            {selectedBranch.address ? <p>{selectedBranch.address}</p> : null}
            {selectedBranch.opening_hours ? <p>Giờ mở cửa: {selectedBranch.opening_hours}</p> : null}
            {branchStatus ? <span className={`badge status-${branchStatus.tone}`}>{branchStatus.label}</span> : null}
            <p className="product-hint">Hình thức nhận: {getFulfillmentMethodLabel(fulfillmentMethod)}</p>
          </div>
        ) : (
          <p className="product-hint">Bạn chưa chọn chi nhánh chuẩn bị đơn.</p>
        )}

        <div className="stack-list compact-stack">
          {items.map((item) => (
            <div key={item.line_id} className="mini-order-line">
              <div>
                <strong>{item.name}</strong>
                <p className="product-hint">
                  {item.quantity} x {formatVnd(item.price_vnd)}
                </p>
                <p className="product-hint">
                  {getProductSizeLabel(item.size_option)} · {getIceLevelLabel(item.ice_level)} · {getSugarLevelLabel(item.sugar_level)}
                </p>
                {item.note ? <p className="product-hint">Ghi chú: {item.note}</p> : null}
              </div>
              <strong>{formatVnd(item.price_vnd * item.quantity)}</strong>
            </div>
          ))}
        </div>

        <div className="card nested">
          <p>Tạm tính: {formatVnd(subtotal)}</p>
          <p>Giảm giá: {formatVnd(discountPreview.data?.discount_amount_vnd ?? 0)}</p>
          <p>Phí giao hàng: {formatVnd(deliveryFee)}</p>
          <p className="order-total">Tổng cộng: {formatVnd((discountPreview.data?.final_subtotal_vnd ?? subtotal) + deliveryFee)}</p>
          {availableDiscounts.length ? (
            <p className="product-hint">Mã hiện có: {availableDiscounts.map((discount) => discount.code).join(", ")}</p>
          ) : null}
          <p className="product-hint">Đặt online chỉ áp dụng tự đến lấy hoặc giao tận nơi. Nếu bạn muốn dùng tại quán, KACoffee luôn sẵn sàng phục vụ trực tiếp tại chi nhánh.</p>
        </div>
      </aside>
    </section>
  );
}
