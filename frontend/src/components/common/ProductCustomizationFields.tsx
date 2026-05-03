import type { IceLevel, ProductSize, ProductType, ServingOption, SugarLevel } from "../../types/models";
import { supportsDrinkAdjustments } from "../../utils/productOptions";

type CustomValue = {
  serving_option?: ServingOption;
  size_option: ProductSize;
  ice_level: IceLevel;
  sugar_level: SugarLevel;
  note: string;
};

export function ProductCustomizationFields({
  productType,
  value,
  onChange,
  compact = false,
  showServingOptions = false,
}: {
  productType: ProductType;
  value: CustomValue;
  onChange: (patch: Partial<CustomValue>) => void;
  compact?: boolean;
  showServingOptions?: boolean;
}) {
  const allowAdjustments = supportsDrinkAdjustments({ product_type: productType });
  const servingOption = value.serving_option ?? "takeaway";

  return (
    <div className={`customization-shell ${compact ? "compact" : ""}`}>
      {showServingOptions ? (
        <div className="customization-group">
          <span className="product-hint">Phục vụ theo cách</span>
          <div className="chip-row">
            {(["dine_in", "takeaway"] as ServingOption[]).map((option) => (
              <button
                key={option}
                className={servingOption === option ? "button primary" : "button secondary"}
                onClick={() => onChange({ serving_option: option })}
                type="button"
              >
                {option === "dine_in" ? "Tại chỗ" : "Mang về"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {allowAdjustments ? (
        <div className="customization-grid">
          <label className="customization-field">
            <span>Size</span>
            <select value={value.size_option} onChange={(event) => onChange({ size_option: event.target.value as ProductSize })}>
              <option value="small">Nhỏ</option>
              <option value="medium">Vừa</option>
              <option value="large">Lớn</option>
            </select>
          </label>
          <label className="customization-field">
            <span>Đá</span>
            <select value={value.ice_level} onChange={(event) => onChange({ ice_level: event.target.value as IceLevel })}>
              <option value="no_ice">Không đá</option>
              <option value="less_ice">Ít đá</option>
              <option value="normal_ice">Đá bình thường</option>
            </select>
          </label>
          <label className="customization-field">
            <span>Đường</span>
            <select value={value.sugar_level} onChange={(event) => onChange({ sugar_level: event.target.value as SugarLevel })}>
              <option value="no_sugar">Không đường</option>
              <option value="less_sugar">Ít đường</option>
              <option value="normal_sugar">Đường bình thường</option>
            </select>
          </label>
        </div>
      ) : (
        <p className="product-hint">Dòng đóng chai giữ công thức chuẩn của quán, không cần chỉnh size, đá hay đường.</p>
      )}

      <label className="customization-field">
        <span>Ghi chú cho món</span>
        <textarea
          rows={compact ? 2 : 3}
          value={value.note}
          placeholder="Ví dụ: pha nhạt hơn một chút, thêm ống hút giấy..."
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </label>
    </div>
  );
}
