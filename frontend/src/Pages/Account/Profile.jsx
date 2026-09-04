import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import StoreLayout from "../../Components/StoreLayout";
import { asList } from "../../lib/props";

/** @param {import('../../types/pages').AccountProfileProps} props */
export default function AccountProfile({ user, addresses }) {
  const savedAddresses = asList(addresses);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [processing, setProcessing] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setProcessing(true);
    router.post(
      "/account",
      { name, email },
      { onFinish: () => setProcessing(false) }
    );
  }

  return (
    <StoreLayout>
      <Head title="My Account" />

      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">My Account</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Profile Information
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {processing ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Addresses
              </h2>
              {savedAddresses.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {addr.label}
                        </p>
                        {addr.is_default && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {addr.first_name} {addr.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {addr.address_line1}
                      </p>
                      <p className="text-sm text-gray-500">
                        {addr.city}, {addr.state} {addr.postal_code}
                      </p>
                      <p className="text-sm text-gray-500">{addr.country}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No addresses saved yet.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Quick Links
              </h2>
              <nav className="space-y-2">
                <Link
                  href="/account/orders"
                  className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Order History
                </Link>
                <Link
                  href="/products"
                  className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Continue Shopping
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
