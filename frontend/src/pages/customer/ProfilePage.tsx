import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { fetchCustomerProfile, updateCustomerProfile } from "../../services/customerApi";
import { getApiErrorMessage } from "../../utils/apiError";

type ProfileForm = {
  full_name: string;
  email?: string;
  default_address_line?: string;
  default_ward?: string;
  default_district?: string;
  default_city?: string;
};

export function ProfilePage() {
  const { data } = useQuery({ queryKey: ["customer-profile"], queryFn: fetchCustomerProfile });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProfileForm>({
    values: {
      full_name: data?.full_name ?? "",
      email: data?.email ?? "",
      default_address_line: data?.default_address_line ?? "",
      default_ward: data?.default_ward ?? "",
      default_district: data?.default_district ?? "",
      default_city: data?.default_city ?? ""
    }
  });
  const formError = Object.values(errors)[0]?.message as string | undefined;

  const mutation = useMutation({
    mutationFn: updateCustomerProfile,
    onSuccess: (profile) =>
      reset({
        full_name: profile.full_name,
        email: profile.email ?? "",
        default_address_line: profile.default_address_line ?? "",
        default_ward: profile.default_ward ?? "",
        default_district: profile.default_district ?? "",
        default_city: profile.default_city ?? ""
      })
  });

  return (
    <section className="card">
      <h1>Hồ sơ của tôi</h1>
      <p>Số điện thoại: {data?.phone}</p>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="form-grid">
        <input {...register("full_name", { required: "Vui lòng nhập họ và tên." })} placeholder="Họ và tên" />
        <input {...register("email")} placeholder="Địa chỉ email" />
        <input {...register("default_address_line")} placeholder="Địa chỉ mặc định" />
        <input {...register("default_ward")} placeholder="Phường/Xã" />
        <input {...register("default_district")} placeholder="Quận/Huyện" />
        <input {...register("default_city")} placeholder="Tỉnh/Thành phố" />
        <button className="button primary" type="submit">
          Lưu hồ sơ
        </button>
      </form>
      {formError ? <p className="error">{formError}</p> : null}
      {!formError && mutation.isError ? (
        <p className="error">{getApiErrorMessage(mutation.error, "Không thể lưu hồ sơ.")}</p>
      ) : null}
    </section>
  );
}
