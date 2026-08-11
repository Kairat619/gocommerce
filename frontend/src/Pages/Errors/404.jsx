import { Head, Link } from "@inertiajs/react";

export default function NotFound() {
  return (
    <>
      <Head title="Page Not Found" />
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold text-gray-300">404</h1>
          <p className="mb-6 text-lg text-gray-600">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Go Home
          </Link>
        </div>
      </div>
    </>
  );
}
