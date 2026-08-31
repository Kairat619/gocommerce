import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import ProductForm from "../../../Components/Admin/Products/ProductForm";

export default function AdminProductsEdit({
  product,
  product_images,
  product_variants,
  product_attributes,
  categories,
  attributes,
  brands,
  currency,
  tax_rate,
}) {
  return (
    <AdminLayout title="Edit Product">
      <Head title={`Edit ${product.name}`} />

      <ProductForm
        action={`/admin/products/${product.id}`}
        isEdit
        product={product}
        productImages={product_images}
        productVariants={product_variants}
        productAttributes={product_attributes}
        categories={categories}
        attributes={attributes}
        brands={brands}
        currency={currency}
        taxRate={tax_rate}
      />
    </AdminLayout>
  );
}
