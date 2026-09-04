import Field from "../UI/Field";
import Input from "../UI/Input";
import Select from "../UI/Select";

/**
 * The six address fields, rendered once for shipping and once for billing.
 *
 * The checkout form posts flat, prefixed keys (`shipping_city`,
 * `billing_city`, …) because the Go handler's `parseInput` flattens every
 * value to a string and cannot read nested objects. So `prefix` is part of the
 * contract, not a styling choice — see API_CONTRACT.md, POST /checkout.
 *
 * @param {Object} props
 * @param {"shipping"|"billing"} props.prefix
 * @param {Record<string, string>} props.values keyed `${prefix}_${field}`
 * @param {(next: Record<string, string>) => void} props.onChange
 * @param {boolean} [props.required] the server requires the shipping set only
 */
const countries = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
];

export default function AddressFields({
  prefix,
  values,
  onChange,
  required = false,
}) {
  const key = (field) => `${prefix}_${field}`;
  const set = (field) => (e) =>
    onChange({ ...values, [key(field)]: e.target.value });

  const mark = (label) => (required ? `${label} *` : label);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        className="sm:col-span-2"
        label={mark("Full Name")}
        htmlFor={key("name")}
      >
        <Input
          id={key("name")}
          type="text"
          required={required}
          autoComplete={`${prefix} name`}
          value={values[key("name")]}
          onChange={set("name")}
        />
      </Field>

      <Field
        className="sm:col-span-2"
        label={mark("Address")}
        htmlFor={key("address")}
      >
        <Input
          id={key("address")}
          type="text"
          required={required}
          autoComplete={`${prefix} street-address`}
          value={values[key("address")]}
          onChange={set("address")}
        />
      </Field>

      <Field label={mark("City")} htmlFor={key("city")}>
        <Input
          id={key("city")}
          type="text"
          required={required}
          autoComplete={`${prefix} address-level2`}
          value={values[key("city")]}
          onChange={set("city")}
        />
      </Field>

      <Field label="State" htmlFor={key("state")}>
        <Input
          id={key("state")}
          type="text"
          autoComplete={`${prefix} address-level1`}
          value={values[key("state")]}
          onChange={set("state")}
        />
      </Field>

      <Field label={mark("Postal Code")} htmlFor={key("postal_code")}>
        <Input
          id={key("postal_code")}
          type="text"
          required={required}
          autoComplete={`${prefix} postal-code`}
          value={values[key("postal_code")]}
          onChange={set("postal_code")}
        />
      </Field>

      <Field label={mark("Country")} htmlFor={key("country")}>
        <Select
          id={key("country")}
          required={required}
          autoComplete={`${prefix} country`}
          value={values[key("country")]}
          onChange={set("country")}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
