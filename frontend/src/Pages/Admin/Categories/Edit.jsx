import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import CategoryForm from "../../../Components/Admin/Categories/CategoryForm";

/** @param {import('../../../types/pages').AdminCategoriesEditProps} props */
export default function AdminCategoriesEdit({ category, categories }) {
  return (
    <AdminLayout title="Edit Category">
      <Head title={`Edit ${category.name}`} />

      <CategoryForm
        action={`/admin/categories/${category.id}`}
        isEdit
        category={category}
        categories={categories}
      />
    </AdminLayout>
  );
}
