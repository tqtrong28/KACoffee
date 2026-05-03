import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { StatePanel } from "../../components/common/StatePanel";
import { fetchAdminSystemSettings, updateAdminSystemSettings } from "../../services/systemSettingsApi";
import { getApiErrorMessage } from "../../utils/apiError";

type FormValues = {
  site_title: string;
  brand_headline: string;
  brand_subheadline: string;
  support_phone?: string;
  support_email?: string;
  delivery_fee_vnd: number;
  public_notice?: string;
};

export function SystemSettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ["admin-system-settings"],
    queryFn: fetchAdminSystemSettings,
  });
  const { data: settings, refetch } = settingsQuery;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();
  const formError = Object.values(errors)[0]?.message as string | undefined;

  useEffect(() => {
    if (!settings) return;
    reset({
      site_title: settings.site_title,
      brand_headline: settings.brand_headline,
      brand_subheadline: settings.brand_subheadline,
      support_phone: settings.support_phone ?? "",
      support_email: settings.support_email ?? "",
      delivery_fee_vnd: settings.delivery_fee_vnd,
      public_notice: settings.public_notice ?? "",
    });
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: updateAdminSystemSettings,
    onSuccess: async () => {
      await refetch();
    },
  });

  return (
    <section>
      <div className="section-heading compact">
        <p className="eyebrow">Cấu hình hệ thống</p>
        <h1>Chỉnh nhanh những thông tin nền của thương hiệu KACoffee</h1>
        <p className="product-hint">Từ trang chủ đến phí giao hàng, mọi thay đổi ở đây sẽ ảnh hưởng trực tiếp đến trải nghiệm khách hàng.</p>
      </div>
      {settingsQuery.isLoading ? (
        <StatePanel
          title="Đang tải cấu hình hệ thống"
          message="KACoffee đang lấy các giá trị hiện tại để bạn chỉnh sửa thật an toàn."
          tone="loading"
        />
      ) : null}
      {!settingsQuery.isLoading && settingsQuery.error ? (
        <StatePanel
          title="Không thể tải cấu hình hệ thống"
          message={getApiErrorMessage(settingsQuery.error, "Có lỗi khi tải cấu hình hệ thống. Vui lòng thử lại sau.")}
          tone="error"
        />
      ) : null}
      {!settingsQuery.isLoading && !settingsQuery.error ? (
        <div className="grid two-up">
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="card form-stack">
            <div className="section-heading compact">
              <h2>Thiết lập hiển thị</h2>
              <p className="product-hint">Cập nhật nhanh tiêu đề, mô tả thương hiệu và thông báo công khai.</p>
            </div>
            <input {...register("site_title", { required: "Vui lòng nhập tên website." })} placeholder="Tên website" />
            <textarea
              {...register("brand_headline", { required: "Vui lòng nhập tiêu đề trang chủ." })}
              placeholder="Tiêu đề chính trang chủ"
              rows={3}
            />
            <textarea
              {...register("brand_subheadline", { required: "Vui lòng nhập mô tả trang chủ." })}
              placeholder="Mô tả phụ trang chủ"
              rows={4}
            />
            <input {...register("support_phone")} placeholder="Số điện thoại hỗ trợ" />
            <input {...register("support_email")} placeholder="Email hỗ trợ" />
            <input
              {...register("delivery_fee_vnd", {
                valueAsNumber: true,
                required: "Vui lòng nhập phí giao hàng.",
              })}
              type="number"
              placeholder="Phí giao hàng (VND)"
            />
            <textarea {...register("public_notice")} placeholder="Thông báo hiển thị công khai" rows={4} />
            <button className="button primary" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
            </button>
            {formError ? <p className="error">{formError}</p> : null}
            {!formError && mutation.isError ? (
              <p className="error">{getApiErrorMessage(mutation.error, "Không thể lưu cấu hình hệ thống.")}</p>
            ) : null}
            {mutation.isSuccess ? <p className="badge">Đã lưu cấu hình</p> : null}
          </form>
          <div className="card">
            <div className="section-heading compact">
              <h2>Phần này kiểm soát gì?</h2>
              <p className="product-hint">Đây là các cấu hình nền giúp web giữ được thông điệp và cảm giác thương hiệu nhất quán.</p>
            </div>
            <ul className="stack-list">
              <li>Tiêu đề và mô tả thương hiệu trên trang chủ</li>
              <li>Thông tin liên hệ hỗ trợ hiển thị cho khách hàng</li>
              <li>Phí giao hàng dùng trong bước đặt đơn</li>
              <li>Thông báo chung hiển thị ở các trang public</li>
            </ul>
            {settings ? (
              <p className="product-hint">
                Cập nhật lần cuối: {new Date(settings.updated_at).toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
