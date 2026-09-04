import { Head, Link, useForm } from "@inertiajs/react";
import AuthLayout from "../../Layouts/AuthLayout";
import Button from "../../Components/UI/Button";
import Field from "../../Components/UI/Field";
import Input from "../../Components/UI/Input";

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
    password: "",
    remember_me: false,
  });

  const submit = (e) => {
    e.preventDefault();
    post("/login");
  };

  return (
    <AuthLayout
      subtitle="Sign in to your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-accent hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <Head title="Sign In" />

      <form onSubmit={submit} className="space-y-6">
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => setData("email", e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <Input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => setData("password", e.target.value)}
            autoComplete="current-password"
          />
        </Field>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={data.remember_me}
            onChange={(e) => setData("remember_me", e.target.checked)}
            className="h-4 w-4 border-ink/25 text-ink focus:ring-ink"
          />
          <span className="text-body-sm text-muted-foreground">
            Remember me
          </span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={processing}
          className="w-full"
        >
          {processing ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthLayout>
  );
}
