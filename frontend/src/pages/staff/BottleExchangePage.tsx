import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { createBottleExchange } from "../../services/bottleExchangeApi";
import { fetchProducts } from "../../services/catalogApi";
import { getApiErrorMessage } from "../../utils/apiError";

type FormValues = {
  customer_phone?: string;
  returned_bottle_qty: number;
  reward_product_id: number;
  note?: string;
};

export function BottleExchangePage() {
  const { data: products = [] } = useQuery({ queryKey: ["catalog-products"], queryFn: () => fetchProducts() });
  const bottledProducts = products.filter((product) => product.product_type === "bottled" && product.is_in_store_available);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      returned_bottle_qty: 5
    }
  });
  const formError = Object.values(errors)[0]?.message as string | undefined;

  useEffect(() => {
    if (bottledProducts[0]) {
      setValue("reward_product_id", bottledProducts[0].id);
    }
  }, [bottledProducts, setValue]);

  const mutation = useMutation({
    mutationFn: createBottleExchange,
    onSuccess: () => reset({ returned_bottle_qty: 5, reward_product_id: bottledProducts[0]?.id ?? 0 })
  });

  return (
    <section className="grid two-up">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="card form-stack">
        <h1>Đổi vỏ chai</h1>
        <p>Quy tắc: cứ 5 vỏ chai đổi được 1 chai cà phê miễn phí. Quà tặng miễn phí không cộng điểm thành viên.</p>
        <input {...register("customer_phone")} placeholder="Số điện thoại khách hàng (không bắt buộc)" />
        <input
          {...register("returned_bottle_qty", {
            valueAsNumber: true,
            required: "Vui lòng nhập số lượng vỏ chai."
          })}
          type="number"
          min={5}
          step={5}
        />
        <select
          {...register("reward_product_id", {
            valueAsNumber: true,
            required: "Vui lòng chọn sản phẩm tặng."
          })}
        >
          {bottledProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <textarea {...register("note")} placeholder="Ghi chú nội bộ" rows={4} />
        <button className="button primary" disabled={bottledProducts.length === 0} type="submit">
          Lưu lượt đổi
        </button>
        {mutation.data ? (
          <p className="badge">
            Đã lưu lượt đổi: {mutation.data.reward_quantity} {mutation.data.reward_product_name_snapshot} miễn phí
          </p>
        ) : null}
        {formError ? <p className="error">{formError}</p> : null}
        {!formError && mutation.isError ? (
          <p className="error">
            {getApiErrorMessage(mutation.error, "Không thể lưu lượt đổi. Số lượng vỏ chai phải là bội số của 5.")}
          </p>
        ) : null}
      </form>
      <div className="card">
        <h2>Sản phẩm đủ điều kiện làm quà tặng</h2>
        <div className="stack-list">
          {bottledProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
              </div>
            </div>
          ))}
        </div>
        {bottledProducts.length === 0 ? <p className="product-hint">Hãy thêm ít nhất một sản phẩm đóng chai trước khi dùng màn hình này.</p> : null}
      </div>
    </section>
  );
}
