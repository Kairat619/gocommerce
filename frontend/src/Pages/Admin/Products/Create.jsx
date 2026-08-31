import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import ProductForm from "../../../Components/Admin/Products/ProductForm";

export default function AdminProductsCreate({ categories, attributes, brands, currency, tax_rate }) {
  return (
    <AdminLayout title="Create Product">
      <Head title="Create Product" />

      <ProductForm
        action="/admin/products"
        categories={categories}
        attributes={attributes}
        brands={brands}
        currency={currency}
        taxRate={tax_rate}
      />
    </AdminLayout>
  );
}
