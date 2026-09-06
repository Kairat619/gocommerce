import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import CollectionForm from "../../../Components/Admin/Collections/CollectionForm";

export default function AdminCollectionsCreate() {
  return (
    <AdminLayout title="Create Collection">
      <Head title="Create Collection" />

      <CollectionForm action="/admin/collections" />
    </AdminLayout>
  );
}
