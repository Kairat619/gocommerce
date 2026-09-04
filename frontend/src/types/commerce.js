/**
 * Commerce prop shapes, mirroring the Go serializers in `internal/handler/`.
 *
 * These typedefs are the machine-readable half of API_CONTRACT.md. There is no
 * TypeScript here, so they are the only thing standing between a renamed prop
 * and a silently blank page — editors will flag a misspelled field.
 *
 * Reminders that the types alone cannot express:
 *   - money arrives as a pre-formatted STRING ("12.00"); a SQL NULL becomes
 *     "0.00" or "", so zero usually means "absent", not "free"
 *   - EXCEPT inside `Cart`, where it is a float
 *   - ids are dashless hex, 32 chars — never reformat them
 *   - dates are pre-formatted strings, not ISO timestamps
 *
 * @module types/commerce
 */

/**
 * @typedef {Object} Pagination
 * @property {number} current 1-based page number
 * @property {number} total   page COUNT, never 0
 */

/**
 * A product as it appears in listings (home, search, filters).
 * `serializeFeaturedProducts` / `serializeFilterProducts`.
 *
 * @typedef {Object} ProductListItem
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description       raw HTML
 * @property {string} price             formatted, e.g. "49.00"
 * @property {string} compare_at_price  "0.00" when unset — use lib/product
 * @property {string} sku
 * @property {string} image_url         "" when unset
 * @property {boolean} is_featured
 * @property {number} stock_quantity
 * @property {string} category_name
 * @property {string} category_slug
 */

/**
 * A product inside a category listing. `serializeCategoryProducts` omits
 * compare_at_price, sku and is_featured — components that render both shapes
 * must tolerate their absence.
 *
 * @typedef {Object} CategoryProductItem
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {string} price
 * @property {string} image_url
 * @property {number} stock_quantity
 * @property {string} category_name
 * @property {string} category_slug
 */

/**
 * The product detail page's product. `serializeProductWithCategory`.
 * Adds barcode/weight/meta to the listing shape. Note it does NOT carry
 * short_description, brand or tags — those exist in the database and in admin
 * props, but not on the storefront.
 *
 * @typedef {ProductListItem & {
 *   barcode: string,
 *   weight: string,
 *   meta_title: string,
 *   meta_description: string
 * }} ProductDetail
 */

/**
 * @typedef {Object} ProductImage
 * @property {string} id
 * @property {string} url
 * @property {string} alt_text
 * @property {number} sort_order  currently ignored by the gallery
 * @property {boolean} is_primary
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} id
 * @property {string} name
 * @property {string} sku
 * @property {string} price
 * @property {number} stock_quantity
 * @property {boolean} is_active
 */

/**
 * Related products on the detail page. Built with an unsized Go slice, so this
 * list arrives as `null` rather than `[]` when there are no siblings — always
 * run it through `asList` from lib/props.
 *
 * @typedef {Object} RelatedProduct
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} price
 * @property {string} image_url
 * @property {string} category_name
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {number} [product_count] present only from serializeCategoriesWithCount
 */

/**
 * A cart line. Money here is a FLOAT — the Go Cart struct is JSON-marshalled
 * directly rather than passing through formatNumeric.
 *
 * @typedef {Object} CartItem
 * @property {string} product_id
 * @property {string} name
 * @property {string} slug
 * @property {number} price
 * @property {number} quantity
 * @property {string} image_url
 * @property {string} sku
 */

/**
 * @typedef {Object} Cart
 * @property {CartItem[]} items
 * @property {number} total_items
 * @property {number} total_price
 */

/**
 * @typedef {"pending"|"confirmed"|"processing"|"shipped"|"delivered"|"cancelled"} OrderStatus
 */

/**
 * `serializeOrder` — shared by checkout confirmation, account order detail and
 * admin order detail.
 *
 * @typedef {Object} Order
 * @property {string} id
 * @property {OrderStatus} status
 * @property {string} total
 * @property {string} subtotal
 * @property {string} tax
 * @property {string} shipping_cost
 * @property {string} discount
 * @property {string} notes
 * @property {string} shipping_name
 * @property {string} shipping_address
 * @property {string} shipping_city
 * @property {string} shipping_state
 * @property {string} shipping_postal_code
 * @property {string} shipping_country
 * @property {string} billing_name
 * @property {string} billing_address
 * @property {string} billing_city
 * @property {string} billing_state
 * @property {string} billing_postal_code
 * @property {string} billing_country
 * @property {string} created_at  pre-formatted, e.g. "January 2, 2006"
 */

/**
 * A row in the customer's order history. `item_count` is hardcoded to 0 by the
 * handler — do not display it.
 *
 * @typedef {Object} OrderListItem
 * @property {string} id
 * @property {OrderStatus} status
 * @property {string} total
 * @property {number} item_count  always 0; see API_CONTRACT.md
 * @property {string} created_at
 */

/**
 * @typedef {Object} AccountOrderItem
 * @property {string} id
 * @property {string} product_name
 * @property {string} variant_name
 * @property {number} quantity
 * @property {string} unit_price
 * @property {string} total
 * @property {string} product_slug
 * @property {string} product_image
 */

/**
 * The admin order-detail line. Note it has NO `id`, unlike AccountOrderItem.
 *
 * @typedef {Object} AdminOrderItem
 * @property {string} product_name
 * @property {number} quantity
 * @property {string} unit_price
 * @property {string} total
 */

/**
 * @typedef {Object} Address
 * @property {string} id
 * @property {string} label
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} company
 * @property {string} address_line1
 * @property {string} address_line2
 * @property {string} city
 * @property {string} state
 * @property {string} postal_code
 * @property {string} country
 * @property {string} phone
 * @property {boolean} is_default
 */

export {};
