import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createBranch, fetchAdminBranches, updateBranch } from "../../services/adminApi";
import type { Branch } from "../../types/models";
import { getApiErrorMessage } from "../../utils/apiError";
import { getBranchOpenStatus } from "../../utils/branchStatus";
import { applyBranchImageFallback, getBranchImageUrl } from "../../utils/branchMedia";

type FormValues = {
  code: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  opening_hours?: string;
  map_url?: string;
  image_url?: string;
  amenities_text?: string;
  is_active: boolean;
};

function parseAmenities(value?: string | null) {
  return (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function branchToFormValues(branch?: Branch | null): FormValues {
  return {
    code: branch?.code ?? "",
    name: branch?.name ?? "",
    address: branch?.address ?? "",
    city: branch?.city ?? "Hà Nội",
    phone: branch?.phone ?? "",
    opening_hours: branch?.opening_hours ?? "",
    map_url: branch?.map_url ?? "",
    image_url: branch?.image_url ?? "",
    amenities_text: branch?.amenities_text ?? "",
    is_active: branch?.is_active ?? true,
  };
}

export function BranchesPage() {
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const { data: branches = [], refetch } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: fetchAdminBranches,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: branchToFormValues(),
  });
  const formError = Object.values(errors)[0]?.message as string | undefined;

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      editingBranch ? updateBranch(editingBranch.id, values) : createBranch(values),
    onSuccess: async () => {
      setEditingBranch(null);
      reset(branchToFormValues());
      await refetch();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (branch: Branch) =>
      updateBranch(branch.id, {
        code: branch.code,
        name: branch.name,
        address: branch.address ?? undefined,
        city: branch.city ?? undefined,
        phone: branch.phone ?? undefined,
        opening_hours: branch.opening_hours ?? undefined,
        map_url: branch.map_url ?? undefined,
        image_url: branch.image_url ?? undefined,
        amenities_text: branch.amenities_text ?? undefined,
        is_active: !branch.is_active,
      }),
    onSuccess: async () => {
      await refetch();
    },
  });

  return (
    <section>
      <h1>Quản lý chi nhánh</h1>
      <div className="grid two-up">
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="card form-stack"
        >
          <input
            {...register("code", { required: "Vui lòng nhập mã chi nhánh." })}
            placeholder="Mã chi nhánh"
          />
          <input
            {...register("name", { required: "Vui lòng nhập tên chi nhánh." })}
            placeholder="Tên chi nhánh"
          />
          <input {...register("address")} placeholder="Địa chỉ" />
          <input {...register("city")} placeholder="Tỉnh/Thành phố" />
          <input {...register("phone")} placeholder="Số điện thoại" />
          <input {...register("opening_hours")} placeholder="Giờ mở cửa, ví dụ 07:00 - 22:30" />
          <input {...register("map_url")} placeholder="Link Google Maps / chỉ đường" />
          <input {...register("image_url")} placeholder="URL ảnh chi nhánh" />
          <textarea
            {...register("amenities_text")}
            placeholder="Tiện ích, ngăn cách bằng dấu |, ví dụ Wi-Fi | Chỗ gửi xe | Mang đi"
            rows={4}
          />
          <label className="inline-actions">
            <input type="checkbox" {...register("is_active")} />
            <span>Chi nhánh đang hoạt động</span>
          </label>
          <div className="inline-actions">
            <button className="button primary" type="submit">
              {editingBranch ? "Lưu chi nhánh" : "Tạo chi nhánh"}
            </button>
            {editingBranch ? (
              <button
                className="button secondary"
                onClick={() => {
                  setEditingBranch(null);
                  reset(branchToFormValues());
                }}
                type="button"
              >
                Hủy chỉnh sửa
              </button>
            ) : null}
          </div>
          {formError ? <p className="error">{formError}</p> : null}
          {!formError && mutation.isError ? (
            <p className="error">{getApiErrorMessage(mutation.error, "Không thể lưu chi nhánh.")}</p>
          ) : null}
        </form>
        <div className="card">
          <h2>Danh sách chi nhánh</h2>
          <ul className="stack-list">
            {branches.map((branch) => {
              const branchStatus = getBranchOpenStatus(branch.opening_hours);
              return (
              <li key={branch.id} className="branch-admin-card">
                <img
                  className="branch-admin-photo"
                  src={getBranchImageUrl(branch)}
                  alt={branch.name}
                  onError={(event) => applyBranchImageFallback(event, branch.code)}
                />
                <div className="product-details">
                  <h3>{branch.name}</h3>
                  <p>
                    {branch.code} · {branch.city ?? "Chưa có thành phố"}
                  </p>
                  {branch.address ? <p>{branch.address}</p> : null}
                  {branch.phone ? <p>Điện thoại: {branch.phone}</p> : null}
                  {branch.opening_hours ? <p>Giờ mở cửa: {branch.opening_hours}</p> : null}
                  {parseAmenities(branch.amenities_text).length ? (
                    <div className="chip-row">
                      {parseAmenities(branch.amenities_text).map((amenity) => (
                        <span key={amenity} className="badge branch-chip">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="product-hint">{branch.is_active ? "Đang hoạt động" : "Tạm ngưng"}</p>
                  {branchStatus ? <span className={`badge status-${branchStatus.tone}`}>{branchStatus.label}</span> : null}
                </div>
                <div className="inline-actions branch-actions">
                  {branch.map_url ? (
                    <a className="button secondary" href={branch.map_url} rel="noreferrer" target="_blank">
                      Chỉ đường
                    </a>
                  ) : null}
                  <button
                    className="button secondary"
                    onClick={() => {
                      setEditingBranch(branch);
                      reset(branchToFormValues(branch));
                    }}
                    type="button"
                  >
                    Sửa
                  </button>
                  <button
                    className={branch.is_active ? "button danger" : "button primary"}
                    onClick={() => toggleMutation.mutate(branch)}
                    type="button"
                  >
                    {branch.is_active ? "Ngừng hoạt động" : "Kích hoạt"}
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
