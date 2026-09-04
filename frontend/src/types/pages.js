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
 * `Pages/Admin/Dashboard` — GET /admin
 *
 * @typedef {Object} AdminDashboardProps
 * @property {{total_orders: number, total_revenue: string, average_order: string, unique_customers: number}} summary
 * @property {number} product_count
 * @property {number} customer_count
 * @property {AdminOrderRow[]} recent_orders
 * @property {{name: string, total_sold: number, total_revenue: string}[]} top_products
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
 * @property {{id: string, name: string, slug: string, description: string, sort_order: number, is_active: boolean}[]} categories
 */

/**
 * `Pages/Admin/Categories/Edit`. The slug is derived server-side from `name`;
 * there is no slug field on the form.
 *
 * @typedef {Object} AdminCategoryEditProps
 * @property {{id: string, name: string, slug: string, description: string, image_url: string, sort_order: number, is_active: boolean}} category
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
 * `Pages/Admin/Settings/Index`
 *
 * `tax_rate_percent` is a PERCENTAGE (8.25), unlike the `tax_rate` fraction
 * sent to checkout and the product form.
 *
 * @typedef {Object} AdminSettingsProps
 * @property {{tax_rate_percent: number, shipping_cost: number, free_shipping_threshold: number}} settings
 */

export {};
