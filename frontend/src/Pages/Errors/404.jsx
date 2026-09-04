import { Head } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import Button from "../../Components/UI/Button";

export default function NotFound() {
  return (
    <StoreLayout>
      <Head title="Page Not Found" />

      <div className="py-24 text-center">
        <p className="text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
          Error 404
        </p>
        <h1 className="mt-4 text-display-lg text-ink">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-4 max-w-md text-body-md text-muted-foreground">
          The page you&apos;re looking for may have moved, or the product is no
          longer available.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Button href="/products" variant="primary" size="lg">
            Browse the Collection
          </Button>
          <Button href="/" variant="outline" size="lg">
            Go Home
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}
