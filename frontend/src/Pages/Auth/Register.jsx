import { Head, Link, useForm } from "@inertiajs/react";
import AuthLayout from "../../Layouts/AuthLayout";
import Button from "../../Components/UI/Button";
import Field from "../../Components/UI/Field";
import Input from "../../Components/UI/Input";

export default function Register() {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const submit = (e) => {
    e.preventDefault();
    post("/register");
  };

  return (
    <AuthLayout
      subtitle="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-accent hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <Head title="Create Account" />

      <form onSubmit={submit} className="space-y-6">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            type="text"
            value={data.name}
            onChange={(e) => setData("name", e.target.value)}
            autoComplete="name"
            autoFocus
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => setData("email", e.target.value)}
            autoComplete="email"
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          hint="Minimum 8 characters"
        >
          <Input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => setData("password", e.target.value)}
            autoComplete="new-password"
          />
        </Field>

        <Field
          label="Confirm Password"
          htmlFor="password_confirmation"
          error={errors.password_confirmation}
        >
          <Input
            id="password_confirmation"
            type="password"
            value={data.password_confirmation}
            onChange={(e) => setData("password_confirmation", e.target.value)}
            autoComplete="new-password"
          />
        </Field>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={processing}
          className="w-full"
        >
          {processing ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
