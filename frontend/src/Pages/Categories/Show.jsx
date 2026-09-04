import { Head } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import ProductGrid from "../../Components/Commerce/ProductGrid";
import Pagination from "../../Components/Pagination";
import Button from "../../Components/UI/Button";
import Container from "../../Components/UI/Container";
import EmptyState from "../../Components/UI/EmptyState";
import Breadcrumbs from "../../Components/Breadcrumbs";
import { decorativeImage } from "../../lib/image";
import { pageTitle } from "../../lib/brand";
import { asList, asPagination } from "../../lib/props";

/** @param {import('../../types/pages').CategoriesShowProps} props */
export default function CategoriesShow({ category, products, pagination }) {
  const items = asList(products);
  const pages = asPagination(pagination);

  return (
    <StoreLayout full>
      <Head title={pageTitle(category.name)} />

      {/* Category hero */}
      <section className="relative overflow-hidden bg-ink">
        <img
          src={decorativeImage(`category-${category.slug}`, 1920, 700)}
          alt={category.name}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <Container className="relative py-20 md:py-28">
          <Breadcrumbs
            tone="inverse"
            className="mb-5"
            items={[
              { label: "Collections", href: "/categories" },
              { label: category.name },
            ]}
          />
          <h1 className="max-w-2xl text-display-lg text-white">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 max-w-xl text-body-lg text-zinc-300">
              {category.description}
            </p>
          )}
        </Container>
      </section>

      <Container className="py-14 md:py-20">
        {items.length === 0 ? (
          <EmptyState
            title="No products in this collection yet"
            description="Check back soon or explore the full catalogue."
          >
            <Button href="/products" variant="primary" size="md">
              Browse All Products
            </Button>
          </EmptyState>
        ) : (
          <>
            <ProductGrid products={items} columns="threeToFour" />
            <Pagination pagination={pages} />
          </>
        )}
      </Container>
    </StoreLayout>
  );
}
