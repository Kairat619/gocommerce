import Breadcrumbs from "../Breadcrumbs";
import ProductGrid from "../Commerce/ProductGrid";
import Container from "../UI/Container";
import ShelfHeading from "../../sections/marketplace/ShelfHeading";
import ProductInfoTabs from "./ProductInfoTabs";
import ProductShowcase from "./ProductShowcase";
import PurchasePanel from "./PurchasePanel";

/**
 * The marketplace product page: gallery beside the buy box, information tabs
 * beneath, and related products to finish.
 *
 * Presentational. Pages/Products/Show owns variant, quantity and cart state
 * and passes the purchase props straight through to PurchasePanel.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').ProductDetail} props.product
 * @param {import('../../types/commerce').ProductImage[]} props.images
 * @param {import('../../types/commerce').RelatedProduct[]} props.related
 * @param {Object} props.purchase  PurchasePanel props, minus `product`
 */
export default function MarketplaceProductDetail({ product, images, related, purchase }) {
  return (
    <Container className="py-6 md:py-8">
      <Breadcrumbs
        look="marketplace"
        className="mb-2"
        items={[
          { label: "Shop", href: "/products" },
          { label: product.category_name, href: `/categories/${product.category_slug}` },
          { label: product.name },
        ]}
      />
      {product.sku && (
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-wider text-outline">
          SKU: {product.sku}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <ProductShowcase product={product} images={images} discount={purchase.discount} />
        </div>
        <div className="lg:col-span-5">
          <PurchasePanel product={product} {...purchase} />
        </div>
      </div>

      <div className="mt-8">
        <ProductInfoTabs product={product} />
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <ShelfHeading
            title="Customers Also Viewed"
            actionLabel="View Category"
            actionHref={`/categories/${product.category_slug}`}
          />
          <ProductGrid products={related} columns="marketplace" spacing="compact" />
        </section>
      )}
    </Container>
  );
}
