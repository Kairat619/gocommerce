import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import StoreLayout from "../../Components/StoreLayout";
import Button from "../../Components/UI/Button";
import Field from "../../Components/UI/Field";
import Input from "../../Components/UI/Input";
import AddressCard from "../../Components/Commerce/AddressCard";
import { asList } from "../../lib/props";
import { pageTitle } from "../../lib/brand";

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
      <Head title={pageTitle("My Account")} />

      <div className="mx-auto max-w-4xl">
        <h1 className="mb-10 text-display-md text-ink">My Account</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section className="border border-ink/10 bg-white p-6">
              <h2 className="mb-5 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                Profile Information
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field label="Name" htmlFor="name">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </Field>
                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </Field>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={processing}
                >
                  {processing ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </section>

            <section className="border border-ink/10 bg-white p-6">
              <h2 className="mb-5 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                Addresses
              </h2>
              {savedAddresses.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {savedAddresses.map((addr) => (
                    <AddressCard key={addr.id} address={addr} />
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">
                  No addresses saved yet. The address you enter at checkout will
                  be saved here.
                </p>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <nav className="border border-ink/10 bg-white p-6">
              <h2 className="mb-5 text-label-lg font-semibold uppercase tracking-[0.1em] text-ink">
                Quick Links
              </h2>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/account/orders"
                    className="block py-2 text-body-sm text-muted-foreground transition-colors hover:text-accent"
                  >
                    Order History
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    className="block py-2 text-body-sm text-muted-foreground transition-colors hover:text-accent"
                  >
                    Continue Shopping
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
