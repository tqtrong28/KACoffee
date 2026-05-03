import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../features/auth/authStore";
import { fetchMe, loginEmployee } from "../../services/authApi";
import { getApiErrorMessage } from "../../utils/apiError";

type FormValues = {
  username: string;
  password: string;
};

export function StaffLoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>();
  const setSession = useAuthStore((state) => state.setSession);
  const setMe = useAuthStore((state) => state.setMe);
  const formError = Object.values(errors)[0]?.message as string | undefined;

  const mutation = useMutation({
    mutationFn: loginEmployee,
    onSuccess: async (session) => {
      setSession(session);
      const me = await fetchMe();
      setMe(me);
      navigate(me.role === "shipper" ? "/shipper" : me.role === "employee" ? "/staff" : "/admin");
    }
  });

  return (
    <section className="card auth-card">
      <h1>Đăng nhập nhân viên</h1>
      <p>Tài khoản mẫu: staff1 / staff123</p>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="form-stack">
        <input {...register("username", { required: "Vui lòng nhập tên đăng nhập." })} placeholder="Tên đăng nhập" />
        <input {...register("password", { required: "Vui lòng nhập mật khẩu." })} type="password" placeholder="Mật khẩu" />
        <button className="button primary" type="submit">
          Đăng nhập
        </button>
      </form>
      {formError ? <p className="error">{formError}</p> : null}
      {!formError && mutation.isError ? (
        <p className="error">{getApiErrorMessage(mutation.error, "Tên đăng nhập hoặc mật khẩu chưa đúng.")}</p>
      ) : null}
    </section>
  );
}
