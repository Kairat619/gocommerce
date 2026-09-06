import { useState } from "react";

import Field, { inputClass } from "../Form/Field";
import FormCard from "../Form/FormCard";
import Textarea from "../Form/Textarea";
import { generateCode, normalizeCode, sanitizeCodeInput } from "./couponFormState";

/**
 * The coupon code gets its own treatment rather than sitting in a row of
 * inputs: it is the one value a customer ever types, so it is shown large, in
 * the exact form it will be stored, with copy and generate beside it.
 */
export default function CouponBasicInfo({ form, setField, errors, isEdit }) {
  const [copied, setCopied] = useState(false);
  const preview = normalizeCode(form.code);

  async function copy() {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be refused; the code is visible and selectable
      // anyway, so there is nothing to recover from.
    }
  }

  return (
    <FormCard
      title="Coupon code"
      description="The code customers enter at checkout. Stored in capitals, so case never matters to a shopper."
    >
      <div className="space-y-5">
        <Field
          label="Code"
          htmlFor="code"
          required
          error={errors.code}
          hint="Letters, numbers, hyphens and underscores."
        >
          <div className="flex flex-wrap items-stretch gap-2">
            <input
              id="code"
              name="code"
              value={form.code}
              onChange={(e) => setField("code", sanitizeCodeInput(e.target.value))}
              aria-invalid={errors.code ? "true" : undefined}
              aria-describedby="code-preview"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={64}
              placeholder="WELCOME10"
              className={`${inputClass(errors.code)} min-w-0 flex-1 font-mono text-base uppercase tracking-[0.12em]`}
            />

            <button
              type="button"
              onClick={() => setField("code", generateCode())}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Generate
            </button>

            <button
              type="button"
              onClick={copy}
              disabled={!preview}
              aria-label={`Copy coupon code ${preview}`}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* The stored form, so an entry typed in lower case is never a surprise. */}
          <p id="code-preview" className="mt-2 text-xs text-gray-500" aria-live="polite">
            {preview ? (
              <>
                Customers will enter <span className="font-mono font-semibold text-gray-800">{preview}</span>
              </>
            ) : (
              "Pick something short and memorable, or generate one."
            )}
          </p>
        </Field>

        <Textarea
          label="Internal note"
          name="description"
          value={form.description}
          onChange={(value) => setField("description", value)}
          error={errors.description}
          rows={3}
          maxLength={500}
          placeholder="e.g. Autumn promotion for kitchen products — approved by marketing."
          hint="For your team only. Customers never see this."
        />

        {isEdit && (
          <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Changing the code stops the old one working immediately. Orders already placed keep the code they
            were placed with.
          </p>
        )}
      </div>
    </FormCard>
  );
}
