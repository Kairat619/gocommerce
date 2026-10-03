import { Link, usePage } from "@inertiajs/react";
import Container from "../UI/Container";
import Icon from "../UI/Icon";
import { BRAND_NAME } from "../../lib/brand";
import BrandMark from "./BrandMark";

/**
 * The marketplace footer: a reassurance strip, a brand column with the
 * store's own description and contact details, and link columns.
 *
 * Every link goes somewhere real. The design's About/Careers/Press, legal
 * pages, social icons and payment-network badges have no pages, URLs or
 * payment integration behind them in this storefront, so they are omitted.
 */
const assurances = [
  { icon: "truck", title: "Tracked Delivery", body: "Every order, door to door" },
  { icon: "shield", title: "Secure Checkout", body: "Your details stay protected" },
  { icon: "support", title: "Dedicated Support", body: "Real people, ready to help" },
  { icon: "return", title: "Easy Returns", body: "Hassle-free after delivery" },
];

const FALLBACK_DESCRIPTION =
  "A marketplace for quality products, delivered quickly and backed by people who care.";

export default function MarketplaceFooter() {
  const { auth, store } = usePage().props;
  const user = auth?.user;

  const columns = [
    {
      heading: "Shop",
      links: [
        { label: "All Products", href: "/products" },
        { label: "Categories", href: "/categories" },
        { label: "Collections", href: "/collections" },
      ],
    },
    {
      heading: "Customer Care",
      links: [
        { label: "Track Order", href: "/account/orders" },
        { label: "Shopping Cart", href: "/cart" },
        ...(store?.email ? [{ label: "Contact Us", href: `mailto:${store.email}` }] : []),
      ],
    },
    {
      heading: "My Account",
      links: user
        ? [
            { label: "Dashboard", href: "/account" },
            { label: "Orders", href: "/account/orders" },
          ]
        : [
            { label: "Sign In", href: "/login" },
            { label: "Create Account", href: "/register" },
          ],
    },
  ];

  return (
    <footer className="border-t border-surface-container bg-muted">
      <div className="border-b border-surface-container bg-white">
        <Container as="ul" className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {assurances.map((item) => (
            <li key={item.title} className="flex items-center gap-3">
              <Icon name={item.icon} className="h-8 w-8 shrink-0 text-accent" />
              <div>
                <p className="text-base font-bold leading-6 text-ink">{item.title}</p>
                <p className="text-[13px] leading-[18px] text-muted-foreground">{item.body}</p>
              </div>
            </li>
          ))}
        </Container>
      </div>

      <Container className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <BrandMark size="sm" />
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            {store?.description || FALLBACK_DESCRIPTION}
          </p>
          {(store?.email || store?.phone) && (
            <ul className="mt-5 space-y-2 text-[13px] text-muted-foreground">
              {store?.email && (
                <li>
                  <a href={`mailto:${store.email}`} className="flex items-center gap-2 transition-colors hover:text-accent">
                    <Icon name="mail" className="h-4 w-4 shrink-0" />
                    {store.email}
                  </a>
                </li>
              )}
              {store?.phone && (
                <li>
                  <a href={`tel:${store.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 transition-colors hover:text-accent">
                    <Icon name="phone" className="h-4 w-4 shrink-0" />
                    {store.phone}
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h4 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink">
              {col.heading}
            </h4>
            <ul className="space-y-2 text-[13px] text-muted-foreground">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("mailto:") ? (
                    <a href={link.href} className="transition-colors hover:text-accent">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="transition-colors hover:text-accent">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t border-surface-container">
        <Container className="py-6 text-[13px] text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
