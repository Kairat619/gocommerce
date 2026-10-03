import { Link, router, usePage } from "@inertiajs/react";
import { useCallback, useRef, useState } from "react";
import Container from "../UI/Container";
import Icon from "../UI/Icon";
import cn from "../../lib/cn";
import BrandMark from "./BrandMark";
import SearchForm from "./SearchForm";
import useMenuDismiss from "./useMenuDismiss";

/**
 * The dense marketplace header: logo, product search, cart and account on the
 * first row; category shortcuts on the second.
 *
 * The design also shows a delivery location, a language/currency switcher and
 * a wishlist counter. The storefront has none of those features, so they are
 * left out rather than drawn as controls that do nothing.
 */
const navLinks = [
  { label: "Shop All", href: "/products" },
  { label: "Collections", href: "/collections" },
];

function pathOf(url) {
  return (url || "/").split("?")[0];
}

function isActive(url, href) {
  const path = pathOf(url);
  return path === href || path.startsWith(`${href}/`);
}

export default function MarketplaceNavbar() {
  const { auth, cart, store } = usePage().props;
  const { url } = usePage();
  const user = auth?.user;
  const itemCount = cart?.total_items || 0;
  const firstName = user?.name?.split(" ")[0];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const closeAll = useCallback(() => {
    setAccountOpen(false);
    setDrawerOpen(false);
  }, []);

  useMenuDismiss({
    dropdownOpen: accountOpen,
    drawerOpen,
    dropdownRef: accountRef,
    closeAll,
  });

  function signOut() {
    closeAll();
    router.post("/logout");
  }

  const accountLinks = [
    { label: "My Account", href: "/account" },
    { label: "Order History", href: "/account/orders" },
    ...(user?.role === "admin" ? [{ label: "Admin Panel", href: "/admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandMark hideNameOnMobile />

        <SearchForm
          id="header-search"
          url={url}
          className="mx-2 hidden max-w-2xl flex-1 md:flex"
        />

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <Link
            href="/cart"
            aria-label={`Cart, ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-ink transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Icon name="bag" className="h-6 w-6 text-accent" />
            <span className="hidden text-[13px] font-bold sm:inline">Cart</span>
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          </Link>

          {user ? (
            <div className="relative hidden md:block" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen(!accountOpen)}
                aria-expanded={accountOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[13px] font-bold text-accent">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[11px] text-muted-foreground">Hello,</span>
                  <span className="max-w-[8rem] truncate text-[13px] font-bold text-ink">
                    {firstName}
                  </span>
                </span>
                <Icon
                  name="chevronDown"
                  className={cn("h-4 w-4 text-outline transition-transform", accountOpen && "rotate-180")}
                />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-lg">
                  <div className="border-b border-ink/10 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {accountLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t border-ink/10" />
                  <button
                    type="button"
                    onClick={signOut}
                    className="block w-full px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-muted"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:flex"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-outline">
                <Icon name="user" className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[11px] text-muted-foreground">Hello,</span>
                <span className="text-[13px] font-bold text-ink">Sign in</span>
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            aria-controls="storefront-drawer"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
          >
            <Icon name={drawerOpen ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>
      </Container>

      <Container className="pb-3 md:hidden">
        <SearchForm id="header-search-mobile" url={url} />
      </Container>

      <div className="border-t border-muted">
        <Container className="flex h-11 items-center justify-between gap-3">
          <nav aria-label="Shop" className="flex min-w-0 items-center gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/categories"
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isActive(url, "/categories")
                  ? "bg-accent text-white"
                  : "bg-surface-container text-accent hover:bg-accent-soft"
              )}
            >
              <Icon name="menu" className="h-4 w-4" />
              All Categories
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(url, link.href) ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  isActive(url, link.href)
                    ? "bg-accent text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-4 text-[13px] font-semibold text-muted-foreground lg:flex">
            <Link href="/account/orders" className="flex items-center gap-1.5 transition-colors hover:text-ink">
              <Icon name="receipt" className="h-4 w-4" />
              Track Order
            </Link>
            {store?.email && (
              <a href={`mailto:${store.email}`} className="flex items-center gap-1.5 font-bold transition-colors hover:text-ink">
                <Icon name="mail" className="h-4 w-4" />
                Contact Us
              </a>
            )}
          </div>
        </Container>
      </div>

      {drawerOpen && (
        <div id="storefront-drawer" className="border-t border-muted bg-white md:hidden">
          <Container className="space-y-1 pb-4 pt-3">
            {user ? (
              <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted px-3 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="mb-2 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  className="rounded-lg border border-ink/15 px-3 py-2.5 text-center text-sm font-bold text-ink"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-bold text-white"
                >
                  Create Account
                </Link>
              </div>
            )}

            {[
              { label: "All Categories", href: "/categories" },
              ...navLinks,
              { label: "Track Order", href: "/account/orders" },
              ...(user ? accountLinks : []),
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}

            {store?.email && (
              <a
                href={`mailto:${store.email}`}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-muted"
              >
                Contact Us
              </a>
            )}

            {user && (
              <button
                type="button"
                onClick={signOut}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-ink transition-colors hover:bg-muted"
              >
                Sign Out
              </button>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}
