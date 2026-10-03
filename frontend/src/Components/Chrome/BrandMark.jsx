import { Link } from "@inertiajs/react";
import cn from "../../lib/cn";
import { BRAND_NAME } from "../../lib/brand";

/**
 * The marketplace logo lockup: a rounded monogram tile beside the store name.
 *
 * Built from the configured store name rather than an image, so renaming the
 * shop in Settings -> General renames the logo too.
 */
const sizes = {
  md: { tile: "h-8 w-8 text-lg", name: "text-xl" },
  sm: { tile: "h-7 w-7 text-base", name: "text-base" },
};

export default function BrandMark({ size = "md", hideNameOnMobile = false }) {
  const scale = sizes[size] || sizes.md;

  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-lg bg-accent font-extrabold text-white",
          scale.tile
        )}
      >
        {BRAND_NAME.charAt(0).toUpperCase()}
      </span>
      <span
        className={cn(
          "font-extrabold uppercase tracking-tight text-accent",
          scale.name,
          hideNameOnMobile && "hidden sm:inline"
        )}
      >
        {BRAND_NAME}
      </span>
    </Link>
  );
}
