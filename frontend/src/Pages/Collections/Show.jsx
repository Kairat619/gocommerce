import { Head } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import ProductGrid from "../../Components/Commerce/ProductGrid";
import Pagination from "../../Components/Pagination";
import Button from "../../Components/UI/Button";
import Container from "../../Components/UI/Container";
import EmptyState from "../../Components/UI/EmptyState";
import Breadcrumbs from "../../Components/Breadcrumbs";
import { collectionImage } from "../../lib/image";
import { pageTitle } from "../../lib/brand";
import { asList, asPagination } from "../../lib/props";

export default function CollectionsShow({ collection, products, pagination }) {
  const items = asList(products);
  const pages = asPagination(pagination);

  return (
    <StoreLayout full>
      {/* meta_title / meta_description come from the admin collection form's SEO
          card. `description` is not used as a fallback here — it is rich text
          from the editor, and raw HTML has no business in a meta tag. */}
      <Head title={pageTitle(collection.meta_title || collection.name)}>
        {collection.meta_description && (
          <meta head-key="description" name="description" content={collection.meta_description} />
        )}
      </Head>

      <section className="relative overflow-hidden bg-ink">
        <img
          src={collectionImage(collection, 1920, 700)}
          alt={collection.name}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <Container className="relative py-20 md:py-28">
          <Breadcrumbs
            tone="inverse"
            className="mb-5"
            items={[{ label: "Collections", href: "/collections" }, { label: collection.name }]}
          />
          <h1 className="max-w-2xl text-display-lg text-white">{collection.name}</h1>
          {collection.description && (
            <div
              className="prose-product mt-4 max-w-xl text-body-lg text-zinc-300"
              dangerouslySetInnerHTML={{ __html: collection.description }}
            />
          )}
        </Container>
      </section>

      <Container className="py-14 md:py-20">
        {items.length === 0 ? (
          <EmptyState
            title="Nothing in this collection yet"
            description="Check back soon or explore the full catalogue."
          >
            <Button href="/products" variant="primary" size="md">
              Browse All Products
            </Button>
          </EmptyState>
        ) : (
          <>
            {/* Products arrive in the merchant's curated order (position, then
                name) — ProductGrid renders them as given and must not re-sort. */}
            <ProductGrid products={items} columns="threeToFour" />
            <Pagination pagination={pages} />
          </>
        )}
      </Container>
    </StoreLayout>
  );
}
