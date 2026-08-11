import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../../Components/StoreLayout";
import ProductCard from "../../Components/ProductCard";
import Pagination from "../../Components/Pagination";
import Button from "../../Components/UI/Button";

export default function CategoriesShow({ category, products, pagination }) {
  return (
    <StoreLayout full>
      <Head title={`${category.name} | ShopNest`} />

      {/* Category hero */}
      <section className="relative overflow-hidden bg-ink">
        <img
          src={`https://picsum.photos/seed/shopnest-${category.slug}/1920/700`}
          alt={category.name}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative mx-auto max-w-screen-2xl px-4 py-20 md:px-8 md:py-28 lg:px-12">
          <nav className="mb-5 flex items-center gap-2 text-label-sm uppercase tracking-[0.1em] text-white/70">
            <Link href="/categories" className="transition-colors hover:text-accent">
              Collections
            </Link>
            <span>/</span>
            <span className="text-white">{category.name}</span>
          </nav>
          <h1 className="max-w-2xl text-display-lg text-white">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 max-w-xl text-body-lg text-zinc-300">
              {category.description}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-screen-2xl px-4 py-14 md:px-8 md:py-20 lg:px-12">
        {products.length === 0 ? (
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
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
            <Pagination pagination={pagination} />
          </>
        )}
      </div>
    </StoreLayout>
  );
}
