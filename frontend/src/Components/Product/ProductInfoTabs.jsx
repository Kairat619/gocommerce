import { useRef, useState } from "react";
import cn from "../../lib/cn";
import { hasAmount } from "../../lib/money";

/**
 * Description and specifications, as keyboard-navigable tabs.
 *
 * Specifications list only fields the product actually carries. The design's
 * reviews and Q&A tabs are absent: the storefront has neither.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').ProductDetail} props.product
 */
export default function ProductInfoTabs({ product }) {
  const specs = [
    { label: "Category", value: product.category_name },
    { label: "SKU", value: product.sku },
    { label: "Barcode", value: product.barcode },
    { label: "Weight", value: hasAmount(product.weight) ? `${product.weight} kg` : "" },
  ].filter((spec) => spec.value);

  const tabs = [
    product.description && { id: "description", label: "Description" },
    specs.length > 0 && { id: "specifications", label: "Specifications" },
  ].filter(Boolean);

  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const tabRefs = useRef({});

  if (tabs.length === 0) return null;

  function onKeyDown(e, index) {
    const moves = { ArrowRight: 1, ArrowLeft: -1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = tabs[(index + moves[e.key] + tabs.length) % tabs.length];
    setActiveId(next.id);
    tabRefs.current[next.id]?.focus();
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm md:p-6">
      <div role="tablist" aria-label="Product information" className="flex gap-2 overflow-x-auto border-b border-muted pb-3">
        {tabs.map((tab, index) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active ? "bg-accent text-white" : "text-muted-foreground hover:bg-muted hover:text-ink"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeId === "description" && (
        <div
          role="tabpanel"
          id="panel-description"
          aria-labelledby="tab-description"
          tabIndex={0}
          className="prose-product mt-4 max-w-3xl text-sm leading-7 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      )}

      {activeId === "specifications" && (
        <div role="tabpanel" id="panel-specifications" aria-labelledby="tab-specifications" tabIndex={0} className="mt-4">
          <dl className="max-w-2xl divide-y divide-muted overflow-hidden rounded-xl border border-muted">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm odd:bg-muted/50">
                <dt className="text-muted-foreground">{spec.label}</dt>
                <dd className="col-span-2 font-semibold text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
