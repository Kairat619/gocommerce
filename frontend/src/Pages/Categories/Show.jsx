import { Head } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import ProductCard from "../../Components/ProductCard";
import Pagination from "../../Components/Pagination";
import Button from "../../Components/UI/Button";
import Container from "../../Components/UI/Container";
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
          <div className="border border-dashed border-ink/15 py-24 text-center">
            <p className="font-serif text-headline-md text-ink">
              No products in this collection yet
            </p>
            <p className="mt-2 text-body-sm text-muted-foreground">
              Check back soon or explore the full catalogue.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/products" variant="primary" size="md">
                Browse All Products
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
            <Pagination pagination={pages} />
          </>
        )}
      </Container>
    </StoreLayout>
  );
}
