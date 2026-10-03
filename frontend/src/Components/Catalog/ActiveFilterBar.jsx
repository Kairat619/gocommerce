import Icon from "../UI/Icon";

/**
 * The applied filters as removable chips, with a "Clear All".
 *
 * @param {Object} props
 * @param {{key: string, label: string}[]} props.filters
 * @param {(key: string) => void} props.onRemove
 * @param {() => void} props.onClear
 */
export default function ActiveFilterBar({ filters, onRemove, onClear }) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
      <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Active filters:
      </span>
      <ul className="flex flex-1 flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <li key={filter.key}>
            <button
              type="button"
              onClick={() => onRemove(filter.key)}
              aria-label={`Remove filter: ${filter.label}`}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[13px] font-semibold text-accent transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {filter.label}
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClear}
        className="flex items-center gap-1 rounded text-[13px] font-bold text-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
      >
        <Icon name="return" className="h-4 w-4" />
        Clear All
      </button>
    </div>
  );
}
