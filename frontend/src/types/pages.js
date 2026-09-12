/**
 * Per-page prop shapes. One typedef per Inertia page, named after the page
 * component, in the same order as API_CONTRACT.md.
 *
 * These are the props the Go handler passes to `renderer.Render`. The shared
 * props (see ./shared) arrive alongside them on every page and are read with
 * `usePage()` rather than through the component signature.
 *
 * @module types/pages
 */

/* -------------------------------------------------------------------------
 * Storefront
 * ---------------------------------------------------------------------- */

/**
 * `Pages/Welcome` — GET /
 *
 * @typedef {Object} WelcomeProps
 * @property {string} message  sent by the handler, not rendered
 * @property {import('./commerce').ProductListItem[]} featured_products max 8
 * @property {import('./commerce').Category[]} categories
 */

/**
 * `Pages/Products/Index` — GET /products
 *
 * The four echo props exist so the filter form repopulates after an Inertia
 * visit. Dropping them breaks filter persistence.
 *
 * @typedef {Object} ProductsIndexProps
 * @property {import('./commerce').ProductListItem[]} products
 * @property {import('./commerce').Category[]} categories
 * @property {import('./commerce').Pagination} pagination
 * @property {string} search     echo of ?q=
 * @property {string} category   echo of ?category= (a slug)
 * @property {string} min_price  echo, unparsed
 * @property {string} max_price  echo, unparsed
 */

/**
 * `Pages/Products/Show` — GET /products/{slug}
 *
 * @typedef {Object} ProductsShowProps
 * @property {import('./commerce').ProductDetail} product
 * @property {import('./commerce').ProductImage[]} images
 * @property {import('./commerce').ProductVariant[]} variants active only
 * @property {import('./commerce').RelatedProduct[]|null} related_products may be null
 */

/**
 * `Pages/Categories/Index` — GET /categories
 *
 * @typedef {Object} CategoriesIndexProps
 * @property {import('./commerce').Category[]} categories
 */

/**
 * `Pages/Categories/Show` — GET /categories/{slug}
 *
 * @typedef {Object} CategoriesShowProps
 * @property {import('./commerce').Category} category  no product_count here
 * @property {import('./commerce').CategoryProductItem[]} products
 * @property {import('./commerce').Pagination} pagination
 */

/**
 * `Pages/Cart/Index` — GET /cart
 *
 * @typedef {Object} CartIndexProps
 * @property {import('./commerce').Cart} cart also available as a shared prop
 */

/**
 * `Pages/Checkout/Index` — GET /checkout
 *
 * `tax_rate` is a FRACTION (0.0825), unlike the admin settings form's
 * `tax_rate_percent` (8.25).
 *
 * @typedef {Object} CheckoutIndexProps
 * @property {import('./commerce').Cart} cart
 * @property {import('./commerce').Address[]|null} addresses may be null
 * @property {number} tax_rate
 * @property {number} shipping_cost
 * @property {number} free_shipping_threshold
 */

/**
 * `Pages/Checkout/Confirmation` — GET /checkout/confirmation/{id}
 *
 * @typedef {Object} CheckoutConfirmationProps
 * @property {import('./commerce').Order} order
 */

/* -------------------------------------------------------------------------
 * Account
 * ---------------------------------------------------------------------- */

/**
 * `Pages/Account/Profile` — GET /account
 * `user` is read from the SESSION, not the database.
 *
 * @typedef {Object} AccountProfileProps
 * @property {{id: string, name: string, email: string}} user
 * @property {import('./commerce').Address[]} addresses
 */

/**
 * `Pages/Account/Orders` — GET /account/orders (10 per page)
 *
 * @typedef {Object} AccountOrdersProps
 * @property {import('./commerce').OrderListItem[]} orders
 * @property {import('./commerce').Pagination} pagination
 */

/**
 * `Pages/Account/OrderShow` — GET /account/orders/{id}
 *
 * @typedef {Object} AccountOrderShowProps
 * @property {import('./commerce').Order} order
 * @property {import('./commerce').AccountOrderItem[]} items
 */

