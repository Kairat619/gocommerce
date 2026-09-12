package handler

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
	"gocommerce/internal/middleware"
	"gocommerce/internal/service"
	"gocommerce/internal/session"
)

const (
	maxOrderNoteLength = 2000

	defaultOrderPageSize = 20
	maxOrderPageSize     = 100
)

// orderPageSizes are the page sizes the list offers. Bounded so a crafted
// ?limit= cannot ask the database for every order at once.
var orderPageSizes = []int{20, 50, 100}

// orderStatuses is the full lifecycle, in order. It mirrors the order_status
// enum in 001_initial and is the single source of truth for the admin UI.
var orderStatuses = []db.OrderStatus{
	db.OrderStatusPending,
	db.OrderStatusConfirmed,
	db.OrderStatusProcessing,
	db.OrderStatusShipped,
	db.OrderStatusDelivered,
	db.OrderStatusCancelled,
}

// allowedTransitions is the order state machine.
//
// Before this existed any status could move to any other, so a delivered order
// could be sent back to pending and a cancelled one silently revived. Orders are
// financial records: they move forward, or they are cancelled before they ship.
//
// Cancellation is deliberately unavailable once an order has shipped — the goods
// have left, so the remedy is a return, not a cancellation, and this application
// has no returns workflow to hand it to. `delivered` and `cancelled` are
// terminal.
var allowedTransitions = map[db.OrderStatus][]db.OrderStatus{
	db.OrderStatusPending:    {db.OrderStatusConfirmed, db.OrderStatusCancelled},
	db.OrderStatusConfirmed:  {db.OrderStatusProcessing, db.OrderStatusCancelled},
	db.OrderStatusProcessing: {db.OrderStatusShipped, db.OrderStatusCancelled},
	db.OrderStatusShipped:    {db.OrderStatusDelivered},
	db.OrderStatusDelivered:  {},
	db.OrderStatusCancelled:  {},
}

func canTransition(from, to db.OrderStatus) bool {
	for _, candidate := range allowedTransitions[from] {
		if candidate == to {
			return true
		}
	}
	return false
}

// AdminOrderHandler owns the admin order screens.
//
// Orders are the operational and financial centre of the store, so this handler
// only ever *records* what happened — it never recomputes a total, a discount or
// a tax. Those were settled by the checkout engine when the order was placed and
// are historical fact.
type AdminOrderHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
	pool     *pgxpool.Pool
	settings *service.SettingsService
}

