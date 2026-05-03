import { Link } from "react-router-dom";

import { StatePanel } from "../../components/common/StatePanel";
import { ProductCustomizationFields } from "../../components/common/ProductCustomizationFields";
import { useCartStore } from "../../features/cart/cartStore";
import { formatVnd } from "../../utils/format";
import { getIceLevelLabel, getProductSizeLabel, getProductTypeLabel, getSugarLevelLabel } from "../../utils/labels";

export function CartPage() {
  const { items, updateLine, updateQuantity, removeItem } = useCartStore();
  const subtotal = items.reduce((sum, item) => sum + item.price_vnd * item.quantity, 0);

  return (
    <section className="grid two-up order-experience-grid">
      <section className="card">
        <div className="section-heading compact">
          <p className="eyebrow">Giỏ hàng hiện tại</p>
          <h1>Chọn lại từng món thật đúng ý trước khi thanh toán</h1>
        </div>
        {items.length === 0 ? (
          <StatePanel
            title="Giỏ hàng đang trống"
            message="Bạn chưa thêm món nào vào giỏ. KACoffee đã chuẩn bị sẵn thực đơn để mình chọn tiếp thật nhanh."
            action={
              <Link to="/menu" className="button primary">
                Xem thực đơn
              </Link>
            }
          />
        ) : (
          <div className="stack-list">
            {items.map((item) => (
              <div key={item.line_id} className="product-card cart-line-card admin-record-card">
                <div className="product-details cart-line-main">
                  <h3>{item.name}</h3>
                  <p>
                    {getProductTypeLabel(item.product_type)} · {formatVnd(item.price_vnd)}
                  </p>
                  <p className="product-hint">
                    {getProductSizeLabel(item.size_option)} · {getIceLevelLabel(item.ice_level)} · {getSugarLevelLabel(item.sugar_level)}
                  </p>
                  {item.note ? <p className="product-hint">Ghi chú: {item.note}</p> : null}
                  <ProductCustomizationFields
                    compact
                    productType={item.product_type}
                    value={{
                      size_option: item.size_option,
                      ice_level: item.ice_level,
                      sugar_level: item.sugar_level,
                      note: item.note,
                    }}
                    onChange={(patch) => updateLine(item.line_id, patch)}
                    showServingOptions={false}
                  />
                </div>
                <div className="stack-list cart-line-controls">
                  <div className="record-total-block">
                    <span className="product-hint">Thành tiền</span>
                    <strong>{formatVnd(item.price_vnd * item.quantity)}</strong>
                  </div>
                  <label className="quantity-field">
                    <span>Số lượng</span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.line_id, Number(event.target.value))}
                    />
                  </label>
                  <button className="button secondary" onClick={() => removeItem(item.line_id)} type="button">
                    Xóa món
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="card cart-summary-card">
        <div className="section-heading compact">
          <p className="eyebrow">Tóm tắt trước thanh toán</p>
          <h2>Kiểm tra nhanh trước khi sang bước chọn chi nhánh</h2>
        </div>
        <div className="summary-fact-grid">
          <div className="summary-fact-card">
            <strong>{items.length}</strong>
            <span>Dòng món đang chờ xác nhận</span>
          </div>
          <div className="summary-fact-card">
            <strong>Pickup / Delivery</strong>
            <span>Chọn hình thức nhận ở bước tiếp theo</span>
          </div>
          <div className="summary-fact-card">
            <strong>Hà Nội</strong>
            <span>Giao tận nơi trong khu vực đang hỗ trợ</span>
          </div>
        </div>
        <p className="product-hint">Các tuỳ chọn size, đá, đường và ghi chú sẽ được giữ nguyên khi bạn sang bước thanh toán.</p>
        <p className="order-total">Tạm tính: {formatVnd(subtotal)}</p>
        <div className="stack-list cart-summary-actions">
          <Link to="/menu" className="button secondary">
            Chọn thêm món
          </Link>
          <Link to="/checkout" className="button primary">
            Sang bước thanh toán
          </Link>
        </div>
      </aside>
    </section>
  );
}
