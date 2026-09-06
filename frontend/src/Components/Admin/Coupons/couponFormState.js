/**
 * Coupon form state, shared by Create and Edit.
 *
 * Every rule here mirrors validateCouponForm in
 * internal/handler/admin_coupons.go so the merchant sees problems before a
 * round trip. The server stays authoritative — code uniqueness in particular
 * can only be settled there.
 */

export const DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
  FREE_SHIPPING: "free_shipping",
};

/** Matches service.NormalizeCode in Go, so the preview is what gets stored. */
export function normalizeCode(code) {
  return String(code ?? "")
    .trim()
    .toUpperCase();
}

/** Strips anything the server would reject, without upper-casing as you type. */
export function sanitizeCodeInput(value) {
  return String(value ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Suggests a code for merchants who do not have one in mind. Ambiguous
 * characters (O/0, I/1) are left out because customers type these by hand.
 */
export function generateCode(prefix = "SAVE") {
  let suffix = "";
  const values = new Uint32Array(6);
  crypto.getRandomValues(values);
  for (const value of values) suffix += CODE_ALPHABET[value % CODE_ALPHABET.length];
  return normalizeCode(prefix) + suffix;
}

/**
 * The columns behind these fields are NOT NULL and default to 0, so the server
 * sends "0.00" for "no minimum". Blank is what the merchant should see, since
 * the input's placeholder says "No minimum".
 */
function optionalAmount(value) {
  const amount = Number(String(value ?? "").trim());
  return Number.isFinite(amount) && amount > 0 ? String(value) : "";
}

export function buildInitialForm(coupon) {
  const source = coupon || {};

  return {
    code: source.code || "",
    description: source.description || "",
    is_active: source.is_active != null ? source.is_active : true,

    discount_type: source.discount_type || DISCOUNT_TYPES.PERCENTAGE,
    // Only a free-shipping coupon stores 0, so a 0 here means "unset" — the
    // field starts blank if the merchant switches to a type that needs a value.
    discount_value: optionalAmount(source.discount_value),
    max_discount_amount: source.max_discount_amount || "",

    min_order_amount: optionalAmount(source.min_order_amount),
    min_order_quantity: source.min_order_quantity ? String(source.min_order_quantity) : "",

    // null from the server means unlimited, which is the blank input.
    max_uses: source.max_uses != null ? String(source.max_uses) : "",
    max_uses_per_customer: source.max_uses_per_customer != null ? String(source.max_uses_per_customer) : "",

    starts_at: source.starts_at || "",
    ends_at: source.ends_at || "",
  };
}

/**
 * Sends only the fields the selected discount type actually uses, so a value
 * left behind by switching type is never submitted.
 */
export function toPayload(form, redirectTo) {
  const isPercentage = form.discount_type === DISCOUNT_TYPES.PERCENTAGE;
  const isFreeShipping = form.discount_type === DISCOUNT_TYPES.FREE_SHIPPING;

  return {
    code: normalizeCode(form.code),
    description: form.description,
    is_active: form.is_active,

    discount_type: form.discount_type,
    discount_value: isFreeShipping ? "0" : form.discount_value,
    max_discount_amount: isPercentage ? form.max_discount_amount : "",

    min_order_amount: form.min_order_amount,
    min_order_quantity: form.min_order_quantity,

    max_uses: form.max_uses,
    max_uses_per_customer: form.max_uses_per_customer,

    starts_at: form.starts_at,
    ends_at: form.ends_at,

    redirect_to: redirectTo,
  };
}

function money(errors, field, raw, { required = false, label = "This value" } = {}) {
  const value = String(raw ?? "").trim();

  if (!value) {
    if (required) errors[field] = `${label} is required.`;
    return null;
  }
  if (!/^\d*\.?\d*$/.test(value) || value === ".") {
    errors[field] = "Enter a valid amount.";
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors[field] = "Enter a valid amount.";
    return null;
  }
  if (parsed < 0) {
    errors[field] = "Value cannot be negative.";
    return null;
  }
  return parsed;
}

function whole(errors, field, raw, { min = 0 } = {}) {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  if (!/^\d+$/.test(value)) {
    errors[field] =
      min === 1
        ? "Enter a whole number, or leave blank for unlimited."
        : "Enter a whole number.";
    return null;
  }

  const parsed = Number(value);
  if (parsed < min) {
    errors[field] =
      min === 1
        ? "Enter a limit of at least 1, or leave blank for unlimited."
        : "Value cannot be negative.";
    return null;
  }
  return parsed;
}

export function validateForm(form) {
  const errors = {};

  const code = normalizeCode(form.code);
  if (!code) errors.code = "Coupon code is required.";
  else if (code.length > 64) errors.code = "Coupon code must be 64 characters or fewer.";
  else if (!/^[A-Z0-9_-]+$/.test(code)) {
    errors.code = "Coupon code can only contain letters, numbers, hyphens and underscores.";
  }

  if (form.description.trim().length > 500) {
    errors.description = "Internal note must be 500 characters or fewer.";
  }

  validateDiscount(errors, form);

  money(errors, "min_order_amount", form.min_order_amount);
  whole(errors, "min_order_quantity", form.min_order_quantity, { min: 0 });

  whole(errors, "max_uses", form.max_uses, { min: 1 });
  whole(errors, "max_uses_per_customer", form.max_uses_per_customer, { min: 1 });

  validateDates(errors, form);

  return errors;
}

function validateDiscount(errors, form) {
  switch (form.discount_type) {
    case DISCOUNT_TYPES.FREE_SHIPPING:
      // Carries no amount at all.
      return;

    case DISCOUNT_TYPES.PERCENTAGE: {
      const percent = money(errors, "discount_value", form.discount_value, {
        required: true,
        label: "Discount percentage",
      });
      if (percent !== null) {
        if (percent <= 0) errors.discount_value = "Enter a percentage greater than 0.";
        else if (percent > 100) errors.discount_value = "A percentage discount cannot exceed 100%.";
      }

      if (String(form.max_discount_amount ?? "").trim()) {
        const cap = money(errors, "max_discount_amount", form.max_discount_amount);
        if (cap !== null && cap <= 0) {
          errors.max_discount_amount =
            "Enter a maximum discount greater than 0, or leave it blank for no cap.";
        }
      }
      return;
    }

    case DISCOUNT_TYPES.FIXED: {
      const amount = money(errors, "discount_value", form.discount_value, {
        required: true,
        label: "Discount amount",
      });
      if (amount !== null && amount <= 0) {
        errors.discount_value = "Enter a discount amount greater than 0.";
      }
      return;
    }

    default:
      errors.discount_type = "Choose a discount type.";
  }
}

function validateDates(errors, form) {
  const starts = form.starts_at ? new Date(form.starts_at) : null;
  const ends = form.ends_at ? new Date(form.ends_at) : null;

  if (starts && Number.isNaN(starts.getTime())) errors.starts_at = "Enter a valid date and time.";
  if (ends && Number.isNaN(ends.getTime())) errors.ends_at = "Enter a valid date and time.";

  if (starts && ends && !errors.starts_at && !errors.ends_at && ends <= starts) {
    errors.ends_at = "The end date must be after the start date.";
  }
}

/**
 * The coupon's effective state, combining the manual switch with the schedule
 * and the usage counter. Mirrors couponLifecycle in the Go handler so the form
 * and the list describe a coupon the same way.
 */
export function lifecycleOf(form, { usedCount = 0 } = {}) {
  if (!form.is_active) return "disabled";

  const now = new Date();
  const starts = form.starts_at ? new Date(form.starts_at) : null;
  const ends = form.ends_at ? new Date(form.ends_at) : null;

  if (starts && !Number.isNaN(starts.getTime()) && now < starts) return "scheduled";
  if (ends && !Number.isNaN(ends.getTime()) && now >= ends) return "expired";

  const limit = String(form.max_uses ?? "").trim();
  if (limit && usedCount >= Number(limit)) return "used_up";

  return "active";
}

export const LIFECYCLE_LABELS = {
  active: { label: "Active", tone: "green", hint: "Customers can use this coupon right now." },
  scheduled: { label: "Scheduled", tone: "blue", hint: "Enabled, but its start date has not arrived yet." },
  expired: { label: "Expired", tone: "gray", hint: "Enabled, but its end date has passed." },
  used_up: { label: "Limit reached", tone: "amber", hint: "Enabled, but it has hit its total usage limit." },
  disabled: { label: "Disabled", tone: "gray", hint: "Turned off manually, regardless of its dates." },
};