func NewAdminOrderHandler(renderer *inertia.Renderer, queries *db.Queries, pool *pgxpool.Pool, settings *service.SettingsService) *AdminOrderHandler {
	return &AdminOrderHandler{renderer: renderer, queries: queries, pool: pool, settings: settings}
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

// orderFilters is the parsed, validated query string. Every value is echoed
// back to the page so the filter controls stay populated and the URL remains
// shareable — the pattern the storefront product filters already use.
type orderFilters struct {
	Search string
	Status string
	Range  string
	Sort   string
	Limit  int
	Page   int

	from pgtype.Timestamptz
	to   pgtype.Timestamptz
}

// dateRanges are the presets offered by the list. Each resolves to a half-open
// [from, to) window so an order never falls into two ranges at once.
var dateRanges = map[string]func(now time.Time) (time.Time, time.Time){
	"today": func(now time.Time) (time.Time, time.Time) {
		start := startOfDay(now)
		return start, start.AddDate(0, 0, 1)
	},
	"yesterday": func(now time.Time) (time.Time, time.Time) {
		start := startOfDay(now).AddDate(0, 0, -1)
		return start, start.AddDate(0, 0, 1)
	},
	"7d": func(now time.Time) (time.Time, time.Time) {
		return startOfDay(now).AddDate(0, 0, -6), startOfDay(now).AddDate(0, 0, 1)
	},
	"30d": func(now time.Time) (time.Time, time.Time) {
		return startOfDay(now).AddDate(0, 0, -29), startOfDay(now).AddDate(0, 0, 1)
	},
}

func startOfDay(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
}

var orderSorts = map[string]bool{
	"newest": true, "oldest": true,
	"total_desc": true, "total_asc": true,
	"customer": true,
}

func parseOrderFilters(r *http.Request) orderFilters {
	query := r.URL.Query()

	filters := orderFilters{
		Search: strings.TrimSpace(query.Get("q")),
		Sort:   "newest",
		Limit:  defaultOrderPageSize,
		Page:   getPageParam(r),
	}

	// An unknown status is dropped rather than passed to the enum cast, which
	// would error at the database rather than simply showing everything.
	status := query.Get("status")
	for _, candidate := range orderStatuses {
		if string(candidate) == status {
			filters.Status = status
			break
		}
	}

	if sort := query.Get("sort"); orderSorts[sort] {
		filters.Sort = sort
	}

	if limit, err := strconv.Atoi(query.Get("limit")); err == nil {
		for _, size := range orderPageSizes {
			if size == limit {
				filters.Limit = limit
				break
			}
		}
	}
	if filters.Limit > maxOrderPageSize {
		filters.Limit = maxOrderPageSize
	}

	if window, ok := dateRanges[query.Get("range")]; ok {
		filters.Range = query.Get("range")
		from, to := window(time.Now())
		filters.from = pgtype.Timestamptz{Time: from, Valid: true}
		filters.to = pgtype.Timestamptz{Time: to, Valid: true}
	}

	return filters
}

func (f orderFilters) active() bool {
	return f.Search != "" || f.Status != "" || f.Range != "" || f.Sort != "newest"
}

func (h *AdminOrderHandler) List() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		filters := parseOrderFilters(r)

		status := db.NullOrderStatus{}
		if filters.Status != "" {
			status = db.NullOrderStatus{OrderStatus: db.OrderStatus(filters.Status), Valid: true}
		}

		search := pgtype.Text{String: filters.Search, Valid: filters.Search != ""}
		sort := pgtype.Text{String: filters.Sort, Valid: true}

		total, err := h.queries.CountFilterOrders(r.Context(), db.CountFilterOrdersParams{
			Status: status, Search: search, From: filters.from, To: filters.to,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// A filter that shrinks the result set can leave the list on a page past
		// the end; walk back rather than showing nothing.
		lastPage := totalPages(total, filters.Limit)
		if filters.Page > lastPage {
			filters.Page = lastPage
		}

		orders, err := h.queries.FilterOrders(r.Context(), db.FilterOrdersParams{
			Limit:  int32(filters.Limit),
			Offset: int32((filters.Page - 1) * filters.Limit),
			Status: status, Search: search, From: filters.from, To: filters.to, Sort: sort,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		serialized := make([]map[string]any, len(orders))
		for i, o := range orders {
			serialized[i] = map[string]any{
				"id":             fmt.Sprintf("%x", o.ID.Bytes),
				"status":         string(o.Status),
				"customer_name":  o.CustomerName,
				"customer_email": o.CustomerEmail,
				"shipping_name":  o.ShippingName,
				"item_count":     o.ItemCount,
				"total":          formatNumeric(o.Total),
				"discount":       formatNumeric(o.Discount),
				"coupon_code":    o.CouponCode.String,
				"created_at":     o.CreatedAt.Time.Format(time.RFC3339),
			}
		}

		// Counts for the status tabs, so a merchant can see where the work is
		// without clicking through each one.
		counts := map[string]int64{}
		if rows, err := h.queries.CountOrdersByEachStatus(r.Context()); err == nil {
			for _, row := range rows {
				counts[string(row.Status)] = row.Count
			}
		}

		h.renderer.Render(w, r, "Pages/Admin/Orders/Index", inertia.Props{
			"orders":         serialized,
			"status_counts":  counts,
			"currency":       h.settings.Get(r.Context()).Currency,
			"page_sizes":     orderPageSizes,
			"filters_active": filters.active(),
			"filters": map[string]any{
				"q":      filters.Search,
				"status": filters.Status,
				"range":  filters.Range,
				"sort":   filters.Sort,
				"limit":  filters.Limit,
			},
			"pagination": map[string]any{
				"current": filters.Page,
				"total":   lastPage,
				"count":   total,
			},
		})
	}
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

func (h *AdminOrderHandler) Show() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		orderUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/orders", inertia.WithFlash(inertia.Flash{
				"error": "Invalid order ID.",
			}))
			return
		}

		order, err := h.queries.GetOrderByID(r.Context(), orderUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/orders", inertia.WithFlash(inertia.Flash{
				"error": "Order not found.",
			}))
			return
		}

		items, _ := h.queries.ListOrderItemsForAdmin(r.Context(), orderUUID)
		activity, _ := h.queries.ListOrderActivity(r.Context(), orderUUID)
		stats, _ := h.queries.GetCustomerOrderStats(r.Context(), order.UserID)

		serializedItems := make([]map[string]any, len(items))
		for i, item := range items {
			serializedItems[i] = map[string]any{
				"id": fmt.Sprintf("%x", item.ID.Bytes),
				// From order_items, never products: this is what was sold, at the
				// price it was sold for.
				"product_name": item.ProductName,
				"variant_name": item.VariantName.String,
				"quantity":     item.Quantity,
				"unit_price":   formatNumeric(item.UnitPrice),
				"total":        formatNumeric(item.Total),
				// Presentation extras the order never captured. Current values,
				// and labelled as such in the UI.
				"product_slug":      item.ProductSlug.String,
				"product_sku":       item.ProductSku.String,
				"product_image_url": item.ProductImageUrl.String,
			}
		}

		serializedActivity := make([]map[string]any, len(activity))
		for i, event := range activity {
			serializedActivity[i] = map[string]any{
				"id":          fmt.Sprintf("%x", event.ID.Bytes),
				"kind":        event.Kind,
				"message":     event.Message,
				"actor_name":  event.ActorName,
				"from_status": nullOrderStatus(event.FromStatus),
				"to_status":   nullOrderStatus(event.ToStatus),
				"created_at":  event.CreatedAt.Time.Format(time.RFC3339),
			}
		}

		next := allowedTransitions[order.Status]
		nextStatuses := make([]string, len(next))
		for i, s := range next {
			nextStatuses[i] = string(s)
		}

		props := inertia.Props{
			"order":          serializeAdminOrder(order),
			"items":          serializedItems,
			"activity":       serializedActivity,
			"next_statuses":  nextStatuses,
			"currency":       h.settings.Get(r.Context()).Currency,
			"restores_stock": order.Status != db.OrderStatusCancelled,
			"customer": map[string]any{
				"id":             fmt.Sprintf("%x", order.UserID.Bytes),
				"name":           order.CustomerName,
				"email":          order.CustomerEmail,
				"order_count":    stats.OrderCount,
				"lifetime_value": formatNumeric(stats.LifetimeValue),
			},
		}

		h.renderer.Render(w, r, "Pages/Admin/Orders/Show", props)
	}
}