/* -------------------------------------------------------------------------
 * Admin
 * ---------------------------------------------------------------------- */

/**
 * `Pages/Admin/Dashboard` — GET /admin?range=&from=&to=
 *
 * Every section is optional: the handler runs them concurrently and a section
 * whose query failed sends nothing and names itself in `section_errors`, so
 * `undefined` means "failed", not "empty". An empty list means empty.
 *
 * Money values are pre-formatted strings ("1234.50"), counts are numbers, and
 * `change` is a percentage or `null` when the comparison period was zero —
 * there is no percentage change from nothing.
 *
 * @typedef {Object} AdminDashboardProps
 * @property {DashboardPeriod} period the resolved window, always present
 * @property {Object.<string, DashboardMetric>} [kpis] revenue, orders, average_order_value, new_customers, items_sold, buyers, discount_total
 * @property {{bucket_at: string, label: string, revenue: string, orders: number}[]} [sales_series]
 * @property {{total: number, breakdown: {status: import('./commerce').OrderStatus, count: number}[]}} [order_status]
 * @property {{pending: number, awaiting_fulfilment: number, in_transit: number, stalled: number, stalled_after_days: number, orders: DashboardAttentionOrder[]}} [backlog]
 * @property {{id: string, status: import('./commerce').OrderStatus, total: string, customer_name: string, customer_email: string, coupon_code: string, created_at: string}[]} [recent_orders]
 * @property {{id: string, name: string, slug: string, sku: string, image_url: string, units_sold: number, revenue: string, order_count: number}[]} [top_products]
 * @property {{id: string, name: string, slug: string, units_sold: number, revenue: string, order_count: number}[]} [top_categories]
 * @property {{new_buyers: number, returning_buyers: number, top: {id: string, name: string, email: string, order_count: number, revenue: string}[]}} [customers]
 * @property {{out_of_stock: number, low_stock: number, tracked_products: number, alerts: DashboardStockAlert[]}} [inventory]
 * @property {{redemptions: number, discount_total: string, orders: number, revenue: string, live_coupons: number, top: DashboardCoupon[]}} [promotions]
 * @property {DashboardActivity[]} [activity]
 * @property {{products: number, customers: number, categories: number, collections: number}} [catalog]
 * @property {string} currency const storeCurrency
 * @property {Object.<string, string>} section_errors section name -> error, empty when all succeeded
 */

/**
 * @typedef {Object} DashboardPeriod
 * @property {string} range today|yesterday|7d|30d|month|last_month|year|custom
 * @property {string} label
 * @property {string} from RFC3339, inclusive
 * @property {string} to RFC3339, exclusive; clamped to now for an in-progress period
 * @property {string} comparison_label what the deltas are measured against
 * @property {boolean} in_progress the period has not finished
 * @property {"hour"|"day"|"week"|"month"} bucket the chart's granularity
 * @property {string} custom_from YYYY-MM-DD, "" unless range is custom
 * @property {string} custom_to YYYY-MM-DD, "" unless range is custom
 * @property {{value: string, label: string}[]} ranges the presets offered
 */

/**
 * One KPI and its comparison. `change` is null when the previous value was
 * zero.
 *
 * @typedef {Object} DashboardMetric
 * @property {string|number} value
 * @property {string|number} previous
 * @property {number|null} change percent
 */

/**
 * @typedef {Object} DashboardAttentionOrder
 * @property {string} id
 * @property {import('./commerce').OrderStatus} status
 * @property {string} total
 * @property {string} customer_name
 * @property {string} customer_email
 * @property {number} item_count
 * @property {string} created_at RFC3339
 * @property {number} age_days
 * @property {boolean} stalled open for longer than stalled_after_days
 */

/**
 * @typedef {Object} DashboardStockAlert
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} sku
 * @property {string} image_url
 * @property {string} category_name
 * @property {number} stock_quantity
 * @property {number} low_stock_threshold
 * @property {boolean} allow_backorders
 */

