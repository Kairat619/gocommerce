import { useState } from "react";
import { router } from "@inertiajs/react";

export default function SearchBar({ defaultValue = "" }) {
  const [query, setQuery] = useState(defaultValue);

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    const qs = params.toString();
    router.get("/products" + (qs ? `?${qs}` : ""), {}, { preserveScroll: true });
  };

  return (
    <form onSubmit={submit} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search curated styles..."
        className="w-full border border-ink/20 bg-white py-2.5 pl-10 pr-4 text-body-sm text-ink placeholder:text-outline focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </form>
  );
}
