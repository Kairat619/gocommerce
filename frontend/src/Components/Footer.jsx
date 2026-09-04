import { Link } from "@inertiajs/react";
import Container from "./UI/Container";
import { BRAND_NAME } from "../lib/brand";

const columns = [
  {
    heading: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Collections", href: "/categories" },
      { label: "New Arrivals", href: "/products" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/products" },
      { label: "Sustainability", href: "/products" },
      { label: "Journal", href: "/products" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Shipping & Returns", href: "/products" },
      { label: "Contact", href: "/products" },
      { label: "FAQ", href: "/products" },
    ],
  },
];

const socials = ["IG", "TW", "FB"];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-ink-container text-white">
      <Container className="grid grid-cols-1 gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Link href="/" className="font-serif text-lg font-bold text-white">
            {BRAND_NAME}
          </Link>
          <p className="mt-5 font-serif text-body-sm leading-relaxed text-zinc-400">
            Curating the world's finest minimalist fashion and lifestyle goods
            since 2024.
          </p>
          <div className="mt-8 flex gap-3">
            {socials.map((s) => (
              <span
                key={s}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-label-sm text-zinc-300 transition-colors hover:border-white hover:text-white"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h4 className="mb-5 text-label-sm font-semibold uppercase tracking-[0.2em] text-white">
              {col.heading}
            </h4>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-serif text-body-sm text-zinc-300 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t border-zinc-800">
        <Container className="flex flex-col gap-3 py-6 text-label-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/products" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/products" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/products" className="transition-colors hover:text-white">
              Accessibility
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