/**
 * @typedef {Object} DashboardCoupon
 * @property {string} id
 * @property {string} code
 * @property {string} description
 * @property {string} discount_type
 * @property {string} discount_value
 * @property {boolean} is_active
 * @property {number} redemptions
 * @property {string} discount_total
 * @property {string} revenue
 */

/**
 * @typedef {Object} DashboardActivity
 * @property {string} id
 * @property {string} order_id
 * @property {string} kind created|status_changed|note|stock_restored
 * @property {string} message composed when the event happened, never recomposed
 * @property {string} actor_name "" for customer or system events
 * @property {string} customer_name
 * @property {string} from_status "" unless a status change
 * @property {string} to_status "" unless a status change
 * @property {string} created_at RFC3339
 */

/**
 * @typedef {Object} AdminOrderRow
 * @property {string} id
 * @property {string} customer_name
 * @property {string} customer_email
 * @property {string} total
 * @property {import('./commerce').OrderStatus} status
 * @property {string} created_at  "Jan 2, 2006"
 */

/**
 * `Pages/Admin/Products/Index` — GET /admin/products (20 per page)
 *
 * @typedef {Object} AdminProductsIndexProps
 * @property {{id: string, name: string, slug: string, price: string, stock_quantity: number, is_active: boolean, category_name: string, image_url: string}[]} products
 * @property {import('./commerce').Pagination} pagination
 */

/**
 * `Pages/Admin/Products/Create` and `.../Edit`.
 *
 * The Edit page receives everything below PLUS `product`, `product_images`,
 * `product_variants` and `product_attributes`. Both pages post a JSON body
 * decoded by `decodeProductForm`, not by `parseInput`.
 *
 * @typedef {Object} AdminProductFormProps
 * @property {{id: string, parent_id: string|null, name: string, slug: string, is_active: boolean}[]} categories
 * @property {AdminAttribute[]} attributes
 * @property {string[]} brands
 * @property {string} currency  "USD"
 * @property {number} tax_rate  fraction
 */

/**
 * @typedef {Object} AdminAttribute
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {"text"|"textarea"|"number"|"boolean"|"select"|"multiselect"} type
 * @property {boolean} is_required
 * @property {boolean} is_variant
 * @property {{id: string, value: string}[]} options
 */

/**
 * `Pages/Admin/Categories/Index`
 *
 * @typedef {Object} AdminCategoriesIndexProps
 * @property {{id: string, parent_id: string|null, name: string, slug: string, description: string, image_url: string, sort_order: number, is_active: boolean}[]} categories
 */

/**
 * One node of the category tree sent to the create and edit forms so the parent
 * picker can search and expand without a request per keystroke.
 *
 * @typedef {Object} AdminCategoryNode
 * @property {string} id
 * @property {string|null} parent_id  null for a top-level category
 * @property {string} name
 * @property {string} slug
 * @property {boolean} is_active
 */

/**
 * The category being edited. `slug` is the storefront URL key: the form posts
 * it back unchanged unless the merchant edits it, so a rename never moves the
 * public page on its own.
 *
 * @typedef {Object} AdminCategoryDetail
 * @property {string} id
 * @property {string|null} parent_id
 * @property {string} name
 * @property {string} slug
 * @property {string} description       raw HTML
 * @property {string} image_url         "" when unset
 * @property {number} sort_order
 * @property {boolean} is_active
 * @property {string} meta_title
 * @property {string} meta_description
 * @property {string} meta_keywords
 * @property {number} product_count
 */

/**
 * `Pages/Admin/Categories/Create`
 *
 * @typedef {Object} AdminCategoriesCreateProps
 * @property {AdminCategoryNode[]} categories
 */

/**
 * `Pages/Admin/Categories/Edit`
 *
 * @typedef {Object} AdminCategoriesEditProps
 * @property {AdminCategoryDetail} category
 * @property {AdminCategoryNode[]} categories
 */

/**
 * `Pages/Admin/Orders/Index`
 *
 * @typedef {Object} AdminOrdersIndexProps
 * @property {AdminOrderRow[]} orders
 * @property {string} status  echo of ?status=
 * @property {import('./commerce').Pagination} pagination
 */

