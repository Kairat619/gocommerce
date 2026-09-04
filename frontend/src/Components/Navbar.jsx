import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import CartIcon from "./CartIcon";
import Container from "./UI/Container";
import { BRAND_NAME } from "../lib/brand";

const navLinks = [
  { label: "New Arrivals", href: "/products" },
  { label: "Shop", href: "/products" },
  { label: "Collections", href: "/categories" },
];

export default function Navbar() {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // A dropdown that only closes when you click its own trigger is a trap:
  // click anywhere else and it follows you down the page.
  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const onPointerDown = (e) => {
      if (!userMenuRef.current?.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [userMenuOpen]);

  // Escape closes whichever menu is open.
  useEffect(() => {
    if (!userMenuOpen && !mobileMenuOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [userMenuOpen, mobileMenuOpen]);

  // Navigating away must not leave a menu hanging open behind the new page.
  useEffect(() => {
    return router.on("navigate", () => {
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
    });
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-ink text-center text-label-sm font-medium uppercase tracking-[0.18em] text-white/90">
        <p className="px-4 py-2">
          Complimentary shipping on all orders over $200
        </p>
      </div>

      <div className="border-b border-ink/10 bg-surface/85 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="font-serif text-2xl font-bold tracking-tight text-ink"
            >
              {BRAND_NAME}
            </Link>
            <nav className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-body-sm font-medium tracking-tight text-muted-foreground transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <CartIcon />
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 px-3 py-1.5 text-body-sm font-medium text-ink transition-colors hover:text-accent"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-label-sm font-semibold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                  <span>{user.name}</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 border border-ink/10 bg-white py-1 shadow-lg">
                    <div className="border-b border-ink/10 px-4 py-3">
                      <p className="text-body-sm font-medium text-ink">
                        {user.name}
                      </p>
                      <p className="text-label-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/account"
                      className="block px-4 py-2.5 text-body-sm text-ink transition-colors hover:bg-muted"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      className="block px-4 py-2.5 text-body-sm text-ink transition-colors hover:bg-muted"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Order History
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2.5 text-body-sm text-ink transition-colors hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-ink/10" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.post("/logout");
                      }}
                      className="block w-full px-4 py-2.5 text-left text-body-sm text-ink transition-colors hover:bg-muted"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-body-sm font-medium text-ink transition-colors hover:text-accent"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-ink px-5 py-2.5 text-label-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-accent"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <CartIcon />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center text-ink"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </Container>

        {mobileMenuOpen && (
          <div className="border-t border-ink/10 bg-surface md:hidden">
            <div className="space-y-1 px-4 pb-4 pt-3">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block px-3 py-2.5 text-body-md font-medium text-ink transition-colors hover:text-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/cart"
                className="block px-3 py-2.5 text-body-md font-medium text-ink transition-colors hover:text-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
              </Link>

              {user ? (
                <div className="mt-3 border-t border-ink/10 pt-3">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-label-sm font-semibold text-white">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-body-sm font-medium text-ink">
                        {user.name}
                      </p>
                      <p className="text-label-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/account"
                    className="block px-3 py-2.5 text-body-md font-medium text-ink transition-colors hover:text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block px-3 py-2.5 text-body-md font-medium text-ink transition-colors hover:text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Order History
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2.5 text-body-md font-medium text-ink transition-colors hover:text-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.post("/logout");
                    }}
                    className="block w-full px-3 py-2.5 text-left text-body-md font-medium text-ink transition-colors hover:text-accent"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-2 border-t border-ink/10 pt-3">
                  <Link
                    href="/login"
                    className="block border border-ink/20 px-3 py-2.5 text-center text-label-lg font-semibold uppercase tracking-[0.08em] text-ink"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block bg-ink px-3 py-2.5 text-center text-label-lg font-semibold uppercase tracking-[0.08em] text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
