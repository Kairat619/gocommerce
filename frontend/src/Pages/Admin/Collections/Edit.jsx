import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import CollectionForm from "../../../Components/Admin/Collections/CollectionForm";

export default function AdminCollectionsEdit({ collection, products }) {
  return (
    <AdminLayout title="Edit Collection">
      <Head title={`Edit ${collection.name}`} />

      <CollectionForm
        action={`/admin/collections/${collection.id}`}
        isEdit
        collection={collection}
        products={products}
      />
    </AdminLayout>
  );
}
