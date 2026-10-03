import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Icon from "../UI/Icon";
import cn from "../../lib/cn";

function searchTermOf(url) {
  const query = (url || "").split("?")[1] || "";
  return new URLSearchParams(query).get("q") || "";
}

/**
 * Header product search. Submits to the catalogue's existing `?q=` filter, so
 * results are the ordinary /products page.
 */
export default function SearchForm({ id, url, className = "" }) {
  const [term, setTerm] = useState(() => searchTermOf(url));

  // Keep the box in step with the results page it sits above.
  useEffect(() => {
    setTerm(searchTermOf(url));
  }, [url]);

  function submit(e) {
    e.preventDefault();
    const q = term.trim();
    router.get("/products", q ? { q } : {});
  }

  function clear() {
    setTerm("");
    if ((url || "").split("?")[0] === "/products" && searchTermOf(url)) {
      router.get("/products");
    }
  }

  return (
    <form role="search" onSubmit={submit} className={cn("relative flex w-full items-center", className)}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Icon
        name="search"
        className="pointer-events-none absolute left-3.5 h-5 w-5 text-outline"
      />
      <input
        id={id}
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search products, brands and categories..."
        className="w-full rounded-lg border-0 bg-muted py-2 pl-10 pr-10 text-sm text-ink placeholder:text-outline focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
      />
      {term && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-outline hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
