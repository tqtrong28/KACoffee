import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { createDiscount, fetchAdminDiscounts } from "../../services/discountApi";
import { fetchMembershipRanks } from "../../services/customerApi";
import { getApiErrorMessage } from "../../utils/apiError";

type FormValues = {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  value: number;
  min_order_value_vnd?: number;
  eligible_rank_ids: number[];
};

export function DiscountsPage() {
  const { data: discounts = [], refetch } = useQuery({ queryKey: ["admin-discounts"], queryFn: fetchAdminDiscounts });
  const { data: ranks = [] } = useQuery({ queryKey: ["membership-ranks"], queryFn: fetchMembershipRanks });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      discount_type: "percentage",
      eligible_rank_ids: []
    }
  });
  const formError = Object.values(errors)[0]?.message as string | undefined;

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createDiscount({
        ...values,
        value: Number(values.value),
        min_order_value_vnd: values.min_order_value_vnd ? Number(values.min_order_value_vnd) : undefined,
        is_active: true,
        eligible_rank_ids: values.eligible_rank_ids.map(Number)
      }),
    onSuccess: async () => {
      reset();
      await refetch();
    }
  });

  return (
    <section>
      <h1>Khuyến mãi</h1>
      <div className="grid two-up">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="card form-stack">
          <input {...register("code", { required: "Vui lòng nhập mã giảm giá." })} placeholder="Mã giảm giá" />
          <textarea {...register("description")} placeholder="Mô tả" rows={4} />
          <select {...register("discount_type", { required: "Vui lòng chọn loại giảm giá." })}>
            <option value="percentage">Theo phần trăm</option>
            <option value="fixed">Giảm số tiền cố định</option>
          </select>
          <input {...register("value", { valueAsNumber: true, required: "Vui lòng nhập giá trị giảm." })} type="number" placeholder="Giá trị giảm" />
          <input {...register("min_order_value_vnd", { valueAsNumber: true })} type="number" placeholder="Đơn tối thiểu" />
          <div className="stack-list">
            {ranks.map((rank) => (
              <label key={rank.id} className="inline-actions">
                <input type="checkbox" value={rank.id} {...register("eligible_rank_ids")} />
                <span>{rank.name}</span>
              </label>
            ))}
          </div>
          <button className="button primary" type="submit">
            Tạo khuyến mãi
          </button>
          {formError ? <p className="error">{formError}</p> : null}
          {!formError && mutation.isError ? (
            <p className="error">{getApiErrorMessage(mutation.error, "Không thể tạo khuyến mãi.")}</p>
          ) : null}
        </form>
        <div className="card">
          <h2>Danh sách khuyến mãi</h2>
          <ul className="stack-list">
            {discounts.map((discount) => (
              <li key={discount.id}>
                <strong>{discount.code}</strong> · {discount.discount_type === "percentage" ? "Phần trăm" : "Cố định"} · {discount.value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