// serializeAdminOrder carries every field the order recorded. The previous
// admin page received most of this already and rendered none of it — the coupon,
// the discount, the billing address and the customer's checkout note were all
// invisible to staff.
func serializeAdminOrder(o db.GetOrderByIDRow) map[string]any {
	return map[string]any{
		"id":     fmt.Sprintf("%x", o.ID.Bytes),
		"status": string(o.Status),

		"subtotal":      formatNumeric(o.Subtotal),
		"discount":      formatNumeric(o.Discount),
		"tax":           formatNumeric(o.Tax),
		"shipping_cost": formatNumeric(o.ShippingCost),
		"total":         formatNumeric(o.Total),
		"coupon_code":   o.CouponCode.String,

		// The customer's own note from checkout. Distinct from staff notes,
		// which live in the activity log.
		"customer_note": o.Notes.String,

		"shipping_name":        o.ShippingName,
		"shipping_address":     o.ShippingAddress,
		"shipping_city":        o.ShippingCity,
		"shipping_state":       o.ShippingState.String,
		"shipping_postal_code": o.ShippingPostalCode,
		"shipping_country":     o.ShippingCountry,

		"billing_name":        o.BillingName.String,
		"billing_address":     o.BillingAddress.String,
		"billing_city":        o.BillingCity.String,
		"billing_state":       o.BillingState.String,
		"billing_postal_code": o.BillingPostalCode.String,
		"billing_country":     o.BillingCountry.String,

		"created_at": o.CreatedAt.Time.Format(time.RFC3339),
		"updated_at": o.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func nullOrderStatus(s db.NullOrderStatus) any {
	if !s.Valid {
		return nil
	}
	return string(s.OrderStatus)
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

// UpdateStatus moves an order along its lifecycle, records the move in the
// activity log, and — when the move is a cancellation — returns the reserved
// stock to the catalogue. All three happen in one transaction.
func (h *AdminOrderHandler) UpdateStatus() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		orderUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/orders", inertia.WithFlash(inertia.Flash{
				"error": "Invalid order ID.",
			}))
			return
		}

		detailURL := "/admin/orders/" + id

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, detailURL, inertia.WithFlash(inertia.Flash{"error": "Invalid request."}))
			return
		}

		order, err := h.queries.GetOrderByID(r.Context(), orderUUID)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/orders", inertia.WithFlash(inertia.Flash{"error": "Order not found."}))
			return
		}

		target := db.OrderStatus(fields["status"])

		// The UI only offers valid moves, but the UI is not the authority.
		if !canTransition(order.Status, target) {
			h.renderer.Redirect(w, r, detailURL, inertia.WithFlash(inertia.Flash{
				"error": fmt.Sprintf(
					"An order that is %s cannot be moved to %s.",
					order.Status, fields["status"],
				),
			}))
			return
		}

		actorID, actorName := h.actor(r)

		restored, err := h.applyStatusChange(r.Context(), order, target, actorID, actorName)
		if err != nil {
			h.renderer.Redirect(w, r, detailURL, inertia.WithFlash(inertia.Flash{
				"error": "Failed to update the order: " + err.Error(),
			}))
			return
		}

		message := fmt.Sprintf("Order marked as %s.", target)
		if restored > 0 {
			message = fmt.Sprintf(
				"Order cancelled. %d item%s returned to stock.",
				restored, plural(int64(restored)),
			)
		}

		h.renderer.Redirect(w, r, detailURL, inertia.WithFlash(inertia.Flash{"success": message}))
	}
}

