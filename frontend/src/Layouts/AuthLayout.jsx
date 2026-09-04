import { Link } from "@inertiajs/react";
import FlashMessage from "../Components/FlashMessage";
import { BRAND_NAME } from "../lib/brand";

/**
 * The centred card used by sign-in and registration.
 *
 * These two pages sit outside StoreLayout — a guest mid-authentication has no
 * cart and no nav to speak of — so this layout mounts FlashMessage itself.
 * It is the only renderer of flash on these pages.
 *
 * @param {Object} props
 * @param {string} props.subtitle  the line under the wordmark
 * @param {React.ReactNode} props.children  the form card's contents
 * @param {React.ReactNode} [props.footer]  the "already have an account" line
 */
export default function AuthLayout({ subtitle, children, footer }) {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <Link
              href="/"
              className="font-serif text-display-md text-ink transition-colors hover:text-accent"
            >
              {BRAND_NAME}
            </Link>
            <p className="mt-2 text-body-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          <div className="border border-ink/10 bg-white p-8">{children}</div>

          {footer && (
            <p className="mt-6 text-center text-body-sm text-muted-foreground">
              {footer}
            </p>
          )}
        </div>
      </div>

      <FlashMessage />
    </>
  );
}
