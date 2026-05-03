import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { StatePanel } from "../../components/common/StatePanel";
import { useAuthStore } from "../../features/auth/authStore";
import { useToastStore } from "../../features/toast/toastStore";
import { createEmployee, fetchEmployees } from "../../services/adminApi";
import { fetchBranches } from "../../services/catalogApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { downloadCsv } from "../../utils/csv";
import { getRoleLabel } from "../../utils/labels";

type FormValues = {
  username: string;
  password: string;
  full_name: string;
  phone?: string;
  role_code: string;
  branch_id: number;
};

export function EmployeesPage() {
  const me = useAuthStore((state) => state.me);
  const isAdmin = me?.role === "admin";
  const pushToast = useToastStore((state) => state.pushToast);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const { data: employees = [], refetch } = useQuery({
    queryKey: ["admin-employees", branchId],
    queryFn: () => fetchEmployees(branchId),
  });
  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesQuery =
        !normalizedQuery ||
        employee.username.toLowerCase().includes(normalizedQuery) ||
        employee.full_name.toLowerCase().includes(normalizedQuery) ||
        (employee.phone ?? "").toLowerCase().includes(normalizedQuery) ||
        employee.branch_name.toLowerCase().includes(normalizedQuery);
      const matchesRole = !roleFilter || employee.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [employees, query, roleFilter]);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      role_code: "employee",
    },
  });
  const formError = Object.values(errors)[0]?.message as string | undefined;

  useEffect(() => {
    if (!isAdmin && me?.branch_id) {
      setValue("branch_id", me.branch_id);
    }
  }, [isAdmin, me?.branch_id, setValue]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createEmployee({
        ...values,
        branch_id: isAdmin ? values.branch_id : Number(me?.branch_id),
      }),
    onSuccess: async () => {
      reset({
        role_code: "employee",
        branch_id: isAdmin ? undefined : Number(me?.branch_id),
      });
      pushToast("Đã tạo tài khoản nhân sự mới.", "success");
      await refetch();
    },
  });

  return (
    <section>
      <div className="section-heading compact">
        <p className="eyebrow">Nhân sự và phân vai</p>
        <h1>Quản lý tài khoản nội bộ gọn và dễ tra cứu hơn</h1>
        <p className="product-hint">
          {isAdmin ? "Quản trị viên có thể tạo và lọc nhân sự toàn hệ thống." : `Bạn đang quản lý đội ngũ của ${me?.branch_name ?? "chi nhánh hiện tại"}.`}
        </p>
      </div>
      <div className="grid two-up">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="card form-stack">
          <div className="section-heading compact">
            <h2>Tạo tài khoản nội bộ</h2>
            <p className="product-hint">Thiết lập nhanh username, mật khẩu và vai trò để đội ngũ bắt đầu làm việc.</p>
          </div>
          {isAdmin ? (
            <select {...register("branch_id", { valueAsNumber: true, required: "Vui lòng chọn chi nhánh." })}>
              <option value="">Chọn chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input type="hidden" {...register("branch_id", { valueAsNumber: true })} />
              <div className="badge">Đang quản lý đội ngũ của {me?.branch_name}</div>
            </>
          )}
          <input {...register("username", { required: "Vui lòng nhập tên đăng nhập." })} placeholder="Tên đăng nhập" />
          <input {...register("password", { required: "Vui lòng nhập mật khẩu." })} type="password" placeholder="Mật khẩu" />
          <input {...register("full_name", { required: "Vui lòng nhập họ tên." })} placeholder="Họ và tên" />
          <input {...register("phone")} placeholder="Số điện thoại" />
          <select {...register("role_code", { required: "Vui lòng chọn vai trò." })}>
            <option value="employee">Nhân viên</option>
            {isAdmin ? <option value="manager">Quản lý</option> : null}
            {isAdmin ? <option value="admin">Quản trị viên</option> : null}
            <option value="shipper">Nhân viên giao hàng</option>
          </select>
          <button className="button primary" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Đang tạo tài khoản..." : isAdmin ? "Tạo tài khoản nhân sự" : "Thêm nhân viên / shipper"}
          </button>
          {formError ? <p className="error">{formError}</p> : null}
          {!formError && mutation.isError ? (
            <p className="error">{getApiErrorMessage(mutation.error, "Không thể tạo tài khoản nhân sự.")}</p>
          ) : null}
        </form>
        <div className="card">
          <div className="section-heading compact">
            <h2>Danh sách nhân sự</h2>
            <p className="product-hint">Lọc nhanh theo chi nhánh, vai trò hoặc tên tài khoản để thao tác dễ hơn.</p>
          </div>
          <div className="admin-toolbar">
            {isAdmin ? (
              <select value={branchId ?? ""} onChange={(event) => setBranchId(event.target.value ? Number(event.target.value) : undefined)}>
                <option value="">Tất cả chi nhánh</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="badge">Đang xem nhân sự của {me?.branch_name ?? "chi nhánh hiện tại"}</div>
            )}
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, username, số điện thoại..." />
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="">Tất cả vai trò</option>
              <option value="employee">Nhân viên</option>
              <option value="manager">Quản lý</option>
              <option value="shipper">Nhân viên giao hàng</option>
              <option value="admin">Quản trị viên</option>
            </select>
            <button
              className="button secondary"
              onClick={() =>
                downloadCsv(
                  "kacoffee-employees.csv",
                  filteredEmployees.map((employee) => ({
                    username: employee.username,
                    full_name: employee.full_name,
                    role: getRoleLabel(employee.role),
                    branch: employee.branch_name,
                    phone: employee.phone,
                    active: employee.is_active ? "yes" : "no",
                  })),
                )
              }
              type="button"
            >
              Xuất CSV
            </button>
          </div>
          <div className="stack-list">
            {filteredEmployees.map((employee) => (
              <article key={employee.id} className="product-card admin-record-card">
                <div className="product-details">
                  <div className="record-header">
                    <h3>{employee.full_name}</h3>
                    <span className="badge">{getRoleLabel(employee.role)}</span>
                  </div>
                  <div className="record-meta">
                    <span>@{employee.username}</span>
                    <span>{employee.branch_name}</span>
                    {employee.phone ? <span>{employee.phone}</span> : null}
                  </div>
                </div>
                <div className="record-total-block">
                  <span className="product-hint">Trạng thái</span>
                  <strong>{employee.is_active ? "Đang hoạt động" : "Tạm khóa"}</strong>
                </div>
              </article>
            ))}
            {filteredEmployees.length === 0 ? (
              <StatePanel
                title="Không có nhân sự nào khớp bộ lọc"
                message="Bạn có thể đổi vai trò, từ khóa hoặc phạm vi chi nhánh để xem đội ngũ phù hợp."
                action={
                  query || roleFilter || branchId ? (
                    <button
                      className="button secondary"
                      onClick={() => {
                        setQuery("");
                        setRoleFilter("");
                        setBranchId(undefined);
                      }}
                      type="button"
                    >
                      Xóa bộ lọc
                    </button>
                  ) : undefined
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
