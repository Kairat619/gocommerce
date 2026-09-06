import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import CategoryForm from "../../../Components/Admin/Categories/CategoryForm";

/** @param {import('../../../types/pages').AdminCategoriesCreateProps} props */
export default function AdminCategoriesCreate({ categories }) {
  return (
    <AdminLayout title="Create Category">
      <Head title="Create Category" />

      <CategoryForm action="/admin/categories" categories={categories} />
    </AdminLayout>
  );
}
