import { Head } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayout";
import AttributeForm from "../../../Components/Admin/Attributes/AttributeForm";

export default function AdminAttributesEdit({ attribute, options }) {
  return (
    <AdminLayout title="Edit Attribute">
      <Head title={`Edit ${attribute.name}`} />

      <AttributeForm
        action={`/admin/attributes/${attribute.id}/edit`}
        isEdit
        attribute={attribute}
        options={options}
      />
    </AdminLayout>
  );
}
