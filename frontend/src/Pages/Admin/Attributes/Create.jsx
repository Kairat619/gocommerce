import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import AttributeForm from "../../../Components/Admin/Attributes/AttributeForm";

export default function AdminAttributesCreate() {
  return (
    <AdminLayout title="Create Attribute">
      <Head title="Create Attribute" />

      <AttributeForm action="/admin/attributes/create" />
    </AdminLayout>
  );
}
