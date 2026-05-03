import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { createCategory } from "../../services/adminApi";
import { fetchCategories } from "../../services/catalogApi";
import { getApiErrorMessage } from "../../utils/apiError";

type FormValues = {
  name: string;
  slug: string;
  description?: string;
};

export function CategoriesPage() {
  const { data: categories = [], refetch } = useQuery({ queryKey: ["admin-categories"], queryFn: fetchCategories });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>();
  const formError = Object.values(errors)[0]?.message as string | undefined;

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createCategory({
        ...values,
        display_order: categories.length + 1,
        is_active: true
      }),
    onSuccess: async () => {
      reset();
      await refetch();
    }
  });

  return (
    <section>
      <h1>Danh mục</h1>
      <div className="grid two-up">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="card form-stack">
          <input {...register("name", { required: "Vui lòng nhập tên danh mục." })} placeholder="Tên danh mục" />
          <input {...register("slug", { required: "Vui lòng nhập slug danh mục." })} placeholder="Slug" />
          <textarea {...register("description")} placeholder="Mô tả" rows={4} />
          <button className="button primary" type="submit">
            Tạo danh mục
          </button>
          {formError ? <p className="error">{formError}</p> : null}
          {!formError && mutation.isError ? (
            <p className="error">{getApiErrorMessage(mutation.error, "Không thể tạo danh mục.")}</p>
          ) : null}
        </form>
        <div className="card">
          <h2>Danh sách danh mục</h2>
          <ul className="stack-list">
            {categories.map((category) => (
              <li key={category.id}>
                <strong>{category.name}</strong> · {category.slug}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