// applyStatusChange returns how many units were returned to stock, which is
// zero for every move except a cancellation.
func (h *AdminOrderHandler) applyStatusChange(
	ctx context.Context,
	order db.GetOrderByIDRow,
	target db.OrderStatus,
	actorID pgtype.UUID,
	actorName string,
) (int32, error) {
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	qtx := h.queries.WithTx(tx)

	if err := qtx.UpdateOrderStatus(ctx, db.UpdateOrderStatusParams{
		ID:     order.ID,
		Status: target,
	}); err != nil {
		return 0, err
	}

	if _, err := qtx.CreateOrderActivity(ctx, db.CreateOrderActivityParams{
		OrderID:    order.ID,
		UserID:     actorID,
		ActorName:  actorName,
		Kind:       "status_changed",
		Message:    fmt.Sprintf("Status changed from %s to %s.", order.Status, target),
		FromStatus: db.NullOrderStatus{OrderStatus: order.Status, Valid: true},
		ToStatus:   db.NullOrderStatus{OrderStatus: target, Valid: true},
	}); err != nil {
		return 0, err
	}

	if target != db.OrderStatusCancelled {
		return 0, tx.Commit(ctx)
	}

	// Stock is deducted once, when the order is placed (see
	// service.OrderService.CreateOrder), so cancelling is the point at which it
	// comes back. Restoring is additive — `stock_quantity + n` rather than a
	// value computed here — so two cancellations racing cannot lose one
	// another's restock.
	items, err := qtx.GetOrderItemsByOrderID(ctx, order.ID)
	if err != nil {
		return 0, err
	}

	var restored int32
	for _, item := range items {
		if err := qtx.RestoreProductStock(ctx, db.RestoreProductStockParams{
			ID:            item.ProductID,
			StockQuantity: item.Quantity,
		}); err != nil {
			return 0, err
		}
		restored += item.Quantity
	}

	if restored > 0 {
		if _, err := qtx.CreateOrderActivity(ctx, db.CreateOrderActivityParams{
			OrderID:   order.ID,
			UserID:    actorID,
			ActorName: actorName,
			Kind:      "stock_restored",
			Message: fmt.Sprintf(
				"%d item%s returned to stock.", restored, plural(int64(restored)),
			),
		}); err != nil {
			return 0, err
		}
	}

	return restored, tx.Commit(ctx)
}

