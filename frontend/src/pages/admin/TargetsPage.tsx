import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { StatePanel } from "../../components/common/StatePanel";
import {
  createBranchTargetPolicy,
  createRoleTargetPolicy,
  fetchBranchTargetPolicies,
  fetchRoleTargetPolicies,
  updateBranchTargetPolicy,
  updateRoleTargetPolicy,
} from "../../services/adminApi";
import { fetchBranches } from "../../services/catalogApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatDateTime, formatVnd } from "../../utils/format";
import { getRoleLabel } from "../../utils/labels";

type RolePolicyForm = {
  role_code: string;
  monthly_order_target: number;
  monthly_revenue_target_vnd: number;
  monthly_delivery_target: number;
  bonus_rate_percent: number;
  bonus_per_extra_order_vnd: number;
  bonus_per_extra_delivery_vnd: number;
  bonus_flat_vnd: number;
  is_active: boolean;
};

type BranchPolicyForm = {
  branch_id: number;
  monthly_order_target: number;
  monthly_revenue_target_vnd: number;
  bonus_rate_percent: number;
  bonus_flat_vnd: number;
  is_active: boolean;
};

export function TargetsPage() {
  const { data: rolePolicies = [], refetch: refetchRolePolicies } = useQuery({
    queryKey: ["role-target-policies"],
    queryFn: fetchRoleTargetPolicies,
  });
  const { data: branchPolicies = [], refetch: refetchBranchPolicies } = useQuery({
    queryKey: ["branch-target-policies"],
    queryFn: fetchBranchTargetPolicies,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
  });

  const [selectedRolePolicyId, setSelectedRolePolicyId] = useState<number | null>(null);
  const [selectedBranchPolicyId, setSelectedBranchPolicyId] = useState<number | null>(null);

  const {
    register: registerRole,
    handleSubmit: handleRoleSubmit,
    reset: resetRole,
    formState: { errors: roleErrors },
  } = useForm<RolePolicyForm>({
    defaultValues: {
      role_code: "employee",
      monthly_order_target: 0,
      monthly_revenue_target_vnd: 0,
      monthly_delivery_target: 0,
      bonus_rate_percent: 0,
      bonus_per_extra_order_vnd: 0,
      bonus_per_extra_delivery_vnd: 0,
      bonus_flat_vnd: 0,
      is_active: true,
    },
  });
  const roleFormError = Object.values(roleErrors)[0]?.message as string | undefined;

  const {
    register: registerBranch,
    handleSubmit: handleBranchSubmit,
    reset: resetBranch,
    formState: { errors: branchErrors },
  } = useForm<BranchPolicyForm>({
    defaultValues: {
      monthly_order_target: 0,
      monthly_revenue_target_vnd: 0,
      bonus_rate_percent: 0,
      bonus_flat_vnd: 0,
      is_active: true,
    },
  });
  const branchFormError = Object.values(branchErrors)[0]?.message as string | undefined;

  const roleMutation = useMutation({
    mutationFn: (values: RolePolicyForm) =>
      selectedRolePolicyId
        ? updateRoleTargetPolicy(selectedRolePolicyId, values)
        : createRoleTargetPolicy(values),
    onSuccess: async () => {
      setSelectedRolePolicyId(null);
      resetRole({
        role_code: "employee",
        monthly_order_target: 0,
        monthly_revenue_target_vnd: 0,
        monthly_delivery_target: 0,
        bonus_rate_percent: 0,
        bonus_per_extra_order_vnd: 0,
        bonus_per_extra_delivery_vnd: 0,
        bonus_flat_vnd: 0,
        is_active: true,
      });
      await refetchRolePolicies();
    },
  });

  const branchMutation = useMutation({
    mutationFn: (values: BranchPolicyForm) =>
      selectedBranchPolicyId
        ? updateBranchTargetPolicy(selectedBranchPolicyId, values)
        : createBranchTargetPolicy(values),
    onSuccess: async () => {
      setSelectedBranchPolicyId(null);
      resetBranch({
        branch_id: 0,
        monthly_order_target: 0,
        monthly_revenue_target_vnd: 0,
        bonus_rate_percent: 0,
        bonus_flat_vnd: 0,
        is_active: true,
      });
      await refetchBranchPolicies();
    },
  });

  return (
    <section>
      <div className="section-heading compact">
        <p className="eyebrow">Chỉ tiêu & hoa hồng</p>
        <h1>Thiết lập động lực cho từng vai trò và từng chi nhánh</h1>
        <p className="product-hint">Thiết kế chính sách đủ rõ để đội ngũ biết mình đang phấn đấu vì mục tiêu nào.</p>
      </div>
      <div className="grid two-up">
        <form onSubmit={handleRoleSubmit((values) => roleMutation.mutate(values))} className="card form-stack">
          <div className="section-heading compact">
            <h2>Chính sách theo vai trò</h2>
            <p className="product-hint">Áp dụng cho nhân viên, quản lý và shipper trên toàn hệ thống.</p>
          </div>
          <select {...registerRole("role_code", { required: "Vui lòng chọn vai trò." })}>
            <option value="employee">Nhân viên</option>
            <option value="manager">Quản lý</option>
            <option value="shipper">Nhân viên giao hàng</option>
          </select>
          <input {...registerRole("monthly_order_target", { valueAsNumber: true })} type="number" placeholder="Chỉ tiêu số đơn trong tháng" />
          <input {...registerRole("monthly_revenue_target_vnd", { valueAsNumber: true })} type="number" placeholder="Chỉ tiêu doanh thu trong tháng (VND)" />
          <input {...registerRole("monthly_delivery_target", { valueAsNumber: true })} type="number" placeholder="Chỉ tiêu số lượt giao trong tháng" />
          <input {...registerRole("bonus_rate_percent", { valueAsNumber: true })} type="number" placeholder="Tỷ lệ thưởng trên doanh thu vượt chỉ tiêu (%)" />
          <input {...registerRole("bonus_per_extra_order_vnd", { valueAsNumber: true })} type="number" placeholder="Thưởng mỗi đơn vượt chỉ tiêu (VND)" />
          <input {...registerRole("bonus_per_extra_delivery_vnd", { valueAsNumber: true })} type="number" placeholder="Thưởng mỗi lượt giao vượt chỉ tiêu (VND)" />
          <input {...registerRole("bonus_flat_vnd", { valueAsNumber: true })} type="number" placeholder="Thưởng cố định khi đạt chỉ tiêu (VND)" />
          <label className="inline-actions">
            <input type="checkbox" {...registerRole("is_active")} />
            <span>Đang áp dụng</span>
          </label>
          <div className="inline-actions">
            <button className="button primary" disabled={roleMutation.isPending} type="submit">
              {roleMutation.isPending
                ? "Đang lưu..."
                : selectedRolePolicyId
                  ? "Lưu chính sách vai trò"
                  : "Tạo chính sách vai trò"}
            </button>
            {selectedRolePolicyId ? (
              <button
                className="button secondary"
                onClick={() => {
                  setSelectedRolePolicyId(null);
                  resetRole({
                    role_code: "employee",
                    monthly_order_target: 0,
                    monthly_revenue_target_vnd: 0,
                    monthly_delivery_target: 0,
                    bonus_rate_percent: 0,
                    bonus_per_extra_order_vnd: 0,
                    bonus_per_extra_delivery_vnd: 0,
                    bonus_flat_vnd: 0,
                    is_active: true,
                  });
                }}
                type="button"
              >
                Hủy chỉnh sửa
              </button>
            ) : null}
          </div>
          {roleFormError ? <p className="error">{roleFormError}</p> : null}
          {!roleFormError && roleMutation.isError ? (
            <p className="error">{getApiErrorMessage(roleMutation.error, "Không thể lưu chính sách vai trò.")}</p>
          ) : null}
        </form>

        <div className="card">
          <div className="section-heading compact">
            <h2>Chính sách vai trò hiện có</h2>
            <p className="product-hint">Tra cứu và chỉnh lại từng chính sách đang áp dụng cho đội ngũ.</p>
          </div>
          <div className="stack-list">
            {rolePolicies.map((policy) => (
              <article key={policy.id} className="product-card admin-record-card">
                <div className="product-details">
                  <div className="record-header">
                    <h3>{getRoleLabel(policy.role_code)}</h3>
                    <span className={`badge ${policy.is_active ? "accent" : "muted"}`}>{policy.is_active ? "Đang áp dụng" : "Tạm dừng"}</span>
                  </div>
                  <div className="record-meta">
                    <span>Đơn {policy.monthly_order_target}</span>
                    <span>Doanh thu {formatVnd(policy.monthly_revenue_target_vnd)}</span>
                    <span>Giao hàng {policy.monthly_delivery_target}</span>
                  </div>
                  <p>Tỷ lệ thưởng: {policy.bonus_rate_percent}% · Thưởng cố định: {formatVnd(policy.bonus_flat_vnd)}</p>
                  <p className="product-hint">Cập nhật lúc {formatDateTime(policy.updated_at)}</p>
                </div>
                <div className="record-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setSelectedRolePolicyId(policy.id);
                      resetRole({
                        role_code: policy.role_code,
                        monthly_order_target: policy.monthly_order_target,
                        monthly_revenue_target_vnd: policy.monthly_revenue_target_vnd,
                        monthly_delivery_target: policy.monthly_delivery_target,
                        bonus_rate_percent: policy.bonus_rate_percent,
                        bonus_per_extra_order_vnd: policy.bonus_per_extra_order_vnd,
                        bonus_per_extra_delivery_vnd: policy.bonus_per_extra_delivery_vnd,
                        bonus_flat_vnd: policy.bonus_flat_vnd,
                        is_active: policy.is_active,
                      });
                    }}
                    type="button"
                  >
                    Sửa
                  </button>
                </div>
              </article>
            ))}
            {rolePolicies.length === 0 ? (
              <StatePanel
                title="Chưa có chính sách theo vai trò"
                message="Hãy tạo chính sách đầu tiên để đội ngũ có mục tiêu và mức thưởng rõ ràng."
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid two-up">
        <form onSubmit={handleBranchSubmit((values) => branchMutation.mutate(values))} className="card form-stack">
          <div className="section-heading compact">
            <h2>Chính sách theo chi nhánh</h2>
            <p className="product-hint">Dùng để đặt chỉ tiêu doanh thu và đơn hàng cho từng cửa hàng trong chuỗi.</p>
          </div>
          <select {...registerBranch("branch_id", { valueAsNumber: true, required: "Vui lòng chọn chi nhánh." })}>
            <option value="">Chọn chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <input {...registerBranch("monthly_order_target", { valueAsNumber: true })} type="number" placeholder="Chỉ tiêu số đơn trong tháng" />
          <input {...registerBranch("monthly_revenue_target_vnd", { valueAsNumber: true })} type="number" placeholder="Chỉ tiêu doanh thu trong tháng (VND)" />
          <input {...registerBranch("bonus_rate_percent", { valueAsNumber: true })} type="number" placeholder="Tỷ lệ thưởng trên doanh thu vượt chỉ tiêu (%)" />
          <input {...registerBranch("bonus_flat_vnd", { valueAsNumber: true })} type="number" placeholder="Thưởng cố định cho chi nhánh (VND)" />
          <label className="inline-actions">
            <input type="checkbox" {...registerBranch("is_active")} />
            <span>Đang áp dụng</span>
          </label>
          <div className="inline-actions">
            <button className="button primary" disabled={branchMutation.isPending} type="submit">
              {branchMutation.isPending
                ? "Đang lưu..."
                : selectedBranchPolicyId
                  ? "Lưu chính sách chi nhánh"
                  : "Tạo chính sách chi nhánh"}
            </button>
            {selectedBranchPolicyId ? (
              <button
                className="button secondary"
                onClick={() => {
                  setSelectedBranchPolicyId(null);
                  resetBranch({
                    branch_id: 0,
                    monthly_order_target: 0,
                    monthly_revenue_target_vnd: 0,
                    bonus_rate_percent: 0,
                    bonus_flat_vnd: 0,
                    is_active: true,
                  });
                }}
                type="button"
              >
                Hủy chỉnh sửa
              </button>
            ) : null}
          </div>
          {branchFormError ? <p className="error">{branchFormError}</p> : null}
          {!branchFormError && branchMutation.isError ? (
            <p className="error">{getApiErrorMessage(branchMutation.error, "Không thể lưu chính sách chi nhánh.")}</p>
          ) : null}
        </form>

        <div className="card">
          <div className="section-heading compact">
            <h2>Chính sách chi nhánh hiện có</h2>
            <p className="product-hint">Mỗi chi nhánh có thể có mục tiêu riêng để đo hiệu quả thực tế hơn.</p>
          </div>
          <div className="stack-list">
            {branchPolicies.map((policy) => (
              <article key={policy.id} className="product-card admin-record-card">
                <div className="product-details">
                  <div className="record-header">
                    <h3>{policy.branch_name}</h3>
                    <span className={`badge ${policy.is_active ? "accent" : "muted"}`}>{policy.is_active ? "Đang áp dụng" : "Tạm dừng"}</span>
                  </div>
                  <div className="record-meta">
                    <span>Đơn {policy.monthly_order_target}</span>
                    <span>Doanh thu {formatVnd(policy.monthly_revenue_target_vnd)}</span>
                  </div>
                  <p>Tỷ lệ thưởng: {policy.bonus_rate_percent}% · Thưởng cố định: {formatVnd(policy.bonus_flat_vnd)}</p>
                  <p className="product-hint">Cập nhật lúc {formatDateTime(policy.updated_at)}</p>
                </div>
                <div className="record-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setSelectedBranchPolicyId(policy.id);
                      resetBranch({
                        branch_id: policy.branch_id,
                        monthly_order_target: policy.monthly_order_target,
                        monthly_revenue_target_vnd: policy.monthly_revenue_target_vnd,
                        bonus_rate_percent: policy.bonus_rate_percent,
                        bonus_flat_vnd: policy.bonus_flat_vnd,
                        is_active: policy.is_active,
                      });
                    }}
                    type="button"
                  >
                    Sửa
                  </button>
                </div>
              </article>
            ))}
            {branchPolicies.length === 0 ? (
              <StatePanel
                title="Chưa có chính sách chi nhánh"
                message="Tạo chính sách đầu tiên để theo dõi mục tiêu doanh thu và thưởng của từng cửa hàng."
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
