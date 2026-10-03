import Icon from "../UI/Icon";
import cn from "../../lib/cn";

/**
 * Saved addresses as a radio group, plus "use a different address".
 *
 * Radios rather than buttons so the choice is announced and arrow-key
 * navigable. The page owns the choice and copies the chosen address into the
 * shipping fields the order is posted with.
 *
 * @param {Object} props
 * @param {import('../../types/commerce').Address[]} props.addresses
 * @param {string} props.value  an address id, or "new"
 * @param {(value: string) => void} props.onChange
 */
export default function AddressPicker({ addresses, value, onChange }) {
  const options = [
    ...addresses.map((address) => ({
      value: address.id,
      content: (
        <>
          <span className="flex items-start justify-between gap-2">
            <span className="text-sm font-bold text-ink">
              {address.first_name} {address.last_name}
              {address.label && (
                <span className="font-semibold text-muted-foreground"> ({address.label})</span>
              )}
            </span>
            {address.is_default && (
              <span className="shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                Default
              </span>
            )}
          </span>
          <span className="mt-1 block text-[13px] leading-5 text-muted-foreground">
            {address.address_line1}
            {address.address_line2 && `, ${address.address_line2}`}
            <br />
            {[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}
            {" · "}
            {address.country}
          </span>
          {address.phone && (
            <span className="mt-1 block text-[13px] text-muted-foreground">{address.phone}</span>
          )}
        </>
      ),
    })),
    {
      value: "new",
      content: (
        <>
          <span className="flex items-center gap-2 text-sm font-bold text-accent">
            <Icon name="arrowRight" className="h-4 w-4 -rotate-45" />
            Use a different address
          </span>
          <span className="mt-1 block text-[13px] text-muted-foreground">
            Enter a delivery address for this order.
          </span>
        </>
      ),
    },
  ];

  return (
    <fieldset>
      <legend className="sr-only">Choose a delivery address</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors focus-within:ring-2 focus-within:ring-accent",
                checked
                  ? "border-accent bg-surface-container"
                  : "border-transparent bg-muted hover:border-accent-soft"
              )}
            >
              <input
                type="radio"
                name="shipping-address-choice"
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--color-accent))] focus:outline-none"
              />
              <span className="min-w-0 flex-1">{option.content}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
