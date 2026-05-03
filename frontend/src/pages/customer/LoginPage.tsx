import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../features/auth/authStore";
import { fetchMe, loginCustomer } from "../../services/authApi";
import { getApiErrorMessage } from "../../utils/apiError";

type LoginForm = {
  phone: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>();
  const setSession = useAuthStore((state) => state.setSession);
  const setMe = useAuthStore((state) => state.setMe);
  const formError = Object.values(errors)[0]?.message as string | undefined;

  const mutation = useMutation({
    mutationFn: loginCustomer,
    onSuccess: async (session) => {
      setSession(session);
      const me = await fetchMe();
      setMe(me);
      navigate("/account");
    }
  });

  return (
    <section className="card auth-card">
      <h1>Đăng nhập khách hàng</h1>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="form-stack">
        <input {...register("phone", { required: "Vui lòng nhập số điện thoại." })} placeholder="Số điện thoại" />
        <input {...register("password", { required: "Vui lòng nhập mật khẩu." })} type="password" placeholder="Mật khẩu" />
        <button className="button primary" type="submit">
          Đăng nhập
        </button>
      </form>
      {formError ? <p className="error">{formError}</p> : null}
      {!formError && mutation.isError ? (
        <p className="error">{getApiErrorMessage(mutation.error, "Số điện thoại hoặc mật khẩu chưa đúng.")}</p>
      ) : null}
    </section>
  );
}
