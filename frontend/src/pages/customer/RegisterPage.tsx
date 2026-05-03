import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../features/auth/authStore";
import { fetchMe, registerCustomer } from "../../services/authApi";
import { getApiErrorMessage } from "../../utils/apiError";

type RegisterForm = {
  phone: string;
  password: string;
  full_name: string;
  email?: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterForm>();
  const setSession = useAuthStore((state) => state.setSession);
  const setMe = useAuthStore((state) => state.setMe);
  const formError = Object.values(errors)[0]?.message as string | undefined;

  const mutation = useMutation({
    mutationFn: registerCustomer,
    onSuccess: async (session) => {
      setSession(session);
      const me = await fetchMe();
      setMe(me);
      navigate("/account/membership");
    }
  });

  return (
    <section className="card auth-card">
      <h1>Đăng ký tài khoản thành viên</h1>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="form-stack">
        <input {...register("full_name", { required: "Vui lòng nhập họ và tên." })} placeholder="Họ và tên" />
        <input {...register("phone", { required: "Vui lòng nhập số điện thoại." })} placeholder="Số điện thoại" />
        <input {...register("email")} placeholder="Địa chỉ email (không bắt buộc)" />
        <input {...register("password", { required: "Vui lòng nhập mật khẩu." })} type="password" placeholder="Mật khẩu" />
        <button className="button primary" type="submit">
          Đăng ký
        </button>
      </form>
      {formError ? <p className="error">{formError}</p> : null}
      {!formError && mutation.isError ? (
        <p className="error">{getApiErrorMessage(mutation.error, "Không thể đăng ký. Vui lòng kiểm tra lại thông tin.")}</p>
      ) : null}
    </section>
  );
}