// AddNote records an internal staff note against the order.
//
// It lands in the activity log so it sits in chronological order among the
// status changes it relates to. It is never shown to the customer — the
// storefront order pages read `orders.notes`, which is the customer's own
// checkout note and is not touched here.
func (h *AdminOrderHandler) AddNote() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		orderUUID, err := parseUUID(id)
		if err != nil {
			h.renderer.Redirect(w, r, "/admin/orders", inertia.WithFlash(inertia.Flash{
				"error": "Invalid order ID.",
			}))
			return
		}

		detailURL := "/admin/orders/" + id

		fields, err := parseInput(r)
		if err != nil {
			h.renderer.Redirect(w, r, detailURL, inertia.WithFlash(inertia.Flash{"error": "Invalid request."}))
			return
		}

		note := strings.TrimSpace(fields["note"])
		switch {
		case note == "":
			h.renderer.Redirect(w, r, detailURL, inertia.WithFlash(inertia.Flash{
				"error": "Write something before saving the note.",
			}))
			return
		case len(note) > maxOrderNoteLength:
			h.renderer.Redirect(w, r, detailURL, inertia.WithFlash(inertia.Flash{
				"error": fmt.Sprintf("A note must be %d characters or fewer.", maxOrderNoteLength),
			}))
			return
		}

		if _, err := h.queries.GetOrderByID(r.Context(), orderUUID); err != nil {
			h.renderer.Redirect(w, r, "/admin/orders", inertia.WithFlash(inertia.Flash{"error": "Order not found."}))
			return
		}

		actorID, actorName := h.actor(r)

		if _, err := h.queries.CreateOrderActivity(r.Context(), db.CreateOrderActivityParams{
			OrderID:   orderUUID,
			UserID:    actorID,
			ActorName: actorName,
			Kind:      "note",
			Message:   note,
		}); err != nil {
			h.renderer.Redirect(w, r, detailURL, inertia.WithFlash(inertia.Flash{"error": "Failed to save the note."}))
			return
		}

		h.renderer.Redirect(w, r, detailURL, inertia.WithFlash(inertia.Flash{"success": "Note added."}))
	}
}

// actor identifies the signed-in member of staff for the audit trail. The name
// is stored alongside the id so the history stays readable even if the account
// is later renamed or removed.
func (h *AdminOrderHandler) actor(r *http.Request) (pgtype.UUID, string) {
	sess := session.FromContext(r.Context())
	if sess == nil {
		return pgtype.UUID{}, ""
	}

	rawID, ok := middleware.GetUserID(sess)
	if !ok {
		return pgtype.UUID{}, ""
	}

	actorID, err := parseUUID(rawID)
	if err != nil {
		return pgtype.UUID{}, ""
	}

	user, err := h.queries.GetUserByID(r.Context(), actorID)
	if err != nil {
		return actorID, ""
	}
	return actorID, user.Name
}
