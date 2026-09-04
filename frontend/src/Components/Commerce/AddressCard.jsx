import cn from "../../lib/cn";
import Badge from "../UI/Badge";

/**
 * A saved address. Renders as a button when `onSelect` is given (the checkout
 * picker) and as a plain panel otherwise (the account address list).
 *
 * @param {Object} props
 * @param {import('../../types/commerce').Address} props.address
 * @param {() => void} [props.onSelect]
 */
export default function AddressCard({ address, onSelect, className = "" }) {
  const body = (
    <>
      {address.label && (
        <p className="mb-1.5 text-label-sm font-semibold uppercase tracking-[0.12em] text-outline">
          {address.label}
        </p>
      )}
      <p className="font-serif text-body-lg text-ink">
        {address.first_name} {address.last_name}
      </p>
      {address.company && (
        <p className="mt-1 text-body-sm text-muted-foreground">
          {address.company}
        </p>
      )}
      <p className="mt-2 text-body-sm text-muted-foreground">
        {address.address_line1}
      </p>
      {address.address_line2 && (
        <p className="text-body-sm text-muted-foreground">
          {address.address_line2}
        </p>
      )}
      <p className="text-body-sm text-muted-foreground">
        {address.city}, {address.state} {address.postal_code}
      </p>
      <p className="text-body-sm text-muted-foreground">{address.country}</p>
      {address.phone && (
        <p className="mt-2 text-body-sm text-muted-foreground">
          {address.phone}
        </p>
      )}
      {address.is_default && (
        <Badge tone="outline" size="sm" className="mt-3">
          Default
        </Badge>
      )}
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "border border-ink/15 p-5 text-left transition-colors hover:border-ink hover:bg-muted",
          className
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={cn("border border-ink/15 p-5", className)}>{body}</div>
  );
}