/**
 * `Pages/Admin/Orders/Show`
 *
 * @typedef {Object} AdminOrderShowProps
 * @property {import('./commerce').Order} order
 * @property {import('./commerce').AdminOrderItem[]} items
 */

/**
 * `Pages/Admin/Customers/Index`
 *
 * @typedef {Object} AdminCustomersIndexProps
 * @property {AdminCustomer[]} customers
 * @property {import('./commerce').Pagination} pagination
 */

/**
 * @typedef {Object} AdminCustomer
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {"customer"|"admin"} role
 * @property {string} created_at
 */

/**
 * `Pages/Admin/Customers/Show`
 *
 * @typedef {Object} AdminCustomerShowProps
 * @property {AdminCustomer} customer
 * @property {{id: string, total: string, status: import('./commerce').OrderStatus, created_at: string}[]} orders max 10
 */

/**
 * `Pages/Admin/Settings/Index` — GET /admin/settings
 *
 * @typedef {Object} AdminSettingsIndexProps
 * @property {SettingsSection[]} sections
 * @property {SettingsActivityEntry[]} activity store-wide, newest first
 * @property {{name: string, currency: string}} store
 */

/**
 * `Pages/Admin/Settings/Section` — GET /admin/settings/{section}
 *
 * Every section receives the WHOLE configuration in `settings`; it edits only
 * its own fields and the server keeps the rest. `system` and `localization`
 * carry extra props nobody else does.
 *
 * @typedef {Object} AdminSettingsSectionProps
 * @property {SettingsSection[]} sections
 * @property {SettingsSection} section the one being shown
 * @property {StoreSettings} settings
 * @property {SettingsActivityEntry[]} activity this section's fields only
 * @property {SystemStatus} [system] `system` section only
 * @property {{code: string, label: string}[]} [currencies] `localization` only
 * @property {{name: string, abbrev: string, offset: string, now: string}} [timezone] `localization` only
 */

/**
 * @typedef {Object} SettingsSection
 * @property {string} key general|localization|catalog|checkout|system
 * @property {string} label
 * @property {string} description
 * @property {string} icon
 * @property {boolean} editable false for `system`, which has no form
 * @property {string[]} keywords search synonyms
 */

/**
 * The whole store configuration.
 *
 * `tax_rate_percent` is a PERCENTAGE (8.25), unlike the `tax_rate` fraction
 * sent to checkout and the product form. Never conflate them.
 *
 * @typedef {Object} StoreSettings
 * @property {number} tax_rate_percent
 * @property {number} shipping_cost
 * @property {number} free_shipping_threshold
 * @property {string} store_name
 * @property {string} store_description
 * @property {string} store_email display only — there is no mail delivery
 * @property {string} store_phone display only
 * @property {string} currency ISO 4217, the one source of truth
 * @property {number} products_per_page
 * @property {boolean} default_product_active new products only
 * @property {boolean} default_track_inventory new products only
 * @property {boolean} default_allow_backorders new products only
 * @property {number} default_low_stock_threshold new products only
 */

/**
 * One audited configuration change. Only database-backed settings appear here —
 * no environment value has a code path that could produce one.
 *
 * @typedef {Object} SettingsActivityEntry
 * @property {string} id
 * @property {string} actor_name "" when it could not be attributed
 * @property {string} setting_key
 * @property {string} previous_value rendered; "" means it was blank
 * @property {string} new_value
 * @property {string} created_at RFC3339
 */

/**
 * Deployment status. STATUS ONLY — never a credential, masked or otherwise.
 *
 * @typedef {Object} SystemStatus
 * @property {string} environment
 * @property {string} app_url
 * @property {string} database_host DSN host, credentials stripped
 * @property {"configured"|"warning"} session_state
 * @property {string} session_detail
 * @property {"configured"|"not_configured"} storage_state
 * @property {string} storage_detail
 * @property {string} storage_public
 * @property {number} max_upload_mb
 * @property {number} login_rate_limit
 */

export {};
