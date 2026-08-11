import { Head, Link } from "@inertiajs/react";
import StoreLayout from "../Components/StoreLayout";
import ProductCard from "../Components/ProductCard";
import SectionHeading from "../Components/UI/SectionHeading";
import Button from "../Components/UI/Button";

const categoryImages = [
  "https://picsum.photos/seed/shopnest-electronics/800/1000",
  "https://picsum.photos/seed/shopnest-apparel/800/1000",
  "https://picsum.photos/seed/shopnest-home/800/1000",
  "https://picsum.photos/seed/shopnest-books/800/1000",
];

const valueProps = [
  {
    title: "Complimentary Shipping",
    body: "On all orders above $200, always tracked.",
  },
  {
    title: "30-Day Returns",
    body: "Hassle-free returns within 30 days of delivery.",
  },
  {
    title: "Secure Checkout",
    body: "Encrypted, 100% secure payment processing.",
  },
];

export default function Welcome({ featured_products = [], categories = [] }) {
  const featured = featured_products.slice(0, 8);
  const cats = categories.slice(0, 4);

  return (
    <StoreLayout full>
      <Head title="ShopNest — Curated Home & Lifestyle" />

      {/* Hero */}
      <section className="relative min-h-[78vh] overflow-hidden bg-ink">
        <img
          src="https://picsum.photos/seed/shopnest-hero-lifestyle/1920/1200"
          alt="Curated home and lifestyle collection"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-screen-2xl items-center px-4 md:px-8 lg:px-12">
          <div className="max-w-xl animate-fade-up py-24 text-white">
            <span className="mb-5 block text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
              New Collection 2025
            </span>
            <h1 className="text-display-xl text-white">
              Elevate Your Everyday Style
            </h1>
            <p className="mt-6 max-w-md text-body-lg text-zinc-300">
              Premium products curated for modern living. Quality craftsmanship
              meets contemporary design.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="/products" variant="inverse" size="lg">
                Shop Now
              </Button>
              <Button href="/categories" variant="inverse-outline" size="lg">
                Explore Collections
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-ink/10 bg-surface">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 divide-y divide-ink/10 px-4 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8 lg:px-12">
          {valueProps.map((vp) => (
            <div key={vp.title} className="px-2 py-8 md:px-8">
              <h3 className="text-headline-md font-semibold text-ink">
                {vp.title}
              </h3>
              <p className="mt-1.5 text-body-sm text-muted-foreground">
                {vp.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      {cats.length > 0 && (
        <section className="mx-auto max-w-screen-2xl px-4 py-16 md:px-8 md:py-24 lg:px-12">
          <SectionHeading
            eyebrow="Curated Categories"
            title="Shop by Collection"
            actionLabel="View All"
            actionHref="/categories"
          />
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {cats.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group relative aspect-[3/4] overflow-hidden bg-surface-container"
              >
                <img
                  src={categoryImages[i % categoryImages.length]}
                  alt={cat.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-serif text-headline-md text-white">
                    {cat.name}
                  </h3>
                  <span className="mt-1 inline-block text-label-sm uppercase tracking-[0.12em] text-white/80">
                    {cat.product_count} item
                    {cat.product_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="border-y border-ink/10 bg-white">
          <div className="mx-auto max-w-screen-2xl px-4 py-16 md:px-8 md:py-24 lg:px-12">
            <SectionHeading
              eyebrow="Editor's Choice"
              title="Featured This Season"
              description="Hand-picked selections for the discerning eye."
              actionLabel="Shop All"
              actionHref="/products"
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Editorial CTA band */}
      <section className="relative overflow-hidden bg-ink">
        <img
          src="https://picsum.photos/seed/shopnest-editorial-band/1920/900"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative mx-auto max-w-screen-2xl px-4 py-20 text-center md:px-8 md:py-28 lg:px-12">
          <span className="mb-4 block text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
            The ShopNest Promise
          </span>
          <h2 className="mx-auto max-w-2xl text-display-lg text-white">
            Ready to upgrade your lifestyle?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-body-lg text-zinc-300">
            Join thousands of satisfied customers and discover products that
            make a difference.
          </p>
          <div className="mt-9 flex justify-center">
            <Button href="/products" variant="inverse" size="lg">
              Start Shopping
            </Button>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
